import { useState, useMemo, type FC } from 'react';
import { PieChart, CreditCard, Landmark } from 'lucide-react';
import { Card } from './common/ui/Card';
import { useCuotasTarjeta } from '../hooks/useCuotasTarjeta';
import { usePrestamos } from '../hooks/usePrestamos';
import { formatCurrency } from '../utils/formatters';
import type { CuotaTarjeta } from '../types';

const CardsView: FC = () => {
  const [activeCard, setActiveCard] = useState<'visa' | 'prestamos'>('visa');
  const { cuotas, loading: loadingCuotas, error: errorCuotas } = useCuotasTarjeta();
  const { prestamos, loading: loadingPrestamos, error: errorPrestamos } = usePrestamos();

  const groupedCuotas = useMemo<Record<string, CuotaTarjeta[]>>(() => {
    return cuotas.reduce((acc, cuota) => {
      if (!acc[cuota.tarjeta]) {
        acc[cuota.tarjeta] = [];
      }
      acc[cuota.tarjeta].push(cuota);
      return acc;
    }, {} as Record<string, CuotaTarjeta[]>);
  }, [cuotas]);

  const isLoading = activeCard === 'visa' ? loadingCuotas : loadingPrestamos;
  const error = activeCard === 'visa' ? errorCuotas : errorPrestamos;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1 tracking-tight font-serif">Financiación</h1>
          <p className="text-stone-500 text-sm font-medium">Control de cuotas y límites</p>
        </div>
        <div className="w-10 h-10 bg-stone-100 rounded-xl border border-stone-200 flex items-center justify-center text-terracotta-500">
          <PieChart size={20} />
        </div>
      </header>

      {/* Toggle */}
      <div className="bg-stone-100 p-1.5 rounded-2xl border border-stone-200 flex relative">
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-terracotta-500 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${activeCard === 'visa' ? 'left-1.5' : 'left-[calc(50%+4.5px)]'}`}
        />
        <button
          onClick={() => setActiveCard('visa')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${activeCard === 'visa' ? 'text-white' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <CreditCard size={14} /> Visa / Master
        </button>
        <button
          onClick={() => setActiveCard('prestamos')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${activeCard === 'prestamos' ? 'text-white' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <Landmark size={14} /> Préstamos
        </button>
      </div>

      <div className="relative min-h-[200px]">
        {isLoading ? (
          <p className="text-stone-400 text-sm text-center py-8">Cargando...</p>
        ) : error ? (
          <p className="text-stone-400 text-sm text-center py-8">{error}</p>
        ) : activeCard === 'visa' ? (
          <div className="space-y-6">
            {Object.keys(groupedCuotas).length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">No hay cuotas activas</p>
            ) : (
              (Object.entries(groupedCuotas) as [string, CuotaTarjeta[]][]).map(([tarjeta, items]) => (
                <section key={tarjeta} className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-lg font-bold text-stone-800 font-serif">{tarjeta}</h4>
                    <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200">
                      {items.length} activas
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {items.map((item) => {
                      const progress = (item.cuota_actual / item.total_cuotas) * 100;
                      return (
                        <Card key={item.id} shadow="soft" className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-terracotta-500">
                                <CreditCard size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-stone-800">{item.descripcion}</p>
                                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mt-0.5">
                                  {item.categoria}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-stone-800 tracking-tight">
                                {formatCurrency(item.monto_cuota, item.moneda)}
                              </p>
                              <p className="text-[10px] text-stone-500 font-medium">
                                <span className="text-stone-700">{item.cuota_actual}</span>{' '}
                                <span className="text-stone-400">/</span> {item.total_cuotas}
                              </p>
                            </div>
                          </div>
                          <div className="relative pt-2">
                            <div className="flex justify-between text-[10px] font-medium text-stone-500 mb-1.5">
                              <span>Progreso</span>
                              <span>Faltan {item.total_cuotas - item.cuota_actual} cuotas</span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-terracotta-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {prestamos.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">No hay préstamos activos</p>
            ) : (
              prestamos.map((loan) => {
                const progress = (loan.cuota_actual / loan.total_cuotas) * 100;
                const remainingDebt = loan.monto_original - loan.monto_cuota * loan.cuota_actual;
                return (
                  <Card key={loan.id} shadow="card" className="relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-navy-800 border border-stone-200">
                            <Landmark size={18} />
                          </div>
                          <div>
                            <h5 className="font-bold text-stone-800 text-lg tracking-tight font-serif">
                              {loan.entidad}
                            </h5>
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                              Préstamo Personal
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-stone-800 tracking-tighter">
                            {formatCurrency(loan.monto_cuota, loan.moneda)}
                          </p>
                          <p className="text-[10px] text-stone-500 uppercase font-bold">Cuota Mensual</p>
                        </div>
                      </div>

                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-stone-600 font-medium">Progreso del pago</span>
                          <span className="text-stone-800 font-bold">{Math.round(progress)}%</span>
                        </div>

                        <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-navy-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-end pt-1">
                          <div>
                            <p className="text-[10px] text-stone-500 font-medium uppercase mb-0.5">Cuotas Pagas</p>
                            <p className="text-sm font-bold text-stone-800">
                              {loan.cuota_actual}{' '}
                              <span className="text-stone-400 text-xs">/ {loan.total_cuotas}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-stone-500 font-medium uppercase mb-0.5">Deuda Restante</p>
                            <div className="flex items-center gap-1 justify-end text-stone-700">
                              <span className="text-sm font-bold">
                                {formatCurrency(Math.max(0, remainingDebt), loan.moneda)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardsView;
