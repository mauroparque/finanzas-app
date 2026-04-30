import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Movimiento } from '../../types';

interface Props {
  transactions: Movimiento[];
}

const MACRO_COLORS: Record<string, string> = {
  VIVIR: '#8FA68E',      // sage-500
  TRABAJAR: '#3E4A5E',   // navy-500
  DEBER: '#D4A843',      // amber-500
  DISFRUTAR: '#C46A52',  // terracotta-500
};

export function MacroPieChart({ transactions }: Props) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.tipo === 'gasto' && t.moneda === 'ARS')
      .forEach(t => {
        const macro = t.macro || 'VIVIR';
        map[macro] = (map[macro] || 0) + parseFloat(String(t.monto));
      });

    const total = Object.values(map).reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: MACRO_COLORS[name] || '#78716c',
    }));
  }, [transactions]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center py-2">
      <div className="w-[120px] h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={58}
              stroke="none"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
