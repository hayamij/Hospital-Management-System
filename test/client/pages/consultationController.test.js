import { describe, expect, it } from 'vitest';
import {
  buildConsultationErrors,
  buildConsultationNoteBlock,
  mapRecordRows,
} from '../../../client/src/pages/controllers/consultationController.js';

describe('consultationController', () => {
  it('validates required consultation data', () => {
    const errors = buildConsultationErrors({
      activePatientId: '',
      form: {
        clinicalNote: 'short',
        icd10: 'invalid',
        prescription: 'abc',
        labOrders: '',
      },
    });

    expect(errors.patient).toBeDefined();
    expect(errors.clinicalNote).toBeDefined();
    expect(errors.icd10).toBeDefined();
    expect(errors.prescription).toBeDefined();
    expect(errors.labOrders).toBeDefined();
  });

  it('builds note block with upper-cased ICD10 code', () => {
    const note = buildConsultationNoteBlock({
      clinicalNote: 'Patient reports mild fever and dry cough',
      icd10: 'j20.9',
      prescription: 'Paracetamol 500mg',
      labOrders: 'CBC',
    });

    expect(note).toContain('ICD10: J20.9');
    expect(note).toContain('Clinical: Patient reports mild fever and dry cough');
  });

  it('maps records to a normalized table row shape', () => {
    const rows = mapRecordRows([
      {
        recordId: 'rec-1',
        visitDate: '2026-01-01T08:00:00.000Z',
        diagnosis: 'Acute bronchitis',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'rec-1',
      doctorId: '-',
      note: 'Acute bronchitis',
    });
  });
});
