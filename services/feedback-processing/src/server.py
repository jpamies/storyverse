import os
import json
import time
import logging
import threading
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from pymongo import MongoClient
from textblob import TextBlob
import nltk
from prometheus_client import Counter, Histogram, Gauge, start_http_server, generate_latest

# Download NLTK data
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

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

# Prometheus metrics
FEEDBACK_REQUESTS = Counter('feedback_requests_total', 'Total number of feedback requests')
FEEDBACK_ERRORS = Counter('feedback_errors_total', 'Total number of feedback errors')
FEEDBACK_PROCESSING_TIME = Histogram('feedback_processing_time_seconds', 'Time spent processing feedback')
SENTIMENT_SCORE = Gauge('feedback_sentiment_score', 'Average sentiment score of feedback', ['universe'])
RATING_SCORE = Gauge('feedback_rating_score', 'Average rating score of feedback', ['universe'])

# Register Prometheus metrics
from prometheus_client import CollectorRegistry
register = CollectorRegistry()
register.register(FEEDBACK_REQUESTS)
register.register(FEEDBACK_ERRORS)
register.register(FEEDBACK_PROCESSING_TIME)
register.register(SENTIMENT_SCORE)
register.register(RATING_SCORE)

# Start Prometheus metrics server
def start_metrics_server():
    start_http_server(8000)
    logger.info("Prometheus metrics server started on port 8000")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Submit feedback endpoint
@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    FEEDBACK_REQUESTS.inc()
    start_time = time.time()
    
    try:
        data = request.json
        
        if not data:
            FEEDBACK_ERRORS.inc()
            return jsonify({"error": "No data provided"}), 400
        
        # Required fields
        user_id = data.get('user_id')
        story_id = data.get('story_id')
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        if not user_id or not story_id or rating is None:
            FEEDBACK_ERRORS.inc()
            return jsonify({"error": "Missing required fields"}), 400
        
        # Validate rating
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError("Rating must be between 1 and 5")
        except ValueError as e:
            FEEDBACK_ERRORS.inc()
            return jsonify({"error": str(e)}), 400
        
        # Process sentiment if comment provided
        sentiment_score = 0
        if comment:
            blob = TextBlob(comment)
            sentiment_score = blob.sentiment.polarity
        
        # Create feedback document
        feedback = {
            'user_id': user_id,
            'story_id': story_id,
            'rating': rating,
            'comment': comment,
            'sentiment_score': sentiment_score,
            'timestamp': datetime.utcnow(),
            'processed': False
        }
        
        # Store in MongoDB
        if db:
            result = db.feedback.insert_one(feedback)
            feedback_id = str(result.inserted_id)
        else:
            feedback_id = "mock_id_" + str(int(time.time()))
        
        # Get story details to update metrics
        story_universes = []
        if db:
            story = db.stories.find_one({"_id": story_id})
            if story and "universes" in story:
                story_universes = story["universes"]
        
        # Update metrics for each universe
        for universe in story_universes:
            # Update universe-specific metrics
            update_universe_metrics(universe)
        
        FEEDBACK_PROCESSING_TIME.observe(time.time() - start_time)
        return jsonify({
            "status": "success",
            "feedback_id": feedback_id,
            "sentiment_score": sentiment_score
        })
        
    except Exception as e:
        logger.exception("Error submitting feedback")
        FEEDBACK_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get feedback for a story
@app.route('/api/feedback/story/<story_id>', methods=['GET'])
def get_story_feedback(story_id):
    FEEDBACK_REQUESTS.inc()
    start_time = time.time()
    
    try:
        if not db:
            FEEDBACK_ERRORS.inc()
            return jsonify({"error": "Database not available"}), 500
        
        # Get all feedback for the story
        feedback_list = list(db.feedback.find({"story_id": story_id}))
        
        # Convert ObjectId to string
        for feedback in feedback_list:
            feedback["_id"] = str(feedback["_id"])
            feedback["timestamp"] = feedback["timestamp"].isoformat()
        
        # Calculate average rating
        avg_rating = 0
        if feedback_list:
            avg_rating = sum(f["rating"] for f in feedback_list) / len(feedback_list)
        
        # Calculate average sentiment
        avg_sentiment = 0
        sentiment_count = 0
        for feedback in feedback_list:
            if "sentiment_score" in feedback:
                avg_sentiment += feedback["sentiment_score"]
                sentiment_count += 1
        
        if sentiment_count > 0:
            avg_sentiment /= sentiment_count
        
        FEEDBACK_PROCESSING_TIME.observe(time.time() - start_time)
        return jsonify({
            "story_id": story_id,
            "feedback_count": len(feedback_list),
            "average_rating": avg_rating,
            "average_sentiment": avg_sentiment,
            "feedback": feedback_list
        })
        
    except Exception as e:
        logger.exception(f"Error getting feedback for story {story_id}")
        FEEDBACK_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get feedback summary for a universe
@app.route('/api/feedback/universe/<universe_id>', methods=['GET'])
def get_universe_feedback(universe_id):
    FEEDBACK_REQUESTS.inc()
    start_time = time.time()
    
    try:
        if not db:
            FEEDBACK_ERRORS.inc()
            return jsonify({"error": "Database not available"}), 500
        
        # Get all stories for the universe
        stories = list(db.stories.find({"universes": universe_id}))
        story_ids = [str(s["_id"]) for s in stories]
        
        # Get all feedback for these stories
        feedback_list = list(db.feedback.find({"story_id": {"$in": story_ids}}))
        
        # Calculate average rating
        avg_rating = 0
        if feedback_list:
            avg_rating = sum(f["rating"] for f in feedback_list) / len(feedback_list)
        
        # Calculate average sentiment
        avg_sentiment = 0
        sentiment_count = 0
        for feedback in feedback_list:
            if "sentiment_score" in feedback:
                avg_sentiment += feedback["sentiment_score"]
                sentiment_count += 1
        
        if sentiment_count > 0:
            avg_sentiment /= sentiment_count
        
        # Update Prometheus metrics
        RATING_SCORE.labels(universe=universe_id).set(avg_rating)
        SENTIMENT_SCORE.labels(universe=universe_id).set(avg_sentiment)
        
        # Extract common words from comments
        common_words = extract_common_words(feedback_list)
        
        FEEDBACK_PROCESSING_TIME.observe(time.time() - start_time)
        return jsonify({
            "universe_id": universe_id,
            "story_count": len(stories),
            "feedback_count": len(feedback_list),
            "average_rating": avg_rating,
            "average_sentiment": avg_sentiment,
            "common_words": common_words
        })
        
    except Exception as e:
        logger.exception(f"Error getting feedback for universe {universe_id}")
        FEEDBACK_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get overall feedback summary
@app.route('/api/feedback/summary', methods=['GET'])
def get_feedback_summary():
    FEEDBACK_REQUESTS.inc()
    start_time = time.time()
    
    try:
        if not db:
            FEEDBACK_ERRORS.inc()
            return jsonify({"error": "Database not available"}), 500
        
        # Get all feedback
        feedback_list = list(db.feedback.find())
        
        # Calculate average rating
        avg_rating = 0
        if feedback_list:
            avg_rating = sum(f["rating"] for f in feedback_list) / len(feedback_list)
        
        # Calculate rating distribution
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for feedback in feedback_list:
            rating = feedback["rating"]
            if rating in rating_distribution:
                rating_distribution[rating] += 1
        
        # Calculate average sentiment
        avg_sentiment = 0
        sentiment_count = 0
        for feedback in feedback_list:
            if "sentiment_score" in feedback:
                avg_sentiment += feedback["sentiment_score"]
                sentiment_count += 1
        
        if sentiment_count > 0:
            avg_sentiment /= sentiment_count
        
        # Get top universes by rating
        universe_ratings = {}
        for feedback in feedback_list:
            story_id = feedback["story_id"]
            story = db.stories.find_one({"_id": story_id})
            if story and "universes" in story:
                for universe in story["universes"]:
                    if universe not in universe_ratings:
                        universe_ratings[universe] = {"total": 0, "count": 0}
                    universe_ratings[universe]["total"] += feedback["rating"]
                    universe_ratings[universe]["count"] += 1
        
        top_universes = []
        for universe, data in universe_ratings.items():
            if data["count"] > 0:
                avg = data["total"] / data["count"]
                top_universes.append({"universe": universe, "average_rating": avg, "feedback_count": data["count"]})
        
        top_universes.sort(key=lambda x: x["average_rating"], reverse=True)
        top_universes = top_universes[:5]  # Top 5
        
        FEEDBACK_PROCESSING_TIME.observe(time.time() - start_time)
        return jsonify({
            "feedback_count": len(feedback_list),
            "average_rating": avg_rating,
            "rating_distribution": rating_distribution,
            "average_sentiment": avg_sentiment,
            "top_universes": top_universes
        })
        
    except Exception as e:
        logger.exception("Error getting feedback summary")
        FEEDBACK_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Extract common words from feedback comments
def extract_common_words(feedback_list, limit=10):
    try:
        from nltk.corpus import stopwords
        from nltk.tokenize import word_tokenize
        
        # Combine all comments
        all_comments = " ".join([f["comment"] for f in feedback_list if "comment" in f and f["comment"]])
        
        # Tokenize
        tokens = word_tokenize(all_comments.lower())
        
        # Remove stopwords and punctuation
        stop_words = set(stopwords.words('english'))
        filtered_tokens = [w for w in tokens if w.isalpha() and w not in stop_words and len(w) > 2]
        
        # Count frequencies
        from collections import Counter
        word_counts = Counter(filtered_tokens)
        
        # Return most common words
        return word_counts.most_common(limit)
    except Exception as e:
        logger.error(f"Error extracting common words: {e}")
        return []

# Update metrics for a universe
def update_universe_metrics(universe_id):
    try:
        if not db:
            return
        
        # Get all stories for the universe
        stories = list(db.stories.find({"universes": universe_id}))
        story_ids = [str(s["_id"]) for s in stories]
        
        # Get all feedback for these stories
        feedback_list = list(db.feedback.find({"story_id": {"$in": story_ids}}))
        
        # Calculate average rating
        avg_rating = 0
        if feedback_list:
            avg_rating = sum(f["rating"] for f in feedback_list) / len(feedback_list)
        
        # Calculate average sentiment
        avg_sentiment = 0
        sentiment_count = 0
        for feedback in feedback_list:
            if "sentiment_score" in feedback:
                avg_sentiment += feedback["sentiment_score"]
                sentiment_count += 1
        
        if sentiment_count > 0:
            avg_sentiment /= sentiment_count
        
        # Update Prometheus metrics
        RATING_SCORE.labels(universe=universe_id).set(avg_rating)
        SENTIMENT_SCORE.labels(universe=universe_id).set(avg_sentiment)
        
    except Exception as e:
        logger.error(f"Error updating metrics for universe {universe_id}: {e}")

# Metrics endpoint
@app.route('/metrics', methods=['GET'])
def metrics():
    response = app.response_class(
        response=generate_latest(register),
        status=200,
        mimetype="text/plain"
    )
    return response

if __name__ == '__main__':
    # Start metrics server in a separate thread
    metrics_thread = threading.Thread(target=start_metrics_server, daemon=True)
    metrics_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=8080)
