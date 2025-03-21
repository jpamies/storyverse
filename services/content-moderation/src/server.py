import os
import json
import time
import logging
import threading
import base64
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import boto3
from PIL import Image
from prometheus_client import Counter, Histogram, start_http_server
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set. Content moderation will use AWS Rekognition only.")
    openai_client = None
else:
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Initialize AWS Rekognition client
AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.environ.get('AWS_SECRET_KEY')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

if AWS_ACCESS_KEY and AWS_SECRET_KEY:
    rekognition_client = boto3.client(
        'rekognition',
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
        region_name=AWS_REGION
    )
else:
    logger.warning("AWS credentials not set. AWS Rekognition will not work.")
    rekognition_client = None

# Prometheus metrics
MODERATION_REQUESTS = Counter('content_moderation_requests_total', 'Total number of content moderation requests')
MODERATION_FAILURES = Counter('content_moderation_failures_total', 'Total number of content moderation failures')
MODERATION_TIME = Histogram('content_moderation_time_seconds', 'Time spent on content moderation')
FLAGGED_CONTENT = Counter('flagged_content_total', 'Total number of flagged content items', ['content_type', 'reason'])

# Start Prometheus metrics server
def start_metrics_server():
    start_http_server(8000)
    logger.info("Prometheus metrics server started on port 8000")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Text moderation endpoint
@app.route('/api/moderate/text', methods=['POST'])
def moderate_text():
    MODERATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        data = request.json
        
        if not data or 'text' not in data:
            MODERATION_FAILURES.inc()
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        age_group = data.get('age_group', '3-5')  # Default to youngest age group for strictest moderation
        
        # Use OpenAI moderation API if available
        if openai_client:
            result = moderate_text_with_openai(text, age_group)
        else:
            # Fallback to simple keyword-based moderation
            result = moderate_text_with_keywords(text, age_group)
        
        MODERATION_TIME.observe(time.time() - start_time)
        
        if result['flagged']:
            for category in result['categories']:
                if result['categories'][category]:
                    FLAGGED_CONTENT.labels(content_type='text', reason=category).inc()
        
        return jsonify(result)
        
    except Exception as e:
        logger.exception("Error moderating text")
        MODERATION_FAILURES.inc()
        return jsonify({"error": str(e)}), 500

# Image moderation endpoint
@app.route('/api/moderate/image', methods=['POST'])
def moderate_image():
    MODERATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        data = request.json
        
        if not data or 'image' not in data:
            MODERATION_FAILURES.inc()
            return jsonify({"error": "No image provided"}), 400
        
        image_data = data['image']
        age_group = data.get('age_group', '3-5')  # Default to youngest age group for strictest moderation
        
        # Check if image is a URL or base64
        if image_data.startswith('http'):
            # URL-based image would be handled here
            # For simplicity, we'll return an error
            MODERATION_FAILURES.inc()
            return jsonify({"error": "URL-based images not supported yet"}), 400
        elif image_data.startswith('data:image'):
            # Extract base64 data
            image_data = image_data.split(',')[1]
        
        # Use AWS Rekognition if available
        if rekognition_client:
            result = moderate_image_with_rekognition(image_data, age_group)
        else:
            # Fallback to simple size check
            result = moderate_image_basic(image_data)
        
        MODERATION_TIME.observe(time.time() - start_time)
        
        if result['flagged']:
            for label in result.get('flagged_labels', []):
                FLAGGED_CONTENT.labels(content_type='image', reason=label).inc()
        
        return jsonify(result)
        
    except Exception as e:
        logger.exception("Error moderating image")
        MODERATION_FAILURES.inc()
        return jsonify({"error": str(e)}), 500

# Story moderation endpoint (combines text and image moderation)
@app.route('/api/moderate/story', methods=['POST'])
def moderate_story():
    MODERATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        data = request.json
        
        if not data:
            MODERATION_FAILURES.inc()
            return jsonify({"error": "No data provided"}), 400
        
        text = data.get('text', '')
        images = data.get('images', [])
        age_group = data.get('age_group', '3-5')
        
        # Moderate text
        text_result = moderate_text_with_openai(text, age_group) if openai_client else moderate_text_with_keywords(text, age_group)
        
        # Moderate images
        image_results = []
        for image in images:
            if rekognition_client:
                # Extract base64 data if needed
                if image.startswith('data:image'):
                    image = image.split(',')[1]
                image_result = moderate_image_with_rekognition(image, age_group)
            else:
                image_result = moderate_image_basic(image)
            image_results.append(image_result)
        
        # Combine results
        story_flagged = text_result['flagged'] or any(result['flagged'] for result in image_results)
        
        result = {
            "flagged": story_flagged,
            "text_moderation": text_result,
            "image_moderation": image_results
        }
        
        MODERATION_TIME.observe(time.time() - start_time)
        
        if story_flagged:
            FLAGGED_CONTENT.labels(content_type='story', reason='combined_issues').inc()
        
        return jsonify(result)
        
    except Exception as e:
        logger.exception("Error moderating story")
        MODERATION_FAILURES.inc()
        return jsonify({"error": str(e)}), 500

# OpenAI text moderation
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def moderate_text_with_openai(text, age_group):
    try:
        response = openai_client.moderations.create(input=text)
        result = response.results[0]
        
        # Adjust flagging based on age group
        flagged = result.flagged
        
        # For younger age groups, be more strict
        if age_group == '3-5' and any(result.category_scores.values()):
            # Lower threshold for youngest age group
            for category, score in result.category_scores.items():
                if score > 0.3:  # Lower threshold than OpenAI's default
                    flagged = True
                    break
        
        return {
            "flagged": flagged,
            "categories": result.categories,
            "category_scores": result.category_scores,
            "age_group": age_group
        }
    except Exception as e:
        logger.error(f"OpenAI moderation error: {e}")
        # Fallback to keyword-based moderation
        return moderate_text_with_keywords(text, age_group)

# Simple keyword-based text moderation
def moderate_text_with_keywords(text, age_group):
    # Very basic keyword list - in a real app, this would be much more comprehensive
    inappropriate_keywords = {
        '3-5': ['death', 'kill', 'blood', 'scary', 'monster', 'fight', 'hate', 'gun', 'weapon'],
        '6-8': ['kill', 'blood', 'gun', 'weapon', 'hate', 'violent'],
        '9-12': ['gun', 'weapon', 'explicit', 'violent']
    }
    
    # Get keywords for the specified age group and all younger age groups
    all_keywords = set()
    age_groups = ['3-5', '6-8', '9-12']
    for ag in age_groups:
        all_keywords.update(inappropriate_keywords.get(ag, []))
        if ag == age_group:
            break
    
    text_lower = text.lower()
    flagged_categories = {}
    
    for keyword in all_keywords:
        if keyword in text_lower:
            flagged_categories[keyword] = True
    
    return {
        "flagged": len(flagged_categories) > 0,
        "categories": flagged_categories,
        "age_group": age_group
    }

# AWS Rekognition image moderation
def moderate_image_with_rekognition(image_data, age_group):
    try:
        # Convert base64 to bytes
        image_bytes = base64.b64decode(image_data)
        
        # Call Rekognition DetectModerationLabels
        response = rekognition_client.detect_moderation_labels(
            Image={'Bytes': image_bytes},
            MinConfidence=50.0  # Adjust confidence threshold as needed
        )
        
        # Process moderation labels
        moderation_labels = response.get('ModerationLabels', [])
        
        # Age-appropriate filtering
        confidence_threshold = 70
        if age_group == '3-5':
            confidence_threshold = 50  # Stricter for young children
        elif age_group == '6-8':
            confidence_threshold = 60
        
        flagged_labels = []
        for label in moderation_labels:
            if label['Confidence'] >= confidence_threshold:
                flagged_labels.append(label['Name'])
        
        return {
            "flagged": len(flagged_labels) > 0,
            "flagged_labels": flagged_labels,
            "all_labels": [label['Name'] for label in moderation_labels],
            "age_group": age_group
        }
    except Exception as e:
        logger.error(f"Rekognition moderation error: {e}")
        # Fallback to basic image check
        return moderate_image_basic(image_data)

# Basic image moderation (fallback)
def moderate_image_basic(image_data):
    try:
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Check image dimensions
        width, height = image.size
        
        # Very basic check - just ensure the image isn't too large or too small
        if width > 5000 or height > 5000:
            return {
                "flagged": True,
                "flagged_labels": ["ImageTooLarge"],
                "message": "Image dimensions exceed maximum allowed"
            }
        
        if width < 100 or height < 100:
            return {
                "flagged": True,
                "flagged_labels": ["ImageTooSmall"],
                "message": "Image dimensions below minimum required"
            }
        
        return {
            "flagged": False,
            "message": "Image passed basic checks"
        }
    except Exception as e:
        logger.error(f"Basic image moderation error: {e}")
        return {
            "flagged": True,
            "flagged_labels": ["ProcessingError"],
            "message": f"Error processing image: {str(e)}"
        }

if __name__ == '__main__':
    # Start metrics server in a separate thread
    metrics_thread = threading.Thread(target=start_metrics_server, daemon=True)
    metrics_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=8080)
