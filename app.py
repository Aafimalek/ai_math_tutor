# app.py
from flask import Flask, request, render_template, jsonify
import os
import uuid
# Import the updated OCR function and your solver
from utils.math_solver import solve_math_problem, get_similar_problems
from utils.image_processor import extract_text_from_image
import logging

app = Flask(__name__)

# Configure logging for app.py
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# UPLOAD_FOLDER is no longer strictly necessary for OCR if reading bytes directly
# But you might keep it for debugging or other purposes.
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER # Still useful for temporary saves if needed

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    """Solve a math problem from text or image"""
    try:
        problem_text = ""
        # Check if image was uploaded
        if 'problem_image' in request.files and request.files['problem_image'].filename != '':
            image_file = request.files['problem_image']

            # Read image bytes directly from the uploaded file
            image_bytes = image_file.read()
            logger.info(f"Received image file: {image_file.filename}, size: {len(image_bytes)} bytes")

            # --- NEW OCR INTEGRATION: Call the Groq Vision based OCR ---
            problem_text = extract_text_from_image(image_bytes)
            logger.info(f"OCR extracted text: {problem_text[:100]}...") # Log first 100 chars
            # --- END NEW OCR INTEGRATION ---

            if "Error" in problem_text or not problem_text.strip():
                return jsonify({
                    'error': problem_text if "Error" in problem_text else 'Could not extract a valid math problem from the image. Please try a clearer image.'
                }), 400

        else:
            # Process text input if no image is uploaded
            problem_text = request.form.get('problem_text', '').strip()

        # Get domain if specified
        domain = request.form.get('domain', None)

        # Solve the problem
        if not problem_text:
            return jsonify({
                'error': 'No valid input provided. Please enter a math problem or upload an image.'
            }), 400

        solution = solve_math_problem(problem_text, domain)

        return jsonify({
            'problem': problem_text, # Return the extracted text
            'solution': solution
        })

    except Exception as e:
        logger.exception("An error occurred during problem solving:") # Log full traceback
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/similar', methods=['POST'])
def similar():
    """Generate similar math problems"""
    try:
        problem_text = request.form.get('problem_text', '').strip()
        domain = request.form.get('domain', None)
        if not problem_text:
            return jsonify({'error': 'No problem text provided.'}), 400
        similar_problems = get_similar_problems(problem_text, domain)
        return jsonify({'similar_problems': similar_problems})
    except Exception as e:
        logger.exception("An error occurred during similar problem generation:")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)