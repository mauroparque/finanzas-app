import { Home, CreditCard, ClipboardCheck, TrendingUp, DollarSign, List } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import type { Screen } from '../../../types';

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const NAV_ITEMS: { screen: Screen; label: string; icon: ReactNode }[] = [
  { screen: 'dashboard', label: 'Inicio', icon: <Home size={20} /> },
  { screen: 'movimientos', label: 'Movimientos', icon: <List size={20} /> },
  { screen: 'tarjetas', label: 'Tarjetas', icon: <CreditCard size={20} /> },
  { screen: 'servicios', label: 'Servicios', icon: <ClipboardCheck size={20} /> },
  { screen: 'cotizaciones', label: 'Cotizaciones', icon: <DollarSign size={20} /> },
  { screen: 'analisis', label: 'Análisis', icon: <TrendingUp size={20} /> },
];

export function Sidebar({ activeScreen, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-stone-200">
      <div className="p-6">
        <h1 className="font-serif text-xl text-navy-800">Finanzas</h1>
        <p className="text-sm text-stone-400 mt-1">Mau & Agos</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ screen, label, icon }) => (
          <button
            key={screen}
            onClick={() => onNavigate(screen)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
              activeScreen === screen
                ? 'bg-terracotta-50 text-terracotta-700'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800',
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
