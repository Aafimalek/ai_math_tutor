document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const problemForm = document.getElementById('problem-form');
    const problemText = document.getElementById('problem-text');
    const problemImage = document.getElementById('problem-image');
    const imagePreview = document.getElementById('image-preview');
    const solveButton = document.getElementById('solve-button');
    const solutionSection = document.getElementById('solution-section');
    const loader = document.getElementById('loader');
    const problemDisplay = document.getElementById('problem-text-display');
    const solutionContent = document.getElementById('solution-content');
    const similarButton = document.getElementById('similar-button');
    const similarProblemsDiv = document.getElementById('similar-problems');
    
    // Show image preview
    problemImage.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Problem image preview">`;
            };
            
            reader.readAsDataURL(file);
        } else {
            imagePreview.innerHTML = `<p>Preview will appear here</p>`;
        }
    });
    
    // Handle form submission
    problemForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Validate input
        const textInput = problemText.value.trim();
        const fileInput = problemImage.files[0];
        
        if (!textInput && !fileInput) {
            alert('Please enter a math problem or upload an image.');
            return;
        }
        
        // Show loader and solution section
        solutionSection.style.display = 'block';
        loader.style.display = 'block';
        solutionContent.innerHTML = '';
        
        // Disable the solve button
        solveButton.disabled = true;
        solveButton.textContent = 'Solving...';
        
        // Create form data
        const formData = new FormData(problemForm);
        
        // Send request to server
        fetch('/solve', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Hide loader
            loader.style.display = 'none';
            
            // Check for error
            if (data.error) {
                solutionContent.innerHTML = `<div class="error">${data.error}</div>`;
                return;
            }
            
            // Process LaTeX in problem text
            let processedProblem = data.problem;
            // Replace display math first
            processedProblem = processedProblem.replace(/\$\$([\s\S]+?)\$\$/g, '\\[$1\\]');
            // Then inline math
            processedProblem = processedProblem.replace(/\$([^\$]+)\$/g, '\\($1\\)');
            problemDisplay.innerHTML = processedProblem;

            // Trigger MathJax rendering for the problem statement
            if (window.MathJax) {
                MathJax.typesetPromise([problemDisplay]).catch(err => console.error('MathJax error:', err));
            }

            // Process solution to render LaTeX properly
            let processedSolution = data.solution;

            // Replace $$...$$ (display math) with \[...\]
            processedSolution = processedSolution.replace(/\$\$([\s\S]+?)\$\$/g, (match, p1) => {
                return '<div class="math-display">\\[' + p1.trim() + '\\]</div>';
            });

            // Replace $...$ (inline math) with \(...\), but not inside display math
            processedSolution = processedSolution.replace(/(^|[^\\])\$([^\$]+?)\$/g, (match, prefix, p1) => {
                if (prefix.endsWith('\\')) return match;
                return prefix + '\\(' + p1.trim() + '\\)';
            });

            // Replace Markdown bold (**text**) with <strong>
            processedSolution = processedSolution.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

            // Replace Markdown italic (*text*) with <em>
            processedSolution = processedSolution.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

            // Split into paragraphs at double newlines, preserve lists and math blocks
            processedSolution = processedSolution
                .replace(/\r\n/g, '\n') // Normalize newlines
                .split(/\n{2,}/)
                .map(paragraph => {
                    // If it's a display math block, don't wrap in <p>
                    if (paragraph.includes('class="math-display"')) return paragraph;
                    // If it's a list, don't wrap in <p>
                    if (/^\s*[\d\-\*]+\./.test(paragraph)) return paragraph.replace(/\n/g, '<br>');
                    return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
                })
                .join('');

            // Set HTML
            solutionContent.innerHTML = processedSolution;

            // Typeset math expressions
            if (window.MathJax) {
                MathJax.typesetPromise([solutionContent]).catch(err => console.error('MathJax error:', err));
            }
            
            // Scroll to solution
            solutionSection.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error:', error);
            loader.style.display = 'none';
            solutionContent.innerHTML = `<div class="error">An error occurred. Please try again.</div>`;
        })
        .finally(() => {
            // Re-enable the solve button
            solveButton.disabled = false;
            solveButton.textContent = 'Solve Problem';
        });
    });

    // Handle similar problems generation
    if (similarButton) {
        similarButton.addEventListener('click', function() {
            const textInput = problemText.value.trim();
            if (!textInput) {
                alert('Please enter a math problem to get similar problems.');
                return;
            }
            similarButton.disabled = true;
            similarButton.textContent = 'Generating...';
            similarProblemsDiv.innerHTML = '';

            const formData = new FormData();
            formData.append('problem_text', textInput);
            formData.append('domain', document.getElementById('domain-select').value);

            fetch('/similar', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                similarButton.disabled = false;
                similarButton.textContent = 'Get Similar Problems';
                if (data.error) {
                    similarProblemsDiv.innerHTML = `<div class="error">${data.error}</div>`;
                } else if (data.similar_problems && data.similar_problems.length) {
                    // Clean up each problem: remove leading numbering and trim, then process LaTeX
                    const cleaned = data.similar_problems.map(p => {
                        let text = p.replace(/^\s*[\d\-\*]+\.\s*/, '').trim();
                        // Replace display math first
                        text = text.replace(/\$\$([\s\S]+?)\$\$/g, '\\[$1\\]');
                        // Then inline math
                        text = text.replace(/\$([^\$]+)\$/g, '\\($1\\)');
                        return text;
                    });
                    similarProblemsDiv.innerHTML = '<strong>Similar Problems:</strong><ul>' +
                        cleaned.map(p => `<li>${p}</li>`).join('') +
                        '</ul>';
                    // Trigger MathJax rendering
                    if (window.MathJax) {
                        MathJax.typesetPromise([similarProblemsDiv]).catch(err => console.error('MathJax error:', err));
                    }
                } else {
                    similarProblemsDiv.innerHTML = '<div>No similar problems found.</div>';
                }
            })
            .catch(error => {
                similarButton.disabled = false;
                similarButton.textContent = 'Get Similar Problems';
                similarProblemsDiv.innerHTML = `<div class="error">An error occurred. Please try again.</div>`;
            });
        });
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        // Load preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ Light Mode';
        }
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
                darkModeToggle.textContent = '☀️ Light Mode';
            } else {
                localStorage.setItem('darkMode', 'disabled');
                darkModeToggle.textContent = '🌙 Dark Mode';
            }
        });
    }
});