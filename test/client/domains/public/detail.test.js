import { describe, expect, it } from 'vitest';
import {
  buildBookingLink,
  formatPrice,
  mapRelatedServices,
  normalizeService,
} from '../../../../client/src/domains/public/services/detail.js';

describe('public detail domain', () => {
  it('normalizes wrapped service payloads', () => {
    const normalized = normalizeService({
      service: {
        id: 'svc-009',
        title: 'Kham tong quat',
        description: 'Mo ta ngan',
        price: 300000,
      },
    });

    expect(normalized).toMatchObject({
      id: 'svc-009',
      name: 'Kham tong quat',
      description: 'Mo ta ngan',
      price: 300000,
      image: expect.stringContaining('/assets/images/'),
    });
  });

  it('returns null for invalid payload', () => {
    expect(normalizeService(null)).toBeNull();
    expect(normalizeService('bad')).toBeNull();
  });

  it('maps related services to a stable UI shape', () => {
    const mapped = mapRelatedServices([
      { id: 'svc-1', name: 'A' },
      { title: 'B' },
    ]);

    expect(mapped).toHaveLength(2);
    expect(mapped[0]).toMatchObject({ id: 'svc-1', name: 'A' });
    expect(mapped[1]).toMatchObject({ id: 'svc-2', name: 'B' });
    expect(mapped[0].image).toContain('/assets/images/');
  });

  it('builds booking link using encoded service id', () => {
    expect(buildBookingLink('svc-1')).toBe('/patient/booking?service=svc-1');
    expect(buildBookingLink('svc/1')).toBe('/patient/booking?service=svc%2F1');
    expect(buildBookingLink('')).toBe('/register');
  });

  it('formats prices in VND', () => {
    expect(formatPrice(999000)).toBe('999.000 VND');
    expect(formatPrice('x')).toBe('x');
  });
});
