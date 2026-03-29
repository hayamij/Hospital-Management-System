import { describe, expect, it, vi } from 'vitest';
import {
  buildBillingPayload,
  buildOverridePayload,
  buildServicePayload,
  prettyReport,
  withFeedback,
} from '../../../client/src/pages/controllers/adminOpsController.js';

describe('adminOpsController', () => {
  it('formats report output safely', () => {
    expect(prettyReport(null)).toBe('No report generated yet.');
    expect(prettyReport({ ok: true })).toContain('"ok": true');
  });

  it('builds API payloads for override, service, and billing', () => {
    expect(
      buildOverridePayload(
        { action: 'cancel', startAt: '', endAt: '', doctorId: '' },
        'admin-1'
      )
    ).toEqual({
      action: 'cancel',
      startAt: undefined,
      endAt: undefined,
      doctorId: undefined,
      adminId: 'admin-1',
    });

    expect(buildServicePayload({ id: '', name: 'X-Ray', price: 150 }, 'admin-1')).toEqual({
      action: 'upsert',
      adminId: 'admin-1',
      service: { id: undefined, name: 'X-Ray', price: 150 },
    });

    expect(buildBillingPayload({ action: 'issue', dueDate: '' }, 'admin-1')).toEqual({
      action: 'issue',
      dueDate: undefined,
      adminId: 'admin-1',
    });
  });

  it('handles success and error feedback paths', async () => {
    const statusSpy = vi.fn();
    const errorSpy = vi.fn();

    await withFeedback({
      run: async () => {},
      setStatus: statusSpy,
      setError: errorSpy,
      successText: 'Done',
    });

    expect(statusSpy).toHaveBeenLastCalledWith('Done');

    await withFeedback({
      run: async () => {
        throw new Error('Boom');
      },
      setStatus: statusSpy,
      setError: errorSpy,
      successText: 'Done',
    });

    expect(errorSpy).toHaveBeenLastCalledWith('Boom');
  });
});
