let forecastChart, utilizationChart;
let timeLogs = generateTimeLogHistory();
let scenarioHours = 0;

const THEME_COLORS = {
  dark: { text: "#8ea3b8", grid: "#233248", revenue: "#3fb8af", revenueFill: "rgba(63,184,175,0.15)", cost: "#d4716a", costFill: "rgba(212,113,106,0.12)", bar: "#3fb8af", barOver: "#e0a64f" },
  light: { text: "#6b7e90", grid: "#dde6ec", revenue: "#1f8f86", revenueFill: "rgba(31,143,134,0.10)", cost: "#c0524a", costFill: "rgba(192,82,74,0.08)", bar: "#1f8f86", barOver: "#b97c1f" },
};

function fmtKr(n) {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") || "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeToggle").textContent = theme === "light" ? "☀️" : "🌙";
  localStorage.setItem("forecast-dashboard-theme", theme);
  if (forecastChart && utilizationChart) {
    forecastChart.destroy();
    utilizationChart.destroy();
    forecastChart = null;
    utilizationChart = null;
    renderCharts();
  }
}

function initTheme() {
  const saved = localStorage.getItem("forecast-dashboard-theme") || "dark";
  applyTheme(saved);
  document.getElementById("themeToggle").addEventListener("click", () => {
    applyTheme(getTheme() === "light" ? "dark" : "light");
  });
}

function renderStats() {
  const weeks = computeWeeklyForecast(scenarioHours);
  const totalRevenue = weeks.reduce((s, w) => s + w.revenue, 0);
  const totalCost = weeks.reduce((s, w) => s + w.cost, 0);
  const margin = totalRevenue ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  const utilization = computeUtilization(scenarioHours);
  const avgUtil = utilization.reduce((s, u) => s + u.utilization, 0) / utilization.length;

  document.getElementById("revenueForecast").textContent = fmtKr(totalRevenue);
  document.getElementById("costForecast").textContent = fmtKr(totalCost);
  document.getElementById("marginValue").textContent = margin.toFixed(1) + "%";
  document.getElementById("avgUtilization").textContent = avgUtil.toFixed(0) + "%";
}

function renderTicker() {
  const list = document.getElementById("timeTicker");
  const recent = timeLogs.slice(-8).reverse();
  list.innerHTML = recent
    .map(
      (t) => `<li>
        <span class="time">${t.time.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</span>
        <span class="who">${t.consultant} — ${t.project}</span>
        <span class="hours">${t.hours}h</span>
      </li>`
    )
    .join("");
}

function renderCharts() {
  const weeks = computeWeeklyForecast(scenarioHours);
  const utilization = computeUtilization(scenarioHours);
  const colors = THEME_COLORS[getTheme()];

  const ctxForecast = document.getElementById("forecastChart");
  const ctxUtil = document.getElementById("utilizationChart");

  if (!forecastChart) {
    forecastChart = new Chart(ctxForecast, {
      type: "line",
      data: {
        labels: weeks.map((w) => `Week ${w.week}`),
        datasets: [
          {
            label: "Revenue",
            data: weeks.map((w) => w.revenue),
            borderColor: colors.revenue,
            backgroundColor: colors.revenueFill,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: "Cost",
            data: weeks.map((w) => w.cost),
            borderColor: colors.cost,
            backgroundColor: colors.costFill,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: colors.text } } },
        scales: {
          x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
          y: { ticks: { color: colors.text }, grid: { color: colors.grid } },
        },
      },
    });
  } else {
    forecastChart.data.labels = weeks.map((w) => `Week ${w.week}`);
    forecastChart.data.datasets[0].data = weeks.map((w) => w.revenue);
    forecastChart.data.datasets[1].data = weeks.map((w) => w.cost);
    forecastChart.update();
  }

  if (!utilizationChart) {
    utilizationChart = new Chart(ctxUtil, {
      type: "bar",
      data: {
        labels: utilization.map((u) => u.name),
        datasets: [{
          label: "Utilization %",
          data: utilization.map((u) => u.utilization),
          backgroundColor: utilization.map((u) => (u.utilization > 100 ? colors.barOver : colors.bar)),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: colors.text }, grid: { color: colors.grid }, suggestedMax: 140 },
          y: { ticks: { color: colors.text }, grid: { display: false } },
        },
      },
    });
  } else {
    utilizationChart.data.labels = utilization.map((u) => u.name);
    utilizationChart.data.datasets[0].data = utilization.map((u) => u.utilization);
    utilizationChart.data.datasets[0].backgroundColor = utilization.map((u) => (u.utilization > 100 ? colors.barOver : colors.bar));
    utilizationChart.update();
  }
}

function renderAll() {
  renderStats();
  renderTicker();
  renderCharts();
}

function tickClock() {
  document.getElementById("clock").textContent = new Date().toLocaleTimeString("sv-SE");
}

function simulateTimeLog() {
  timeLogs.push(generateTimeLogEntry());
  renderTicker();
}

function initScenarioSlider() {
  const slider = document.getElementById("scenarioSlider");
  const valueLabel = document.getElementById("scenarioValue");
  slider.addEventListener("input", () => {
    scenarioHours = Number(slider.value);
    valueLabel.textContent = scenarioHours;
    renderStats();
    renderCharts();
  });
}

initTheme();
initScenarioSlider();
tickClock();
renderAll();
setInterval(tickClock, 1000);
setInterval(simulateTimeLog, 7000);
