import os
import json
import time
import uuid
import logging
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
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

# Initialize Anthropic client
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
if not ANTHROPIC_API_KEY:
    logger.warning("ANTHROPIC_API_KEY not set. Text generation will not work.")
    client = None
else:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Prometheus metrics
GENERATION_REQUESTS = Counter('text_generation_requests_total', 'Total number of text generation requests')
GENERATION_ERRORS = Counter('text_generation_errors_total', 'Total number of text generation errors')
GENERATION_TIME = Histogram('text_generation_time_seconds', 'Time spent generating text')

# Character information
CHARACTER_INFO = {
    'goku': {
        'universe': 'Dragon Ball',
        'traits': ['strong', 'kind', 'naive', 'determined', 'loves food'],
        'abilities': ['super strength', 'flying', 'energy blasts', 'martial arts'],
        'friends': ['Krillin', 'Bulma', 'Vegeta', 'Piccolo'],
        'speech_style': 'simple and direct, often excited about fighting'
    },
    'woody': {
        'universe': 'Toy Story',
        'traits': ['loyal', 'brave', 'responsible', 'insecure at times'],
        'abilities': ['leadership', 'comes alive when humans aren\'t looking'],
        'friends': ['Buzz Lightyear', 'Jessie', 'Bo Peep', 'Rex'],
        'speech_style': 'friendly cowboy talk with phrases like "howdy partner"'
    },
    'fry': {
        'universe': 'Futurama',
        'traits': ['lazy', 'kind-hearted', 'naive', 'impulsive'],
        'abilities': ['delivery boy skills', 'adaptability to the future'],
        'friends': ['Bender', 'Leela', 'Professor Farnsworth', 'Zoidberg'],
        'speech_style': 'casual and sometimes confused, makes pop culture references'
    },
    'leonardo': {
        'universe': 'Ninja Turtles',
        'traits': ['disciplined', 'responsible', 'strategic', 'leader'],
        'abilities': ['ninjutsu', 'swordsmanship', 'leadership'],
        'friends': ['Raphael', 'Donatello', 'Michelangelo', 'Splinter'],
        'speech_style': 'serious and focused, occasionally says "turtle power"'
    },
    'simba': {
        'universe': 'Lion King',
        'traits': ['brave', 'playful', 'responsible', 'royal'],
        'abilities': ['roaring', 'hunting', 'leadership'],
        'friends': ['Nala', 'Timon', 'Pumbaa', 'Rafiki'],
        'speech_style': 'regal yet approachable, sometimes playful'
    },
    'sulley': {
        'universe': 'Monsters Inc',
        'traits': ['kind', 'protective', 'strong', 'gentle giant'],
        'abilities': ['scaring', 'strength', 'roaring'],
        'friends': ['Mike Wazowski', 'Boo', 'Celia'],
        'speech_style': 'friendly and warm, sometimes nervous'
    }
}

# Start Prometheus metrics server
def start_metrics_server():
    start_http_server(8000)
    logger.info("Prometheus metrics server started on port 8000")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Text generation endpoint
@app.route('/api/generate', methods=['POST'])
def generate_text():
    GENERATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        data = request.json
        
        # Validate request
        if not data:
            GENERATION_ERRORS.inc()
            return jsonify({"error": "No data provided"}), 400
        
        characters = data.get('characters', [])
        theme = data.get('theme', 'adventure')
        moral_lesson = data.get('moral_lesson', 'friendship')
        age_group = data.get('age_group', '6-8')
        length = data.get('length', 'bedtime-short')
        story_id = data.get('story_id', str(uuid.uuid4()))
        
        if not characters:
            GENERATION_ERRORS.inc()
            return jsonify({"error": "No characters provided"}), 400
        
        if not client:
            GENERATION_ERRORS.inc()
            return jsonify({"error": "Text generation service not configured"}), 500
        
        # Build character information for the prompt
        character_details = []
        for character in characters:
            if character in CHARACTER_INFO:
                info = CHARACTER_INFO[character]
                character_details.append(f"{character.title()} from {info['universe']}: {', '.join(info['traits'])}")
            else:
                character_details.append(character)
        
        character_info = "\n".join(character_details)
        
        # Determine length based on story type
        if length == "bedtime-short":
            word_count = "300-400"
            pages = "5-7"
        elif length == "chapter-adventure":
            word_count = "600-800"
            pages = "10-15"
        elif length == "mini-epic":
            word_count = "1000-1200"
            pages = "15-20"
        else:
            word_count = "300-400"
            pages = "5-7"
        
        # Build the prompt
        prompt = f"""
        You are a children's story writer creating a {length} story for children in the {age_group} age group.
        
        Write a story featuring the following characters:
        {character_info}
        
        Theme: {theme}
        Moral lesson: {moral_lesson}
        
        The story should be appropriate for {age_group} year olds, approximately {word_count} words, and divided into {pages} pages.
        Each page should have a clear scene that could be illustrated.
        
        Format your response as a JSON object with the following structure:
        {{
            "title": "The story title",
            "pages": [
                {{
                    "page_number": 1,
                    "text": "Text for page 1",
                    "scene_description": "Brief description of what should be illustrated on this page"
                }},
                ...
            ]
        }}
        
        Make the story engaging, age-appropriate, and incorporate the moral lesson naturally.
        """
        
        # Generate text with Anthropic Claude
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=2000,
            temperature=0.7,
            system="You are a children's story writer who creates engaging, age-appropriate stories featuring characters from popular franchises.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract JSON from response
        try:
            content = response.content[0].text
            # Find JSON in the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                story_data = json.loads(json_str)
            else:
                # Fallback if JSON parsing fails
                GENERATION_ERRORS.inc()
                return jsonify({"error": "Failed to parse generated story"}), 500
        except Exception as e:
            logger.exception("Error parsing generated story")
            GENERATION_ERRORS.inc()
            return jsonify({"error": f"Failed to parse generated story: {str(e)}"}), 500
        
        # Add metadata
        result = {
            "story_id": story_id,
            "characters": characters,
            "theme": theme,
            "moral_lesson": moral_lesson,
            "age_group": age_group,
            "length": length,
            "story": story_data
        }
        
        GENERATION_TIME.observe(time.time() - start_time)
        return jsonify(result)
        
    except Exception as e:
        logger.exception("Error generating text")
        GENERATION_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start metrics server in a separate thread
    metrics_thread = threading.Thread(target=start_metrics_server, daemon=True)
    metrics_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=8080)
