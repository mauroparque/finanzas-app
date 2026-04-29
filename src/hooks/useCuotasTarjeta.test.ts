import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCuotasTarjeta } from './useCuotasTarjeta';

vi.mock('../config/api', () => ({
  apiGet: vi.fn().mockResolvedValue([
    { id: 1, descripcion: 'TV Samsung', tarjeta: 'Visa', monto_cuota: 15000, moneda: 'ARS', cuota_actual: 3, total_cuotas: 12, fecha_inicio: '2026-01-15', unidad: 'HOGAR', categoria: 'Vivienda', concepto: 'Alquiler', detalle: 'TV Samurai 55"', activo: true },
  ]),
  apiPatch: vi.fn(),
}));

describe('useCuotasTarjeta', () => {
  it('fetches installments on mount', async () => {
    const { result } = renderHook(() => useCuotasTarjeta());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cuotas.length).toBe(1);
    expect(result.current.cuotas[0].descripcion).toBe('TV Samsung');
  });
});
