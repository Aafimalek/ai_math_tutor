# AI Math Tutor

AI Math Tutor is a web application that helps users solve math problems up to Master's level, providing step-by-step solutions and generating similar problems for practice. It supports both text and image input (with OCR for math images), and features a modern, responsive frontend with dark mode.

---

## Features

- **Step-by-step math solutions** using Groq LLM API (Llama 3 model).
- **Similar problem generation** for extra practice.
- **Text and image input** (image OCR using Tesseract + equ language data).
- **LaTeX rendering** for math expressions (via MathJax).
- **Modern UI** with dark mode toggle.
- **Domain selection** (General, Calculus, Linear Algebra, Statistics, Differential Equations).

---

## Setup Instructions

### 1. Clone the repository

```sh
git clone https://github.com/yourusername/ai_math_tutor.git
cd ai_math_tutor
```

### 2. Install dependencies

Make sure you have Python 3.8+ and [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed.

```sh
pip install -r requirements.txt
```

- **Windows users:** Download and install Tesseract, and ensure `equ.traineddata` is in your `tessdata` folder.

### 3. Set up environment variables

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the app

```sh
python app.py
```

Visit [http://localhost:5000](http://localhost:5000) in your browser.

---

## Usage

1. **Enter a math problem** in the text box, or upload a clear image of a printed/handwritten math problem.
2. **Select a domain** (optional) for more accurate solutions.
3. Click **"Solve Problem"** to get a step-by-step solution.
4. Click **"Get Similar Problems"** for practice problems of the same type.
5. Toggle **dark mode** using the button in the header.

---

## Notes

- **OCR for math images is experimental** and may not accurately capture all symbols, especially for handwritten or complex printed math. For best results, type your problem or use a clear, high-contrast printed image.
- All math is rendered using LaTeX via MathJax.
- Solutions and similar problems are generated using the Groq Llama 3 model.

---

## Project Structure

```
ai_math_tutor/
│
├── app.py                  # Flask app
├── requirements.txt
├── .env
│
├── static/
│   ├── style.css           # Frontend styles
│   └── script.js           # Frontend JS
│
├── templates/
│   └── index.html          # Main HTML template
│
└── utils/
    ├── math_solver.py      # LLM integration and similar problems
    ├── image_processor.py  # OCR pipeline
    └── domain_prompts.py   # Domain-specific prompts
```

---

## Credits

- [Groq](https://groq.com/) for LLM API
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [MathJax](https://www.mathjax.org/) for LaTeX rendering

---

## License

MIT License
