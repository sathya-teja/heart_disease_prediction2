// Production-Grade JavaScript for HeartSense AI

class HeartSenseApp {
    constructor() {
        this.form = document.getElementById('predictionForm');
        this.submitBtn = document.querySelector('#predictionForm .btn-primary');
        this.resultsSection = document.getElementById('results-section');
        this.toastContainer = null;
        
        this.init();
    }

    init() {
        this.createToastContainer();
        this.setupFormHandling();
        this.setupFormValidation();
        this.setupAnimations();
    }

    // Create toast container for notifications
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        this.toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
        `;
        document.body.appendChild(this.toastContainer);
    }

    // Setup form submission with AJAX
    setupFormHandling() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) {
                this.showToast('Please fill in all required fields correctly.', 'error');
                return;
            }

            this.showLoading();
            
            try {
                const formData = new FormData(this.form);
                const response = await fetch('/predict', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.error) {
                    throw new Error(result.error);
                }
                
                this.displayResults(result);
                this.showToast('Analysis completed successfully!', 'success');
                
            } catch (error) {
                console.error('Error:', error);
                this.showToast('An error occurred. Please try again.', 'error');
            } finally {
                this.hideLoading();
            }
        });
    }

    // Form validation
    setupFormValidation() {
        const inputs = this.form?.querySelectorAll('input, select');
        if (!inputs) return;

        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input, select');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        // Clear previous errors
        this.clearFieldError(field);

        // Check if required field is empty
        if (isRequired && !value) {
            this.showFieldError(field, 'This field is required.');
            return false;
        }

        // Validate number fields
        if (field.type === 'number' && value) {
            const numValue = parseFloat(value);
            const min = parseFloat(field.min);
            const max = parseFloat(field.max);

            if (isNaN(numValue)) {
                this.showFieldError(field, 'Please enter a valid number.');
                return false;
            }

            if (min && numValue < min) {
                this.showFieldError(field, `Value must be at least ${min}.`);
                return false;
            }

            if (max && numValue > max) {
                this.showFieldError(field, `Value must be at most ${max}.`);
                return false;
            }
        }

        // Mark as valid
        field.classList.add('is-valid');
        return true;
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        // Create or update error message
        let errorElement = field.parentNode.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            errorElement.style.cssText = `
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            `;
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid', 'is-valid');
        const errorElement = field.parentNode.querySelector('.invalid-feedback');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Loading states
    showLoading() {
        if (this.submitBtn) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
        }
    }

    hideLoading() {
        if (this.submitBtn) {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = 'Analyze Risk';
        }
    }

    // Display results with charts
    displayResults(result) {
        // Extract data from JSON response
        const predictionText = result.prediction;
        const probability = result.probability;
        const isPositive = result.is_positive;
        
        // Create results HTML
        const resultsHTML = `
            <div class="result-card ${isPositive ? 'result-positive' : 'result-negative'}">
                <div class="result-header">
                    <h3>${isPositive ? '⚠️ Risk Detected' : '✅ No Risk Detected'}</h3>
                    <p class="result-description">${predictionText}</p>
                </div>
                
                <div class="charts-container">
                    <div class="chart-card">
                        <h4>Risk Probability</h4>
                        <div class="chart-wrapper">
                            <canvas id="probabilityChart" width="300" height="300"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-card">
                        <h4>Feature Importance</h4>
                        <div class="chart-wrapper">
                            <canvas id="featureChart" width="300" height="300"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="result-actions">
                    <button class="btn-secondary" onclick="window.print()">Download Report</button>
                    <button class="btn-primary" onclick="document.getElementById('prediction-form-section').scrollIntoView({behavior: 'smooth'})">New Prediction</button>
                </div>
            </div>
        `;
        
        // Display results
        this.resultsSection.innerHTML = resultsHTML;
        this.resultsSection.style.display = 'block';
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Initialize charts
        this.createProbabilityChart(probability);
        this.createFeatureChart();
    }

    // Create probability donut chart
    createProbabilityChart(probability) {
        const ctx = document.getElementById('probabilityChart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Risk Probability', 'No Risk'],
                datasets: [{
                    data: [probability * 100, (1 - probability) * 100],
                    backgroundColor: ['#ef4444', '#10b981'],
                    borderWidth: 0,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                family: 'Inter',
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Create feature importance chart
    createFeatureChart() {
        const ctx = document.getElementById('featureChart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Chest Pain', 'Max Heart Rate', 'Age', 'Cholesterol', 'Blood Pressure', 'ST Depression', 'Exercise Angina'],
                datasets: [{
                    label: 'Importance',
                    data: [0.23, 0.18, 0.15, 0.12, 0.10, 0.08, 0.06],
                    backgroundColor: '#1976d2',
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Importance: ' + (context.parsed * 100).toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 0.3,
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            },
                            font: {
                                family: 'Inter',
                                size: 10
                            }
                        },
                        grid: {
                            color: '#e3e8ee'
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                family: 'Inter',
                                size: 10
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast show`;
        toast.style.cssText = `
            background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#dbeafe'};
            border-left: 4px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : '#1e40af'};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-bottom: 1rem;
            min-width: 300px;
            padding: 1rem;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
        `;
        
        toast.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; color: inherit;">×</button>
            </div>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    // Setup animations
    setupAnimations() {
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe cards and other elements
        document.querySelectorAll('.feature-card, #prediction-form-section').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HeartSenseApp();
});

// Export for potential use in other scripts
window.HeartSenseApp = HeartSenseApp; 