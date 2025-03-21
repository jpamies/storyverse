import os
import json
import time
import uuid
import logging
import threading
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import openai
import boto3
from pydub import AudioSegment
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

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set. Audio narration will not work.")
    client = None
else:
    client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Initialize AWS S3 client
AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.environ.get('AWS_SECRET_KEY')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
S3_BUCKET = os.environ.get('S3_BUCKET', 'storyverse-media')

if AWS_ACCESS_KEY and AWS_SECRET_KEY:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
        region_name=AWS_REGION
    )
else:
    logger.warning("AWS credentials not set. S3 storage will not work.")
    s3_client = None

# Prometheus metrics
GENERATION_REQUESTS = Counter('audio_generation_requests_total', 'Total number of audio generation requests')
GENERATION_ERRORS = Counter('audio_generation_errors_total', 'Total number of audio generation errors')
GENERATION_TIME = Histogram('audio_generation_time_seconds', 'Time spent generating audio')

# Character voice mapping
CHARACTER_VOICES = {
    'goku': 'nova',  # Energetic, youthful voice
    'woody': 'alloy',  # Friendly, warm voice
    'fry': 'echo',  # Casual, slightly confused voice
    'leonardo': 'onyx',  # Serious, leader-like voice
    'simba': 'shimmer',  # Young, royal voice
    'sulley': 'fable'  # Deep, gentle giant voice
}

# Default voice
DEFAULT_VOICE = 'nova'

# Start Prometheus metrics server
def start_metrics_server():
    start_http_server(8000)
    logger.info("Prometheus metrics server started on port 8000")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Audio generation endpoint
@app.route('/api/generate', methods=['POST'])
def generate_audio():
    GENERATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        data = request.json
        
        # Validate request
        if not data:
            GENERATION_ERRORS.inc()
            return jsonify({"error": "No data provided"}), 400
        
        story_id = data.get('story_id', str(uuid.uuid4()))
        story_text = data.get('text')
        characters = data.get('characters', [])
        narrator_voice = data.get('narrator_voice', 'alloy')
        
        if not story_text:
            GENERATION_ERRORS.inc()
            return jsonify({"error": "No story text provided"}), 400
        
        if not client:
            GENERATION_ERRORS.inc()
            return jsonify({"error": "Audio generation service not configured"}), 500
        
        # For simplicity, we'll use a single voice for the entire narration
        # In a real implementation, we would parse the text to identify character dialogue
        # and use different voices for different characters
        
        # Select voice based on primary character or use default narrator voice
        voice = narrator_voice
        if characters and characters[0] in CHARACTER_VOICES:
            voice = CHARACTER_VOICES[characters[0]]
        
        # Generate audio with OpenAI TTS
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        
        try:
            response = client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=story_text
            )
            
            # Save audio to temp file
            response.stream_to_file(temp_file.name)
            
            # In a real implementation, we would upload to S3 here
            audio_url = f"local://{temp_file.name}"
            
            if s3_client:
                # Upload to S3
                s3_key = f"stories/{story_id}/narration.mp3"
                s3_client.upload_file(temp_file.name, S3_BUCKET, s3_key)
                audio_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
            
            GENERATION_TIME.observe(time.time() - start_time)
            return jsonify({
                "status": "success",
                "audio_url": audio_url,
                "story_id": story_id,
                "voice": voice,
                "duration_seconds": get_audio_duration(temp_file.name)
            })
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
        
    except Exception as e:
        logger.exception("Error generating audio")
        GENERATION_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

# Get audio duration in seconds
def get_audio_duration(file_path):
    try:
        audio = AudioSegment.from_file(file_path)
        return len(audio) / 1000.0  # Convert milliseconds to seconds
    except Exception as e:
        logger.error(f"Error getting audio duration: {e}")
        return 0

if __name__ == '__main__':
    # Start metrics server in a separate thread
    metrics_thread = threading.Thread(target=start_metrics_server, daemon=True)
    metrics_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=8080)
