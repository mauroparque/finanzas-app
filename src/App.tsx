import { useState } from 'react';
import { Plus } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CardsView from './components/CardsView';
import ServicesView from './components/ServicesView';
import Modal from './components/common/Modal';
import TransactionForm from './components/transactions/TransactionForm';
import { BottomNav } from './components/common/Layout/BottomNav';
import { Sidebar } from './components/common/Layout/Sidebar';
import type { Screen } from './types';

const App = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':    return <Dashboard />;
      case 'tarjetas':     return <CardsView />;
      case 'servicios':    return <ServicesView onBack={() => setActiveScreen('dashboard')} />;
      case 'movimientos':  return <MovimientosPlaceholder />;
      case 'cotizaciones': return <CotizacionesPlaceholder />;
      case 'analisis':     return <AnalisisPlaceholder />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 pt-6 max-w-2xl mx-auto w-full custom-scrollbar">
          {renderScreen()}
        </main>

        <BottomNav
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          className="md:hidden"
        />
      </div>

      {/* FAB */}
      <div className="fixed bottom-20 right-5 z-50 md:bottom-8 md:right-8">
        <button
          onClick={() => setIsTransactionModalOpen(true)}
          className="w-14 h-14 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors duration-150 active:scale-95"
          aria-label="Agregar movimiento"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Nueva Operación"
      >
        <TransactionForm onSuccess={() => setIsTransactionModalOpen(false)} />
      </Modal>
    </div>
  );
};

const MovimientosPlaceholder = () => (
  <div className="flex flex-col items-center justify-center py-20 text-stone-400">
    <p className="text-sm">Movimientos — próximamente en Phase 3</p>
  </div>
);

const CotizacionesPlaceholder = () => (
  <div className="flex flex-col items-center justify-center py-20 text-stone-400">
    <p className="text-sm">Cotizaciones FX — próximamente en Phase 3</p>
  </div>
);

const AnalisisPlaceholder = () => (
  <div className="flex flex-col items-center justify-center py-20 text-stone-400">
    <p className="text-sm">Análisis — próximamente en Phase 3</p>
  </div>
);

export default App;
