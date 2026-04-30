import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Movimiento } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  transactions: Movimiento[];
}

export function MacroTrendChart({ transactions }: Props) {
  const data = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};

    transactions
      .filter(t => t.tipo === 'gasto')
      .forEach(t => {
        const day = t.fecha_operacion.slice(0, 10); // YYYY-MM-DD
        const macro = t.macro || 'VIVIR';
        if (!map[day]) map[day] = {};
        map[day][macro] = (map[day][macro] || 0) + parseFloat(String(t.monto));
      });

    const days = Object.keys(map).sort();
    const macros = ['VIVIR', 'TRABAJAR', 'DEBER', 'DISFRUTAR'] as const;

    return days.map(day => {
      const row: Record<string, number | string> = { day };
      macros.forEach(m => {
        row[m] = map[day][m] || 0;
      });
      return row;
    });
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="text-center text-stone-500 py-12">
        Sin datos de gastos para el período seleccionado.
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: '#78716c' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#78716c' }}
            tickFormatter={(v: number) => `$${v.toLocaleString('es-AR')}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value, 'ARS'),
              name,
            ]}
            contentStyle={{
              borderRadius: '1rem',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="VIVIR"
            stackId="1"
            stroke="#5e8152"
            fill="#5e8152"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="TRABAJAR"
            stackId="1"
            stroke="#456ba3"
            fill="#456ba3"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="DEBER"
            stackId="1"
            stroke="#d4a373"
            fill="#d4a373"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="DISFRUTAR"
            stackId="1"
            stroke="#c06c4f"
            fill="#c06c4f"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
