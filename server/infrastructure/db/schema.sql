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
	reason NVARCHAR(MAX) NULL,
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
	(N'doc-2', N'Dr. Alice', N'Cardiology', N'Heart Center', 10, N'doc2@example.com', N'0900000002', N'active'),
	(N'doc-3', N'Dr. Minh Tran', N'Neurology', N'Neuro Clinic', 6, N'doc3@example.com', N'0900000003', N'active'),
	(N'doc-4', N'Dr. Maria Nguyen', N'Pediatrics', N'Children Department', 12, N'doc4@example.com', N'0900000004', N'active'),
	(N'doc-5', N'Dr. David Pham', N'Orthopedics', N'Orthopedic Center', 7, N'doc5@example.com', N'0900000005', N'active'),
	(N'doc-6', N'Dr. Emily Tran', N'Dermatology', N'Skin Clinic', 9, N'doc6@example.com', N'0900000006', N'active'),
	(N'doc-7', N'Dr. Brian Le', N'Oncology', N'Cancer Center', 5, N'doc7@example.com', N'0900000007', N'active'),
	(N'doc-8', N'Dr. Helen Vu', N'Endocrinology', N'Metabolic Clinic', 8, N'doc8@example.com', N'0900000008', N'active'),
	(N'doc-9', N'Dr. Peter Dao', N'Gastroenterology', N'Digestive Center', 7, N'doc9@example.com', N'0900000009', N'active'),
	(N'doc-10', N'Dr. Tina Bui', N'Pulmonology', N'Respiratory Unit', 6, N'doc10@example.com', N'0900000010', N'active'),
	(N'doc-11', N'Dr. Kevin Phan', N'Ophthalmology', N'Eye Clinic', 10, N'doc11@example.com', N'0900000011', N'active'),
	(N'doc-12', N'Dr. Susan Nguyen', N'ENT', N'ENT Clinic', 9, N'doc12@example.com', N'0900000012', N'active'),
	(N'doc-13', N'Dr. Victor Nguyen', N'Nephrology', N'Kidney Center', 6, N'doc13@example.com', N'0900000013', N'active'),
	(N'doc-14', N'Dr. Linda Ho', N'Rheumatology', N'Joint Clinic', 7, N'doc14@example.com', N'0900000014', N'inactive'),
	(N'doc-15', N'Dr. Oliver Nguyen', N'Psychiatry', N'Mental Health Unit', 8, N'doc15@example.com', N'0900000015', N'on_leave');

INSERT INTO patients (id, full_name, date_of_birth, contact_email, contact_phone, contact_address, emergency_contact, status, assigned_doctor_id)
VALUES
	(N'pat-1', N'Alice Patient', '1995-03-20T00:00:00', N'patient@example.com', N'0911111111', N'District 1, Ho Chi Minh City', N'{"name":"Bob Patient","phone":"0922222222"}', N'active', N'doc-1'),
	(N'pat-2', N'John Smith', '1989-09-12T00:00:00', N'john@example.com', N'0933333333', N'District 7, Ho Chi Minh City', N'{"name":"Mary Smith","phone":"0944444444"}', N'active', N'doc-2'),
	(N'pat-3', N'Lan Ho', '2001-01-05T00:00:00', N'lan@example.com', N'0955555555', N'Thu Duc City, Ho Chi Minh City', N'{"name":"Khanh Ho","phone":"0966666666"}', N'active', N'doc-4'),
	(N'pat-4', N'Bao Nguyen', '1976-06-18T00:00:00', N'bao@example.com', N'0977777777', N'Binh Thanh, Ho Chi Minh City', N'{"name":"Linh Nguyen","phone":"0988888888"}', N'active', N'doc-3'),
	(N'pat-5', N'Thomas Lee', '1992-11-02T00:00:00', N'thomas@example.com', N'0999999999', N'District 3, Ho Chi Minh City', N'{"name":"Anne Lee","phone":"0901111222"}', N'active', N'doc-5'),
	(N'pat-6', N'Kim Nguyen', '1984-02-14T00:00:00', N'kim@example.com', N'0901111111', N'District 10, Ho Chi Minh City', N'{"name":"Huy Nguyen","phone":"0901111112"}', N'active', N'doc-6'),
	(N'pat-7', N'Quang Pham', '1990-07-23T00:00:00', N'quang@example.com', N'0902222222', N'Go Vap, Ho Chi Minh City', N'{"name":"My Pham","phone":"0902222223"}', N'active', N'doc-7'),
	(N'pat-8', N'Minh Le', '1979-12-03T00:00:00', N'minhle@example.com', N'0903333333', N'District 2, Ho Chi Minh City', N'{"name":"Thanh Le","phone":"0903333334"}', N'active', N'doc-8'),
	(N'pat-9', N'Trang Vu', '1998-09-30T00:00:00', N'trang@example.com', N'0904444444', N'Binh Tan, Ho Chi Minh City', N'{"name":"Tuan Vu","phone":"0904444445"}', N'active', N'doc-9'),
	(N'pat-10', N'Khoa Tran', '2000-05-09T00:00:00', N'khoa@example.com', N'0905555555', N'District 5, Ho Chi Minh City', N'{"name":"Linh Tran","phone":"0905555556"}', N'active', N'doc-10'),
	(N'pat-11', N'Phuong Do', '1982-01-19T00:00:00', N'phuong@example.com', N'0906666666', N'District 6, Ho Chi Minh City', N'{"name":"Duc Do","phone":"0906666667"}', N'active', N'doc-11'),
	(N'pat-12', N'Hoa Dang', '1971-08-27T00:00:00', N'hoa@example.com', N'0907777777', N'Binh Chanh, Ho Chi Minh City', N'{"name":"Tam Dang","phone":"0907777778"}', N'active', N'doc-12'),
	(N'pat-13', N'Ngoc Phan', '1993-04-16T00:00:00', N'ngoc@example.com', N'0908888888', N'District 4, Ho Chi Minh City', N'{"name":"Bao Phan","phone":"0908888889"}', N'pending', N'doc-13'),
	(N'pat-14', N'Thien Nguyen', '1987-10-01T00:00:00', N'thien@example.com', N'0909999999', N'District 8, Ho Chi Minh City', N'{"name":"Quyen Nguyen","phone":"0909999990"}', N'inactive', N'doc-14'),
	(N'pat-15', N'Anh Vo', '1996-06-06T00:00:00', N'anh@example.com', N'0901212121', N'Phu Nhuan, Ho Chi Minh City', N'{"name":"Tien Vo","phone":"0901212122"}', N'verified', N'doc-15');

INSERT INTO users (id, email, password_hash, role, status, patient_id, doctor_id, full_name)
VALUES
	(N'admin-1', N'admin@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'admin', N'active', NULL, NULL, N'Admin User'),
	(N'admin-2', N'admin2@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'admin', N'active', NULL, NULL, N'Admin Two'),
	(N'admin-3', N'admin3@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'admin', N'inactive', NULL, NULL, N'Admin Three'),
	(N'doc-1', N'doc@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-1', N'Dr. Demo'),
	(N'doc-2', N'doc2@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'doctor', N'active', NULL, N'doc-2', N'Dr. Alice'),
	(N'doc-3', N'doc3@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-3', N'Dr. Minh Tran'),
	(N'doc-4', N'doc4@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-4', N'Dr. Maria Nguyen'),
	(N'doc-5', N'doc5@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-5', N'Dr. David Pham'),
	(N'doc-6', N'doc6@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-6', N'Dr. Emily Tran'),
	(N'doc-7', N'doc7@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-7', N'Dr. Brian Le'),
	(N'doc-8', N'doc8@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-8', N'Dr. Helen Vu'),
	(N'doc-9', N'doc9@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-9', N'Dr. Peter Dao'),
	(N'doc-10', N'doc10@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-10', N'Dr. Tina Bui'),
	(N'doc-11', N'doc11@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-11', N'Dr. Kevin Phan'),
	(N'doc-12', N'doc12@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-12', N'Dr. Susan Nguyen'),
	(N'doc-13', N'doc13@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-13', N'Dr. Victor Nguyen'),
	(N'doc-14', N'doc14@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'pending', NULL, N'doc-14', N'Dr. Linda Ho'),
	(N'doc-15', N'doc15@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'disabled', NULL, N'doc-15', N'Dr. Oliver Nguyen'),
	(N'pat-1', N'patient@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-1', NULL, N'Alice Patient'),
	(N'pat-2', N'john@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-2', NULL, N'John Smith'),
	(N'pat-3', N'lan@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-3', NULL, N'Lan Ho'),
	(N'pat-4', N'bao@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-4', NULL, N'Bao Nguyen'),
	(N'pat-5', N'thomas@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-5', NULL, N'Thomas Lee'),
	(N'pat-6', N'kim@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-6', NULL, N'Kim Nguyen'),
	(N'pat-7', N'quang@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-7', NULL, N'Quang Pham'),
	(N'pat-8', N'minhle@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-8', NULL, N'Minh Le'),
	(N'pat-9', N'trang@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-9', NULL, N'Trang Vu'),
	(N'pat-10', N'khoa@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-10', NULL, N'Khoa Tran'),
	(N'pat-11', N'phuong@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-11', NULL, N'Phuong Do'),
	(N'pat-12', N'hoa@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-12', NULL, N'Hoa Dang'),
	(N'pat-13', N'ngoc@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'pending', N'pat-13', NULL, N'Ngoc Phan'),
	(N'pat-14', N'thien@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'inactive', N'pat-14', NULL, N'Thien Nguyen'),
	(N'pat-15', N'anh@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'verified', N'pat-15', NULL, N'Anh Vo');

INSERT INTO appointments (id, patient_id, doctor_id, start_at, end_at, reason, status)
VALUES
	(N'apt-1', N'pat-1', N'doc-1', DATEADD(MINUTE, 30, SYSUTCDATETIME()), DATEADD(MINUTE, 60, SYSUTCDATETIME()), N'General consultation', N'scheduled'),
	(N'apt-2', N'pat-2', N'doc-2', DATEADD(HOUR, 24, SYSUTCDATETIME()), DATEADD(HOUR, 25, SYSUTCDATETIME()), N'Cardiology follow-up', N'pending'),
	(N'apt-3', N'pat-3', N'doc-4', DATEADD(HOUR, 30, SYSUTCDATETIME()), DATEADD(HOUR, 31, SYSUTCDATETIME()), N'Pediatric checkup', N'scheduled'),
	(N'apt-4', N'pat-4', N'doc-3', DATEADD(HOUR, 48, SYSUTCDATETIME()), DATEADD(HOUR, 49, SYSUTCDATETIME()), N'Neurology consultation', N'confirmed'),
	(N'apt-5', N'pat-5', N'doc-5', DATEADD(HOUR, 72, SYSUTCDATETIME()), DATEADD(HOUR, 73, SYSUTCDATETIME()), N'Orthopedic follow-up', N'pending'),
	(N'apt-6', N'pat-6', N'doc-6', DATEADD(HOUR, 80, SYSUTCDATETIME()), DATEADD(HOUR, 81, SYSUTCDATETIME()), N'Skin rash check', N'scheduled'),
	(N'apt-7', N'pat-7', N'doc-7', DATEADD(HOUR, 96, SYSUTCDATETIME()), DATEADD(HOUR, 97, SYSUTCDATETIME()), N'Oncology follow-up', N'pending'),
	(N'apt-8', N'pat-8', N'doc-8', DATEADD(HOUR, 110, SYSUTCDATETIME()), DATEADD(HOUR, 111, SYSUTCDATETIME()), N'Diabetes management', N'in_progress'),
	(N'apt-9', N'pat-9', N'doc-9', DATEADD(HOUR, -36, SYSUTCDATETIME()), DATEADD(HOUR, -35, SYSUTCDATETIME()), N'Abdominal pain review', N'completed'),
	(N'apt-10', N'pat-10', N'doc-10', DATEADD(HOUR, 144, SYSUTCDATETIME()), DATEADD(HOUR, 145, SYSUTCDATETIME()), N'Shortness of breath', N'cancelled'),
	(N'apt-11', N'pat-11', N'doc-11', DATEADD(HOUR, -12, SYSUTCDATETIME()), DATEADD(HOUR, -11, SYSUTCDATETIME()), N'Vision screening', N'no_show'),
	(N'apt-12', N'pat-12', N'doc-12', DATEADD(HOUR, 176, SYSUTCDATETIME()), DATEADD(HOUR, 177, SYSUTCDATETIME()), N'Sinus symptoms', N'confirmed'),
	(N'apt-13', N'pat-13', N'doc-13', DATEADD(HOUR, 192, SYSUTCDATETIME()), DATEADD(HOUR, 193, SYSUTCDATETIME()), N'Kidney check', N'pending'),
	(N'apt-14', N'pat-14', N'doc-14', DATEADD(HOUR, 208, SYSUTCDATETIME()), DATEADD(HOUR, 209, SYSUTCDATETIME()), N'Joint pain follow-up', N'scheduled'),
	(N'apt-15', N'pat-15', N'doc-15', DATEADD(HOUR, 224, SYSUTCDATETIME()), DATEADD(HOUR, 225, SYSUTCDATETIME()), N'Anxiety consultation', N'confirmed'),
	(N'apt-16', N'pat-2', N'doc-2', DATEADD(HOUR, -6, SYSUTCDATETIME()), DATEADD(HOUR, -5, SYSUTCDATETIME()), N'ECG reassessment', N'completed'),
	(N'apt-17', N'pat-4', N'doc-3', DATEADD(HOUR, 12, SYSUTCDATETIME()), DATEADD(HOUR, 13, SYSUTCDATETIME()), N'Neurology review - urgent slot', N'requested'),
	(N'apt-18', N'pat-6', N'doc-6', DATEADD(HOUR, 36, SYSUTCDATETIME()), DATEADD(HOUR, 37, SYSUTCDATETIME()), N'Follow-up dermatitis control', N'scheduled'),
	(N'apt-19', N'pat-11', N'doc-11', DATEADD(HOUR, -72, SYSUTCDATETIME()), DATEADD(HOUR, -71, SYSUTCDATETIME()), N'Post treatment eye exam', N'completed'),
	(N'apt-20', N'pat-15', N'doc-15', DATEADD(HOUR, -24, SYSUTCDATETIME()), DATEADD(HOUR, -23, SYSUTCDATETIME()), N'Behavioral health intake', N'cancelled');

INSERT INTO billings (id, invoice_number, patient_id, charges, status, due_date)
VALUES
	(N'inv-1', N'INV-001', N'pat-1', N'[{"item":"Consultation","amount":5000000}]', N'open', DATEADD(HOUR, 24, SYSUTCDATETIME())),
	(N'inv-2', N'INV-002', N'pat-2', N'[{"item":"ECG","amount":12000000}]', N'draft', DATEADD(HOUR, 24, SYSUTCDATETIME())),
	(N'inv-3', N'INV-003', N'pat-3', N'[{"item":"Pediatric checkup","amount":4500000},{"item":"Vaccine","amount":2500000}]', N'open', DATEADD(HOUR, 48, SYSUTCDATETIME())),
	(N'inv-4', N'INV-004', N'pat-4', N'[{"item":"MRI","amount":3000000}]', N'issued', DATEADD(HOUR, 72, SYSUTCDATETIME())),
	(N'inv-5', N'INV-005', N'pat-5', N'[{"item":"X-Ray","amount":9000000},{"item":"Consultation","amount":5000000}]', N'draft', DATEADD(HOUR, 96, SYSUTCDATETIME())),
	(N'inv-6', N'INV-006', N'pat-6', N'[{"item":"Dermatology consult","amount":6000000}]', N'paid', DATEADD(HOUR, 120, SYSUTCDATETIME())),
	(N'inv-7', N'INV-007', N'pat-7', N'[{"item":"Oncology consult","amount":2000000}]', N'draft', DATEADD(HOUR, 144, SYSUTCDATETIME())),
	(N'inv-8', N'INV-008', N'pat-8', N'[{"item":"Lab Test","amount":7000000},{"item":"Consultation","amount":5000000}]', N'open', DATEADD(HOUR, 168, SYSUTCDATETIME())),
	(N'inv-9', N'INV-009', N'pat-9', N'[{"item":"Ultrasound","amount":11000000}]', N'open', DATEADD(HOUR, 192, SYSUTCDATETIME())),
	(N'inv-10', N'INV-010', N'pat-10', N'[{"item":"Pulmonary test","amount":13000000}]', N'void', DATEADD(HOUR, 216, SYSUTCDATETIME())),
	(N'inv-11', N'INV-011', N'pat-11', N'[{"item":"Vision screening","amount":4000000}]', N'open', DATEADD(HOUR, 240, SYSUTCDATETIME())),
	(N'inv-12', N'INV-012', N'pat-12', N'[{"item":"ENT consult","amount":5500000}]', N'issued', DATEADD(HOUR, 264, SYSUTCDATETIME())),
	(N'inv-13', N'INV-013', N'pat-13', N'[{"item":"Kidney panel","amount":1500000}]', N'draft', DATEADD(HOUR, 288, SYSUTCDATETIME())),
	(N'inv-14', N'INV-014', N'pat-14', N'[{"item":"Rheumatology consult","amount":7500000}]', N'open', DATEADD(HOUR, 312, SYSUTCDATETIME())),
	(N'inv-15', N'INV-015', N'pat-15', N'[{"item":"Psychiatry consult","amount":9000000}]', N'open', DATEADD(HOUR, 336, SYSUTCDATETIME())),
	(N'inv-16', N'INV-016', N'pat-2', N'[{"item":"Cardio package","amount":14500000},{"item":"Medication","amount":2500000}]', N'issued', DATEADD(HOUR, 360, SYSUTCDATETIME())),
	(N'inv-17', N'INV-017', N'pat-4', N'[{"item":"Neuro follow-up","amount":8500000}]', N'paid', DATEADD(HOUR, 384, SYSUTCDATETIME())),
	(N'inv-18', N'INV-018', N'pat-7', N'[{"item":"Oncology infusion","amount":18000000}]', N'void', DATEADD(HOUR, 408, SYSUTCDATETIME())),
	(N'inv-19', N'INV-019', N'pat-11', N'[{"item":"Eye pressure test","amount":3200000}]', N'draft', DATEADD(HOUR, 432, SYSUTCDATETIME())),
	(N'inv-20', N'INV-020', N'pat-14', N'[{"item":"Joint therapy package","amount":12000000}]', N'open', DATEADD(HOUR, 456, SYSUTCDATETIME()));

INSERT INTO payments (id, patient_id, invoice_id, amount, method, status)
VALUES
	(N'pay-1', N'pat-1', N'inv-1', 5000000, N'card', N'completed'),
	(N'pay-2', N'pat-3', N'inv-3', 7000000, N'cash', N'completed'),
	(N'pay-3', N'pat-4', N'inv-4', 1500000, N'bank_transfer', N'partial'),
	(N'pay-4', N'pat-6', N'inv-6', 6000000, N'card', N'completed'),
	(N'pay-5', N'pat-7', N'inv-7', 1000000, N'cash', N'partial'),
	(N'pay-6', N'pat-8', N'inv-8', 12000000, N'bank_transfer', N'completed'),
	(N'pay-7', N'pat-9', N'inv-9', 11000000, N'card', N'completed'),
	(N'pay-8', N'pat-10', N'inv-10', 500000, N'cash', N'initiated'),
	(N'pay-9', N'pat-11', N'inv-11', 4000000, N'card', N'completed'),
	(N'pay-10', N'pat-2', N'inv-16', 17000000, N'bank_transfer', N'completed'),
	(N'pay-11', N'pat-4', N'inv-17', 8500000, N'card', N'completed'),
	(N'pay-12', N'pat-7', N'inv-18', 200000, N'e_wallet', N'failed'),
	(N'pay-13', N'pat-14', N'inv-20', 3500000, N'cash', N'partial');

INSERT INTO medical_records (id, patient_id, entries)
VALUES
	(N'mr-1', N'pat-1', N'[{"type":"visit","note":"Stable vitals"}]'),
	(N'mr-2', N'pat-2', N'[{"type":"visit","note":"Mild chest pain"}]'),
	(N'mr-3', N'pat-3', N'[{"type":"visit","note":"Vaccination schedule updated"}]'),
	(N'mr-4', N'pat-4', N'[{"type":"visit","note":"Headache improving"}]'),
	(N'mr-5', N'pat-5', N'[{"type":"visit","note":"Knee pain under observation"}]'),
	(N'mr-6', N'pat-6', N'[{"type":"visit","note":"Skin irritation improving"}]'),
	(N'mr-7', N'pat-7', N'[{"type":"visit","note":"Chemotherapy follow-up scheduled"}]'),
	(N'mr-8', N'pat-8', N'[{"type":"visit","note":"Blood sugar trending down"}]'),
	(N'mr-9', N'pat-9', N'[{"type":"visit","note":"Abdominal ultrasound ordered"}]'),
	(N'mr-10', N'pat-10', N'[{"type":"visit","note":"Inhaler prescribed"}]'),
	(N'mr-11', N'pat-11', N'[{"type":"visit","note":"Vision stable"}]'),
	(N'mr-12', N'pat-12', N'[{"type":"visit","note":"Sinus congestion improved"}]'),
	(N'mr-13', N'pat-13', N'[{"type":"visit","note":"Kidney function monitored"}]'),
	(N'mr-14', N'pat-14', N'[{"type":"visit","note":"Joint swelling reduced"}]'),
	(N'mr-15', N'pat-15', N'[{"type":"visit","note":"Sleep quality improving"}]');

INSERT INTO prescriptions (id, patient_id, doctor_id, content)
VALUES
	(N'rx-1', N'pat-1', N'doc-1', N'{"medicines":["Paracetamol"],"note":"After meals"}'),
	(N'rx-2', N'pat-2', N'doc-2', N'{"medicines":["Aspirin"],"note":"Daily in the morning"}'),
	(N'rx-3', N'pat-4', N'doc-3', N'{"medicines":["Ibuprofen"],"note":"As needed"}'),
	(N'rx-4', N'pat-6', N'doc-6', N'{"medicines":["Hydrocortisone"],"note":"Apply twice daily"}'),
	(N'rx-5', N'pat-7', N'doc-7', N'{"medicines":["Ondansetron"],"note":"After treatment"}'),
	(N'rx-6', N'pat-8', N'doc-8', N'{"medicines":["Metformin"],"note":"With meals"}'),
	(N'rx-7', N'pat-9', N'doc-9', N'{"medicines":["Omeprazole"],"note":"Before breakfast"}'),
	(N'rx-8', N'pat-10', N'doc-10', N'{"medicines":["Albuterol"],"note":"As needed"}'),
	(N'rx-9', N'pat-11', N'doc-11', N'{"medicines":["Artificial tears"],"note":"Three times daily"}');

INSERT INTO messages (id, from_patient_id, to_doctor_id, from_doctor_id, to_patient_id, subject, content)
VALUES
	(N'msg-1', N'pat-1', N'doc-1', NULL, NULL, N'Need advice', N'I have mild fever.'),
	(N'msg-2', NULL, NULL, N'doc-1', N'pat-1', N'Follow up', N'Please monitor your temperature.'),
	(N'msg-3', N'pat-3', N'doc-4', NULL, NULL, N'Vaccination', N'Is booster needed this month?'),
	(N'msg-4', NULL, NULL, N'doc-4', N'pat-3', N'Reply', N'We can schedule a booster next week.'),
	(N'msg-5', N'pat-6', N'doc-6', NULL, NULL, N'Skin allergy', N'Rash still itchy after two days.'),
	(N'msg-6', NULL, NULL, N'doc-6', N'pat-6', N'Re: Skin allergy', N'Try the ointment twice daily.'),
	(N'msg-7', N'pat-7', N'doc-7', NULL, NULL, N'Follow-up', N'When is the next appointment?'),
	(N'msg-8', NULL, NULL, N'doc-7', N'pat-7', N'Reply', N'We will confirm the schedule tomorrow.'),
	(N'msg-9', N'pat-9', N'doc-9', NULL, NULL, N'Diet question', N'Can I eat spicy food?'),
	(N'msg-10', NULL, NULL, N'doc-9', N'pat-9', N'Reply', N'Please avoid spicy food for two weeks.'),
	(N'msg-11', N'pat-10', N'doc-10', NULL, NULL, N'Shortness of breath', N'Symptoms worsen at night.'),
	(N'msg-12', NULL, NULL, N'doc-10', N'pat-10', N'Reply', N'Use inhaler and rest.');

INSERT INTO services (id, name, price, description)
VALUES
	(N'svc-1', N'Consultation', 5000000, N'General clinic consultation service.'),
	(N'svc-2', N'Lab Test', 7000000, N'Basic laboratory testing service.'),
	(N'svc-3', N'ECG', 12000000, N'Electrocardiogram service.'),
	(N'svc-4', N'X-Ray', 9000000, N'Radiology imaging for bones and joints.'),
	(N'svc-5', N'Vaccination', 2500000, N'Routine vaccination service for children.'),
	(N'svc-6', N'Dermatology Consult', 6000000, N'Skin specialist consultation.'),
	(N'svc-7', N'Oncology Consult', 2000000, N'Cancer treatment consultation.'),
	(N'svc-8', N'Ultrasound', 11000000, N'Abdominal ultrasound service.'),
	(N'svc-9', N'Pulmonary Test', 13000000, N'Lung function testing.'),
	(N'svc-10', N'Vision Screening', 4000000, N'Basic eye exam.'),
	(N'svc-11', N'ENT Consult', 5500000, N'Ear, nose, and throat consultation.'),
	(N'svc-12', N'Kidney Panel', 15000000, N'Lab test for kidney function.'),
	(N'svc-13', N'Rheumatology Consult', 7500000, N'Joint and autoimmune consult.'),
	(N'svc-14', N'Psychiatry Consult', 9000000, N'Mental health consultation.'),
	(N'svc-15', N'Physical Therapy', 8000000, N'Rehabilitation therapy session.');

INSERT INTO insurance_plans (id, provider, plan_name, coverage_summary, copay_amount)
VALUES
	(N'ins-1', N'Blue Health', N'Standard Care', N'Outpatient consultation and basic lab coverage up to 80%.', 1500000),
	(N'ins-2', N'Sunrise Insurance', N'Family Plus', N'Family package with pediatric and maternity support.', 1000000),
	(N'ins-3', N'Prime Shield', N'Premium Gold', N'Extended inpatient and emergency coverage up to 90%.', 500000),
	(N'ins-4', N'HealthFirst', N'Basic Saver', N'General outpatient coverage up to 60%.', 2000000),
	(N'ins-5', N'VitaCare', N'Wellness Plus', N'Annual checkup and lab coverage.', 1200000),
	(N'ins-6', N'Pacific Guard', N'Silver Care', N'Inpatient coverage up to 70%.', 1800000),
	(N'ins-7', N'Skyline Insurance', N'Flex Plan', N'Flexible coverage with optional add-ons.', 2500000),
	(N'ins-8', N'Nova Life', N'Family Standard', N'Maternity and pediatric support.', 1500000),
	(N'ins-9', N'Guardian Health', N'Platinum', N'Extended coverage with lower copay.', 800000);

INSERT INTO booking_constraints (id, code, title, description, applies_to_role, constraint_value)
VALUES
	(N'bc-1', N'MAX_ACTIVE_APPOINTMENTS', N'Active booking limit', N'Each patient can keep at most 3 active appointments.', N'patient', 3),
	(N'bc-2', N'MIN_BOOKING_NOTICE_HOURS', N'Minimum booking notice', N'Appointments must be booked at least 24 hours in advance.', N'patient', 24),
	(N'bc-3', N'MAX_DAILY_APPOINTMENTS_PER_DOCTOR', N'Daily limit per doctor', N'Limit number of appointments per doctor per day.', N'doctor', 12),
	(N'bc-4', N'MAX_BOOKINGS_PER_WEEK', N'Weekly booking limit', N'Each patient can create at most 5 bookings per week.', N'patient', 5),
	(N'bc-5', N'RESCHEDULE_WINDOW_HOURS', N'Reschedule window', N'Rescheduling allowed up to 12 hours before appointment.', N'patient', 12),
	(N'bc-6', N'DOCTOR_BUFFER_MINUTES', N'Doctor buffer', N'Buffer time between appointments.', N'doctor', 15),
	(N'bc-7', N'MAX_CANCELS_PER_MONTH', N'Cancel limit', N'Each patient can cancel at most 2 appointments per month.', N'patient', 2),
	(N'bc-8', N'BOOKING_OPEN_DAYS', N'Advance booking days', N'Appointments can be booked up to 30 days ahead.', N'patient', 30),
	(N'bc-9', N'NO_SHOW_PENALTY_DAYS', N'No-show penalty', N'No-show limits new bookings for 7 days.', N'patient', 7);

INSERT INTO settings (id, data)
VALUES
	(N'singleton', N'{"clinicName":"Hospital Management Demo","timezone":"Asia/Ho_Chi_Minh","currency":"VND"}'),
	(N'billing', N'{"taxRate":0.1,"invoicePrefix":"INV"}'),
	(N'notifications', N'{"emailEnabled":true,"smsEnabled":false}'),
	(N'ui', N'{"theme":"light","brandColor":"#1e88e5"}'),
	(N'scheduling', N'{"slotDurationMinutes":30,"workingHours":"08:00-17:00"}'),
	(N'security', N'{"passwordMinLength":8,"lockoutMinutes":15}'),
	(N'portal', N'{"publicServicesEnabled":true,"newsEnabled":true}'),
	(N'billing_rules', N'{"lateFeePercent":0.02,"graceDays":7}'),
	(N'integration', N'{"smsProvider":"none","emailProvider":"smtp"}');

INSERT INTO lab_results (id, patient_id, doctor_id, content, status)
VALUES
	(N'lab-1', N'pat-1', N'doc-1', N'{"test":"CBC","result":"Normal"}', N'reviewed'),
	(N'lab-2', N'pat-2', N'doc-2', N'{"test":"ECG","result":"Minor arrhythmia"}', N'pending'),
	(N'lab-3', N'pat-5', N'doc-5', N'{"test":"X-Ray","result":"No fracture"}', N'reviewed'),
	(N'lab-4', N'pat-6', N'doc-6', N'{"test":"Allergy panel","result":"Mild reaction"}', N'reviewed'),
	(N'lab-5', N'pat-7', N'doc-7', N'{"test":"Tumor markers","result":"Stable"}', N'pending'),
	(N'lab-6', N'pat-8', N'doc-8', N'{"test":"HbA1c","result":"7.2"}', N'reviewed'),
	(N'lab-7', N'pat-9', N'doc-9', N'{"test":"Liver panel","result":"Normal"}', N'reviewed'),
	(N'lab-8', N'pat-10', N'doc-10', N'{"test":"Spirometry","result":"Mild obstruction"}', N'pending'),
	(N'lab-9', N'pat-11', N'doc-11', N'{"test":"Vision acuity","result":"20/25"}', N'reviewed'),
	(N'lab-10', N'pat-14', N'doc-14', N'{"test":"Autoimmune panel","result":"Awaiting doctor interpretation"}', N'in_progress');

INSERT INTO contact_leads (id, name, email, message)
VALUES
	(N'lead-1', N'Guest Visitor', N'guest@example.com', N'Need support for insurance plan.'),
	(N'lead-2', N'Nguyen Minh', N'minh@example.com', N'I want to schedule a pediatric consultation.'),
	(N'lead-3', N'Pham Khoa', N'khoa@example.com', N'How to access lab results online?'),
	(N'lead-4', N'Le Bao', N'lebao@example.com', N'Please advise dermatology services.'),
	(N'lead-5', N'Tran Minh', N'tranminh@example.com', N'Need appointment for eye exam.'),
	(N'lead-6', N'Vo Anh', N'voanh@example.com', N'What are the clinic working hours?'),
	(N'lead-7', N'Do Thao', N'dothao@example.com', N'Interested in health check package.'),
	(N'lead-8', N'Pham Linh', N'phamlinh@example.com', N'I need information about ENT services.'),
	(N'lead-9', N'Ngoc Tran', N'ngoctran@example.com', N'How to reschedule an appointment?');

INSERT INTO audit_logs (id, record_id, action, actor_id, reason)
VALUES
	(N'audit-1', N'mr-1', N'seed_audit', N'admin-1', N'Initial seeded audit trail.'),
	(N'audit-2', N'apt-3', N'created_appointment', N'pat-3', N'Patient completed online booking.'),
	(N'audit-3', N'inv-4', N'issued_invoice', N'admin-1', N'Invoice issued after imaging services.'),
	(N'audit-4', N'apt-6', N'created_appointment', N'pat-6', N'Dermatology appointment request submitted.'),
	(N'audit-5', N'inv-6', N'issued_invoice', N'admin-2', N'Payment reconciled in billing cycle.'),
	(N'audit-6', N'mr-8', N'updated_record', N'doc-8', N'Follow-up metrics added to patient chart.'),
	(N'audit-7', N'inv-10', N'voided_invoice', N'admin-3', N'Void due to duplicate invoice creation.'),
	(N'audit-8', N'apt-12', N'created_appointment', N'pat-12', N'ENT consultation booked from portal.'),
	(N'audit-9', N'lab-6', N'result_reviewed', N'doc-8', N'Lab reviewed and marked for follow-up.'),
	(N'audit-10', N'apt-16', N'completed_appointment', N'doc-2', N'Completed ECG reassessment visit.'),
	(N'audit-11', N'inv-16', N'issued_invoice', N'admin-2', N'Generated invoice for cardiology package.');

INSERT INTO refresh_tokens (token, user_id, expires_at)
VALUES
	(N'seed-refresh-admin', N'admin-1', DATEADD(DAY, 7, SYSUTCDATETIME())),
	(N'seed-refresh-doc-1', N'doc-1', DATEADD(DAY, 5, SYSUTCDATETIME())),
	(N'seed-refresh-pat-1', N'pat-1', DATEADD(DAY, 3, SYSUTCDATETIME())),
	(N'seed-refresh-admin-2', N'admin-2', DATEADD(DAY, 7, SYSUTCDATETIME())),
	(N'seed-refresh-doc-6', N'doc-6', DATEADD(DAY, 5, SYSUTCDATETIME())),
	(N'seed-refresh-doc-7', N'doc-7', DATEADD(DAY, 5, SYSUTCDATETIME())),
	(N'seed-refresh-pat-6', N'pat-6', DATEADD(DAY, 3, SYSUTCDATETIME())),
	(N'seed-refresh-pat-7', N'pat-7', DATEADD(DAY, 3, SYSUTCDATETIME())),
	(N'seed-refresh-pat-8', N'pat-8', DATEADD(DAY, 3, SYSUTCDATETIME()));

INSERT INTO doctors (id, full_name, specialization, department, available_slots_per_day, contact_email, contact_phone, status)
VALUES
	(N'doc-16', N'Dr. Grace Nguyen', N'Infectious Disease', N'Infectious Unit', 9, N'doc16@example.com', N'0900000016', N'active'),
	(N'doc-17', N'Dr. Aaron Vo', N'Geriatrics', N'Geriatric Center', 8, N'doc17@example.com', N'0900000017', N'active'),
	(N'doc-18', N'Dr. Chloe Tran', N'Sports Medicine', N'Rehab and Sports', 10, N'doc18@example.com', N'0900000018', N'active'),
	(N'doc-19', N'Dr. Ethan Pham', N'Hematology', N'Blood Disorders Unit', 7, N'doc19@example.com', N'0900000019', N'pending'),
	(N'doc-20', N'Dr. Sophia Le', N'Rehabilitation', N'Physical Rehab', 11, N'doc20@example.com', N'0900000020', N'active');

INSERT INTO patients (id, full_name, date_of_birth, contact_email, contact_phone, contact_address, emergency_contact, status, assigned_doctor_id)
VALUES
	(N'pat-16', N'Huy Dang', '1988-03-15T00:00:00', N'huydang@example.com', N'0901313131', N'District 9, Ho Chi Minh City', N'{"name":"Linh Dang","phone":"0901313132"}', N'active', N'doc-16'),
	(N'pat-17', N'Mai Bui', '1991-07-11T00:00:00', N'maibui@example.com', N'0901414141', N'Thu Duc, Ho Chi Minh City', N'{"name":"Trung Bui","phone":"0901414142"}', N'active', N'doc-17'),
	(N'pat-18', N'Long Vu', '1978-12-21T00:00:00', N'longvu@example.com', N'0901515151', N'District 11, Ho Chi Minh City', N'{"name":"Dao Vu","phone":"0901515152"}', N'pending', N'doc-18'),
	(N'pat-19', N'Thao Truong', '1999-09-09T00:00:00', N'thao.truong@example.com', N'0901616161', N'District 1, Ho Chi Minh City', N'{"name":"Quang Truong","phone":"0901616162"}', N'verified', N'doc-19'),
	(N'pat-20', N'Nam Cao', '1985-05-01T00:00:00', N'namcao@example.com', N'0901717171', N'Binh Thanh, Ho Chi Minh City', N'{"name":"Lan Cao","phone":"0901717172"}', N'active', N'doc-20'),
	(N'pat-21', N'Lien Pham', '1993-08-14T00:00:00', N'lienpham@example.com', N'0901818181', N'District 5, Ho Chi Minh City', N'{"name":"Kiet Pham","phone":"0901818182"}', N'active', N'doc-16'),
	(N'pat-22', N'Duc Hoang', '1975-11-30T00:00:00', N'duchoang@example.com', N'0901919191', N'District 12, Ho Chi Minh City', N'{"name":"My Hoang","phone":"0901919192"}', N'inactive', N'doc-17'),
	(N'pat-23', N'Yen Ngo', '2002-04-05T00:00:00', N'yenngo@example.com', N'0902020202', N'Go Vap, Ho Chi Minh City', N'{"name":"Tuan Ngo","phone":"0902020203"}', N'pending', N'doc-18'),
	(N'pat-24', N'Khanh Bui', '1980-10-10T00:00:00', N'khanhbui@example.com', N'0902121212', N'District 7, Ho Chi Minh City', N'{"name":"Nga Bui","phone":"0902121213"}', N'active', N'doc-19'),
	(N'pat-25', N'An Ly', '1996-01-26T00:00:00', N'anly@example.com', N'0902222333', N'Phu Nhuan, Ho Chi Minh City', N'{"name":"Nhi Ly","phone":"0902222334"}', N'verified', N'doc-20');

INSERT INTO users (id, email, password_hash, role, status, patient_id, doctor_id, full_name)
VALUES
	(N'admin-4', N'admin4@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'admin', N'active', NULL, NULL, N'Admin Four'),
	(N'doc-16', N'doc16@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-16', N'Dr. Grace Nguyen'),
	(N'doc-17', N'doc17@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-17', N'Dr. Aaron Vo'),
	(N'doc-18', N'doc18@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-18', N'Dr. Chloe Tran'),
	(N'doc-19', N'doc19@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'pending', NULL, N'doc-19', N'Dr. Ethan Pham'),
	(N'doc-20', N'doc20@example.com', N'$2b$10$bnNVIK/jG0EH.1WDA2eSuO0TJ.Rh.blNYAh7vbEr9yAMuBQQOYRwS', N'doctor', N'active', NULL, N'doc-20', N'Dr. Sophia Le'),
	(N'pat-16', N'huydang@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-16', NULL, N'Huy Dang'),
	(N'pat-17', N'maibui@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-17', NULL, N'Mai Bui'),
	(N'pat-18', N'longvu@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'pending', N'pat-18', NULL, N'Long Vu'),
	(N'pat-19', N'thao.truong@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'verified', N'pat-19', NULL, N'Thao Truong'),
	(N'pat-20', N'namcao@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-20', NULL, N'Nam Cao'),
	(N'pat-21', N'lienpham@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-21', NULL, N'Lien Pham'),
	(N'pat-22', N'duchoang@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'inactive', N'pat-22', NULL, N'Duc Hoang'),
	(N'pat-23', N'yenngo@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'pending', N'pat-23', NULL, N'Yen Ngo'),
	(N'pat-24', N'khanhbui@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'active', N'pat-24', NULL, N'Khanh Bui'),
	(N'pat-25', N'anly@example.com', N'$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6u.ZYdij24apqYh6g82f58UaxrW', N'patient', N'verified', N'pat-25', NULL, N'An Ly');

INSERT INTO appointments (id, patient_id, doctor_id, start_at, end_at, reason, status)
VALUES
	(N'apt-21', N'pat-16', N'doc-16', DATEADD(HOUR, 10, SYSUTCDATETIME()), DATEADD(HOUR, 11, SYSUTCDATETIME()), N'Fever monitoring', N'scheduled'),
	(N'apt-22', N'pat-17', N'doc-17', DATEADD(HOUR, 14, SYSUTCDATETIME()), DATEADD(HOUR, 15, SYSUTCDATETIME()), N'Geriatric blood pressure review', N'pending'),
	(N'apt-23', N'pat-18', N'doc-18', DATEADD(HOUR, 22, SYSUTCDATETIME()), DATEADD(HOUR, 23, SYSUTCDATETIME()), N'Sports knee evaluation', N'requested'),
	(N'apt-24', N'pat-19', N'doc-19', DATEADD(HOUR, 30, SYSUTCDATETIME()), DATEADD(HOUR, 31, SYSUTCDATETIME()), N'Blood count follow-up', N'scheduled'),
	(N'apt-25', N'pat-20', N'doc-20', DATEADD(HOUR, 40, SYSUTCDATETIME()), DATEADD(HOUR, 41, SYSUTCDATETIME()), N'Rehab consultation', N'pending'),
	(N'apt-26', N'pat-21', N'doc-16', DATEADD(HOUR, -4, SYSUTCDATETIME()), DATEADD(HOUR, -3, SYSUTCDATETIME()), N'Infection control follow-up', N'completed'),
	(N'apt-27', N'pat-22', N'doc-17', DATEADD(HOUR, -18, SYSUTCDATETIME()), DATEADD(HOUR, -17, SYSUTCDATETIME()), N'Mobility check', N'no_show'),
	(N'apt-28', N'pat-23', N'doc-18', DATEADD(HOUR, -30, SYSUTCDATETIME()), DATEADD(HOUR, -29, SYSUTCDATETIME()), N'Shoulder strain treatment', N'cancelled'),
	(N'apt-29', N'pat-24', N'doc-19', DATEADD(HOUR, 54, SYSUTCDATETIME()), DATEADD(HOUR, 55, SYSUTCDATETIME()), N'Hematology reassessment', N'scheduled'),
	(N'apt-30', N'pat-25', N'doc-20', DATEADD(HOUR, 66, SYSUTCDATETIME()), DATEADD(HOUR, 67, SYSUTCDATETIME()), N'Post-injury rehab planning', N'in_progress'),
	(N'apt-31', N'pat-16', N'doc-1', DATEADD(HOUR, -52, SYSUTCDATETIME()), DATEADD(HOUR, -51, SYSUTCDATETIME()), N'General follow-up', N'completed'),
	(N'apt-32', N'pat-17', N'doc-2', DATEADD(HOUR, -60, SYSUTCDATETIME()), DATEADD(HOUR, -59, SYSUTCDATETIME()), N'Cardio routine screening', N'completed'),
	(N'apt-33', N'pat-18', N'doc-3', DATEADD(HOUR, 72, SYSUTCDATETIME()), DATEADD(HOUR, 73, SYSUTCDATETIME()), N'Neuro-muscular check', N'pending'),
	(N'apt-34', N'pat-19', N'doc-4', DATEADD(HOUR, 84, SYSUTCDATETIME()), DATEADD(HOUR, 85, SYSUTCDATETIME()), N'Pediatric transfer consult', N'requested'),
	(N'apt-35', N'pat-20', N'doc-5', DATEADD(HOUR, 90, SYSUTCDATETIME()), DATEADD(HOUR, 91, SYSUTCDATETIME()), N'Orthopedic follow-up', N'scheduled'),
	(N'apt-36', N'pat-21', N'doc-6', DATEADD(HOUR, 96, SYSUTCDATETIME()), DATEADD(HOUR, 97, SYSUTCDATETIME()), N'Dermatology review', N'pending'),
	(N'apt-37', N'pat-22', N'doc-7', DATEADD(HOUR, 102, SYSUTCDATETIME()), DATEADD(HOUR, 103, SYSUTCDATETIME()), N'Oncology counseling', N'scheduled'),
	(N'apt-38', N'pat-23', N'doc-8', DATEADD(HOUR, -84, SYSUTCDATETIME()), DATEADD(HOUR, -83, SYSUTCDATETIME()), N'Endocrine control visit', N'completed'),
	(N'apt-39', N'pat-24', N'doc-9', DATEADD(HOUR, -92, SYSUTCDATETIME()), DATEADD(HOUR, -91, SYSUTCDATETIME()), N'Digestive disorder check', N'completed'),
	(N'apt-40', N'pat-25', N'doc-10', DATEADD(HOUR, 114, SYSUTCDATETIME()), DATEADD(HOUR, 115, SYSUTCDATETIME()), N'Pulmonary recovery review', N'pending');

INSERT INTO billings (id, invoice_number, patient_id, charges, status, due_date)
VALUES
	(N'inv-21', N'INV-021', N'pat-16', N'[{"item":"Infectious consult","amount":4200000},{"item":"Rapid test","amount":1800000}]', N'issued', DATEADD(HOUR, 72, SYSUTCDATETIME())),
	(N'inv-22', N'INV-022', N'pat-17', N'[{"item":"Geriatric package","amount":7600000}]', N'open', DATEADD(HOUR, 96, SYSUTCDATETIME())),
	(N'inv-23', N'INV-023', N'pat-18', N'[{"item":"Sports ultrasound","amount":5100000}]', N'draft', DATEADD(HOUR, 120, SYSUTCDATETIME())),
	(N'inv-24', N'INV-024', N'pat-19', N'[{"item":"Hematology panel","amount":8900000}]', N'paid', DATEADD(HOUR, 144, SYSUTCDATETIME())),
	(N'inv-25', N'INV-025', N'pat-20', N'[{"item":"Rehab session","amount":3000000},{"item":"Therapy tools","amount":1200000}]', N'open', DATEADD(HOUR, 168, SYSUTCDATETIME())),
	(N'inv-26', N'INV-026', N'pat-21', N'[{"item":"Lab package","amount":6700000}]', N'void', DATEADD(HOUR, 192, SYSUTCDATETIME())),
	(N'inv-27', N'INV-027', N'pat-22', N'[{"item":"Specialist consult","amount":5500000}]', N'issued', DATEADD(HOUR, 216, SYSUTCDATETIME())),
	(N'inv-28', N'INV-028', N'pat-23', N'[{"item":"Medication","amount":2500000},{"item":"Follow-up","amount":2000000}]', N'open', DATEADD(HOUR, 240, SYSUTCDATETIME())),
	(N'inv-29', N'INV-029', N'pat-24', N'[{"item":"Imaging","amount":9800000}]', N'paid', DATEADD(HOUR, 264, SYSUTCDATETIME())),
	(N'inv-30', N'INV-030', N'pat-25', N'[{"item":"Pulmonary monitor","amount":6200000}]', N'draft', DATEADD(HOUR, 288, SYSUTCDATETIME()));

INSERT INTO payments (id, patient_id, invoice_id, amount, method, status)
VALUES
	(N'pay-14', N'pat-16', N'inv-21', 6000000, N'card', N'completed'),
	(N'pay-15', N'pat-17', N'inv-22', 3000000, N'cash', N'partial'),
	(N'pay-16', N'pat-18', N'inv-23', 500000, N'e_wallet', N'initiated'),
	(N'pay-17', N'pat-19', N'inv-24', 8900000, N'bank_transfer', N'paid'),
	(N'pay-18', N'pat-20', N'inv-25', 4200000, N'card', N'completed'),
	(N'pay-19', N'pat-21', N'inv-26', 200000, N'e_wallet', N'failed'),
	(N'pay-20', N'pat-22', N'inv-27', 2000000, N'cash', N'partial'),
	(N'pay-21', N'pat-23', N'inv-28', 4500000, N'bank_transfer', N'completed'),
	(N'pay-22', N'pat-24', N'inv-29', 9800000, N'card', N'paid'),
	(N'pay-23', N'pat-25', N'inv-30', 1200000, N'cash', N'initiated'),
	(N'pay-24', N'pat-17', N'inv-22', 4600000, N'bank_transfer', N'completed'),
	(N'pay-25', N'pat-25', N'inv-30', 5000000, N'e_wallet', N'completed');

INSERT INTO medical_records (id, patient_id, entries)
VALUES
	(N'mr-16', N'pat-16', N'[{"type":"visit","note":"Temperature normalized after treatment"}]'),
	(N'mr-17', N'pat-17', N'[{"type":"visit","note":"Blood pressure stable with medication"}]'),
	(N'mr-18', N'pat-18', N'[{"type":"visit","note":"Ligament strain requires therapy"}]'),
	(N'mr-19', N'pat-19', N'[{"type":"visit","note":"Hemoglobin trend improving"}]'),
	(N'mr-20', N'pat-20', N'[{"type":"visit","note":"Walking endurance increased"}]'),
	(N'mr-21', N'pat-21', N'[{"type":"visit","note":"Lab values in expected range"}]'),
	(N'mr-22', N'pat-22', N'[{"type":"visit","note":"Follow-up postponed by patient"}]'),
	(N'mr-23', N'pat-23', N'[{"type":"visit","note":"Recovery plan updated"}]'),
	(N'mr-24', N'pat-24', N'[{"type":"visit","note":"Imaging showed no acute findings"}]'),
	(N'mr-25', N'pat-25', N'[{"type":"visit","note":"Respiratory rate improved"}]');

INSERT INTO prescriptions (id, patient_id, doctor_id, content)
VALUES
	(N'rx-10', N'pat-16', N'doc-16', N'{"medicines":["Azithromycin"],"note":"Once daily for 3 days"}'),
	(N'rx-11', N'pat-17', N'doc-17', N'{"medicines":["Amlodipine"],"note":"Take after breakfast"}'),
	(N'rx-12', N'pat-18', N'doc-18', N'{"medicines":["Diclofenac gel"],"note":"Apply to knee twice daily"}'),
	(N'rx-13', N'pat-19', N'doc-19', N'{"medicines":["Iron supplement"],"note":"Take with vitamin C"}'),
	(N'rx-14', N'pat-20', N'doc-20', N'{"medicines":["Calcium"],"note":"Take at night"}'),
	(N'rx-15', N'pat-23', N'doc-18', N'{"medicines":["Ibuprofen"],"note":"As needed"}'),
	(N'rx-16', N'pat-24', N'doc-19', N'{"medicines":["Probiotic"],"note":"After meals"}'),
	(N'rx-17', N'pat-25', N'doc-20', N'{"medicines":["Budesonide"],"note":"Inhale twice daily"}');

INSERT INTO messages (id, from_patient_id, to_doctor_id, from_doctor_id, to_patient_id, subject, content)
VALUES
	(N'msg-13', N'pat-16', N'doc-16', NULL, NULL, N'Fever follow-up', N'Temperature is down but still coughing.'),
	(N'msg-14', NULL, NULL, N'doc-16', N'pat-16', N'Re: Fever follow-up', N'Continue fluids and rest for 48 hours.'),
	(N'msg-15', N'pat-17', N'doc-17', NULL, NULL, N'Blood pressure reading', N'Reading this morning was 138 over 85.'),
	(N'msg-16', NULL, NULL, N'doc-17', N'pat-17', N'Re: Blood pressure reading', N'Please keep monitoring twice daily.'),
	(N'msg-17', N'pat-18', N'doc-18', NULL, NULL, N'Knee pain', N'Still painful when climbing stairs.'),
	(N'msg-18', NULL, NULL, N'doc-18', N'pat-18', N'Re: Knee pain', N'Add cold compression after exercise.'),
	(N'msg-19', N'pat-20', N'doc-20', NULL, NULL, N'Rehab question', N'Can I increase walking duration this week?'),
	(N'msg-20', NULL, NULL, N'doc-20', N'pat-20', N'Re: Rehab question', N'Increase slowly by 10 minutes per day.'),
	(N'msg-21', N'pat-24', N'doc-19', NULL, NULL, N'Test interpretation', N'Please explain my blood panel result.'),
	(N'msg-22', NULL, NULL, N'doc-19', N'pat-24', N'Re: Test interpretation', N'Your levels are stable, no urgent concern.');

INSERT INTO lab_results (id, patient_id, doctor_id, content, status)
VALUES
	(N'lab-11', N'pat-16', N'doc-16', N'{"test":"CRP","result":"Mildly elevated"}', N'pending'),
	(N'lab-12', N'pat-17', N'doc-17', N'{"test":"Lipid panel","result":"Borderline high LDL"}', N'reviewed'),
	(N'lab-13', N'pat-18', N'doc-18', N'{"test":"Knee MRI","result":"Minor ligament strain"}', N'reviewed'),
	(N'lab-14', N'pat-19', N'doc-19', N'{"test":"CBC","result":"Hemoglobin improved"}', N'reviewed'),
	(N'lab-15', N'pat-20', N'doc-20', N'{"test":"Mobility assessment","result":"Progressing"}', N'in_progress'),
	(N'lab-16', N'pat-23', N'doc-18', N'{"test":"Muscle enzymes","result":"Normal"}', N'pending'),
	(N'lab-17', N'pat-24', N'doc-19', N'{"test":"Coagulation","result":"Normal"}', N'reviewed'),
	(N'lab-18', N'pat-25', N'doc-20', N'{"test":"Spirometry","result":"Improved FEV1"}', N'reviewed');

INSERT INTO contact_leads (id, name, email, message)
VALUES
	(N'lead-10', N'Nguyen Dung', N'dung.nguyen@example.com', N'Can I combine insurance and discount package?'),
	(N'lead-11', N'Le Minh Chau', N'chau.le@example.com', N'I need urgent infectious disease consultation.'),
	(N'lead-12', N'Pham Gia Bao', N'giabao@example.com', N'How long for rehab package enrollment?'),
	(N'lead-13', N'Tran Quoc Huy', N'quochuy@example.com', N'Please share hematology specialist availability.'),
	(N'lead-14', N'Vo Thanh Nhan', N'nhan.vo@example.com', N'What tests are included in annual screening?'),
	(N'lead-15', N'Do Thi Yen', N'yen.do@example.com', N'Can I request weekend appointment slots?');

INSERT INTO audit_logs (id, record_id, action, actor_id, reason)
VALUES
	(N'audit-12', N'apt-21', N'created_appointment', N'pat-16', N'Patient booked via portal for infectious consult.'),
	(N'audit-13', N'apt-26', N'completed_appointment', N'doc-16', N'Consultation completed and notes added.'),
	(N'audit-14', N'inv-21', N'issued_invoice', N'admin-4', N'Invoice issued after consultation and test.'),
	(N'audit-15', N'inv-24', N'marked_paid', N'admin-2', N'Payment reconciliation completed.'),
	(N'audit-16', N'apt-28', N'cancelled_appointment', N'pat-23', N'Patient unavailable and requested cancellation.'),
	(N'audit-17', N'lab-14', N'result_reviewed', N'doc-19', N'Hematology result reviewed with patient.'),
	(N'audit-18', N'mr-22', N'updated_record', N'doc-17', N'Added postponement note and risk reminder.'),
	(N'audit-19', N'inv-26', N'voided_invoice', N'admin-1', N'Void due to duplicated service entry.'),
	(N'audit-20', N'pay-22', N'payment_confirmed', N'admin-4', N'Card payment verified in gateway report.'),
	(N'audit-21', N'apt-40', N'created_appointment', N'pat-25', N'New pulmonary follow-up slot created.');

INSERT INTO refresh_tokens (token, user_id, expires_at)
VALUES
	(N'seed-refresh-admin-4', N'admin-4', DATEADD(DAY, 7, SYSUTCDATETIME())),
	(N'seed-refresh-doc-16', N'doc-16', DATEADD(DAY, 5, SYSUTCDATETIME())),
	(N'seed-refresh-doc-17', N'doc-17', DATEADD(DAY, 5, SYSUTCDATETIME())),
	(N'seed-refresh-doc-20', N'doc-20', DATEADD(DAY, 5, SYSUTCDATETIME())),
	(N'seed-refresh-pat-16', N'pat-16', DATEADD(DAY, 3, SYSUTCDATETIME())),
	(N'seed-refresh-pat-17', N'pat-17', DATEADD(DAY, 3, SYSUTCDATETIME())),
	(N'seed-refresh-pat-20', N'pat-20', DATEADD(DAY, 3, SYSUTCDATETIME())),
	(N'seed-refresh-pat-25', N'pat-25', DATEADD(DAY, 3, SYSUTCDATETIME()));
GO
