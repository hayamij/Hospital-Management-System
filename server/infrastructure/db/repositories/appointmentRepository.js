import crypto from 'node:crypto';
import { AppointmentRepositoryPort } from '../../../application/ports/repositories/appointmentRepositoryPort.js';
import { Appointment } from '../../../domain/entities/appointment.js';

const toDate = (value) => (value ? new Date(value) : null);

const coerceDate = (value) => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

const ensureId = (id) => id || crypto.randomUUID();

const SLOT_MINUTES = 30;
const WORKDAY_START_HOUR_UTC = 8;
const WORKDAY_END_HOUR_UTC = 17;

const isActiveAppointmentStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  return !['canceled', 'cancelled', 'rejected'].includes(value);
};

const normalizeToDate = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDayBoundsUtc = (inputDate) => {
  const date = normalizeToDate(inputDate) || new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const from = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  return { from, to };
};

const slotOverlaps = (slotStart, slotEnd, apptStart, apptEnd) => slotStart < apptEnd && slotEnd > apptStart;

const toEntity = (row) => {
  if (!row) return null;
  return new Appointment({
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    startAt: toDate(row.start_at),
    endAt: toDate(row.end_at),
    reason: row.reason,
    status: row.status,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  });
};

export class SqlAppointmentRepository extends AppointmentRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM appointments WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async save(appointment) {
    const startAt = coerceDate(appointment.startAt)?.toISOString();
    const endAt = coerceDate(appointment.endAt)?.toISOString();
    const status = appointment.status ?? 'pending';
    const id = ensureId(appointment.id);

    const existing = await this.findById(id);
    if (existing) {
      await this.pool.query(
        `UPDATE appointments
           SET patient_id = $1,
               doctor_id = $2,
               start_at = $3,
               end_at = $4,
               reason = $5,
               status = $6,
               updated_at = now()
         WHERE id = $7`,
        [appointment.patientId, appointment.doctorId, startAt, endAt, appointment.reason, status, id],
      );
      return this.findById(id);
    }

    await this.pool.query(
      `INSERT INTO appointments (id, patient_id, doctor_id, start_at, end_at, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, appointment.patientId, appointment.doctorId, startAt, endAt, appointment.reason, status],
    );
    return this.findById(id);
  }

  async listByDoctor(doctorId, { from, to } = {}) {
    const values = [doctorId];
    const conditions = ['doctor_id = $1'];
    if (from) {
      values.push(from);
      conditions.push(`start_at >= $${values.length}`);
    }
    if (to) {
      values.push(to);
      conditions.push(`start_at <= $${values.length}`);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await this.pool.query(`SELECT * FROM appointments ${where} ORDER BY start_at ASC`, values);
    return rows.map(toEntity);
  }

  async listByPatient(patientId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY start_at DESC',
      [patientId],
    );
    return rows.map(toEntity);
  }

  async listAvailableSlots(doctorId, { from, to } = {}) {
    const normalizedFrom = normalizeToDate(from);
    const normalizedTo = normalizeToDate(to);
    const { from: dayStart, to: dayEnd } = normalizedFrom
      ? { from: normalizedFrom, to: normalizedTo || normalizedFrom }
      : toDayBoundsUtc(normalizedTo || new Date());

    const appointments = await this.listByDoctor(doctorId, { from: dayStart, to: dayEnd });
    const busy = appointments
      .filter((item) => isActiveAppointmentStatus(item.status))
      .map((item) => ({ start: item.startAt, end: item.endAt }))
      .filter((item) => item.start instanceof Date && item.end instanceof Date);

    const workStart = new Date(Date.UTC(
      dayStart.getUTCFullYear(),
      dayStart.getUTCMonth(),
      dayStart.getUTCDate(),
      WORKDAY_START_HOUR_UTC,
      0,
      0,
      0,
    ));
    const workEnd = new Date(Date.UTC(
      dayStart.getUTCFullYear(),
      dayStart.getUTCMonth(),
      dayStart.getUTCDate(),
      WORKDAY_END_HOUR_UTC,
      0,
      0,
      0,
    ));

    const slots = [];
    let cursor = workStart;
    while (cursor < workEnd) {
      const next = new Date(cursor.getTime() + SLOT_MINUTES * 60 * 1000);
      if (next > workEnd) break;
      const blocked = busy.some((item) => slotOverlaps(cursor, next, item.start, item.end));
      if (!blocked) {
        slots.push({
          id: `${doctorId}-${cursor.toISOString()}`,
          start: cursor.toISOString(),
          end: next.toISOString(),
        });
      }
      cursor = next;
    }

    return slots;
  }
}
