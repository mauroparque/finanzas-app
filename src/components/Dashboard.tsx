import { useMemo } from 'react';
import {
  Wallet,
  Calendar,
  ShoppingBag,
  PawPrint,
  Zap,
  ArrowRight,
  TrendingUp,
  Home,
  Briefcase,
  CreditCard,
  Smile,
} from 'lucide-react';
import { useMediosPago } from '../hooks/useMediosPago';
import { usePresupuestos } from '../hooks/usePresupuestos';
import { useServicios } from '../hooks/useServicios';
import { useTransactions } from '../hooks/useTransactions';
import { Card } from './common/ui/Card';
import { cn } from '../utils/cn';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number, moneda: string = 'ARS') => {
  const currency = moneda === 'USDT' ? 'USD' : moneda;
  const formatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  return moneda === 'USDT' ? formatted.replace('US$', 'USDT') : formatted;
};

const getSectionHeading = 'text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3';

// ─── Macro config ────────────────────────────────────────────────────────────

type MacroKey = 'VIVIR' | 'TRABAJAR' | 'DEBER' | 'DISFRUTAR';

interface MacroConfig {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
  /** unidad values that map to this macro */
  unidades: string[];
  /** category keywords that map to this macro (fallback) */
  keywords: string[];
}

const MACRO_CONFIG: Record<MacroKey, MacroConfig> = {
  VIVIR: {
    label: 'Vivir',
    icon: <Home size={16} strokeWidth={2} />,
    bgClass: 'bg-sage-50',
    textClass: 'text-sage-700',
    borderClass: 'border-sage-200',
    unidades: ['HOGAR'],
    keywords: ['vivienda', 'aliment', 'super', 'hogar', 'salud', 'transport', 'mascota', 'animal'],
  },
  TRABAJAR: {
    label: 'Trabajar',
    icon: <Briefcase size={16} strokeWidth={2} />,
    bgClass: 'bg-navy-50',
    textClass: 'text-navy-700',
    borderClass: 'border-navy-200',
    unidades: ['PROFESIONAL'],
    keywords: ['professional', 'trabajo', 'oficina', 'software', 'herramienta'],
  },
  DEBER: {
    label: 'Deber',
    icon: <CreditCard size={16} strokeWidth={2} />,
    bgClass: 'bg-terracotta-50',
    textClass: 'text-terracotta-700',
    borderClass: 'border-terracotta-200',
    unidades: [],
    keywords: ['cuota', 'préstamo', 'prestamo', 'deuda', 'tarjeta', 'credito', 'crédito'],
  },
  DISFRUTAR: {
    label: 'Disfrutar',
    icon: <Smile size={16} strokeWidth={2} />,
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    unidades: ['BRASIL'],
    keywords: ['entretenimiento', 'viaje', 'restaurant', 'ocio', 'cultura', 'deporte', 'salida'],
  },
};

function classifyTransaction(unidad: string, categoria: string, concepto: string): MacroKey {
  const lowerCat = (categoria + ' ' + concepto).toLowerCase();

  // DEBER: keyword match first (cross-unit)
  if (MACRO_CONFIG.DEBER.keywords.some(k => lowerCat.includes(k))) return 'DEBER';

  // Unidad-based
  if (unidad === 'PROFESIONAL') return 'TRABAJAR';
  if (unidad === 'BRASIL') return 'DISFRUTAR';

  // HOGAR: further split by keywords
  if (MACRO_CONFIG.DISFRUTAR.keywords.some(k => lowerCat.includes(k))) return 'DISFRUTAR';

  return 'VIVIR';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('bg-stone-100 animate-pulse rounded-xl', className)} />;
}

function CategoryIcon({ category }: { category: string }) {
  const c = category.toLowerCase();
  if (c.includes('aliment') || c.includes('comida') || c.includes('super')) return <ShoppingBag size={16} />;
  if (c.includes('animal') || c.includes('mascota')) return <PawPrint size={16} />;
  if (c.includes('servici') || c.includes('impuesto') || c.includes('luz') || c.includes('gas')) return <Zap size={16} />;
  return <ShoppingBag size={16} />;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { accounts, loading: loadingAccounts } = useMediosPago();
  const { presupuestos, loading: loadingPresupuestos } = usePresupuestos();
  const { movimientosPrevistos, servicios, loading: loadingServicios } = useServicios();
  const currentMonth = useMemo(() => new Date(), []);
  const { transactions } = useTransactions({ month: currentMonth });

  // ── Derived: saldo agrupado por moneda (no mezclar ARS con USD/BRL) ────────
  const saldoPorMoneda = useMemo(() => {
    const groups: Record<string, number> = {};
    accounts.forEach(acc => {
      const m = acc.moneda;
      groups[m] = (groups[m] ?? 0) + parseFloat(String(acc.saldo));
    });
    return groups;
  }, [accounts]);

  // ── Derived: upcoming deadlines ───────────────────────────────────────────
  const upcomingDeadlines = useMemo(
    () =>
      movimientosPrevistos
        .filter(mp => mp.estado !== 'PAID' && mp.estado !== 'PAGADO')
        .slice(0, 4),
    [movimientosPrevistos],
  );

  // ── Derived: gastos por macro ──────────────────────────────────────────────
  const gastosPorMacro = useMemo(() => {
    const totals: Record<MacroKey, number> = { VIVIR: 0, TRABAJAR: 0, DEBER: 0, DISFRUTAR: 0 };
    transactions
      .filter(t => t.tipo === 'gasto')
      .forEach(t => {
        const key = classifyTransaction(t.unidad, t.categoria, t.concepto);
        totals[key] += parseFloat(String(t.monto));
      });
    return totals;
  }, [transactions]);

  // ── Derived: presupuestos con gasto ───────────────────────────────────────
  const presupuestosConGasto = useMemo(
    () =>
      presupuestos.map(p => {
        const spent = transactions
          .filter(t => {
            const campo = p.tipo_objetivo === 'categoria' ? t.categoria : t.concepto;
            return campo === p.nombre_objetivo && t.tipo === 'gasto';
          })
          .reduce((sum, t) => sum + parseFloat(String(t.monto)), 0);
        return { ...p, spent };
      }),
    [presupuestos, transactions],
  );

  // ── Greeting ───────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const capitalized = today.charAt(0).toUpperCase() + today.slice(1);

  // ── Full loading state ─────────────────────────────────────────────────────
  if (loadingAccounts && accounts.length === 0) {
    return (
      <div className="space-y-6 px-1">
        <SkeletonLine className="h-12 w-48" />
        <SkeletonLine className="h-36 w-full" />
        <SkeletonLine className="h-24 w-full" />
        <SkeletonLine className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex justify-between items-start pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-0.5">
            Mau &amp; Agos
          </p>
          <h1 className="text-2xl font-serif font-bold text-stone-900 leading-tight">
            {greeting}
          </h1>
          <p className="text-sm text-stone-500 mt-0.5 font-medium">{capitalized}</p>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 mt-1">
          <Calendar size={16} strokeWidth={2} />
        </div>
      </header>

      {/* ── Hero: Saldo Total ───────────────────────────────────────────────── */}
      <Card className="p-5 bg-stone-900 border-stone-800">
        <p className={cn(getSectionHeading, 'text-stone-500 mb-1 flex items-center gap-1.5')}>
          <Wallet size={12} strokeWidth={2.5} />
          Saldo total consolidado
        </p>

        {loadingAccounts ? (
          <SkeletonLine className="h-10 w-40 bg-stone-800" />
        ) : (
          <div className="space-y-0.5">
            {Object.entries(saldoPorMoneda).map(([moneda, total]) => (
              <p key={moneda} className="text-3xl font-bold text-stone-50 tracking-tight">
                {formatCurrency(total, moneda)}
              </p>
            ))}
            {Object.keys(saldoPorMoneda).length === 0 && (
              <p className="text-3xl font-bold text-stone-50 tracking-tight">—</p>
            )}
          </div>
        )}

        {/* Accounts list */}
        {accounts.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className="bg-stone-800 rounded-xl px-3 py-2.5 border border-stone-700"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-0.5 truncate">
                  {acc.nombre}
                </p>
                <p className="text-sm font-bold text-stone-100 tracking-tight">
                  {formatCurrency(parseFloat(String(acc.saldo)), acc.moneda)}
                </p>
              </div>
            ))}
          </div>
        )}

        {accounts.length === 0 && !loadingAccounts && (
          <p className="mt-2 text-sm text-stone-500">Sin cuentas activas</p>
        )}
      </Card>

      {/* ── Macros: VIVIR / TRABAJAR / DEBER / DISFRUTAR ───────────────────── */}
      <section>
        <p className={getSectionHeading}>Gasto del mes por macro</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(MACRO_CONFIG) as [MacroKey, MacroConfig][]).map(([key, cfg]) => (
            <div
              key={key}
              className={cn(
                'rounded-2xl border p-4 flex flex-col gap-2',
                cfg.bgClass,
                cfg.borderClass,
              )}
            >
              <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center', cfg.textClass, 'bg-white/70 border border-current/10')}>
                {cfg.icon}
              </div>
              <div>
                <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-0.5', cfg.textClass)}>
                  {cfg.label}
                </p>
                <p className="text-base font-bold text-stone-900 tracking-tight">
                  {formatCurrency(gastosPorMacro[key])}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Presupuestos ───────────────────────────────────────────────────── */}
      <section>
        <p className={getSectionHeading}>Presupuestos</p>

        {loadingPresupuestos ? (
          <div className="space-y-3">
            <SkeletonLine className="h-16 w-full" />
            <SkeletonLine className="h-16 w-full" />
          </div>
        ) : presupuestosConGasto.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-sm text-stone-400">No hay presupuestos definidos</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {presupuestosConGasto.map(p => {
              const percentage = p.limite > 0 ? Math.min((p.spent / p.limite) * 100, 100) : 0;
              const isNearLimit = percentage >= p.porcentaje_alerta;
              const isOver = p.spent > p.limite;
              const barColor = isNearLimit || isOver ? 'bg-terracotta-400' : 'bg-sage-400';

              return (
                <Card key={p.id} className="py-3 px-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-7 h-7 rounded-xl flex items-center justify-center',
                        isNearLimit || isOver
                          ? 'bg-terracotta-50 text-terracotta-600'
                          : 'bg-sage-50 text-sage-600',
                      )}>
                        <CategoryIcon category={p.nombre_objetivo} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800 leading-tight">
                          {p.nombre_objetivo}
                        </p>
                        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">
                          {p.unidad ?? 'Global'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-sm font-bold tracking-tight',
                        isOver ? 'text-terracotta-600' : 'text-stone-800',
                      )}>
                        {formatCurrency(p.spent, p.moneda)}
                      </p>
                      <p className="text-[10px] text-stone-400 font-medium">
                        de {formatCurrency(p.limite, p.moneda)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', barColor)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isOver && (
                    <p className="mt-1.5 text-[10px] font-semibold text-terracotta-600 flex items-center gap-1">
                      <TrendingUp size={10} /> Límite superado
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Próximos vencimientos ───────────────────────────────────────────── */}
      <section>
        <p className={getSectionHeading}>Próximos vencimientos</p>

        <Card className="p-0 overflow-hidden">
          {loadingServicios ? (
            <div className="p-4 space-y-3">
              <SkeletonLine className="h-12 w-full" />
              <SkeletonLine className="h-12 w-full" />
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-stone-400">Sin vencimientos pendientes</p>
            </div>
          ) : (
            <ul>
              {upcomingDeadlines.map((mp, idx) => {
                const def = servicios.find(s => s.id === mp.referencia_id);
                const monto = mp.monto_real ?? mp.monto_estimado ?? def?.monto_estimado;
                const isPending = mp.estado === 'PENDING';

                return (
                  <li
                    key={mp.id}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5',
                      idx < upcomingDeadlines.length - 1 && 'border-b border-stone-100',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Status dot */}
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          isPending ? 'bg-terracotta-400 animate-pulse' : 'bg-amber-400',
                        )}
                      />
                      <div>
                        <p className="text-sm font-semibold text-stone-800 leading-tight">
                          {mp.nombre}
                        </p>
                        <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
                          {mp.moneda}
                          {def && ` · Día ${def.dia_vencimiento}`}
                        </p>
                      </div>
                    </div>
                    {monto != null && (
                      <p className="text-sm font-bold text-stone-900 tracking-tight tabular-nums">
                        {formatCurrency(parseFloat(String(monto)), mp.moneda)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <button className="w-full py-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-terracotta-600 hover:bg-terracotta-50 transition-colors border-t border-stone-100">
            Ver calendario completo <ArrowRight size={12} />
          </button>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
