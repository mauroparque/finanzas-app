import { Home, CreditCard, ClipboardCheck, TrendingUp, DollarSign, List } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import type { Screen } from '../../../types';

interface NavItem {
  screen: Screen;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { screen: 'dashboard', label: 'Inicio', icon: <Home size={20} /> },
  { screen: 'movimientos', label: 'Movimientos', icon: <List size={20} /> },
  { screen: 'tarjetas', label: 'Tarjetas', icon: <CreditCard size={20} /> },
  { screen: 'servicios', label: 'Servicios', icon: <ClipboardCheck size={20} /> },
  { screen: 'cotizaciones', label: 'Cotizaciones', icon: <DollarSign size={20} /> },
  { screen: 'analisis', label: 'Análisis', icon: <TrendingUp size={20} /> },
];

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 pb-safe md:hidden">
      <ul className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ screen, label, icon }) => (
          <li key={screen}>
            <button
              onClick={() => onNavigate(screen)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors duration-150',
                activeScreen === screen
                  ? 'text-terracotta-600'
                  : 'text-stone-400 hover:text-stone-600',
              )}
              aria-label={label}
            >
              {icon}
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
