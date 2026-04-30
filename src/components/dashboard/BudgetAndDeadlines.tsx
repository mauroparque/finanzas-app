import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { PresupuestoDefinicion, MovimientoPrevisto, ServicioDefinicion } from '../../types';

interface BudgetItem extends PresupuestoDefinicion {
  spent: number;
}

interface Props {
  presupuestosConGasto: BudgetItem[];
  upcomingDeadlines: MovimientoPrevisto[];
  servicios: ServicioDefinicion[];
  loadingServicios: boolean;
}

export function BudgetAndDeadlines({
  presupuestosConGasto,
  upcomingDeadlines,
  servicios,
  loadingServicios,
}: Props) {
  const hasBudgets = presupuestosConGasto.length > 0;
  const hasDeadlines = upcomingDeadlines.length > 0;

  return (
    <section className="space-y-5">
      {/* Presupuestos */}
      <div>
        <h4 className="font-serif font-bold text-stone-800 text-lg px-1 mb-3">
          Presupuestos
        </h4>

        {hasBudgets ? (
          <div className="space-y-3">
            {presupuestosConGasto.map(p => {
              const limite = parseFloat(String(p.limite));
              const isOver = p.spent > limite;
              const isNearLimit = limite > 0 && (p.spent / limite) * 100 >= p.porcentaje_alerta;

              let barColor = 'bg-emerald-500';
              if (isOver) barColor = 'bg-rose-500';
              else if (isNearLimit) barColor = 'bg-amber-500';

              const pct = limite > 0 ? Math.min((p.spent / limite) * 100, 100) : 0;

              return (
                <div key={p.id} className="px-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-stone-800">{p.nombre_objetivo}</span>
                    <div className="flex items-center gap-2">
                      {isOver && (
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">
                          ⚠️ Excedido
                        </span>
                      )}
                      <span className="text-xs font-bold text-stone-600 tracking-tight">
                        {formatCurrency(p.spent, p.moneda)} / {formatCurrency(limite, p.moneda)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-stone-500 text-sm px-1">No hay presupuestos definidos.</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-stone-200" />

      {/* Vencimientos */}
      <div>
        <h4 className="font-serif font-bold text-stone-800 text-lg px-1 mb-3">
          Próximos Vencimientos
        </h4>

        {loadingServicios ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-terracotta-500" size={24} />
          </div>
        ) : hasDeadlines ? (
          <div className="space-y-0">
            {upcomingDeadlines.map(mp => {
              const def = servicios.find(s => s.id === mp.referencia_id);
              const monto = mp.monto_real ?? mp.monto_estimado ?? def?.monto_estimado;

              return (
                <div
                  key={mp.id}
                  className="flex items-center justify-between py-3 px-1 border-b border-stone-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        mp.estado === 'RESERVADO'
                          ? 'bg-sage-500'
                          : 'bg-terracotta-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-stone-800">{mp.nombre}</p>
                      <p className="text-[10px] font-bold uppercase text-stone-500">{mp.moneda}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {monto != null && (
                      <p className="text-sm font-bold text-stone-800 tracking-tight">
                        {formatCurrency(monto, mp.moneda)}
                      </p>
                    )}
                    {def && (
                      <p className="text-[10px] font-medium text-stone-500">
                        Día {def.dia_vencimiento}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-stone-500 text-sm px-1">Sin vencimientos próximos</p>
        )}

        <button className="mt-3 flex items-center gap-1.5 text-xs font-bold text-terracotta-600 uppercase tracking-widest hover:text-terracotta-700 transition-colors">
          Ver todo el calendario <ArrowRight size={12} />
        </button>
      </div>
    </section>
  );
}
