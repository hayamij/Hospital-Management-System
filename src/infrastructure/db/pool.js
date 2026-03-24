import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

// Lightweight SQLite pool shim that mimics pg Pool.query
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.resolve('data.sqlite');
const db = new Database(dbPath);

// Basic schema tailored for SQLite
const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  patient_id TEXT NULL,
  doctor_id TEXT NULL,
  full_name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  department TEXT DEFAULT '',
  available_slots_per_day INTEGER NOT NULL DEFAULT 0,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  emergency_contact TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_doctor_id TEXT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billings (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL,
  charges TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  due_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  invoice_id TEXT NULL,
  amount REAL NOT NULL,
  method TEXT,
  status TEXT DEFAULT 'initiated',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  entries TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_patient_id TEXT NULL,
  to_doctor_id TEXT NULL,
  from_doctor_id TEXT NULL,
  to_patient_id TEXT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS insurance_plans (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  coverage_summary TEXT,
  copay_amount REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS booking_constraints (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  applies_to_role TEXT,
  constraint_value REAL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_results (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  message TEXT,
  received_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  record_id TEXT,
  action TEXT,
  actor_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(schemaSql);

// Seed minimal data if empty
const seedIfEmpty = () => {
  const row = db.prepare('SELECT COUNT(1) as c FROM users').get();
  if (row && row.c > 0) return;
  const now = new Date().toISOString();
  db.prepare('INSERT INTO doctors (id, full_name, specialization, available_slots_per_day, status, created_at) VALUES (@id,@name,@spec,@slots,@status,@created)').run({ id: 'doc-1', name: 'Dr. Demo', spec: 'General', slots: 8, status: 'active', created: now });
  db.prepare('INSERT INTO patients (id, full_name, status, assigned_doctor_id, created_at) VALUES (@id,@name,@status,@doc,@created)').run({ id: 'pat-1', name: 'Alice Patient', status: 'active', doc: 'doc-1', created: now });
  const passwordHash = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW'; // bcrypt for "password"
  db.prepare('INSERT INTO users (id, email, password_hash, role, status, patient_id, doctor_id, full_name, created_at) VALUES (@id,@email,@hash,@role,@status,@patient,@doctor,@full,@created)').run({ id: 'admin-1', email: 'admin@example.com', hash: passwordHash, role: 'admin', status: 'active', patient: null, doctor: null, full: 'Admin User', created: now });
  db.prepare('INSERT INTO users (id, email, password_hash, role, status, patient_id, doctor_id, full_name, created_at) VALUES (@id,@email,@hash,@role,@status,@patient,@doctor,@full,@created)').run({ id: 'doc-1', email: 'doc@example.com', hash: passwordHash, role: 'doctor', status: 'active', patient: null, doctor: 'doc-1', full: 'Dr. Demo', created: now });
  db.prepare('INSERT INTO users (id, email, password_hash, role, status, patient_id, doctor_id, full_name, created_at) VALUES (@id,@email,@hash,@role,@status,@patient,@doctor,@full,@created)').run({ id: 'pat-1', email: 'patient@example.com', hash: passwordHash, role: 'patient', status: 'active', patient: 'pat-1', doctor: null, full: 'Alice Patient', created: now });
  db.prepare('INSERT INTO services (id, name, price) VALUES (@id,@name,@price)').run({ id: 'svc-1', name: 'Consultation', price: 50 });
  db.prepare('INSERT INTO insurance_plans (id, provider, plan_name, coverage_summary, copay_amount) VALUES (@id,@provider,@plan,@summary,@copay)').run({ id: 'ins-1', provider: 'Blue Health', plan: 'Standard Care', summary: 'Outpatient consultation and basic lab coverage up to 80%.', copay: 15 });
  db.prepare('INSERT INTO booking_constraints (id, code, title, description, applies_to_role, constraint_value) VALUES (@id,@code,@title,@description,@role,@value)').run({ id: 'bc-1', code: 'MAX_ACTIVE_APPOINTMENTS', title: 'Active booking limit', description: 'Each patient can keep at most 3 active appointments.', role: 'patient', value: 3 });
  db.prepare('INSERT INTO billings (id, invoice_number, patient_id, charges, status, due_date, created_at) VALUES (@id,@num,@pat,@charges,@status,@due,@created)').run({ id: 'inv-1', num: 'INV-001', pat: 'pat-1', charges: JSON.stringify([{ item: 'Consultation', amount: 50 }]), status: 'open', due: now, created: now });
};
seedIfEmpty();

// Convert $1 style params to ? for sqlite
function normalize(sql, params = []) {
  const idxMap = [];
  let normalized = sql.replace(/\$(\d+)/g, (_, n) => {
    idxMap.push(Number(n) - 1);
    return '?';
  });
  normalized = normalized.replace(/\bnow\(\)/gi, 'CURRENT_TIMESTAMP');
  if (idxMap.length === 0) return { sql: normalized, values: params };
  const values = idxMap.map((i) => params[i]);
  return { sql: normalized, values };
}

export const pool = {
  query(sql, params = []) {
    const { sql: normalized, values } = normalize(sql, params);
    const stmt = db.prepare(normalized);
    const isSelect = /^\s*select/i.test(normalized);
    if (isSelect) {
      const rows = stmt.all(values);
      return { rows };
    }
    const info = stmt.run(values);
    return { rows: [], lastID: info.lastInsertRowid, changes: info.changes };
  },
};
