import type { ReactNode } from 'react';
import { CreditCard, Landmark } from 'lucide-react';
import { Card } from './common/ui/Card';
import { Badge } from './common/ui/Badge';
import { useCuotasTarjeta } from '../hooks/useCuotasTarjeta';
import { usePrestamos } from '../hooks/usePrestamos';
import { cn } from '../utils/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, moneda: string = 'ARS'): string {
  const currency = moneda === 'USDT' ? 'USD' : moneda;
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
  return moneda === 'USDT' ? formatted.replace('US$', 'USDT') : formatted;
}

function formatNextDueDate(fechaInicio: string, cuotaActual: number): string {
  try {
    const inicio = new Date(fechaInicio);
    const nextDue = new Date(inicio);
    nextDue.setMonth(inicio.getMonth() + cuotaActual);
    return nextDue.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-stone-100 animate-pulse rounded-2xl h-20 mb-3" />
);

// ─── Sub-sections ─────────────────────────────────────────────────────────────

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
    {children}
  </h2>
);

const EmptyState = ({ message }: { message: string }) => (
  <p className="text-stone-400 text-sm text-center py-8">{message}</p>
);

// ─── Cuotas section ───────────────────────────────────────────────────────────

const CuotasSection = () => {
  const { cuotas, loading, error } = useCuotasTarjeta();

  if (loading) {
    return (
      <section>
        <SectionHeading>Cuotas activas</SectionHeading>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <SectionHeading>Cuotas activas</SectionHeading>
        <p className="text-red-500 text-sm text-center py-8">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <SectionHeading>Cuotas activas</SectionHeading>
        {cuotas.length > 0 && (
          <Badge label={`${cuotas.length} activa${cuotas.length !== 1 ? 's' : ''}`} color="sage" />
        )}
      </div>

      {cuotas.length === 0 ? (
        <EmptyState message="Sin cuotas activas" />
      ) : (
        <div className="space-y-3">
          {cuotas.map((cuota) => {
            const progress = Math.round((cuota.cuota_actual / cuota.total_cuotas) * 100);
            const remaining = cuota.total_cuotas - cuota.cuota_actual;

            return (
              <Card key={cuota.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-terracotta-50 rounded-xl flex items-center justify-center text-terracotta-500">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800 leading-tight">
                        {cuota.descripcion}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{cuota.tarjeta}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-800">
                      {formatCurrency(parseFloat(String(cuota.monto_cuota)), cuota.moneda)}
                    </p>
                    <p className="text-xs text-stone-400">
                      {cuota.cuota_actual}&nbsp;/&nbsp;{cuota.total_cuotas}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-stone-400 mb-1">
                    <span>Progreso</span>
                    <span>
                      {remaining === 0
                        ? 'Última cuota'
                        : `Faltan ${remaining} cuota${remaining !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        progress >= 80
                          ? 'bg-sage-400'
                          : 'bg-terracotta-400'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

// ─── Préstamos section ────────────────────────────────────────────────────────

const PrestamosSection = () => {
  const { prestamos, loading, error } = usePrestamos();

  if (loading) {
    return (
      <section>
        <SectionHeading>Préstamos</SectionHeading>
        {[1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <SectionHeading>Préstamos</SectionHeading>
        <p className="text-red-500 text-sm text-center py-8">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <SectionHeading>Préstamos</SectionHeading>
        {prestamos.length > 0 && (
          <Badge label={`${prestamos.length} activo${prestamos.length !== 1 ? 's' : ''}`} color="navy" />
        )}
      </div>

      {prestamos.length === 0 ? (
        <EmptyState message="Sin préstamos activos" />
      ) : (
        <div className="space-y-3">
          {prestamos.map((prestamo) => {
            const saldoPendiente =
              parseFloat(String(prestamo.monto_original)) -
              parseFloat(String(prestamo.monto_cuota)) * prestamo.cuota_actual;
            const progress = Math.round(
              (prestamo.cuota_actual / prestamo.total_cuotas) * 100
            );
            const remaining = prestamo.total_cuotas - prestamo.cuota_actual;
            const proximoVencimiento = formatNextDueDate(
              prestamo.fecha_inicio,
              prestamo.cuota_actual
            );

            return (
              <Card key={prestamo.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-navy-50 rounded-xl flex items-center justify-center text-navy-500">
                      <Landmark size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800 leading-tight">
                        {prestamo.descripcion}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{prestamo.entidad}</p>
                    </div>
                  </div>
                  <Badge label="Activo" color="sage" />
                </div>

                {/* Key figures */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-stone-50 rounded-xl p-2.5">
                    <p className="text-xs text-stone-400 mb-0.5">Cuota mensual</p>
                    <p className="text-sm font-bold text-stone-800">
                      {formatCurrency(parseFloat(String(prestamo.monto_cuota)), prestamo.moneda)}
                    </p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-2.5">
                    <p className="text-xs text-stone-400 mb-0.5">Saldo pendiente</p>
                    <p className="text-sm font-bold text-stone-800">
                      {formatCurrency(Math.max(0, saldoPendiente), prestamo.moneda)}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-stone-400 mb-1">
                    <span>
                      Cuota {prestamo.cuota_actual}&nbsp;/&nbsp;{prestamo.total_cuotas}
                    </span>
                    <span>Próx. {proximoVencimiento}</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        remaining <= 3 ? 'bg-sage-400' : 'bg-navy-400'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-400 mt-1 text-right">
                    {remaining === 0
                      ? 'Última cuota'
                      : `Faltan ${remaining} cuota${remaining !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

// ─── Main view ────────────────────────────────────────────────────────────────

const CardsView = () => {
  return (
    <div className="space-y-8 pb-6">
      <header>
        <h1 className="text-2xl font-serif font-bold text-stone-800 mb-1">Financiación</h1>
        <p className="text-stone-500 text-sm">Control de cuotas y préstamos activos</p>
      </header>

      <CuotasSection />
      <PrestamosSection />
    </div>
  );
};

export default CardsView;
