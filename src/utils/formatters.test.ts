import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatNumber } from './formatters';

describe('formatCurrency', () => {
  it('formats ARS currency', () => {
    expect(formatCurrency(1234.56, 'ARS')).toContain('1.234,56');
  });
  it('formats USD currency', () => {
    expect(formatCurrency(100, 'USD')).toContain('100');
  });
  it('formats BRL currency', () => {
    expect(formatCurrency(50, 'BRL')).toContain('50');
  });
});

describe('formatDate', () => {
  it('formats ISO date string to locale', () => {
    const result = formatDate('2026-04-22T10:00:00Z');
    expect(result).toBeTruthy();
  });
});

describe('formatNumber', () => {
  it('formats with 2 decimals', () => {
    expect(formatNumber(1234.5)).toContain('1.234,5');
  });
});
