import os
import json
import time
import logging
import threading
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import redis
from pymongo import MongoClient
from prometheus_client import Counter, Histogram, start_http_server

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize MongoDB client
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/storyverse')
try:
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client.storyverse
    logger.info("Connected to MongoDB")
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    db = None

# Initialize Redis client for caching
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
    redis_client.ping()
    logger.info("Connected to Redis")
except Exception as e:
    logger.error(f"Redis connection error: {e}")
    redis_client = None

# Service URLs
UNIVERSE_SERVICE_URL = os.environ.get('UNIVERSE_SERVICE_URL', 'http://universe-management:8080')
STORY_SERVICE_URL = os.environ.get('STORY_SERVICE_URL', 'http://story-database:8080')

# Prometheus metrics
RECOMMENDATION_REQUESTS = Counter('recommendation_requests_total', 'Total number of recommendation requests')
RECOMMENDATION_ERRORS = Counter('recommendation_errors_total', 'Total number of recommendation errors')
RECOMMENDATION_TIME = Histogram('recommendation_time_seconds', 'Time spent generating recommendations')
CACHE_HITS = Counter('recommendation_cache_hits_total', 'Total number of recommendation cache hits')
CACHE_MISSES = Counter('recommendation_cache_misses_total', 'Total number of recommendation cache misses')

# Start Prometheus metrics server
def start_metrics_server():
    start_http_server(8000)
    logger.info("Prometheus metrics server started on port 8000")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Get universe recommendations
@app.route('/api/recommend/universes', methods=['GET'])
def recommend_universes():
    RECOMMENDATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        user_id = request.args.get('userId')
        age_group = request.args.get('ageGroup', 'all')
        limit = int(request.args.get('limit', 5))
        
        # Check cache first
        cache_key = f"universe_recommendations:{user_id}:{age_group}:{limit}"
        if redis_client:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                CACHE_HITS.inc()
                RECOMMENDATION_TIME.observe(time.time() - start_time)
                return jsonify(json.loads(cached_result))
        
        CACHE_MISSES.inc()
        
        # Get user's story history
        user_stories = []
        if db:
            user_stories = list(db.stories.find({"userId": user_id}))
        
        # If no user history, return popular universes
        if not user_stories:
            try:
                response = requests.get(f"{UNIVERSE_SERVICE_URL}/api/universes/popular?limit={limit}")
                if response.status_code == 200:
                    universes = response.json()
                    
                    # Cache result
                    if redis_client:
                        redis_client.setex(cache_key, 3600, json.dumps(universes))  # Cache for 1 hour
                    
                    RECOMMENDATION_TIME.observe(time.time() - start_time)
                    return jsonify(universes)
                else:
                    raise Exception(f"Failed to get popular universes: {response.text}")
            except Exception as e:
                logger.error(f"Error getting popular universes: {e}")
                RECOMMENDATION_ERRORS.inc()
                return jsonify({"error": str(e)}), 500
        
        # Get all universes
        try:
            response = requests.get(f"{UNIVERSE_SERVICE_URL}/api/universes")
            if response.status_code != 200:
                raise Exception(f"Failed to get universes: {response.text}")
            
            all_universes = response.json()
        except Exception as e:
            logger.error(f"Error getting universes: {e}")
            RECOMMENDATION_ERRORS.inc()
            return jsonify({"error": str(e)}), 500
        
        # Extract user preferences
        user_universe_ids = []
        user_themes = []
        
        for story in user_stories:
            if "universes" in story:
                user_universe_ids.extend(story["universes"])
            if "theme" in story:
                user_themes.append(story["theme"])
        
        # Count universe frequencies
        universe_counts = {}
        for universe_id in user_universe_ids:
            if universe_id in universe_counts:
                universe_counts[universe_id] += 1
            else:
                universe_counts[universe_id] = 1
        
        # Filter by age group if specified
        if age_group != 'all':
            all_universes = [u for u in all_universes if u.get('ageRating') == age_group or u.get('ageRating') == 'all']
        
        # Score universes based on user history
        scored_universes = []
        for universe in all_universes:
            score = 0
            
            # Base score from popularity
            score += universe.get('popularity', 0) * 0.1
            
            # Score from user history
            if str(universe.get('_id')) in universe_counts:
                score += universe_counts[str(universe.get('_id'))] * 10
            
            # Add universe with score
            scored_universes.append({
                'universe': universe,
                'score': score
            })
        
        # Sort by score and get top recommendations
        scored_universes.sort(key=lambda x: x['score'], reverse=True)
        recommended_universes = [item['universe'] for item in scored_universes[:limit]]
        
        # Cache result
        if redis_client:
            redis_client.setex(cache_key, 3600, json.dumps(recommended_universes))  # Cache for 1 hour
        
        RECOMMENDATION_TIME.observe(time.time() - start_time)
        return jsonify(recommended_universes)
        
    except Exception as e:
        logger.exception("Error generating universe recommendations")
        RECOMMENDATION_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get character recommendations
@app.route('/api/recommend/characters', methods=['GET'])
def recommend_characters():
    RECOMMENDATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        universe_id = request.args.get('universeId')
        user_id = request.args.get('userId')
        role = request.args.get('role')
        limit = int(request.args.get('limit', 5))
        
        if not universe_id:
            return jsonify({"error": "universeId is required"}), 400
        
        # Check cache first
        cache_key = f"character_recommendations:{universe_id}:{user_id}:{role}:{limit}"
        if redis_client:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                CACHE_HITS.inc()
                RECOMMENDATION_TIME.observe(time.time() - start_time)
                return jsonify(json.loads(cached_result))
        
        CACHE_MISSES.inc()
        
        # In a real implementation, we would fetch characters from a character database service
        # For this demo, we'll return mock data
        
        # Mock character data based on universe
        characters = []
        
        if "dragon" in universe_id.lower():
            characters = [
                {"id": "goku", "name": "Goku", "role": "hero", "popularity": 100},
                {"id": "vegeta", "name": "Vegeta", "role": "rival", "popularity": 90},
                {"id": "piccolo", "name": "Piccolo", "role": "mentor", "popularity": 80},
                {"id": "gohan", "name": "Gohan", "role": "hero", "popularity": 85},
                {"id": "krillin", "name": "Krillin", "role": "sidekick", "popularity": 70}
            ]
        elif "turtle" in universe_id.lower():
            characters = [
                {"id": "leonardo", "name": "Leonardo", "role": "hero", "popularity": 95},
                {"id": "raphael", "name": "Raphael", "role": "hero", "popularity": 90},
                {"id": "michelangelo", "name": "Michelangelo", "role": "hero", "popularity": 85},
                {"id": "donatello", "name": "Donatello", "role": "hero", "popularity": 80},
                {"id": "splinter", "name": "Splinter", "role": "mentor", "popularity": 75}
            ]
        elif "toy" in universe_id.lower():
            characters = [
                {"id": "woody", "name": "Woody", "role": "hero", "popularity": 95},
                {"id": "buzz", "name": "Buzz Lightyear", "role": "hero", "popularity": 90},
                {"id": "jessie", "name": "Jessie", "role": "hero", "popularity": 80},
                {"id": "rex", "name": "Rex", "role": "sidekick", "popularity": 75},
                {"id": "hamm", "name": "Hamm", "role": "sidekick", "popularity": 70}
            ]
        elif "futurama" in universe_id.lower():
            characters = [
                {"id": "fry", "name": "Philip J. Fry", "role": "hero", "popularity": 90},
                {"id": "leela", "name": "Turanga Leela", "role": "hero", "popularity": 85},
                {"id": "bender", "name": "Bender", "role": "sidekick", "popularity": 95},
                {"id": "professor", "name": "Professor Farnsworth", "role": "mentor", "popularity": 80},
                {"id": "zoidberg", "name": "Dr. Zoidberg", "role": "sidekick", "popularity": 75}
            ]
        elif "lion" in universe_id.lower():
            characters = [
                {"id": "simba", "name": "Simba", "role": "hero", "popularity": 95},
                {"id": "mufasa", "name": "Mufasa", "role": "mentor", "popularity": 90},
                {"id": "timon", "name": "Timon", "role": "sidekick", "popularity": 85},
                {"id": "pumbaa", "name": "Pumbaa", "role": "sidekick", "popularity": 80},
                {"id": "nala", "name": "Nala", "role": "hero", "popularity": 75}
            ]
        elif "monster" in universe_id.lower():
            characters = [
                {"id": "sulley", "name": "James P. Sullivan", "role": "hero", "popularity": 90},
                {"id": "mike", "name": "Mike Wazowski", "role": "sidekick", "popularity": 85},
                {"id": "boo", "name": "Boo", "role": "sidekick", "popularity": 80},
                {"id": "randall", "name": "Randall Boggs", "role": "rival", "popularity": 75},
                {"id": "waternoose", "name": "Henry J. Waternoose", "role": "rival", "popularity": 70}
            ]
        
        # Filter by role if specified
        if role:
            characters = [c for c in characters if c.get('role') == role]
        
        # Sort by popularity and limit results
        characters.sort(key=lambda x: x.get('popularity', 0), reverse=True)
        characters = characters[:limit]
        
        # Cache result
        if redis_client:
            redis_client.setex(cache_key, 3600, json.dumps(characters))  # Cache for 1 hour
        
        RECOMMENDATION_TIME.observe(time.time() - start_time)
        return jsonify(characters)
        
    except Exception as e:
        logger.exception("Error generating character recommendations")
        RECOMMENDATION_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get theme recommendations
@app.route('/api/recommend/themes', methods=['GET'])
def recommend_themes():
    RECOMMENDATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        user_id = request.args.get('userId')
        age_group = request.args.get('ageGroup')
        universe_ids = request.args.getlist('universeId')
        limit = int(request.args.get('limit', 3))
        
        # Check cache first
        cache_key = f"theme_recommendations:{user_id}:{age_group}:{'-'.join(universe_ids)}:{limit}"
        if redis_client:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                CACHE_HITS.inc()
                RECOMMENDATION_TIME.observe(time.time() - start_time)
                return jsonify(json.loads(cached_result))
        
        CACHE_MISSES.inc()
        
        # All available themes
        all_themes = [
            {
                "id": "adventure_quest",
                "name": "Adventure Quest",
                "description": "Characters seek an important object or person"
            },
            {
                "id": "friendship_tale",
                "name": "Friendship Tale",
                "description": "Story about building relationships and teamwork"
            },
            {
                "id": "overcoming_fears",
                "name": "Overcoming Fears",
                "description": "Characters help each other face their anxieties"
            },
            {
                "id": "learning_skills",
                "name": "Learning New Skills",
                "description": "Characters teach each other abilities from their universes"
            },
            {
                "id": "helping_others",
                "name": "Helping Others",
                "description": "Focus on community service and assistance"
            },
            {
                "id": "mystery_solving",
                "name": "Mystery Solving",
                "description": "Characters work together to solve a puzzle or mystery"
            }
        ]
        
        # Get user's story history
        user_stories = []
        if db:
            user_stories = list(db.stories.find({"userId": user_id}))
        
        # If no user history, return random themes
        if not user_stories:
            import random
            random.shuffle(all_themes)
            recommended_themes = all_themes[:limit]
            
            # Cache result
            if redis_client:
                redis_client.setex(cache_key, 3600, json.dumps(recommended_themes))  # Cache for 1 hour
            
            RECOMMENDATION_TIME.observe(time.time() - start_time)
            return jsonify(recommended_themes)
        
        # Extract user preferences
        user_theme_counts = {}
        
        for story in user_stories:
            if "theme" in story:
                theme = story["theme"]
                if theme in user_theme_counts:
                    user_theme_counts[theme] += 1
                else:
                    user_theme_counts[theme] = 1
        
        # Score themes based on user history
        scored_themes = []
        for theme in all_themes:
            score = 0
            
            # Score from user history
            if theme["id"] in user_theme_counts:
                score += user_theme_counts[theme["id"]] * 10
            
            # Add theme with score
            scored_themes.append({
                'theme': theme,
                'score': score
            })
        
        # Sort by score and get top recommendations
        scored_themes.sort(key=lambda x: x['score'], reverse=True)
        recommended_themes = [item['theme'] for item in scored_themes[:limit]]
        
        # Cache result
        if redis_client:
            redis_client.setex(cache_key, 3600, json.dumps(recommended_themes))  # Cache for 1 hour
        
        RECOMMENDATION_TIME.observe(time.time() - start_time)
        return jsonify(recommended_themes)
        
    except Exception as e:
        logger.exception("Error generating theme recommendations")
        RECOMMENDATION_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get moral lesson recommendations
@app.route('/api/recommend/moral-lessons', methods=['GET'])
def recommend_moral_lessons():
    RECOMMENDATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        user_id = request.args.get('userId')
        age_group = request.args.get('ageGroup')
        theme = request.args.get('theme')
        limit = int(request.args.get('limit', 3))
        
        # Check cache first
        cache_key = f"moral_recommendations:{user_id}:{age_group}:{theme}:{limit}"
        if redis_client:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                CACHE_HITS.inc()
                RECOMMENDATION_TIME.observe(time.time() - start_time)
                return jsonify(json.loads(cached_result))
        
        CACHE_MISSES.inc()
        
        # All available moral lessons
        all_morals = [
            {
                "id": "friendship_teamwork",
                "name": "Friendship & Teamwork",
                "description": "Working together achieves more than working alone"
            },
            {
                "id": "courage_bravery",
                "name": "Courage & Bravery",
                "description": "Standing up for what's right even when it's difficult"
            },
            {
                "id": "honesty_truth",
                "name": "Honesty & Truth",
                "description": "The importance of being truthful"
            },
            {
                "id": "kindness_compassion",
                "name": "Kindness & Compassion",
                "description": "Helping others without expecting rewards"
            },
            {
                "id": "perseverance",
                "name": "Perseverance",
                "description": "Continuing to try despite difficulties"
            },
            {
                "id": "respect_differences",
                "name": "Respect for Differences",
                "description": "Appreciating unique qualities in others"
            },
            {
                "id": "responsibility",
                "name": "Responsibility",
                "description": "Taking care of duties and obligations"
            }
        ]
        
        # Theme-moral mappings for better recommendations
        theme_moral_map = {
            "adventure_quest": ["courage_bravery", "perseverance", "friendship_teamwork"],
            "friendship_tale": ["friendship_teamwork", "respect_differences", "kindness_compassion"],
            "overcoming_fears": ["courage_bravery", "perseverance", "friendship_teamwork"],
            "learning_skills": ["perseverance", "responsibility", "respect_differences"],
            "helping_others": ["kindness_compassion", "responsibility", "friendship_teamwork"],
            "mystery_solving": ["honesty_truth", "friendship_teamwork", "responsibility"]
        }
        
        # Age-appropriate moral lessons
        age_moral_map = {
            "3-5": ["friendship_teamwork", "kindness_compassion", "honesty_truth"],
            "6-8": ["friendship_teamwork", "kindness_compassion", "honesty_truth", "responsibility"],
            "9-12": ["friendship_teamwork", "kindness_compassion", "honesty_truth", "responsibility", "courage_bravery", "perseverance", "respect_differences"]
        }
        
        # Filter by theme if specified
        recommended_moral_ids = []
        if theme and theme in theme_moral_map:
            recommended_moral_ids = theme_moral_map[theme]
        
        # Filter by age group if specified
        if age_group and age_group in age_moral_map:
            if recommended_moral_ids:
                recommended_moral_ids = [m for m in recommended_moral_ids if m in age_moral_map[age_group]]
            else:
                recommended_moral_ids = age_moral_map[age_group]
        
        # If no filters applied, use all morals
        if not recommended_moral_ids:
            recommended_moral_ids = [m["id"] for m in all_morals]
        
        # Get the full moral objects
        recommended_morals = [m for m in all_morals if m["id"] in recommended_moral_ids]
        
        # Limit results
        recommended_morals = recommended_morals[:limit]
        
        # Cache result
        if redis_client:
            redis_client.setex(cache_key, 3600, json.dumps(recommended_morals))  # Cache for 1 hour
        
        RECOMMENDATION_TIME.observe(time.time() - start_time)
        return jsonify(recommended_morals)
        
    except Exception as e:
        logger.exception("Error generating moral lesson recommendations")
        RECOMMENDATION_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start metrics server in a separate thread
    metrics_thread = threading.Thread(target=start_metrics_server, daemon=True)
    metrics_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=8080)
