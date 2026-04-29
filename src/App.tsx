import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { CardsView } from './components/CardsView';
import { ServicesView } from './components/ServicesView';
import { MovimientosView } from './components/MovimientosView';
import { CotizacionesView } from './components/CotizacionesView';
import { AnalisisView } from './components/AnalisisView';
import { Modal } from './components/common/Modal';
import { TransactionForm } from './components/transactions/TransactionForm';
import { BottomNav } from './components/common/Layout/BottomNav';
import { Sidebar } from './components/common/Layout/Sidebar';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './components/auth/LoginScreen';

const App = () => {
  const activeScreen = useUIStore(s => s.activeScreen);
  const setActiveScreen = useUIStore(s => s.setActiveScreen);
  const isTransactionFormOpen = useUIStore(s => s.isTransactionFormOpen);
  const openTransactionForm = useUIStore(s => s.openTransactionForm);
  const closeTransactionForm = useUIStore(s => s.closeTransactionForm);

  const session = useAuthStore(s => s.session);
  const hydrate = useAuthStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!session) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard />;
      case 'movimientos': return <MovimientosView />;
      case 'tarjetas': return <CardsView />;
      case 'servicios': return <ServicesView onBack={() => setActiveScreen('dashboard')} />;
      case 'cotizaciones': return <CotizacionesView />;
      case 'analisis': return <AnalisisView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <div className="flex-1 flex flex-col md:ml-64">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 px-4 pt-6 max-w-2xl mx-auto w-full">
          {renderScreen()}
        </main>
        <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-6 z-50 md:bottom-8 md:right-8">
        <button
          onClick={openTransactionForm}
          className="w-14 h-14 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90"
          aria-label="Agregar Gasto"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={isTransactionFormOpen}
        onClose={closeTransactionForm}
        title="Nueva Operación"
      >
        <TransactionForm onSuccess={closeTransactionForm} />
      </Modal>
    </div>
  );
};

export default App;
