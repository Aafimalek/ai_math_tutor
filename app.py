from flask import Flask, request, render_template, jsonify
import os
import uuid
from utils.math_solver import solve_math_problem, get_similar_problems
from utils.image_processor import extract_text_from_image
app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    """Solve a math problem from text or image"""
    try:
        # Check if image was uploaded
        if 'problem_image' in request.files and request.files['problem_image'].filename != '':
            # Process image input
            image_file = request.files['problem_image']
            
            # Create a unique filename
            filename = str(uuid.uuid4()) + os.path.splitext(image_file.filename)[1]
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            
            # Save the image
            image_file.save(image_path)
            
            # Extract text from image
            problem_text = extract_text_from_image(image_path)
            
            # Clean up the image file
            os.remove(image_path)
            
        else:
            # Process text input
            problem_text = request.form.get('problem_text', '')
        
        # Get domain if specified
        domain = request.form.get('domain', None)
        
        # Solve the problem
        if not problem_text:
            return jsonify({
                'error': 'No valid input provided. Please enter a math problem or upload an image.'
            }), 400
            
        solution = solve_math_problem(problem_text, domain)
        
        return jsonify({
            'problem': problem_text,
            'solution': solution
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/similar', methods=['POST'])
def similar():
    """Generate similar math problems"""
    try:
        problem_text = request.form.get('problem_text', '')
        domain = request.form.get('domain', None)
        if not problem_text:
            return jsonify({'error': 'No problem text provided.'}), 400
        similar_problems = get_similar_problems(problem_text, domain)
        return jsonify({'similar_problems': similar_problems})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)