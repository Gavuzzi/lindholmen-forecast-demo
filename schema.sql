-- Run this in Supabase SQL Editor (Lindholmen Advisory forecast demo)

create table consultants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  cost_rate numeric not null,
  bill_rate numeric not null,
  capacity numeric not null,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text not null,
  consultant_id uuid references consultants(id) on delete set null,
  hours_per_week numeric not null,
  weeks_remaining numeric not null,
  status text not null default 'active',
  created_at timestamptz default now()
);

create table time_logs (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid references consultants(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  hours numeric not null,
  logged_at timestamptz default now()
);

-- Seed with the same fake data the demo already used
insert into consultants (name, role, cost_rate, bill_rate, capacity) values
  ('Erik Lindqvist', 'Senior Consultant', 650, 1450, 38),
  ('Sara Bergman', 'Project Lead', 720, 1600, 38),
  ('Johan Eklund', 'Consultant', 520, 1150, 40),
  ('Maja Holm', 'Senior Consultant', 650, 1450, 36),
  ('Oscar Nyström', 'Analyst', 420, 950, 40),
  ('Elin Sandberg', 'Consultant', 520, 1150, 38);

insert into projects (name, client, consultant_id, hours_per_week, weeks_remaining, status)
select 'Supply Chain Revamp', 'Nordkust Logistics', id, 30, 6, 'active' from consultants where name = 'Erik Lindqvist'
union all
select 'Finance Transformation', 'Bryggan Energy', id, 32, 10, 'active' from consultants where name = 'Sara Bergman'
union all
select 'Process Automation', 'Hamnstaden Retail Group', id, 28, 4, 'active' from consultants where name = 'Johan Eklund'
union all
select 'Data Platform Setup', 'Nordkust Logistics', id, 24, 8, 'active' from consultants where name = 'Maja Holm'
union all
select 'Market Analysis', 'Sjöfront Maritime', id, 20, 3, 'active' from consultants where name = 'Oscar Nyström'
union all
select 'Finance Transformation', 'Bryggan Energy', id, 16, 10, 'active' from consultants where name = 'Elin Sandberg';
