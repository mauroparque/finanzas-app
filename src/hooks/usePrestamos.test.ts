import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePrestamos } from './usePrestamos';

vi.mock('../config/api', () => ({
  apiGet: vi.fn().mockResolvedValue([
    { id: 1, descripcion: 'Préstamo BNA', entidad: 'BNA', monto_original: 1000000, monto_cuota: 50000, moneda: 'ARS', cuota_actual: 5, total_cuotas: 36, fecha_inicio: '2025-01-15', tasa_anual: 45, activo: true },
  ]),
  apiPatch: vi.fn(),
}));

describe('usePrestamos', () => {
  it('fetches loans on mount', async () => {
    const { result } = renderHook(() => usePrestamos());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.prestamos.length).toBe(1);
    expect(result.current.prestamos[0].descripcion).toBe('Préstamo BNA');
  });
});
