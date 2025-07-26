// charts.js - renders charts using Chart.js and window.chartData

document.addEventListener('DOMContentLoaded', function () {
  if (!window.chartData) return;

  // Feature Importance Chart
  const fiCtx = document.getElementById('featureImportanceChart');
  if (fiCtx) {
    new Chart(fiCtx, {
      type: 'bar',
      data: {
        labels: window.chartData.featureColumns,
        datasets: [{
          label: 'Feature Importance',
          data: window.chartData.featureImportanceValues,
          backgroundColor: 'rgba(79, 70, 229, 0.7)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }

  // Probability Distribution Chart
  const probCtx = document.getElementById('probabilityChart');
  if (probCtx) {
    new Chart(probCtx, {
      type: 'doughnut',
      data: {
        labels: ['Disease Probability', 'Healthy Probability'],
        datasets: [{
          data: [window.chartData.probDisease, 1 - window.chartData.probDisease],
          backgroundColor: [
            'rgba(220, 38, 38, 0.7)',
            'rgba(16, 185, 129, 0.7)'
          ],
          borderColor: [
            'rgba(220, 38, 38, 1)',
            'rgba(16, 185, 129, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // Patient Risk Profile Chart
  const riskCtx = document.getElementById('riskProfileChart');
  if (riskCtx) {
    new Chart(riskCtx, {
      type: 'radar',
      data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [{
          label: 'Risk Profile',
          data: window.chartData.riskProfileData,
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0,
            max: 1,
            ticks: { stepSize: 0.2 }
          }
        }
      }
    });
  }
});
