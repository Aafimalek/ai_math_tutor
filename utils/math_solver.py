# math_solver.py
from groq import Groq
import os
import logging
from dotenv import load_dotenv
from .domain_prompts import get_domain_prompt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq client
client = None
try:
    client = Groq(api_key=GROQ_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {str(e)}")

def detect_math_domain(problem_text):
    """Simple heuristic to detect math domain based on keywords"""
    problem_text = problem_text.lower()
    
    if any(kw in problem_text for kw in ["derivative", "integral", "differentiate", "integrate", "limit"]):
        return "calculus"
    elif any(kw in problem_text for kw in ["matrix", "vector", "linear", "determinant", "eigenvalue", "eigenvector", "span"]):
        return "linear_algebra"
    elif any(kw in problem_text for kw in ["probability", "distribution", "random", "variance", "standard deviation", "mean", "median", "hypothesis"]):
        return "statistics"
    elif any(kw in problem_text for kw in ["differential equation", "ode", "pde", "solve for y", "d/dx", "∂/∂t"]):
        return "differential_equations"
    else:
        return "general"

def solve_math_problem(problem_text, domain=None):
    """Solve a math problem using Groq API"""
    if client is None:
        return "Error: Groq client not initialized. Please check your API key."
    
    try:
        # Auto-detect domain if not specified
        if domain is None:
            domain = detect_math_domain(problem_text)
        
        # Get domain-specific prompt
        system_prompt = get_domain_prompt(domain)
        
        # Format the problem
        formatted_problem = f"Solve this mathematics problem step-by-step:\n\n{problem_text}"
        
        # Call Groq API with Claude model (can also use llama3-70b-8192)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # You can try other models available on Groq
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": formatted_problem}
            ],
            temperature=0.2,  # Lower temperature for more deterministic math solutions
            max_tokens=4000
        )
        
        solution = completion.choices[0].message.content
        logger.info(f"Generated solution for {domain} problem")
        return solution
    
    except Exception as e:
        logger.error(f"Error solving math problem: {str(e)}")
        return f"Error solving math problem: {str(e)}"

def get_similar_problems(problem_text, domain=None, n=3):
    """Generate similar math problems using Groq API"""
    if client is None:
        return ["Error: Groq client not initialized. Please check your API key."]
    try:
        if domain is None:
            domain = detect_math_domain(problem_text)
        system_prompt = get_domain_prompt(domain)
        user_prompt = (
            f"Given the following math problem, generate {n} similar but distinct problems "
            f"of the same type and difficulty. Only output the problems, numbered:\n\n"
            f"Original problem:\n{problem_text}"
        )
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        response = completion.choices[0].message.content
        # Extract the problems as a list
        problems = [line.strip() for line in response.split('\n') if line.strip() and (line.strip()[0].isdigit() or line.strip().startswith('-'))]
        return problems if problems else [response]
    except Exception as e:
        logger.error(f"Error generating similar problems: {str(e)}")
        return [f"Error generating similar problems: {str(e)}"]