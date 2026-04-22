import { Home, CreditCard, ClipboardCheck, List, BarChart2, DollarSign } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { Screen } from '../../../types';

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const NAV_ITEMS = [
  { screen: 'dashboard' as Screen,    icon: Home,        label: 'Inicio'       },
  { screen: 'movimientos' as Screen,  icon: List,        label: 'Movimientos'  },
  { screen: 'tarjetas' as Screen,     icon: CreditCard,  label: 'Tarjetas'     },
  { screen: 'servicios' as Screen,    icon: ClipboardCheck, label: 'Servicios' },
  { screen: 'analisis' as Screen,     icon: BarChart2,   label: 'Análisis'     },
  { screen: 'cotizaciones' as Screen, icon: DollarSign,  label: 'Cotizaciones' },
] as const;

export const Sidebar = ({ activeScreen, onNavigate }: SidebarProps) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-stone-100">
        <span className="font-serif text-xl font-semibold text-terracotta-500 tracking-tight">
          Finanzas
        </span>
        <p className="text-xs text-stone-400 mt-0.5">Mau & Agos</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ screen, icon: Icon, label }) => {
          const isActive = activeScreen === screen;
          return (
            <button
              key={screen}
              type="button"
              onClick={() => onNavigate(screen)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-colors duration-150 text-left',
                isActive
                  ? 'bg-terracotta-50 text-terracotta-700'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
              )}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2 : 1.5}
                className={isActive ? 'text-terracotta-500' : 'text-stone-400'}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone-100">
        <p className="text-xs text-stone-300 font-mono">v2.0</p>
      </div>
    </aside>
  );
};
