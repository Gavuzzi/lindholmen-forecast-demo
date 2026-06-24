// Live data — populated from Supabase by supabase-client.js (see loadAllData()).
// These start empty and are filled in before the first render.
let CONSULTANTS = [];
let PROJECTS = [];
let timeLogs = [];

const FORECAST_WEEKS = 8;

function avgRates() {
  if (CONSULTANTS.length === 0) return { cost: 0, bill: 0 };
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
        const consultant = CONSULTANTS.find((c) => c.id === p.consultantId);
        if (consultant) {
          revenue += p.hoursPerWeek * consultant.billRate;
          cost += p.hoursPerWeek * consultant.costRate;
        }
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
    const booked = PROJECTS.filter((p) => p.consultantId === c.id).reduce(
      (sum, p) => sum + p.hoursPerWeek,
      0
    );
    // Distribute hypothetical scenario hours evenly across consultants for display purposes.
    const extra = scenarioHours / CONSULTANTS.length;
    const utilization = c.capacity ? Math.min(((booked + extra) / c.capacity) * 100, 140) : 0;
    return { name: c.name, role: c.role, booked: booked + extra, capacity: c.capacity, utilization };
  });
}
