let forecastChart, utilizationChart;
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

function populateConsultantSelects() {
  const selects = [document.getElementById("pConsultant"), document.getElementById("lConsultant")];
  for (const select of selects) {
    select.innerHTML = CONSULTANTS.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  }
}

function populateProjectSelect() {
  const select = document.getElementById("lProject");
  select.innerHTML = PROJECTS.map((p) => `<option value="${p.id}">${p.name} (${p.client})</option>`).join("");
}

function showStatus(elId, message, isError = false) {
  const el = document.getElementById(elId);
  el.textContent = message;
  el.classList.toggle("error", isError);
}

async function refreshAndRender() {
  await loadAllData();
  populateConsultantSelects();
  populateProjectSelect();
  renderAll();
}

function initModal() {
  const modal = document.getElementById("manageModal");
  document.getElementById("manageButton").addEventListener("click", () => modal.classList.add("open"));
  document.getElementById("modalClose").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.querySelector(`[data-tab-panel="${btn.dataset.tab}"]`).classList.add("active");
    });
  });
}

function initForms() {
  document.getElementById("consultantForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addConsultant({
        name: document.getElementById("cName").value,
        role: document.getElementById("cRole").value,
        costRate: Number(document.getElementById("cCostRate").value),
        billRate: Number(document.getElementById("cBillRate").value),
        capacity: Number(document.getElementById("cCapacity").value),
      });
      showStatus("consultantStatus", "Added!");
      e.target.reset();
      await refreshAndRender();
    } catch (err) {
      showStatus("consultantStatus", "Error: " + err.message, true);
    }
  });

  document.getElementById("projectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addProject({
        name: document.getElementById("pName").value,
        client: document.getElementById("pClient").value,
        consultantId: document.getElementById("pConsultant").value,
        hoursPerWeek: Number(document.getElementById("pHours").value),
        weeksRemaining: Number(document.getElementById("pWeeks").value),
      });
      showStatus("projectStatus", "Added!");
      e.target.reset();
      await refreshAndRender();
    } catch (err) {
      showStatus("projectStatus", "Error: " + err.message, true);
    }
  });

  document.getElementById("logForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await logTime({
        consultantId: document.getElementById("lConsultant").value,
        projectId: document.getElementById("lProject").value,
        hours: Number(document.getElementById("lHours").value),
      });
      showStatus("logStatus", "Logged!");
      e.target.reset();
      await refreshAndRender();
    } catch (err) {
      showStatus("logStatus", "Error: " + err.message, true);
    }
  });
}

async function init() {
  initTheme();
  initScenarioSlider();
  initModal();
  initForms();
  tickClock();
  await refreshAndRender();
  setInterval(tickClock, 1000);
  setInterval(refreshAndRender, 20000); // poll for changes from other users
}

init();
