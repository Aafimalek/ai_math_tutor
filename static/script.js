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
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const fileNameDisplay = document.getElementById('file-name-display');

    // Utility function to clean and process text
    function cleanText(text) {
        if (!text) return '';
        
        // Remove excessive hashtags and markdown artifacts
        text = text.replace(/#{3,}/g, '###'); // Limit to max 3 hashtags
        text = text.replace(/^\s*#+\s*/gm, ''); // Remove leading hashtags from lines
        text = text.replace(/\*{3,}/g, '**'); // Limit excessive asterisks
        text = text.replace(/_{3,}/g, '__'); // Limit excessive underscores
        
        // Clean up spacing
        text = text.replace(/\n{3,}/g, '\n\n'); // Limit excessive line breaks
        text = text.replace(/\s{3,}/g, '  '); // Limit excessive spaces
        
        // Remove problematic characters that might break rendering
        text = text.replace(/[^\w\s\.\,\!\?\(\)\+\-\*\/\=\^\{\}\[\]\$\\\n\r:;'"<>]/g, '');
        
        return text.trim();
    }

    // Improved math processing function
    function processMathContent(text) {
        if (!text) return '';
        
        // Clean the text first
        text = cleanText(text);
        
        // Handle block math ($$...$$)
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
            const cleanContent = content.trim().replace(/\n+/g, ' ');
            return `<div class="math-display">\\[${cleanContent}\\]</div>`;
        });
        
        // Handle inline math ($...$) - be more careful to avoid conflicts
        text = text.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, content) => {
            return `\\(${content.trim()}\\)`;
        });
        
        // Process markdown-style formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
        
        // Process paragraphs and line breaks
        text = text
            .replace(/\r\n/g, '\n')
            .split(/\n\n+/)
            .map(paragraph => {
                paragraph = paragraph.trim();
                if (!paragraph) return '';
                
                // Skip math display blocks
                if (paragraph.includes('class="math-display"')) {
                    return paragraph;
                }
                
                // Handle lists
                if (/^\s*[\d\-\*•]+[\.\)]\s*/.test(paragraph) || /^\s*[-\*•]\s/.test(paragraph)) {
                    const listItems = paragraph.split('\n').map(item => {
                        item = item.trim();
                        if (/^\s*\d+[\.\)]\s*/.test(item)) {
                            return `<li>${item.replace(/^\s*\d+[\.\)]\s*/, '')}</li>`;
                        } else if (/^\s*[-\*•]\s/.test(item)) {
                            return `<li>${item.replace(/^\s*[-\*•]\s*/, '')}</li>`;
                        }
                        return item ? `<li>${item}</li>` : '';
                    }).filter(item => item);
                    
                    const isNumbered = /^\s*\d+[\.\)]/.test(paragraph);
                    return isNumbered ? `<ol>${listItems.join('')}</ol>` : `<ul>${listItems.join('')}</ul>`;
                }
                
                // Regular paragraphs
                return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
            })
            .filter(p => p)
            .join('');
        
        return text;
    }

    // Show image preview & update file name display
    if (problemImage) {
        problemImage.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
                    this.value = '';
                    return;
                }
                
                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    alert('File size must be less than 10MB');
                    this.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Problem image preview">`;
                    imagePreview.style.display = 'flex';
                };
                reader.readAsDataURL(file);
                
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = file.name;
                }
            } else {
                imagePreview.innerHTML = '';
                imagePreview.style.display = 'none';
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = 'No file chosen';
                }
            }
        });
    }
    
    // Handle form submission
    if (problemForm) {
        problemForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const textInput = problemText.value.trim();
            const fileInput = problemImage.files[0];
            
            if (!textInput && !fileInput) {
                alert('Please enter a math problem or upload an image.');
                return;
            }
            
            // Show solution section and loader
            solutionSection.style.display = 'block';
            loader.style.display = 'block';
            solutionContent.innerHTML = '';
            problemDisplay.innerHTML = '';
            similarProblemsDiv.innerHTML = '';
            
            // Update button state
            solveButton.disabled = true;
            solveButton.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; display: inline-block; margin-right: 5px;"></div> Solving...`;
            
            const formData = new FormData(problemForm);
            
            fetch('/solve', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                loader.style.display = 'none';
                
                if (data.error) {
                    solutionContent.innerHTML = `<div class="error">${cleanText(data.error)}</div>`;
                    return;
                }
                
                // Process and display the problem
                const processedProblem = processMathContent(data.problem);
                problemDisplay.innerHTML = processedProblem;
                
                // Process and display the solution
                const processedSolution = processMathContent(data.solution);
                solutionContent.innerHTML = processedSolution;
                
                // Render MathJax
                if (window.MathJax) {
                    MathJax.typesetPromise([problemDisplay, solutionContent])
                        .catch(err => console.error('MathJax error:', err));
                }
                
                // Smooth scroll to solution
                setTimeout(() => {
                    solutionSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 100);
            })
            .catch(error => {
                console.error('Error:', error);
                loader.style.display = 'none';
                solutionContent.innerHTML = `<div class="error">An error occurred: ${error.message}. Please try again.</div>`;
            })
            .finally(() => {
                solveButton.disabled = false;
                solveButton.innerHTML = `<span class="icon-placeholder">✔️</span> Solve Problem`;
            });
        });
    }

    // Handle similar problems generation
    if (similarButton) {
        similarButton.addEventListener('click', function() {
            const currentProblemText = problemDisplay.textContent.trim() || problemText.value.trim();
            if (!currentProblemText) {
                alert('Please solve a problem first or enter one to get similar problems.');
                return;
            }
            
            similarButton.disabled = true;
            similarButton.innerHTML = `<div class="spinner" style="width: 18px; height: 18px; border-width: 2px; display: inline-block; margin-right: 5px;"></div> Generating...`;
            similarProblemsDiv.innerHTML = '<div class="loader" style="display:block; text-align:left; padding:0;"><p>Fetching similar problems...</p></div>';

            const formData = new FormData();
            formData.append('problem_text', currentProblemText);
            formData.append('domain', document.getElementById('domain-select').value);

            fetch('/similar', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    similarProblemsDiv.innerHTML = `<div class="error">${cleanText(data.error)}</div>`;
                } else if (data.similar_problems && data.similar_problems.length) {
                    const cleanedProblems = data.similar_problems.map(p => {
                        let cleanedProblem = cleanText(p);
                        cleanedProblem = cleanedProblem.replace(/^\s*[\d\-\*]+\.\s*/, '').trim();
                        return processMathContent(cleanedProblem);
                    });
                    
                    similarProblemsDiv.innerHTML = '<strong>Similar Problems:</strong><ul>' +
                        cleanedProblems.map(p => `<li>${p}</li>`).join('') +
                        '</ul>';
                    
                    if (window.MathJax) {
                        MathJax.typesetPromise([similarProblemsDiv])
                            .catch(err => console.error('MathJax error on similar:', err));
                    }
                } else {
                    similarProblemsDiv.innerHTML = '<div>No similar problems found.</div>';
                }
            })
            .catch(error => {
                similarProblemsDiv.innerHTML = `<div class="error">An error occurred while fetching similar problems.</div>`;
                console.error("Error fetching similar problems:", error);
            })
            .finally(() => {
                similarButton.disabled = false;
                similarButton.innerHTML = `<span class="icon-placeholder">🔄</span> Get Similar Problems`;
            });
        });
    }

    // Dark mode toggle
    if (darkModeToggle) {
        const toggleTextElement = darkModeToggle.querySelector('.toggle-text');
        const iconElement = darkModeToggle.querySelector('.icon-placeholder');

        function updateToggleAppearance(isDarkMode) {
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
                if (toggleTextElement) toggleTextElement.textContent = 'Light Mode';
                if (iconElement) iconElement.textContent = '☀️';
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                if (toggleTextElement) toggleTextElement.textContent = 'Dark Mode';
                if (iconElement) iconElement.textContent = '🌙';
                localStorage.setItem('darkMode', 'disabled');
            }
        }

        // Load preference
        const currentMode = localStorage.getItem('darkMode');
        if (currentMode === 'enabled') {
            updateToggleAppearance(true);
        } else {
            updateToggleAppearance(false);
        }

        darkModeToggle.addEventListener('click', function() {
            updateToggleAppearance(!document.body.classList.contains('dark-mode'));
        });
    }

    // Add resize handler for responsive math
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (window.MathJax && window.MathJax.typesetPromise) {
                MathJax.typesetPromise().catch(err => console.error('MathJax resize error:', err));
            }
        }, 250);
    });
});