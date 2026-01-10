
import React, { useState } from 'react';
import { Home, CreditCard, ClipboardCheck, Plus } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CardsView from './components/CardsView';
import ServicesView from './components/ServicesView';
import Modal from './components/common/Modal';
import TransactionForm from './components/transactions/TransactionForm';
import { Screen } from './types';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard />;
      case 'cards': return <CardsView />;
      case 'services': return <ServicesView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-[#020617] relative overflow-hidden font-sans text-slate-50 selection:bg-indigo-500/30">
      {/* Background Decor - Animated */}
      <div className="fixed top-[-10%] left-[-20%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-5%] right-[-20%] w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Main Content Area */}
      <main className="flex-1 pb-28 overflow-y-auto custom-scrollbar px-5 pt-8 z-10 relative">
        {renderScreen()}
      </main>

      {/* FAB Button - Enhanced */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={() => setIsTransactionModalOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.4)] flex items-center justify-center transition-transform active:scale-90 border border-white/10"
          aria-label="Agregar Gasto"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Nueva Operación"
      >
        <TransactionForm onSuccess={() => setIsTransactionModalOpen(false)} />
      </Modal>

      {/* Navigation Bar - Glassmorphism & Active Glow */}
      <nav className="fixed bottom-4 left-4 right-4 max-w-[calc(28rem-2rem)] mx-auto bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl px-2 py-3 flex justify-around items-center z-40 shadow-2xl shadow-black/50">
        <NavItem
          active={activeScreen === 'dashboard'}
          onClick={() => setActiveScreen('dashboard')}
          icon={<Home size={22} />}
          label="Inicio"
        />
        <NavItem
          active={activeScreen === 'cards'}
          onClick={() => setActiveScreen('cards')}
          icon={<CreditCard size={22} />}
          label="Tarjetas"
        />
        <NavItem
          active={activeScreen === 'services'}
          onClick={() => setActiveScreen('services')}
          icon={<ClipboardCheck size={22} />}
          label="Servicios"
        />
      </nav>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className="relative flex flex-col items-center justify-center w-16 h-12 group"
  >
    {active && (
      <span className="absolute -top-3 w-8 h-1 bg-indigo-500 rounded-b-full shadow-[0_2px_10px_rgba(99,102,241,0.7)]"></span>
    )}
    <div className={`transition-all duration-300 ${active ? 'text-indigo-400 -translate-y-1' : 'text-slate-500 group-hover:text-slate-300'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-medium transition-all duration-300 ${active ? 'text-indigo-200 opacity-100' : 'text-slate-600 opacity-0 -translate-y-2'}`}>
      {label}
    </span>
  </button>
);

export default App;
