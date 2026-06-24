// Simulated consulting firm data for the Lindholmen Advisory demo.
// In a real deployment this is replaced by data pulled from a PM/time-tracking
// tool (Jira, Harvest, Float) or an ERP export (e.g. SAP S/4HANA), not generated.

const CONSULTANTS = [
  { name: "Erik Lindqvist", role: "Senior Consultant", costRate: 650, billRate: 1450, capacity: 38 },
  { name: "Sara Bergman", role: "Project Lead", costRate: 720, billRate: 1600, capacity: 38 },
  { name: "Johan Eklund", role: "Consultant", costRate: 520, billRate: 1150, capacity: 40 },
  { name: "Maja Holm", role: "Senior Consultant", costRate: 650, billRate: 1450, capacity: 36 },
  { name: "Oscar Nyström", role: "Analyst", costRate: 420, billRate: 950, capacity: 40 },
  { name: "Elin Sandberg", role: "Consultant", costRate: 520, billRate: 1150, capacity: 38 },
];

const PROJECTS = [
  { name: "Supply Chain Revamp", client: "Nordkust Logistics", consultant: "Erik Lindqvist", hoursPerWeek: 30, weeksRemaining: 6, status: "active" },
  { name: "Finance Transformation", client: "Bryggan Energy", consultant: "Sara Bergman", hoursPerWeek: 32, weeksRemaining: 10, status: "active" },
  { name: "Process Automation", client: "Hamnstaden Retail Group", consultant: "Johan Eklund", hoursPerWeek: 28, weeksRemaining: 4, status: "active" },
  { name: "Data Platform Setup", client: "Nordkust Logistics", consultant: "Maja Holm", hoursPerWeek: 24, weeksRemaining: 8, status: "active" },
  { name: "Market Analysis", client: "Sjöfront Maritime", consultant: "Oscar Nyström", hoursPerWeek: 20, weeksRemaining: 3, status: "active" },
  { name: "Finance Transformation", client: "Bryggan Energy", consultant: "Elin Sandberg", hoursPerWeek: 16, weeksRemaining: 10, status: "active" },
];

const FORECAST_WEEKS = 8;

function avgRates() {
  const cost = CONSULTANTS.reduce((s, c) => s + c.costRate, 0) / CONSULTANTS.length;
  const bill = CONSULTANTS.reduce((s, c) => s + c.billRate, 0) / CONSULTANTS.length;
  return { cost, bill };
}

// Computes weekly revenue/cost forecast over FORECAST_WEEKS, including an
// optional hypothetical scenario project (extra hours/week, using average rates).
function computeWeeklyForecast(scenarioHours = 0) {
  const { cost: avgCost, bill: avgBill } = avgRates();
  const weeks = [];

  for (let w = 0; w < FORECAST_WEEKS; w++) {
    let revenue = 0;
    let cost = 0;

    for (const p of PROJECTS) {
      if (p.weeksRemaining > w) {
        const consultant = CONSULTANTS.find((c) => c.name === p.consultant);
        revenue += p.hoursPerWeek * consultant.billRate;
        cost += p.hoursPerWeek * consultant.costRate;
      }
    }

    revenue += scenarioHours * avgBill;
    cost += scenarioHours * avgCost;

    weeks.push({ week: w + 1, revenue, cost, margin: revenue - cost });
  }

  return weeks;
}

function computeUtilization(scenarioHours = 0) {
  return CONSULTANTS.map((c) => {
    const booked = PROJECTS.filter((p) => p.consultant === c.name).reduce(
      (sum, p) => sum + p.hoursPerWeek,
      0
    );
    // Distribute hypothetical scenario hours evenly across consultants for display purposes.
    const extra = scenarioHours / CONSULTANTS.length;
    const utilization = Math.min(((booked + extra) / c.capacity) * 100, 140);
    return { name: c.name, role: c.role, booked: booked + extra, capacity: c.capacity, utilization };
  });
}

function generateTimeLogEntry(time = new Date()) {
  const project = PROJECTS[Math.floor(Math.random() * PROJECTS.length)];
  const hours = (Math.random() * 3 + 0.5).toFixed(1);
  return { time, consultant: project.consultant, project: project.name, hours };
}

// Pre-populate recent history so the ticker isn't empty on first load.
function generateTimeLogHistory(count = 8) {
  const now = new Date();
  const logs = [];
  for (let i = count; i > 0; i--) {
    const time = new Date(now.getTime() - i * 9 * 60 * 1000);
    logs.push(generateTimeLogEntry(time));
  }
  return logs;
}
