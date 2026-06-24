// Real database connection for the Lindholmen Advisory forecast demo.
// Uses the Supabase publishable key only — safe to expose in client-side code.
// RLS is intentionally off during development; must be enabled before real client use.

const SUPABASE_URL = "https://svlbauqccezlbfxcbpvn.supabase.co";
const SUPABASE_KEY = "sb_publishable_m5MquQ2kOO0nfzvnpJ3T2w_-wTPXRmX";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadAllData() {
  const [{ data: consultants, error: cErr }, { data: projects, error: pErr }, { data: logs, error: lErr }] =
    await Promise.all([
      sb.from("consultants").select("*"),
      sb.from("projects").select("*, consultants(name)"),
      sb.from("time_logs").select("*, consultants(name), projects(name)").order("logged_at", { ascending: false }).limit(20),
    ]);

  if (cErr) console.error("consultants:", cErr);
  if (pErr) console.error("projects:", pErr);
  if (lErr) console.error("time_logs:", lErr);

  CONSULTANTS = (consultants || []).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    costRate: Number(c.cost_rate),
    billRate: Number(c.bill_rate),
    capacity: Number(c.capacity),
  }));

  PROJECTS = (projects || []).map((p) => ({
    id: p.id,
    name: p.name,
    client: p.client,
    consultant: p.consultants ? p.consultants.name : null,
    consultantId: p.consultant_id,
    hoursPerWeek: Number(p.hours_per_week),
    weeksRemaining: Number(p.weeks_remaining),
    status: p.status,
  }));

  timeLogs = (logs || [])
    .map((l) => ({
      time: new Date(l.logged_at),
      consultant: l.consultants ? l.consultants.name : "Unknown",
      project: l.projects ? l.projects.name : "Unknown",
      hours: Number(l.hours).toFixed(1),
    }))
    .reverse();
}

async function addConsultant({ name, role, costRate, billRate, capacity }) {
  const { error } = await sb.from("consultants").insert({
    name,
    role,
    cost_rate: costRate,
    bill_rate: billRate,
    capacity,
  });
  if (error) throw error;
}

async function addProject({ name, client, consultantId, hoursPerWeek, weeksRemaining }) {
  const { error } = await sb.from("projects").insert({
    name,
    client,
    consultant_id: consultantId,
    hours_per_week: hoursPerWeek,
    weeks_remaining: weeksRemaining,
  });
  if (error) throw error;
}

async function logTime({ consultantId, projectId, hours }) {
  const { error } = await sb.from("time_logs").insert({
    consultant_id: consultantId,
    project_id: projectId,
    hours,
  });
  if (error) throw error;
}
