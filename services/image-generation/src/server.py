import os
import json
import uuid
import time
import logging
import threading
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
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

# Prometheus metrics
GENERATION_REQUESTS = Counter('image_generation_requests_total', 'Total number of image generation requests')
GENERATION_ERRORS = Counter('image_generation_errors_total', 'Total number of image generation errors')
GENERATION_TIME = Histogram('image_generation_time_seconds', 'Time spent generating images')

# ComfyUI API endpoint
COMFYUI_API = os.environ.get('COMFYUI_API', 'http://localhost:8188')

# S3 configuration
S3_BUCKET = os.environ.get('S3_BUCKET', 'storyverse-media')
S3_PREFIX = os.environ.get('S3_PREFIX', 'stories')

# Character templates
CHARACTER_TEMPLATES = {
    'goku': {
        'prompt': 'Goku from Dragon Ball, spiky black hair, orange gi, blue undershirt, martial artist, friendly smile',
        'negative_prompt': 'realistic, photo, low quality, deformed'
    },
    'woody': {
        'prompt': 'Woody from Toy Story, cowboy, yellow plaid shirt, blue jeans, brown cowboy hat, pull string',
        'negative_prompt': 'realistic, photo, low quality, deformed'
    },
    'fry': {
        'prompt': 'Fry from Futurama, orange hair, red jacket, white t-shirt, blue jeans, delivery boy',
        'negative_prompt': 'realistic, photo, low quality, deformed'
    },
    'leonardo': {
        'prompt': 'Leonardo from Ninja Turtles, blue mask, ninja turtle, katana swords, green skin, shell',
        'negative_prompt': 'realistic, photo, low quality, deformed'
    },
    'simba': {
        'prompt': 'Simba from Lion King, young lion cub, golden fur, curious expression',
        'negative_prompt': 'realistic, photo, low quality, deformed'
    },
    'sulley': {
        'prompt': 'Sulley from Monsters Inc, blue fur with purple spots, horns, large monster, friendly',
        'negative_prompt': 'realistic, photo, low quality, deformed'
    }
}

# Start Prometheus metrics server
def start_metrics_server():
    start_http_server(8000)
    logger.info("Prometheus metrics server started on port 8000")

# Start ComfyUI server
def start_comfyui():
    logger.info("Starting ComfyUI server...")
    subprocess.Popen(["python", "/app/ComfyUI/main.py", "--listen", "0.0.0.0", "--port", "8188"])
    # Wait for ComfyUI to start
    time.sleep(10)
    logger.info("ComfyUI server started")

# Generate workflow for character combination
def generate_workflow(characters, scene, style):
    # This is a simplified workflow - in a real implementation, this would be more complex
    # and would handle character combinations more intelligently
    
    character_prompts = []
    for character in characters:
        if character in CHARACTER_TEMPLATES:
            character_prompts.append(CHARACTER_TEMPLATES[character]['prompt'])
        else:
            character_prompts.append(f"{character}, character")
    
    character_prompt = ", ".join(character_prompts)
    scene_prompt = f"scene: {scene}" if scene else ""
    
    prompt = f"{character_prompt}, {scene_prompt}, children's book illustration, {style}"
    negative_prompt = "realistic, photo, low quality, deformed, ugly, bad anatomy"
    
    # Simple ComfyUI workflow for Stable Diffusion
    workflow = {
        "3": {
            "inputs": {
                "seed": 123456789,
                "steps": 30,
                "cfg": 7.5,
                "sampler_name": "euler_ancestral",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "4": {
            "inputs": {
                "ckpt_name": "dreamshaper_8.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "5": {
            "inputs": {
                "width": 768,
                "height": 512,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "6": {
            "inputs": {
                "text": prompt,
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "7": {
            "inputs": {
                "text": negative_prompt,
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "8": {
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            },
            "class_type": "VAEDecode"
        },
        "9": {
            "inputs": {
                "filename_prefix": "storyverse",
                "images": ["8", 0]
            },
            "class_type": "SaveImage"
        }
    }
    
    return workflow

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Image generation endpoint
@app.route('/api/generate', methods=['POST'])
def generate_image():
    GENERATION_REQUESTS.inc()
    start_time = time.time()
    
    try:
        data = request.json
        
        # Validate request
        if not data:
            GENERATION_ERRORS.inc()
            return jsonify({"error": "No data provided"}), 400
        
        characters = data.get('characters', [])
        scene = data.get('scene', '')
        style = data.get('style', 'cartoon')
        story_id = data.get('story_id', str(uuid.uuid4()))
        
        if not characters:
            GENERATION_ERRORS.inc()
            return jsonify({"error": "No characters provided"}), 400
        
        # Generate workflow
        workflow = generate_workflow(characters, scene, style)
        
        # Submit workflow to ComfyUI
        response = requests.post(
            f"{COMFYUI_API}/prompt",
            json={"prompt": workflow}
        )
        
        if response.status_code != 200:
            logger.error(f"ComfyUI API error: {response.text}")
            GENERATION_ERRORS.inc()
            return jsonify({"error": "Failed to submit workflow to ComfyUI"}), 500
        
        prompt_id = response.json().get('prompt_id')
        
        # Poll for completion (in a real implementation, this would be async)
        # This is simplified for demonstration purposes
        max_retries = 30
        for i in range(max_retries):
            time.sleep(1)
            history_response = requests.get(f"{COMFYUI_API}/history/{prompt_id}")
            if history_response.status_code == 200:
                history = history_response.json()
                if prompt_id in history:
                    if 'outputs' in history[prompt_id]:
                        # Get the image path
                        for node_id, output in history[prompt_id]['outputs'].items():
                            if 'images' in output:
                                image_data = output['images'][0]
                                image_path = f"/app/ComfyUI/output/{image_data['filename']}"
                                
                                # In a real implementation, we would upload to S3 here
                                # For now, we'll just return the local path
                                image_url = f"local://{image_path}"
                                
                                GENERATION_TIME.observe(time.time() - start_time)
                                return jsonify({
                                    "status": "success",
                                    "image_url": image_url,
                                    "story_id": story_id,
                                    "characters": characters,
                                    "scene": scene,
                                    "style": style
                                })
        
        # If we get here, generation timed out
        GENERATION_ERRORS.inc()
        return jsonify({"error": "Image generation timed out"}), 500
        
    except Exception as e:
        logger.exception("Error generating image")
        GENERATION_ERRORS.inc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start metrics server in a separate thread
    metrics_thread = threading.Thread(target=start_metrics_server, daemon=True)
    metrics_thread.start()
    
    # Start ComfyUI in a separate thread
    comfyui_thread = threading.Thread(target=start_comfyui, daemon=True)
    comfyui_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=8080)
