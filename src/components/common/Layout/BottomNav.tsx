import { Home, CreditCard, ClipboardCheck, List } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { Screen } from '../../../types';

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  className?: string;
}

const NAV_ITEMS = [
  { screen: 'dashboard' as Screen,   icon: Home,           label: 'Inicio'      },
  { screen: 'tarjetas' as Screen,    icon: CreditCard,     label: 'Tarjetas'    },
  { screen: 'servicios' as Screen,   icon: ClipboardCheck, label: 'Servicios'   },
  { screen: 'movimientos' as Screen, icon: List,           label: 'Movimientos' },
] as const;

export const BottomNav = ({ activeScreen, onNavigate, className }: BottomNavProps) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-white border-t border-stone-200',
        'pb-safe',
        className
      )}
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ screen, icon: Icon, label }) => {
          const isActive = activeScreen === screen;
          return (
            <button
              key={screen}
              type="button"
              onClick={() => onNavigate(screen)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5',
                'transition-colors duration-150 relative',
                isActive ? 'text-terracotta-500' : 'text-stone-400 hover:text-stone-600'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-terracotta-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
