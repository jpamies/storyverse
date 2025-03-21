import os
import json
import time
import logging
import threading
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from pymongo import MongoClient
import redis
from prometheus_client import Counter, Histogram, Gauge, start_http_server

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

# Prometheus metrics
ANALYTICS_REQUESTS = Counter('analytics_requests_total', 'Total number of analytics requests')
ANALYTICS_ERRORS = Counter('analytics_errors_total', 'Total number of analytics errors')
ANALYTICS_TIME = Histogram('analytics_time_seconds', 'Time spent generating analytics')
ACTIVE_USERS = Gauge('active_users', 'Number of active users in the last 24 hours')
STORIES_CREATED = Gauge('stories_created_total', 'Total number of stories created')
POPULAR_UNIVERSES = Gauge('popular_universes', 'Popularity score of universes', ['universe'])

# Start Prometheus metrics server
def start_metrics_server():
    start_http_server(8000)
    logger.info("Prometheus metrics server started on port 8000")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Track event endpoint
@app.route('/api/track', methods=['POST'])
def track_event():
    ANALYTICS_REQUESTS.inc()
    start_time = time.time()
    
    try:
        data = request.json
        
        if not data:
            ANALYTICS_ERRORS.inc()
            return jsonify({"error": "No data provided"}), 400
        
        # Required fields
        event_type = data.get('event_type')
        user_id = data.get('user_id')
        
        if not event_type or not user_id:
            ANALYTICS_ERRORS.inc()
            return jsonify({"error": "Missing required fields"}), 400
        
        # Create event document
        event = {
            'event_type': event_type,
            'user_id': user_id,
            'timestamp': datetime.utcnow(),
            'properties': data.get('properties', {}),
            'session_id': data.get('session_id'),
            'device_info': data.get('device_info', {})
        }
        
        # Store in MongoDB
        if db:
            db.events.insert_one(event)
        
        # Update active users in Redis
        if redis_client:
            redis_client.sadd('active_users_today', user_id)
            redis_client.expire('active_users_today', 86400)  # Expire after 24 hours
        
        # Update specific metrics based on event type
        if event_type == 'story_created':
            STORIES_CREATED.inc()
            
            # Update universe popularity if applicable
            universes = data.get('properties', {}).get('universes', [])
            for universe in universes:
                if universe:
                    # Increment universe popularity in Redis
                    if redis_client:
                        redis_client.zincrby('popular_universes', 1, universe)
                    
                    # Update Prometheus metric
                    POPULAR_UNIVERSES.labels(universe=universe).inc()
        
        ANALYTICS_TIME.observe(time.time() - start_time)
        return jsonify({"status": "success"})
        
    except Exception as e:
        logger.exception("Error tracking event")
        ANALYTICS_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get active users count
@app.route('/api/analytics/active-users', methods=['GET'])
def get_active_users():
    ANALYTICS_REQUESTS.inc()
    start_time = time.time()
    
    try:
        # Get time period from query params
        period = request.args.get('period', 'day')
        
        # Calculate active users
        active_count = 0
        
        if redis_client:
            if period == 'day':
                active_count = redis_client.scard('active_users_today')
            else:
                # For other periods, we need to query MongoDB
                if db:
                    end_time = datetime.utcnow()
                    
                    if period == 'week':
                        start_time_period = end_time - timedelta(days=7)
                    elif period == 'month':
                        start_time_period = end_time - timedelta(days=30)
                    else:
                        start_time_period = end_time - timedelta(days=1)
                    
                    active_count = db.events.distinct('user_id', {
                        'timestamp': {'$gte': start_time_period, '$lte': end_time}
                    }).count()
        elif db:
            # Fallback to MongoDB if Redis is not available
            end_time = datetime.utcnow()
            
            if period == 'day':
                start_time_period = end_time - timedelta(days=1)
            elif period == 'week':
                start_time_period = end_time - timedelta(days=7)
            elif period == 'month':
                start_time_period = end_time - timedelta(days=30)
            
            active_count = len(db.events.distinct('user_id', {
                'timestamp': {'$gte': start_time_period, '$lte': end_time}
            }))
        
        # Update Prometheus metric
        ACTIVE_USERS.set(active_count)
        
        ANALYTICS_TIME.observe(time.time() - start_time)
        return jsonify({
            "active_users": active_count,
            "period": period
        })
        
    except Exception as e:
        logger.exception("Error getting active users")
        ANALYTICS_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get popular universes
@app.route('/api/analytics/popular-universes', methods=['GET'])
def get_popular_universes():
    ANALYTICS_REQUESTS.inc()
    start_time = time.time()
    
    try:
        # Get limit from query params
        limit = int(request.args.get('limit', 5))
        
        popular_universes = []
        
        if redis_client:
            # Get from Redis sorted set
            universe_data = redis_client.zrevrange('popular_universes', 0, limit-1, withscores=True)
            popular_universes = [{"universe": u.decode('utf-8'), "score": s} for u, s in universe_data]
        elif db:
            # Fallback to MongoDB aggregation
            pipeline = [
                {"$match": {"event_type": "story_created"}},
                {"$unwind": "$properties.universes"},
                {"$group": {"_id": "$properties.universes", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": limit}
            ]
            
            results = list(db.events.aggregate(pipeline))
            popular_universes = [{"universe": r["_id"], "score": r["count"]} for r in results]
        
        # Update Prometheus metrics
        for item in popular_universes:
            POPULAR_UNIVERSES.labels(universe=item["universe"]).set(item["score"])
        
        ANALYTICS_TIME.observe(time.time() - start_time)
        return jsonify({
            "popular_universes": popular_universes
        })
        
    except Exception as e:
        logger.exception("Error getting popular universes")
        ANALYTICS_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get story creation stats
@app.route('/api/analytics/story-creation', methods=['GET'])
def get_story_creation_stats():
    ANALYTICS_REQUESTS.inc()
    start_time = time.time()
    
    try:
        # Get time period from query params
        period = request.args.get('period', 'day')
        
        end_time = datetime.utcnow()
        
        if period == 'day':
            start_time_period = end_time - timedelta(days=1)
            interval = 'hour'
        elif period == 'week':
            start_time_period = end_time - timedelta(days=7)
            interval = 'day'
        elif period == 'month':
            start_time_period = end_time - timedelta(days=30)
            interval = 'day'
        else:
            start_time_period = end_time - timedelta(days=1)
            interval = 'hour'
        
        stats = []
        
        if db:
            # MongoDB aggregation for time-series data
            if interval == 'hour':
                pipeline = [
                    {"$match": {
                        "event_type": "story_created",
                        "timestamp": {"$gte": start_time_period, "$lte": end_time}
                    }},
                    {"$group": {
                        "_id": {
                            "year": {"$year": "$timestamp"},
                            "month": {"$month": "$timestamp"},
                            "day": {"$dayOfMonth": "$timestamp"},
                            "hour": {"$hour": "$timestamp"}
                        },
                        "count": {"$sum": 1}
                    }},
                    {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1}}
                ]
            else:
                pipeline = [
                    {"$match": {
                        "event_type": "story_created",
                        "timestamp": {"$gte": start_time_period, "$lte": end_time}
                    }},
                    {"$group": {
                        "_id": {
                            "year": {"$year": "$timestamp"},
                            "month": {"$month": "$timestamp"},
                            "day": {"$dayOfMonth": "$timestamp"}
                        },
                        "count": {"$sum": 1}
                    }},
                    {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
                ]
            
            results = list(db.events.aggregate(pipeline))
            
            for result in results:
                if interval == 'hour':
                    time_str = f"{result['_id']['year']}-{result['_id']['month']:02d}-{result['_id']['day']:02d} {result['_id']['hour']:02d}:00"
                else:
                    time_str = f"{result['_id']['year']}-{result['_id']['month']:02d}-{result['_id']['day']:02d}"
                
                stats.append({
                    "time": time_str,
                    "count": result["count"]
                })
        
        # Get total count
        total_count = 0
        if db:
            total_count = db.events.count_documents({"event_type": "story_created"})
        
        # Update Prometheus metric
        STORIES_CREATED.set(total_count)
        
        ANALYTICS_TIME.observe(time.time() - start_time)
        return jsonify({
            "period": period,
            "interval": interval,
            "total_count": total_count,
            "stats": stats
        })
        
    except Exception as e:
        logger.exception("Error getting story creation stats")
        ANALYTICS_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get user engagement metrics
@app.route('/api/analytics/user-engagement', methods=['GET'])
def get_user_engagement():
    ANALYTICS_REQUESTS.inc()
    start_time = time.time()
    
    try:
        if not db:
            ANALYTICS_ERRORS.inc()
            return jsonify({"error": "Database not available"}), 500
        
        # Calculate engagement metrics
        total_users = len(db.events.distinct('user_id'))
        
        # Stories per user
        pipeline = [
            {"$match": {"event_type": "story_created"}},
            {"$group": {"_id": "$user_id", "story_count": {"$sum": 1}}},
            {"$group": {"_id": None, "avg_stories": {"$avg": "$story_count"}}}
        ]
        avg_stories_result = list(db.events.aggregate(pipeline))
        avg_stories_per_user = avg_stories_result[0]["avg_stories"] if avg_stories_result else 0
        
        # Session duration
        # This would require more complex logic with session start/end events
        # Simplified version:
        avg_session_duration = 0
        
        # Retention (users who created stories on multiple days)
        pipeline = [
            {"$match": {"event_type": "story_created"}},
            {"$group": {
                "_id": "$user_id",
                "days": {"$addToSet": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                }}
            }},
            {"$project": {"days_count": {"$size": "$days"}}},
            {"$match": {"days_count": {"$gt": 1}}},
            {"$count": "returning_users"}
        ]
        returning_users_result = list(db.events.aggregate(pipeline))
        returning_users = returning_users_result[0]["returning_users"] if returning_users_result else 0
        retention_rate = (returning_users / total_users) * 100 if total_users > 0 else 0
        
        ANALYTICS_TIME.observe(time.time() - start_time)
        return jsonify({
            "total_users": total_users,
            "avg_stories_per_user": avg_stories_per_user,
            "avg_session_duration_minutes": avg_session_duration,
            "returning_users": returning_users,
            "retention_rate_percent": retention_rate
        })
        
    except Exception as e:
        logger.exception("Error getting user engagement metrics")
        ANALYTICS_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Metrics endpoint
@app.route('/metrics', methods=['GET'])
async def metrics():
    res = app.response_class()
    res.content_type = 'text/plain'
    res.data = await register.metrics()
    return res

if __name__ == '__main__':
    # Start metrics server in a separate thread
    metrics_thread = threading.Thread(target=start_metrics_server, daemon=True)
    metrics_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=8080)
