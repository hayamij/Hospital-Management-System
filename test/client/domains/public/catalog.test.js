import { describe, expect, it } from 'vitest';
import {
  categoryByName,
  formatPrice,
  getFallbackServices,
  loadCatalogServices,
} from '../../../../client/src/domains/public/services/catalog.js';

describe('public catalog domain', () => {
  it('categorizes names with keyword rules', () => {
    expect(categoryByName('Kham tim mach tong quat')).toBe('Noi khoa');
    expect(categoryByName('Kham Nhi dinh ky')).toBe('Nhi khoa');
    expect(categoryByName('Xet nghiem mau')).toBe('Can lam sang');
    expect(categoryByName('Phau thuat co ban')).toBe('Ngoai khoa');
    expect(categoryByName('Dich vu khac')).toBe('Tong quat');
  });

  it('returns fallback services when API list is empty', async () => {
    const fakeApi = {
      publicInfo: async () => ({ services: [] }),
    };

    const result = await loadCatalogServices(fakeApi);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      category: expect.any(String),
      image: expect.stringContaining('/assets/images/'),
    });
  });

  it('maps API services with normalized shape', async () => {
    const fakeApi = {
      publicInfo: async () => ({
        services: [
          {
            id: 'svc-001',
            title: 'Kham Noi tong quat',
            description: 'Mo ta',
            price: 250000,
          },
        ],
      }),
    };

    const result = await loadCatalogServices(fakeApi);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'svc-001',
      name: 'Kham Noi tong quat',
      category: 'Noi khoa',
      description: 'Mo ta',
      price: 250000,
    });
  });

  it('formats numeric prices for vi-VN', () => {
    expect(formatPrice(1200000)).toBe('1.200.000 VND');
    expect(formatPrice('abc')).toBe('abc');
  });

  it('provides deterministic fallback shape', () => {
    const fallback = getFallbackServices();

    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback.every((item) => item.image)).toBe(true);
  });
});
