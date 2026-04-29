import { useMemo } from 'react';
import type { Movimiento, PresupuestoDefinicion } from '../types';

export function useBudgetStatus(
  presupuestos: PresupuestoDefinicion[],
  transactions: Movimiento[]
) {
  return useMemo(() => {
    return presupuestos.map(p => {
      const spent = transactions
        .filter(t => {
          const campo = p.tipo_objetivo === 'categoria' ? t.categoria : t.concepto;
          return campo === p.nombre_objetivo && t.tipo === 'gasto' && t.moneda === p.moneda;
        })
        .reduce((sum, t) => sum + parseFloat(String(t.monto)), 0);
      return { ...p, spent };
    });
  }, [presupuestos, transactions]);
}
