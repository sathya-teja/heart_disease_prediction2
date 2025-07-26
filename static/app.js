
const appData = {
    features: [
        {"name": "age", "label": "Age", "type": "number", "min": 18, "max": 100, "description": "Patient's age in years"},
        {"name": "sex", "label": "Gender", "type": "select", "options": [{"value": 1, "label": "Male"}, {"value": 0, "label": "Female"}], "description": "Patient's biological sex"},
        {"name": "cp", "label": "Chest Pain Type", "type": "select", "options": [{"value": 1, "label": "Typical Angina"}, {"value": 2, "label": "Atypical Angina"}, {"value": 3, "label": "Non-Anginal Pain"}, {"value": 4, "label": "Asymptomatic"}], "description": "Type of chest pain experienced"},
        {"name": "trestbps", "label": "Resting Blood Pressure", "type": "number", "min": 80, "max": 200, "description": "Resting blood pressure in mm Hg"},
        {"name": "chol", "label": "Serum Cholesterol", "type": "number", "min": 100, "max": 600, "description": "Serum cholesterol in mg/dl"},
        {"name": "fbs", "label": "Fasting Blood Sugar", "type": "select", "options": [{"value": 1, "label": "> 120 mg/dl"}, {"value": 0, "label": "≤ 120 mg/dl"}], "description": "Fasting blood sugar level"},
        {"name": "restecg", "label": "Resting ECG", "type": "select", "options": [{"value": 0, "label": "Normal"}, {"value": 1, "label": "ST-T abnormality"}, {"value": 2, "label": "LV hypertrophy"}], "description": "Resting electrocardiographic results"},
        {"name": "thalach", "label": "Max Heart Rate", "type": "number", "min": 60, "max": 220, "description": "Maximum heart rate achieved"},
        {"name": "exang", "label": "Exercise Induced Angina", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}], "description": "Exercise induced angina"},
        {"name": "oldpeak", "label": "ST Depression", "type": "number", "min": 0, "max": 10, "step": 0.1, "description": "ST depression induced by exercise"},
        {"name": "slope", "label": "ST Slope", "type": "select", "options": [{"value": 1, "label": "Upsloping"}, {"value": 2, "label": "Flat"}, {"value": 3, "label": "Downsloping"}], "description": "Slope of peak exercise ST segment"},
        {"name": "ca", "label": "Major Vessels", "type": "select", "options": [{"value": 0, "label": "0"}, {"value": 1, "label": "1"}, {"value": 2, "label": "2"}, {"value": 3, "label": "3"}], "description": "Number of major vessels colored by fluoroscopy"},
        {"name": "thal", "label": "Thalassemia", "type": "select", "options": [{"value": 3, "label": "Normal"}, {"value": 6, "label": "Fixed Defect"}, {"value": 7, "label": "Reversible Defect"}], "description": "Thalassemia type"}
    ],
    dashboardStats: {
        totalPatients: 120,
        positiveCases: 35,
        negativeCases: 85,
        recentPredictions: [
            { id: 1001, age: 65, sex: 'Male',  prediction: 'Positive', probability: 0.73, risk: 'High'   },
            { id: 1002, age: 41, sex: 'Female',prediction: 'Negative',probability: 0.17, risk: 'Low'    },
            { id: 1003, age: 54, sex: 'Male',  prediction: 'Negative',probability: 0.22, risk: 'Low'    },
            { id: 1004, age: 70, sex: 'Female',prediction: 'Positive',probability: 0.68, risk: 'High'   },
            { id: 1005, age: 58, sex: 'Male',  prediction: 'Positive',probability: 0.41, risk: 'Medium' }
        ]
    },
    riskDistribution: {
        low: 67,
        medium: 18,
        high: 35
    }
};

/* -------------------------- Chart Instances -------------------------- */
let riskChart = null;
let featureChart = null;
let riskDistributionChart = null;

/* --------------------------- App Lifecycle --------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupNavigation();
    loadDashboardData();
    addFormValidation();
}

/* ------------------------ Event-Listener Setup ----------------------- */
function setupEventListeners() {
    const form = document.getElementById('predictionForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }

    // Unified in-page navigation handling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');

            // Toggle section visibility based on destination
            if (href === '#dashboard') {
                showDashboard();
            } else {
                showMainSections();
            }

            // Smooth scroll if target exists
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* ----------------------- Section Visibility Logic -------------------- */
function showDashboard() {
    toggleSectionDisplay({
        home: 'none',
        prediction: 'none',
        results:  'none',
        dashboard:'block'
    });

    // Create dashboard charts once
    if (!riskDistributionChart) {
        setTimeout(createDashboardCharts, 300);
    }
}

function showMainSections() {
    toggleSectionDisplay({
        home: 'block',
        prediction: 'block',
        // Keep results visibility as-is (it may be none or block)
        dashboard:'none'
    });
}

function toggleSectionDisplay(map) {
    const sections = {
        home:       document.getElementById('home'),
        prediction: document.getElementById('prediction'),
        results:    document.getElementById('results'),
        dashboard:  document.getElementById('dashboard')
    };
    for (const key in map) {
        if (sections[key]) {
            sections[key].style.display = map[key];
        }
    }
}

/* --------------------------- Navigation UX -------------------------- */
function setupNavigation() {
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY  = window.scrollY + 100; // offset for sticky navbar
    let current    = '';

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollY >= top && scrollY < top + height && section.style.display !== 'none') {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
}

/* --------------------------- Form Handling --------------------------- */
async function handleFormSubmission(e) {
    e.preventDefault();
    const form     = e.target;
    const formData = new FormData(form);
    const data     = Object.fromEntries(formData.entries());

    // Validation
    if (!validateForm(data)) {
        showNotification('Please fill in all required fields correctly.', 'error');
        return;
    }

    // Loading state
    const btn = form.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
    btn.disabled = true;

    try {
        await new Promise(r => setTimeout(r, 1500)); // Simulated latency
        const prediction = generatePrediction(data);
        displayPredictionResults(prediction, data);
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
        showNotification('Risk assessment completed successfully!', 'success');
    } catch (err) {
        console.error(err);
        showNotification('An unexpected error occurred. Please try again.', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

function validateForm(data) {
    return appData.features.every(f => data[f.name] && data[f.name].toString().trim() !== '');
}

/* --------------------------- Prediction ------------------------------ */
function generatePrediction(formData) {
    const age      = +formData.age;
    const cp       = +formData.cp;
    const chol     = +formData.chol;
    const thalach  = +formData.thalach;
    let risk = 0;
    if (age > 60) risk += 0.2;
    if (cp === 1) risk += 0.25;
    if (chol > 240) risk += 0.15;
    if (thalach < 120) risk += 0.2;
    if (formData.exang === '1') risk += 0.15;
    risk += (Math.random() - 0.5) * 0.2; // noise
    risk = Math.min(Math.max(risk, 0), 1);

    const riskLevel = risk < 0.3 ? 'Low Risk' : risk < 0.6 ? 'Medium Risk' : 'High Risk';
    const recommendation = risk < 0.3
        ? 'Maintain healthy lifestyle and routine check-ups'
        : risk < 0.6
            ? 'Consider lifestyle changes & regular monitoring'
            : 'Consult cardiologist immediately';

    return { probability: risk, risk: riskLevel, recommendation };
}

/* -------------------------- Results Display -------------------------- */
function displayPredictionResults(prediction, formData) {
    document.getElementById('results').style.display = 'block';
    updateRiskIndicator(prediction);
    createFeatureImportanceChart(formData);
    document.getElementById('riskRecommendation').textContent = prediction.recommendation;
}

// Risk Donut
function updateRiskIndicator(prediction) {
    const pct  = Math.round(prediction.probability * 100);
    document.getElementById('riskPercentage').textContent = pct + '%';
    document.getElementById('riskLabel').textContent = prediction.risk;

    document.getElementById('riskIndicator').className = `risk-indicator risk-${prediction.risk.includes('High') ? 'high' : prediction.risk.includes('Medium') ? 'medium' : 'low'}`;
    createRiskChart(prediction.probability);
}

function createRiskChart(prob) {
    const ctx = document.getElementById('riskChart').getContext('2d');
    if (riskChart) riskChart.destroy();
    const percent = prob * 100;
    const bgColor = prob < 0.3 ? '#10b981' : prob < 0.6 ? '#f59e0b' : '#ef4444';
    riskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percent, 100 - percent],
                backgroundColor: [bgColor, '#e5e7eb'],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: { responsive: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });
}

// Feature Importance (demo randomised)
function createFeatureImportanceChart(formData) {
    const ctx = document.getElementById('featureChart').getContext('2d');
    if (featureChart) featureChart.destroy();
    const demoFeatures = [
        { n: 'Chest Pain Type',  v: Math.random() * 0.25 + 0.15 },
        { n: 'Age',             v: Math.random() * 0.2  + 0.1  },
        { n: 'Max Heart Rate',  v: Math.random() * 0.2  + 0.1  },
        { n: 'Cholesterol',     v: Math.random() * 0.15 + 0.08 },
        { n: 'ST Depression',   v: Math.random() * 0.15 + 0.05 },
        { n: 'Exercise Angina', v: Math.random() * 0.12 + 0.05 },
        { n: 'Blood Pressure',  v: Math.random() * 0.1  + 0.03 },
        { n: 'Gender',          v: Math.random() * 0.08 + 0.02 }
    ].sort((a,b)=>b.v-a.v);

    featureChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: demoFeatures.map(f=>f.n),
            datasets:[{
                data: demoFeatures.map(f=>f.v),
                backgroundColor:['#1FB8CD','#FFC185','#B4413C','#ECEBD5','#5D878F','#DB4545','#D2BA4C','#964325'],
                maxBarThickness: 40,
                borderRadius: 4
            }]
        },
        options:{
            indexAxis:'y',
            responsive:true,
            maintainAspectRatio:false,
            plugins:{ legend:{display:false} },
            scales:{
                x:{beginAtZero:true,ticks:{callback:v=>Math.round(v*100)+'%'}},
                y:{ticks:{font:{size:11}}}
            }
        }
    });
}

/* ------------------------- Dashboard Charts -------------------------- */
function loadDashboardData() {
    const tbody = document.getElementById('recentPredictionsTable');
    if (!tbody) return;
    tbody.innerHTML = appData.dashboardStats.recentPredictions.map(p=>`
        <tr>
            <td>#${p.id}</td>
            <td>${p.age}</td>
            <td>${p.sex}</td>
            <td><span class="badge bg-${p.risk==='High'?'danger':p.risk==='Medium'?'warning':'success'}">${p.risk}</span></td>
            <td>${Math.round(p.probability*100)}%</td>
        </tr>
    `).join('');
}

function createDashboardCharts() {
    const ctx = document.getElementById('riskDistributionChart').getContext('2d');
    if (riskDistributionChart) riskDistributionChart.destroy();
    riskDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data:{
            labels:['Low Risk','Medium Risk','High Risk'],
            datasets:[{
                data:[appData.riskDistribution.low, appData.riskDistribution.medium, appData.riskDistribution.high],
                backgroundColor:['#10b981','#f59e0b','#ef4444'],
                borderWidth:2,
                borderColor:'#ffffff'
            }]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
    });
}

/* --------------------------- Notifications --------------------------- */
function showNotification(msg, type='info') {
    const div = document.createElement('div');
    div.className = `alert alert-${type==='error'?'danger':type} alert-dismissible fade show position-fixed`;
    div.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:300px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)';
    div.innerHTML = `
        <i class="fas fa-${type==='success'?'check-circle':type==='error'?'exclamation-circle':'info-circle'} me-2"></i>
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(div);
    setTimeout(()=>div.remove(),5000);
}

/* ---------------------- Form Field Validation UX --------------------- */
function addFormValidation() {
    const inputs = document.querySelectorAll('#predictionForm input, #predictionForm select');
    inputs.forEach(i=>{
        i.addEventListener('blur', ()=>toggleValidClass(i));
        i.addEventListener('input',()=>toggleValidClass(i));
    });
}

function toggleValidClass(el) {
    const valid = el.checkValidity() && el.value.trim()!=='';
    el.classList.toggle('is-valid',   valid);
    el.classList.toggle('is-invalid', !valid);
}

/* --------------- Expose helpers for automated testing --------------- */
if (typeof window !== 'undefined') {
    window.showDashboard   = showDashboard;
    window.showMainSections = showMainSections;
}

// For unit-testing environment (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validateForm, generatePrediction };
}