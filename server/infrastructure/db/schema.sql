/*
	SQL Server bootstrap script for Hospital Management System.
	Run this script once in SSMS to reset and recreate the database with seed data.
*/

USE master;
GO

IF DB_ID(N'HospitalManagementSystem') IS NOT NULL
BEGIN
	ALTER DATABASE [HospitalManagementSystem] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
	DROP DATABASE [HospitalManagementSystem];
END;
GO

CREATE DATABASE [HospitalManagementSystem];
GO

USE [HospitalManagementSystem];
GO

CREATE TABLE doctors (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	full_name NVARCHAR(255) NOT NULL,
	specialization NVARCHAR(255) NOT NULL,
	department NVARCHAR(255) NOT NULL DEFAULT N'',
	available_slots_per_day INT NOT NULL DEFAULT 0,
	contact_email NVARCHAR(255) NULL,
	contact_phone NVARCHAR(50) NULL,
	status NVARCHAR(32) NOT NULL DEFAULT N'active',
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE patients (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	full_name NVARCHAR(255) NOT NULL,
	date_of_birth DATETIME2 NULL,
	contact_email NVARCHAR(255) NULL,
	contact_phone NVARCHAR(50) NULL,
	contact_address NVARCHAR(500) NULL,
	emergency_contact NVARCHAR(MAX) NULL,
	status NVARCHAR(32) NOT NULL DEFAULT N'active',
	assigned_doctor_id NVARCHAR(64) NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT fk_patients_assigned_doctor FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id)
);
GO

CREATE TABLE users (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	email NVARCHAR(255) NOT NULL,
	password_hash NVARCHAR(255) NOT NULL,
	role NVARCHAR(32) NOT NULL,
	status NVARCHAR(32) NOT NULL DEFAULT N'active',
	patient_id NVARCHAR(64) NULL,
	doctor_id NVARCHAR(64) NULL,
	full_name NVARCHAR(255) NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT uq_users_email UNIQUE (email),
	CONSTRAINT fk_users_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
	CONSTRAINT fk_users_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
GO

CREATE TABLE appointments (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	patient_id NVARCHAR(64) NOT NULL,
	doctor_id NVARCHAR(64) NOT NULL,
	start_at DATETIME2 NOT NULL,
	end_at DATETIME2 NOT NULL,
	reason NVARCHAR(1000) NULL,
	status NVARCHAR(32) NOT NULL DEFAULT N'pending',
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
	CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
GO

CREATE TABLE billings (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	invoice_number NVARCHAR(64) NOT NULL,
	patient_id NVARCHAR(64) NOT NULL,
	charges NVARCHAR(MAX) NOT NULL,
	status NVARCHAR(32) NOT NULL DEFAULT N'draft',
	due_date DATETIME2 NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT uq_billings_invoice_number UNIQUE (invoice_number),
	CONSTRAINT fk_billings_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);
GO

CREATE TABLE payments (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	patient_id NVARCHAR(64) NOT NULL,
	invoice_id NVARCHAR(64) NULL,
	amount DECIMAL(12,2) NOT NULL,
	method NVARCHAR(50) NULL,
	status NVARCHAR(32) NOT NULL DEFAULT N'initiated',
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT fk_payments_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
	CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES billings(id)
);
GO

CREATE TABLE medical_records (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	patient_id NVARCHAR(64) NOT NULL,
	entries NVARCHAR(MAX) NOT NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT fk_medical_records_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);
GO

CREATE TABLE prescriptions (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	patient_id NVARCHAR(64) NOT NULL,
	doctor_id NVARCHAR(64) NOT NULL,
	content NVARCHAR(MAX) NOT NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
	CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
GO

CREATE TABLE messages (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	from_patient_id NVARCHAR(64) NULL,
	to_doctor_id NVARCHAR(64) NULL,
	from_doctor_id NVARCHAR(64) NULL,
	to_patient_id NVARCHAR(64) NULL,
	subject NVARCHAR(255) NULL,
	content NVARCHAR(MAX) NOT NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT fk_messages_from_patient FOREIGN KEY (from_patient_id) REFERENCES patients(id),
	CONSTRAINT fk_messages_to_doctor FOREIGN KEY (to_doctor_id) REFERENCES doctors(id),
	CONSTRAINT fk_messages_from_doctor FOREIGN KEY (from_doctor_id) REFERENCES doctors(id),
	CONSTRAINT fk_messages_to_patient FOREIGN KEY (to_patient_id) REFERENCES patients(id)
);
GO

CREATE TABLE services (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	name NVARCHAR(255) NOT NULL,
	price DECIMAL(12,2) NOT NULL DEFAULT 0,
	description NVARCHAR(MAX) NULL
);
GO

CREATE TABLE insurance_plans (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	provider NVARCHAR(255) NOT NULL,
	plan_name NVARCHAR(255) NOT NULL,
	coverage_summary NVARCHAR(MAX) NULL,
	copay_amount DECIMAL(12,2) NOT NULL DEFAULT 0
);
GO

CREATE TABLE booking_constraints (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	code NVARCHAR(128) NOT NULL,
	title NVARCHAR(255) NOT NULL,
	description NVARCHAR(MAX) NULL,
	applies_to_role NVARCHAR(32) NULL,
	constraint_value INT NOT NULL,
	CONSTRAINT uq_booking_constraints_code UNIQUE (code)
);
GO

CREATE TABLE settings (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	data NVARCHAR(MAX) NOT NULL,
	updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE lab_results (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	patient_id NVARCHAR(64) NOT NULL,
	doctor_id NVARCHAR(64) NULL,
	content NVARCHAR(MAX) NOT NULL,
	status NVARCHAR(32) NOT NULL DEFAULT N'pending',
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT fk_lab_results_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
	CONSTRAINT fk_lab_results_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
GO

CREATE TABLE contact_leads (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	name NVARCHAR(255) NULL,
	email NVARCHAR(255) NULL,
	message NVARCHAR(MAX) NULL,
	received_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE audit_logs (
	id NVARCHAR(64) NOT NULL PRIMARY KEY,
	record_id NVARCHAR(64) NULL,
	action NVARCHAR(255) NULL,
	actor_id NVARCHAR(64) NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE refresh_tokens (
	token NVARCHAR(255) NOT NULL PRIMARY KEY,
	user_id NVARCHAR(64) NOT NULL,
	expires_at DATETIME2 NOT NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

CREATE INDEX ix_users_role ON users(role);
CREATE INDEX ix_appointments_doctor_start ON appointments(doctor_id, start_at);
CREATE INDEX ix_appointments_patient_start ON appointments(patient_id, start_at);
CREATE INDEX ix_billings_patient_created ON billings(patient_id, created_at);
CREATE INDEX ix_payments_patient_created ON payments(patient_id, created_at);
CREATE INDEX ix_messages_created ON messages(created_at);
CREATE INDEX ix_audit_logs_record_created ON audit_logs(record_id, created_at);
GO

INSERT INTO doctors (id, full_name, specialization, department, available_slots_per_day, contact_email, contact_phone, status)
VALUES
	(N'doc-1', N'Dr. Demo', N'General', N'Outpatient', 8, N'doc@example.com', N'0900000001', N'active'),
	(N'doc-2', N'Dr. Alice', N'Cardiology', N'Heart Center', 10, N'doc2@example.com', N'0900000002', N'active');

INSERT INTO patients (id, full_name, date_of_birth, contact_email, contact_phone, contact_address, emergency_contact, status, assigned_doctor_id)
VALUES
	(N'pat-1', N'Alice Patient', '1995-03-20T00:00:00', N'patient@example.com', N'0911111111', N'District 1, Ho Chi Minh City', N'{"name":"Bob Patient","phone":"0922222222"}', N'active', N'doc-1'),
	(N'pat-2', N'John Smith', '1989-09-12T00:00:00', N'john@example.com', N'0933333333', N'District 7, Ho Chi Minh City', N'{"name":"Mary Smith","phone":"0944444444"}', N'active', N'doc-2');

INSERT INTO users (id, email, password_hash, role, status, patient_id, doctor_id, full_name)
VALUES
	(N'admin-1', N'admin@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'admin', N'active', NULL, NULL, N'Admin User'),
	(N'doc-1', N'doc@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'doctor', N'active', NULL, N'doc-1', N'Dr. Demo'),
	(N'doc-2', N'doc2@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'doctor', N'active', NULL, N'doc-2', N'Dr. Alice'),
	(N'pat-1', N'patient@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-1', NULL, N'Alice Patient'),
	(N'pat-2', N'john@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-2', NULL, N'John Smith');

INSERT INTO appointments (id, patient_id, doctor_id, start_at, end_at, reason, status)
VALUES
	(N'apt-1', N'pat-1', N'doc-1', DATEADD(MINUTE, 30, SYSUTCDATETIME()), DATEADD(MINUTE, 60, SYSUTCDATETIME()), N'General consultation', N'scheduled'),
	(N'apt-2', N'pat-2', N'doc-2', DATEADD(HOUR, 24, SYSUTCDATETIME()), DATEADD(HOUR, 25, SYSUTCDATETIME()), N'Cardiology follow-up', N'pending');

INSERT INTO billings (id, invoice_number, patient_id, charges, status, due_date)
VALUES
	(N'inv-1', N'INV-001', N'pat-1', N'[{"item":"Consultation","amount":50}]', N'open', DATEADD(HOUR, 24, SYSUTCDATETIME())),
	(N'inv-2', N'INV-002', N'pat-2', N'[{"item":"ECG","amount":120}]', N'draft', DATEADD(HOUR, 24, SYSUTCDATETIME()));

INSERT INTO payments (id, patient_id, invoice_id, amount, method, status)
VALUES
	(N'pay-1', N'pat-1', N'inv-1', 50, N'card', N'completed');

INSERT INTO medical_records (id, patient_id, entries)
VALUES
	(N'mr-1', N'pat-1', N'[{"type":"visit","note":"Stable vitals"}]'),
	(N'mr-2', N'pat-2', N'[{"type":"visit","note":"Mild chest pain"}]');

INSERT INTO prescriptions (id, patient_id, doctor_id, content)
VALUES
	(N'rx-1', N'pat-1', N'doc-1', N'{"medicines":["Paracetamol"],"note":"After meals"}');

INSERT INTO messages (id, from_patient_id, to_doctor_id, from_doctor_id, to_patient_id, subject, content)
VALUES
	(N'msg-1', N'pat-1', N'doc-1', NULL, NULL, N'Need advice', N'I have mild fever.'),
	(N'msg-2', NULL, NULL, N'doc-1', N'pat-1', N'Follow up', N'Please monitor your temperature.');

INSERT INTO services (id, name, price, description)
VALUES
	(N'svc-1', N'Consultation', 50, N'General clinic consultation service.'),
	(N'svc-2', N'Lab Test', 70, N'Basic laboratory testing service.'),
	(N'svc-3', N'ECG', 120, N'Electrocardiogram service.');

INSERT INTO insurance_plans (id, provider, plan_name, coverage_summary, copay_amount)
VALUES
	(N'ins-1', N'Blue Health', N'Standard Care', N'Outpatient consultation and basic lab coverage up to 80%.', 15),
	(N'ins-2', N'Sunrise Insurance', N'Family Plus', N'Family package with pediatric and maternity support.', 10);

INSERT INTO booking_constraints (id, code, title, description, applies_to_role, constraint_value)
VALUES
	(N'bc-1', N'MAX_ACTIVE_APPOINTMENTS', N'Active booking limit', N'Each patient can keep at most 3 active appointments.', N'patient', 3),
	(N'bc-2', N'MIN_BOOKING_NOTICE_HOURS', N'Minimum booking notice', N'Appointments must be booked at least 24 hours in advance.', N'patient', 24);

INSERT INTO settings (id, data)
VALUES
	(N'singleton', N'{"clinicName":"Hospital Management Demo","timezone":"Asia/Ho_Chi_Minh","currency":"VND"}');

INSERT INTO lab_results (id, patient_id, doctor_id, content, status)
VALUES
	(N'lab-1', N'pat-1', N'doc-1', N'{"test":"CBC","result":"Normal"}', N'reviewed');

INSERT INTO contact_leads (id, name, email, message)
VALUES
	(N'lead-1', N'Guest Visitor', N'guest@example.com', N'Need support for insurance plan.');

INSERT INTO audit_logs (id, record_id, action, actor_id)
VALUES
	(N'audit-1', N'mr-1', N'seed_audit', N'admin-1');

INSERT INTO refresh_tokens (token, user_id, expires_at)
VALUES
	(N'seed-refresh-admin', N'admin-1', DATEADD(DAY, 7, SYSUTCDATETIME()));
GO
