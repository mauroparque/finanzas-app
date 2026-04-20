import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LayoutDashboard, Receipt, PieChart as PieIcon, CreditCard, TrendingUp, Home, Plus, Search, ArrowRight, ArrowUp, ArrowDown, Target, AlertCircle, Check, X, Repeat, Zap, ChevronRight, MoreHorizontal, Wallet, Smartphone, Building2, Send, Sparkles, Settings, Calendar, ArrowDownRight } from 'lucide-react';

// ==================== DESIGN TOKENS ====================
const C = {
  cream: '#f4f1ea', creamWarm: '#ede7da', creamLight: '#faf7ef',
  ink: '#1a1a1a', inkSoft: '#3d3833', muted: '#6b6257', muted2: '#9a9087',
  line: '#d4cec2', lineSoft: '#e4decf',
  terracotta: '#8b3a2b', terracottaSoft: '#c47a64',
  ochre: '#b8862f', forest: '#3d6b4f', forestSoft: '#6f9277',
  rust: '#a8342a', blueInk: '#2c4758', plum: '#6b3e5c',
};
const T = {
  display: `'Fraunces', Georgia, serif`,
  body: `'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif`,
  mono: `'IBM Plex Mono', ui-monospace, monospace`,
};

// ==================== TAXONOMÍA ====================
const MACROS = {
  VIVIR:     { label: 'Vivir',     color: C.forest,  desc: 'Base vital',        budget: 900000 },
  TRABAJAR:  { label: 'Trabajar',  color: C.blueInk, desc: 'Profesional',       budget: 250000 },
  DEBER:     { label: 'Deber',     color: C.rust,    desc: 'Obligaciones',      budget: 1450000 },
  DISFRUTAR: { label: 'Disfrutar', color: C.ochre,   desc: 'Calidad de vida',   budget: 150000 },
};
const SUBCATS = {
  VIVIR:     ['Abastecimiento', 'Servicios', 'Animales', 'Transporte', 'Salud'],
  TRABAJAR:  ['Monotributo', 'Suscripciones', 'Formación', 'Honorarios'],
  DEBER:     ['Alquiler', 'Préstamos', 'Tarjetas', 'Impuestos', 'Seguros'],
  DISFRUTAR: ['Ocio', 'Delivery', 'Regalos', 'Hogar', 'Viajes'],
};
const UNITS = {
  HOGAR:       { label: 'Hogar',       sub: 'Alta Gracia',      color: C.terracotta },
  BRASIL:      { label: 'Brasil',      sub: 'Balneário · USDT', color: C.blueInk },
  PROFESIONAL: { label: 'Profesional', sub: 'Consulta',         color: C.forest },
};

// ==================== SEED DATA ====================
const seedCashAccounts = [
  { id: 'efectivo', name: 'Efectivo',   balance: 17000,  icon: 'wallet' },
  { id: 'mp_mau',   name: 'MP Mau',     balance: 5861,   icon: 'phone' },
  { id: 'mp_agos',  name: 'MP Agos',    balance: 12500,  icon: 'phone' },
  { id: 'bna_mau',  name: 'BNA Mau',    balance: 150000, icon: 'bank' },
  { id: 'bna_agos', name: 'BNA Agos',   balance: 80000,  icon: 'bank' },
];

const seedCards = [
  { id: 'bbva',    name: 'BBVA Visa',  current: 58170,  nextMonth: 21170,  trend: -64,  installments: 2,  dueDate: 16 },
  { id: 'master',  name: 'BNA Master', current: 470134, nextMonth: 364686, trend: -22,  installments: 12, dueDate: 12 },
  { id: 'bnavisa', name: 'BNA Visa',   current: 17999,  nextMonth: 0,      trend: -100, installments: 0,  dueDate: 15 },
];

const PAYMENT_METHODS = [
  { id: 'cash',          label: 'Efectivo',       account: 'efectivo', icon: Wallet },
  { id: 'debit_mp_mau',  label: 'MP Mau',         account: 'mp_mau',   icon: Smartphone },
  { id: 'debit_mp_agos', label: 'MP Agos',        account: 'mp_agos',  icon: Smartphone },
  { id: 'debit_bna_mau', label: 'BNA Mau (déb.)', account: 'bna_mau',  icon: Building2 },
  { id: 'debit_bna_agos',label: 'BNA Agos (déb.)',account: 'bna_agos', icon: Building2 },
  { id: 'transfer',      label: 'Transferencia',  account: 'bna_mau',  icon: Send },
  { id: 'credit',        label: 'Tarjeta crédito',account: null,       icon: CreditCard },
];

const seedTransactions = [
  { id: 1,  date: '2026-04-16', concept: 'Alquiler abril',   amount: 798700, macro: 'DEBER', sub: 'Alquiler', unit: 'HOGAR', method: 'transfer', cardId: null, installments: 1 },
  { id: 2,  date: '2026-04-14', concept: 'Becerra',          amount: 96707,  macro: 'VIVIR', sub: 'Abastecimiento', unit: 'HOGAR', method: 'debit_mp_mau', cardId: null, installments: 1 },
  { id: 3,  date: '2026-04-14', concept: 'Pollo barf 15kg',  amount: 301500, macro: 'VIVIR', sub: 'Animales', unit: 'HOGAR', method: 'cash', cardId: null, installments: 1 },
  { id: 4,  date: '2026-04-13', concept: 'Gatos comida',     amount: 79000,  macro: 'VIVIR', sub: 'Animales', unit: 'HOGAR', method: 'cash', cardId: null, installments: 1 },
  { id: 5,  date: '2026-04-12', concept: 'EPEC',             amount: 58302,  macro: 'VIVIR', sub: 'Servicios', unit: 'HOGAR', method: 'debit_bna_mau', cardId: null, installments: 1 },
  { id: 6,  date: '2026-04-12', concept: 'Cooperativa agua', amount: 50554,  macro: 'VIVIR', sub: 'Servicios', unit: 'HOGAR', method: 'debit_bna_mau', cardId: null, installments: 1 },
  { id: 7,  date: '2026-04-11', concept: 'Personal',         amount: 70131,  macro: 'VIVIR', sub: 'Servicios', unit: 'HOGAR', method: 'debit_bna_mau', cardId: null, installments: 1 },
  { id: 8,  date: '2026-04-10', concept: 'MT Mau',           amount: 42386,  macro: 'TRABAJAR', sub: 'Monotributo', unit: 'PROFESIONAL', method: 'debit_bna_mau', cardId: null, installments: 1 },
  { id: 9,  date: '2026-04-10', concept: 'MT Agos',          amount: 37606,  macro: 'TRABAJAR', sub: 'Monotributo', unit: 'PROFESIONAL', method: 'debit_bna_agos', cardId: null, installments: 1 },
  { id: 10, date: '2026-04-10', concept: 'Claude Pro',       amount: 17999,  macro: 'TRABAJAR', sub: 'Suscripciones', unit: 'PROFESIONAL', method: 'credit', cardId: 'bbva', installments: 1 },
  { id: 11, date: '2026-04-09', concept: 'Porro',            amount: 60000,  macro: 'DISFRUTAR', sub: 'Ocio', unit: 'HOGAR', method: 'cash', cardId: null, installments: 1 },
  { id: 12, date: '2026-04-08', concept: 'Regalo Zeke',      amount: 17000,  macro: 'DISFRUTAR', sub: 'Regalos', unit: 'HOGAR', method: 'cash', cardId: null, installments: 1 },
  { id: 13, date: '2026-04-05', concept: 'Nafta',            amount: 64370,  macro: 'VIVIR', sub: 'Transporte', unit: 'HOGAR', method: 'credit', cardId: 'bbva', installments: 1 },
  { id: 14, date: '2026-04-03', concept: 'Delivery sushi',   amount: 28000,  macro: 'DISFRUTAR', sub: 'Delivery', unit: 'HOGAR', method: 'debit_mp_mau', cardId: null, installments: 1 },
  { id: 15, date: '2026-04-02', concept: 'Préstamo BNA',     amount: 150539, macro: 'DEBER', sub: 'Préstamos', unit: 'HOGAR', method: 'debit_bna_mau', cardId: null, installments: 1 },
  { id: 16, date: '2026-04-02', concept: 'ANSES',            amount: 54289,  macro: 'DEBER', sub: 'Préstamos', unit: 'HOGAR', method: 'debit_bna_mau', cardId: null, installments: 1 },
  { id: 17, date: '2026-04-01', concept: 'Honorarios Mau',   amount: 1520000, macro: null, sub: null, unit: 'PROFESIONAL', method: 'transfer', cardId: null, installments: 1, isIncome: true },
  { id: 18, date: '2026-04-01', concept: 'Honorarios Agos',  amount: 1520870, macro: null, sub: null, unit: 'PROFESIONAL', method: 'transfer', cardId: null, installments: 1, isIncome: true },
];

const seedDebts = [
  { id: 1, name: 'Préstamo BNA',  installment: '19/36', remaining: 18, amount: 2577608, monthly: 150539, endDate: 'oct 2027', progress: 53 },
  { id: 2, name: 'ANSES',         installment: '27/36', remaining: 10, amount: 542089,  monthly: 54289,  endDate: 'feb 2027', progress: 75 },
  { id: 3, name: 'PF 2261551771', installment: '7/12',  remaining: 6,  amount: 88215,   monthly: 14702,  endDate: 'jul 2026', progress: 58 },
  { id: 4, name: 'PF 1753009581', installment: '4/9',   remaining: 6,  amount: 87185,   monthly: 14530,  endDate: 'sep 2026', progress: 44 },
];

const seedGoals = [
  { id: 1, name: 'Colchón de emergencia',    target: 4000000, current: 450000, icon: '🛡️', deadline: '2027-12-31', monthlyPace: 180000 },
  { id: 2, name: 'Pasaporte + traducciones', target: 800000,  current: 120000, icon: '🇩🇪', deadline: '2026-12-31', monthlyPace: 80000 },
  { id: 3, name: 'Inversión Balneário',      target: 3500000, current: 850000, icon: '🇧🇷', deadline: '2027-06-30', monthlyPace: 200000 },
  { id: 4, name: 'Doctorado Alemania',       target: 5000000, current: 0,      icon: '🎓', deadline: '2028-06-30', monthlyPace: 150000 },
];

const seedRecurring = [
  { id: 1,  concept: 'Alquiler',           amount: 957661, day: 5,  macro: 'DEBER',    sub: 'Alquiler',     method: 'transfer',     unit: 'HOGAR',       active: true },
  { id: 2,  concept: 'EPEC',               amount: 45000,  day: 10, macro: 'VIVIR',    sub: 'Servicios',    method: 'debit_bna_mau',unit: 'HOGAR',       active: true },
  { id: 3,  concept: 'Cooperativa',        amount: 55000,  day: 12, macro: 'VIVIR',    sub: 'Servicios',    method: 'debit_bna_mau',unit: 'HOGAR',       active: true },
  { id: 4,  concept: 'Personal',           amount: 70131,  day: 15, macro: 'VIVIR',    sub: 'Servicios',    method: 'debit_bna_mau',unit: 'HOGAR',       active: true },
  { id: 5,  concept: 'MT Mau',             amount: 42386,  day: 20, macro: 'TRABAJAR', sub: 'Monotributo',  method: 'debit_bna_mau',unit: 'PROFESIONAL', active: true },
  { id: 6,  concept: 'MT Agos',            amount: 37606,  day: 20, macro: 'TRABAJAR', sub: 'Monotributo',  method: 'debit_bna_agos',unit: 'PROFESIONAL',active: true },
  { id: 7,  concept: 'Claude Pro + Cursor', amount: 17999, day: 10, macro: 'TRABAJAR', sub: 'Suscripciones', method: 'credit',      unit: 'PROFESIONAL', active: true },
  { id: 8,  concept: 'Pollo barf',         amount: 301500, day: 14, macro: 'VIVIR',    sub: 'Animales',     method: 'cash',         unit: 'HOGAR',       active: true },
  { id: 9,  concept: 'Gatos comida',       amount: 79000,  day: 14, macro: 'VIVIR',    sub: 'Animales',     method: 'cash',         unit: 'HOGAR',       active: true },
  { id: 10, concept: 'Préstamo BNA',       amount: 149771, day: 16, macro: 'DEBER',    sub: 'Préstamos',    method: 'debit_bna_mau',unit: 'HOGAR',       active: true },
  { id: 11, concept: 'ANSES',              amount: 54289,  day: 16, macro: 'DEBER',    sub: 'Préstamos',    method: 'debit_bna_mau',unit: 'HOGAR',       active: true },
  { id: 12, concept: 'Sancor Seguros',     amount: 62000,  day: 1,  macro: 'DEBER',    sub: 'Seguros',      method: 'credit',       unit: 'HOGAR',       active: true },
];

const seedRules = [
  { id: 1,  keywords: ['nafta', 'combustible', 'ypf', 'shell'], macro: 'VIVIR', sub: 'Transporte' },
  { id: 2,  keywords: ['epec', 'luz'],                          macro: 'VIVIR', sub: 'Servicios' },
  { id: 3,  keywords: ['cooperativa', 'agua'],                  macro: 'VIVIR', sub: 'Servicios' },
  { id: 4,  keywords: ['personal', 'telefon', 'internet'],      macro: 'VIVIR', sub: 'Servicios' },
  { id: 5,  keywords: ['delivery', 'pedidos ya', 'rappi'],      macro: 'DISFRUTAR', sub: 'Delivery' },
  { id: 6,  keywords: ['becerra', 'verduler', 'carnicer', 'queser', 'pescader'], macro: 'VIVIR', sub: 'Abastecimiento' },
  { id: 7,  keywords: ['pollo', 'barf', 'bocantino'],           macro: 'VIVIR', sub: 'Animales' },
  { id: 8,  keywords: ['gato', 'gatos', 'antiparasitari'],      macro: 'VIVIR', sub: 'Animales' },
  { id: 9,  keywords: ['monotributo', 'mt mau', 'mt agos'],     macro: 'TRABAJAR', sub: 'Monotributo' },
  { id: 10, keywords: ['claude', 'cursor', 'subscrip', 'chatgpt'], macro: 'TRABAJAR', sub: 'Suscripciones' },
  { id: 11, keywords: ['alquiler'],                             macro: 'DEBER', sub: 'Alquiler' },
  { id: 12, keywords: ['regalo'],                               macro: 'DISFRUTAR', sub: 'Regalos' },
  { id: 13, keywords: ['seguro', 'sancor'],                     macro: 'DEBER', sub: 'Seguros' },
  { id: 14, keywords: ['porro'],                                macro: 'DISFRUTAR', sub: 'Ocio' },
];

const historyData = [
  { mes: 'Nov 25', ingresos: 2960, gastos: 2731, saldo: 229 },
  { mes: 'Dic 25', ingresos: 3457, gastos: 3454, saldo: 2 },
  { mes: 'Ene 26', ingresos: 2882, gastos: 3190, saldo: -308 },
  { mes: 'Feb 26', ingresos: 1947, gastos: 3294, saldo: -1347 },
  { mes: 'Mar 26', ingresos: 2500, gastos: 2787, saldo: -287 },
  { mes: 'Abr 26', ingresos: 3041, gastos: 2878, saldo: 163 },
];

// ==================== UTILS ====================
const fmtARS = (n) => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1000000) return `${sign}$${(abs/1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${sign}$${Math.round(abs/1000)}K`;
  return `${sign}$${Math.round(abs)}`;
};
const fmtFull = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

const suggestFromRules = (concept, rules) => {
  if (!concept || concept.length < 3) return null;
  const low = concept.toLowerCase();
  for (const r of rules) {
    if (r.keywords.some(k => low.includes(k))) return { macro: r.macro, sub: r.sub };
  }
  return null;
};

// ==================== MAIN APP ====================
export default function Cauce() {
  const [view, setView] = useState('dashboard');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [transactions, setTransactions] = useState(seedTransactions);
  const [cards, setCards] = useState(seedCards);
  const [cashAccounts, setCashAccounts] = useState(seedCashAccounts);
  const [goals, setGoals] = useState(seedGoals);
  const [recurring, setRecurring] = useState(seedRecurring);
  const [rules, setRules] = useState(seedRules);
  const [modal, setModal] = useState(null);
  const [modalCtx, setModalCtx] = useState(null);
  const [query, setQuery] = useState('');
  const [macroFilter, setMacroFilter] = useState('ALL');

  // ========== DERIVED ==========
  const filteredTx = useMemo(() => transactions.filter(t => {
    if (unitFilter !== 'ALL' && t.unit !== unitFilter) return false;
    if (macroFilter !== 'ALL' && t.macro !== macroFilter) return false;
    if (query && !t.concept.toLowerCase().includes(query.toLowerCase())) return false;
    return !t.isPayment; // los pagos de tarjeta no aparecen en transacciones regulares
  }), [transactions, unitFilter, macroFilter, query]);

  const currentMonth = useMemo(() => {
    const filtered = transactions.filter(t => !t.isPayment && (unitFilter === 'ALL' || t.unit === unitFilter));
    const expenses = filtered.filter(t => !t.isIncome);
    const incomes  = filtered.filter(t => t.isIncome);
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    const totalInc = incomes.reduce((s, t) => s + t.amount, 0);
    return { expenses: totalExp, income: totalInc, saldo: totalInc - totalExp, txCount: expenses.length, avgTx: expenses.length ? totalExp / expenses.length : 0 };
  }, [transactions, unitFilter]);

  const byMacro = useMemo(() => {
    const m = { VIVIR: 0, TRABAJAR: 0, DEBER: 0, DISFRUTAR: 0 };
    transactions.forEach(t => {
      if (t.isIncome || t.isPayment) return;
      if (unitFilter !== 'ALL' && t.unit !== unitFilter) return;
      if (t.macro) m[t.macro] = (m[t.macro] || 0) + t.amount;
    });
    return m;
  }, [transactions, unitFilter]);

  const totalCash = cashAccounts.reduce((s, a) => s + a.balance, 0);
  const totalDebts = seedDebts.reduce((s, d) => s + d.amount, 0);
  const totalMonthlyDebt = seedDebts.reduce((s, d) => s + d.monthly, 0);

  // ========== ACTIONS ==========
  const addTransaction = (tx) => {
    const newTx = { ...tx, id: Date.now(), isIncome: false, isPayment: false };
    setTransactions([newTx, ...transactions]);
    // Efectos de caja
    if (tx.method === 'credit' && tx.cardId) {
      setCards(cards.map(c => c.id === tx.cardId ? { ...c, current: c.current + tx.amount } : c));
    } else {
      const m = PAYMENT_METHODS.find(p => p.id === tx.method);
      if (m && m.account) {
        setCashAccounts(cashAccounts.map(a => a.id === m.account ? { ...a, balance: a.balance - tx.amount } : a));
      }
    }
    setModal(null);
  };

  const payCard = ({ cardId, amount, fromAccount }) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    setCards(cards.map(c => c.id === cardId ? { ...c, current: Math.max(0, c.current - amount) } : c));
    setCashAccounts(cashAccounts.map(a => a.id === fromAccount ? { ...a, balance: a.balance - amount } : a));
    const payTx = {
      id: Date.now(), date: new Date().toISOString().split('T')[0],
      concept: `Pago ${card.name}`, amount, macro: null, sub: null,
      unit: 'HOGAR', method: fromAccount, cardId, installments: 1,
      isPayment: true,
    };
    setTransactions([payTx, ...transactions]);
    setModal(null);
  };

  // ========== RENDER ==========
  return (
    <div style={{ background: C.cream, minHeight: '100vh', fontFamily: T.body, color: C.ink, display: 'grid', gridTemplateColumns: '260px 1fr' }}>
      <Sidebar view={view} setView={setView} unitFilter={unitFilter} setUnitFilter={setUnitFilter} onQuickAdd={() => setModal('add-tx')} />
      <main style={{ padding: '28px 36px 60px', maxWidth: 1100 }}>
        {view === 'dashboard'    && <Dashboard data={currentMonth} byMacro={byMacro} transactions={transactions.filter(t => !t.isPayment && (unitFilter === 'ALL' || t.unit === unitFilter)).slice(0, 6)} unitFilter={unitFilter} cashAccounts={cashAccounts} totalCash={totalCash} goals={goals} />}
        {view === 'transactions' && <Transactions tx={filteredTx} query={query} setQuery={setQuery} macroFilter={macroFilter} setMacroFilter={setMacroFilter} onOpenAdd={() => setModal('add-tx')} onOpenRules={() => setModal('rules')} />}
        {view === 'macros'       && <MacrosView byMacro={byMacro} tx={transactions.filter(t => !t.isPayment && (unitFilter === 'ALL' || t.unit === unitFilter))} />}
        {view === 'debts'        && <DebtsView debts={seedDebts} cards={cards} totalDebts={totalDebts} totalMonthlyDebt={totalMonthlyDebt} onPayCard={(c) => { setModalCtx({ card: c }); setModal('pay-card'); }} />}
        {view === 'goals'        && <GoalsView goals={goals} setGoals={setGoals} totalCash={totalCash} />}
        {view === 'recurring'    && <RecurringView recurring={recurring} setRecurring={setRecurring} />}
        {view === 'projection'   && <Projection />}
        {view === 'units'        && <UnitsView tx={transactions.filter(t => !t.isPayment)} />}
      </main>

      {modal === 'add-tx'   && <AddTxModal onClose={() => setModal(null)} onSave={addTransaction} cards={cards} rules={rules} />}
      {modal === 'pay-card' && <PayCardModal card={modalCtx?.card} cashAccounts={cashAccounts} onClose={() => setModal(null)} onSave={payCard} />}
      {modal === 'rules'    && <RulesModal rules={rules} setRules={setRules} onClose={() => setModal(null)} />}
    </div>
  );
}

// ==================== SIDEBAR ====================
function Sidebar({ view, setView, unitFilter, setUnitFilter, onQuickAdd }) {
  return (
    <aside style={{ background: C.creamLight, borderRight: `1px solid ${C.line}`, padding: '24px 0', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '0 24px 24px', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.terracotta, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-6deg)' }}>
            <span style={{ fontFamily: T.display, fontStyle: 'italic', color: C.cream, fontSize: 20, fontWeight: 500 }}>c</span>
          </div>
          <div>
            <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>Cauce</div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: C.muted, letterSpacing: '0.12em' }}>FINANZAS · V0.2</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '18px 16px' }}>
        <NavSection title="PRINCIPAL" />
        <NavBtn active={view === 'dashboard'}    onClick={() => setView('dashboard')}    icon={LayoutDashboard} label="Dashboard" />
        <NavBtn active={view === 'transactions'} onClick={() => setView('transactions')} icon={Receipt}         label="Transacciones" />
        <NavBtn active={view === 'macros'}       onClick={() => setView('macros')}       icon={PieIcon}         label="Taxonomía" />

        <NavSection title="DINERO" />
        <NavBtn active={view === 'debts'}     onClick={() => setView('debts')}     icon={CreditCard}  label="Deudas y tarjetas" />
        <NavBtn active={view === 'goals'}     onClick={() => setView('goals')}     icon={Target}      label="Metas" />
        <NavBtn active={view === 'recurring'} onClick={() => setView('recurring')} icon={Repeat}      label="Recurrentes" />

        <NavSection title="ANÁLISIS" />
        <NavBtn active={view === 'projection'} onClick={() => setView('projection')} icon={TrendingUp} label="Proyección" />
        <NavBtn active={view === 'units'}      onClick={() => setView('units')}      icon={Home}       label="Unidades" />

        <NavSection title="UNIDAD ACTIVA" />
        {[{ id: 'ALL', label: 'Todas', sub: 'Consolidado' }, ...Object.entries(UNITS).map(([k, v]) => ({ id: k, label: v.label, sub: v.sub, color: v.color }))].map(u => (
          <button key={u.id} onClick={() => setUnitFilter(u.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '8px 12px', border: 'none',
            background: unitFilter === u.id ? C.creamWarm : 'transparent',
            color: unitFilter === u.id ? C.ink : C.inkSoft,
            fontFamily: T.body, cursor: 'pointer', marginBottom: 2,
            borderLeft: `2px solid ${unitFilter === u.id ? (u.color || C.ink) : 'transparent'}`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 8, background: u.color || C.muted2, border: u.color ? 'none' : `1px solid ${C.muted2}` }} />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{u.label}</div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: T.mono }}>{u.sub}</div>
            </div>
          </button>
        ))}
      </nav>

      <div style={{ padding: '12px 16px 0', marginTop: 12, borderTop: `1px solid ${C.line}` }}>
        <button onClick={onQuickAdd} style={{ width: '100%', background: C.ink, color: C.cream, border: 'none', padding: '12px 14px', fontFamily: T.body, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <Plus size={16} strokeWidth={2} /> Agregar transacción
        </button>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.4 }}>
          Vía Telegram → <span style={{ fontFamily: T.mono, color: C.terracotta }}>/gasto 80k delivery</span>
        </div>
      </div>
    </aside>
  );
}
function NavSection({ title }) { return <div style={{ fontFamily: T.mono, fontSize: 9, color: C.muted, letterSpacing: '0.16em', padding: '14px 8px 6px' }}>{title}</div>; }
function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '9px 12px', border: 'none',
      background: active ? C.creamWarm : 'transparent',
      color: active ? C.ink : C.inkSoft,
      fontFamily: T.body, fontSize: 13, fontWeight: active ? 500 : 400,
      cursor: 'pointer', textAlign: 'left',
      borderLeft: `2px solid ${active ? C.terracotta : 'transparent'}`,
      marginBottom: 1,
    }}>
      <Icon size={15} strokeWidth={1.5} />
      <span>{label}</span>
    </button>
  );
}

// ==================== DASHBOARD ====================
function Dashboard({ data, byMacro, transactions, unitFilter, cashAccounts, totalCash, goals }) {
  const topGoal = goals[0];
  const budgetStatus = Object.entries(MACROS).map(([k, v]) => ({
    key: k, label: v.label, color: v.color,
    spent: byMacro[k] || 0, budget: v.budget,
    pct: ((byMacro[k] || 0) / v.budget) * 100,
  }));

  return (
    <div>
      <PageHeader eyebrow={`DASHBOARD · ABRIL 2026 · ${unitFilter === 'ALL' ? 'CONSOLIDADO' : UNITS[unitFilter].label.toUpperCase()}`} title={<><em>Hola, Mauro.</em> Acá está tu mes.</>} />

      {/* Cash position */}
      <div style={{ marginBottom: 24 }}>
        <CardHeader caption="POSICIÓN DE CAJA" title={`Disponible ahora: ${fmtARS(totalCash)}`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {cashAccounts.map(a => <CashTile key={a.id} a={a} />)}
        </div>
      </div>

      {/* KPIs mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${C.line}`, borderRight: 'none', borderBottom: 'none', marginBottom: 28 }}>
        <KPI label="Ingresos del mes" value={fmtARS(data.income)}   sub={`${transactions.filter(t => t.isIncome).length} entradas`} />
        <KPI label="Gastos del mes"   value={fmtARS(data.expenses)} sub={`${data.txCount} movimientos`} />
        <KPI label="Saldo"            value={fmtARS(data.saldo)}    sub={data.saldo >= 0 ? 'Positivo' : 'En rojo'} tone={data.saldo >= 0 ? 'success' : 'danger'} />
        <KPI label="Gasto promedio"   value={fmtARS(data.avgTx)}    sub="por transacción" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, marginBottom: 24 }}>
        <Card><CardHeader caption="SALUD FINANCIERA" title="Indicador del mes" /><HealthScore income={data.income} expenses={data.expenses} /></Card>
        <Card>
          <CardHeader caption="ÚLTIMOS 6 MESES" title="Ingresos vs. gastos" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={historyData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.lineSoft} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fontFamily: T.mono, fill: C.muted2 }} stroke={C.line} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: C.muted2 }} stroke={C.line} tickFormatter={v => v + 'K'} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => `$${v}K`} />
              <ReferenceLine y={0} stroke={C.rust} strokeDasharray="2 2" />
              <Line type="monotone" dataKey="ingresos" stroke={C.forest} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="gastos"   stroke={C.terracotta} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="saldo"    stroke={C.ochre} strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top meta */}
      {topGoal && (
        <Card style={{ marginBottom: 24 }}>
          <CardHeader caption="META PRINCIPAL" title={<span>{topGoal.icon} {topGoal.name}</span>} action={<button style={linkBtn}>Ver todas <ArrowRight size={12}/></button>} />
          <GoalProgress g={topGoal} />
        </Card>
      )}

      <Card style={{ marginBottom: 24 }}>
        <CardHeader caption="PRESUPUESTO POR MACRO" title="¿Cómo vas contra tus topes?" action={<button style={linkBtn}>Editar topes <ArrowRight size={12}/></button>} />
        {budgetStatus.map(b => <BudgetRow key={b.key} data={b} />)}
      </Card>

      <div style={{ marginBottom: 24 }}>
        <CardHeader caption="ALERTAS ACTIVAS" title="Tu radar" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Alert tone="warn"    title="Ocio sin registro"       desc="Falta categorizar ~$115K/mes en delivery y salidas." />
          <Alert tone="info"    title="PFs chicos terminan"     desc="PF 2261551771 cierra en julio. Libera $14.702/mes." />
          <Alert tone="success" title="Tarjetas bajando"        desc="BNA Master cae 22% el próximo ciclo." />
        </div>
      </div>

      <Card>
        <CardHeader caption="ÚLTIMOS MOVIMIENTOS" title="Actividad reciente" action={<button style={linkBtn}>Ver todos <ArrowRight size={12}/></button>} />
        {transactions.map(t => <TxRow key={t.id} t={t} />)}
      </Card>
    </div>
  );
}

function CashTile({ a }) {
  const IconMap = { wallet: Wallet, phone: Smartphone, bank: Building2 };
  const Icon = IconMap[a.icon];
  return (
    <div style={{ padding: '14px 12px', background: C.creamLight, border: `1px solid ${C.line}`, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: C.muted }}>
        <Icon size={13} strokeWidth={1.5} />
        <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em' }}>{a.name.toUpperCase()}</span>
      </div>
      <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 500, color: a.balance < 0 ? C.rust : C.ink }}>{fmtARS(a.balance)}</div>
    </div>
  );
}

function HealthScore({ income, expenses }) {
  const ratio = income ? expenses / income : 1;
  let score, color, label, desc;
  if (ratio > 1)       { score = 30; color = C.rust;   label = 'Déficit';   desc = 'Estás gastando más de lo que ingresa este mes.'; }
  else if (ratio > 0.95) { score = 55; color = C.ochre;  label = 'Ajustado';  desc = 'Margen muy fino. Un imprevisto te pone en rojo.'; }
  else if (ratio > 0.85) { score = 72; color = C.ochre;  label = 'Estable';   desc = 'Margen modesto. Hay lugar para ajustar.'; }
  else                   { score = 88; color = C.forest; label = 'Saludable'; desc = 'Buen margen de ahorro este mes.'; }
  return (
    <div>
      <div style={{ position: 'relative', width: 140, height: 140, margin: '8px auto 16px' }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="58" fill="none" stroke={C.lineSoft} strokeWidth="10" />
          <circle cx="70" cy="70" r="58" fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${(score/100) * 364.4} 364.4`} strokeLinecap="round" transform="rotate(-90 70 70)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: T.display, fontSize: 36, fontWeight: 500, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted, marginTop: 2, letterSpacing: '0.1em' }}>/ 100</div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: T.display, fontSize: 18, color, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, maxWidth: 240, margin: '0 auto' }}>{desc}</div>
      </div>
    </div>
  );
}

function BudgetRow({ data }) {
  const pct = Math.min(data.pct, 100);
  const overflow = data.pct > 100;
  const danger = data.pct > 85;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '14px 100px 1fr auto', gap: 16, alignItems: 'center', padding: '14px 4px', borderBottom: `1px solid ${C.lineSoft}` }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: data.color }} />
      <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500 }}>{data.label}</div>
      <div>
        <div style={{ background: C.creamWarm, height: 6, position: 'relative', borderRadius: 1 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: danger ? C.rust : data.color, borderRadius: 1 }} />
          {overflow && <div style={{ position: 'absolute', top: -2, right: -2, bottom: -2, width: 4, background: C.rust }}/>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 10, color: C.muted, marginTop: 4 }}>
          <span>{fmtFull(data.spent)}</span>
          <span style={{ color: danger ? C.rust : C.muted }}>{data.pct.toFixed(0)}% de {fmtFull(data.budget)}</span>
        </div>
      </div>
      <ChevronRight size={14} color={C.muted2} />
    </div>
  );
}

// ==================== TRANSACTIONS ====================
function Transactions({ tx, query, setQuery, macroFilter, setMacroFilter, onOpenAdd, onOpenRules }) {
  const sorted = [...tx].sort((a, b) => b.date.localeCompare(a.date));
  const totals = sorted.reduce((acc, t) => { if (t.isIncome) acc.income += t.amount; else acc.expense += t.amount; return acc; }, { income: 0, expense: 0 });
  const byDate = {};
  sorted.forEach(t => { (byDate[t.date] = byDate[t.date] || []).push(t); });

  return (
    <div>
      <PageHeader eyebrow="TRANSACCIONES" title={<>Todo lo que <em>pasa por el cauce.</em></>} action={
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onOpenRules} style={secondaryBtn}><Sparkles size={13} /> Reglas</button>
          <button onClick={onOpenAdd} style={primaryBtn}><Plus size={14} /> Nueva</button>
        </div>
      }/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${C.line}`, borderRight: 'none', borderBottom: 'none', marginBottom: 20 }}>
        <KPI label="Ingresos (listados)" value={fmtARS(totals.income)}  sub={`${tx.filter(t => t.isIncome).length} registros`} />
        <KPI label="Gastos (listados)"   value={fmtARS(totals.expense)} sub={`${tx.filter(t => !t.isIncome).length} registros`} />
        <KPI label="Neto listado"        value={fmtARS(totals.income - totals.expense)} tone={totals.income >= totals.expense ? 'success' : 'danger'} sub="aplicando filtros" />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted2 }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar concepto…" style={{ width: '100%', padding: '10px 14px 10px 36px', background: C.creamLight, border: `1px solid ${C.line}`, fontFamily: T.body, fontSize: 13, outline: 'none' }} />
        </div>
        {['ALL', 'VIVIR', 'TRABAJAR', 'DEBER', 'DISFRUTAR'].map(m => (
          <button key={m} onClick={() => setMacroFilter(m)} style={{ padding: '8px 14px', border: `1px solid ${macroFilter === m ? C.ink : C.line}`, background: macroFilter === m ? C.ink : 'transparent', color: macroFilter === m ? C.cream : C.inkSoft, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer' }}>{m === 'ALL' ? 'TODAS' : m}</button>
        ))}
      </div>
      <Card>
        {Object.keys(byDate).length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>Sin transacciones para este filtro.</div>
        ) : (
          Object.entries(byDate).map(([date, txs]) => (
            <div key={date}>
              <div style={{ padding: '14px 4px 8px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', color: C.muted }}>{fmtDate(date).toUpperCase()}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted2 }}>{txs.length} mov.</div>
              </div>
              {txs.map(t => <TxRow key={t.id} t={t} />)}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

function TxRow({ t }) {
  const macroColor = t.macro ? MACROS[t.macro].color : (t.isIncome ? C.forest : C.muted);
  const unitColor = t.unit ? UNITS[t.unit].color : C.muted;
  const methodLabel = PAYMENT_METHODS.find(m => m.id === t.method)?.label || t.method;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto auto', gap: 14, alignItems: 'center', padding: '14px 4px', borderBottom: `1px solid ${C.lineSoft}`, cursor: 'pointer' }}>
      <div style={{ width: 3, height: 26, background: macroColor, borderRadius: 1 }} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500 }}>{t.concept}</span>
          {t.installments > 1 && (
            <span style={{ fontFamily: T.mono, fontSize: 9, color: C.terracotta, padding: '2px 5px', background: 'rgba(139,58,43,0.08)', borderRadius: 2 }}>
              {t.installments} CUOTAS
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.mono, fontSize: 10, color: C.muted, flexWrap: 'wrap' }}>
          {t.macro && <span>{t.macro} · {t.sub}</span>}
          {t.isIncome && <span style={{ color: C.forest }}>INGRESO</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>· {methodLabel}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: unitColor }} />
            {UNITS[t.unit]?.label || t.unit}
          </span>
        </div>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: t.isIncome ? C.forest : C.ink }}>
        {t.isIncome ? '+' : '-'}{fmtFull(t.amount)}
      </div>
      <MoreHorizontal size={14} color={C.muted2} />
    </div>
  );
}

// ==================== MACROS ====================
function MacrosView({ byMacro, tx }) {
  const total = Object.values(byMacro).reduce((s, v) => s + v, 0);
  const data = Object.entries(MACROS).map(([k, v]) => ({
    key: k, label: v.label, desc: v.desc, color: v.color, budget: v.budget,
    value: byMacro[k] || 0, pct: total ? ((byMacro[k] || 0) / total) * 100 : 0,
  }));
  return (
    <div>
      <PageHeader eyebrow="TAXONOMÍA · VIVIR · TRABAJAR · DEBER · DISFRUTAR" title={<><em>Cuatro macros.</em> Así vive tu dinero.</>} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 24 }}>
        <Card>
          <CardHeader caption="DISTRIBUCIÓN ACTUAL" title="¿Dónde va cada peso?" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} stroke={C.creamLight} strokeWidth={3}>
                {data.map(d => <Cell key={d.key} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={v => fmtFull(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', fontFamily: T.display, fontSize: 22, fontWeight: 500, marginTop: -148, marginBottom: 108, pointerEvents: 'none' }}>{fmtARS(total)}</div>
        </Card>
        <Card>
          <CardHeader caption="CONCENTRACIÓN" title="Ratio de rigidez" />
          <div style={{ padding: '10px 0' }}>
            <div style={{ fontFamily: T.display, fontSize: 48, fontWeight: 500, color: C.rust, lineHeight: 1 }}>
              {data.find(d => d.key === 'DEBER')?.pct.toFixed(0) || 0}%
            </div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
              de tus gastos son obligaciones. Por encima del 50% es señal de que la capacidad de decisión está comprometida por compromisos pasados.
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 14, background: C.creamWarm, borderLeft: `3px solid ${C.terracotta}` }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Meta saludable</div>
            <div style={{ fontSize: 12, color: C.muted }}>DEBER &lt; 45% · DISFRUTAR &gt; 8% · TRABAJAR &gt; 10%</div>
          </div>
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {data.map(m => <MacroDetail key={m.key} data={m} tx={tx.filter(t => t.macro === m.key)} />)}
      </div>
    </div>
  );
}
function MacroDetail({ data, tx }) {
  const subTotals = {};
  tx.forEach(t => { subTotals[t.sub] = (subTotals[t.sub] || 0) + t.amount; });
  const sorted = Object.entries(subTotals).sort(([,a], [,b]) => b - a);
  const budgetPct = (data.value / data.budget) * 100;
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 4, height: 40, background: data.color, borderRadius: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', color: C.muted }}>{data.key}</div>
          <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 500 }}>{data.label}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{data.desc}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 500 }}>{fmtARS(data.value)}</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted }}>{data.pct.toFixed(1)}% del total</div>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ background: C.creamWarm, height: 4, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 90 ? C.rust : data.color }} />
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>vs. tope mensual</span>
          <span>{budgetPct.toFixed(0)}% de {fmtARS(data.budget)}</span>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 10 }}>
        {sorted.length === 0 ? (
          <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: 10 }}>Sin movimientos.</div>
        ) : sorted.slice(0, 4).map(([sub, val]) => (
          <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
            <span style={{ color: C.inkSoft }}>{sub}</span>
            <span style={{ fontFamily: T.mono, fontWeight: 500 }}>{fmtFull(val)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ==================== DEBTS & CARDS ====================
function DebtsView({ debts, cards, totalDebts, totalMonthlyDebt, onPayCard }) {
  return (
    <div>
      <PageHeader eyebrow="DEUDAS Y TARJETAS" title={<>Obligaciones en <em>movimiento.</em></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${C.line}`, borderRight: 'none', borderBottom: 'none', marginBottom: 24 }}>
        <KPI label="Deuda pendiente"         value={fmtARS(totalDebts)} sub={`USD ~${Math.round(totalDebts * 0.0007339).toLocaleString('es-AR')}`} />
        <KPI label="Cuota mensual total"     value={fmtARS(totalMonthlyDebt)} sub={`${debts.length} préstamos`} />
        <KPI label="Tarjetas este ciclo"     value={fmtARS(cards.reduce((s, c) => s + c.current, 0))} sub={`${cards.length} tarjetas`} />
        <KPI label="Liberación 12m"          value={fmtARS(29233)} tone="success" sub="PFs · jul-sep" />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader caption="TARJETAS" title="Resumen y pago" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {cards.map(c => <CardTile key={c.id} c={c} onPay={() => onPayCard(c)} />)}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader caption="PRÉSTAMOS ACTIVOS" title="Mapa de desendeudamiento" />
        {debts.map(d => <DebtRow key={d.id} d={d} />)}
      </Card>

      <Card>
        <CardHeader caption="PROYECCIÓN" title="Cuota total de préstamos por mes" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[
            { mes: 'May 26', v: 233281 }, { mes: 'Jun 26', v: 232754 }, { mes: 'Jul 26', v: 232090 },
            { mes: 'Ago 26', v: 231351 }, { mes: 'Sep 26', v: 230772 }, { mes: 'Oct 26', v: 229800 },
            { mes: 'Nov 26', v: 199919 }, { mes: 'Dic 26', v: 199146 }, { mes: 'Ene 27', v: 198193 },
            { mes: 'Feb 27', v: 197385 }, { mes: 'Mar 27', v: 142268 }, { mes: 'Abr 27', v: 141425 },
          ]} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.lineSoft} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fontFamily: T.mono, fill: C.muted2 }} stroke={C.line} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: C.muted2 }} stroke={C.line} tickFormatter={fmtARS} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => fmtFull(v)} />
            <Bar dataKey="v" fill={C.rust} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function DebtRow({ d }) {
  return (
    <div style={{ padding: '18px 4px', borderBottom: `1px solid ${C.lineSoft}`, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 20, alignItems: 'center' }}>
      <div>
        <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 500 }}>{d.name}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted, marginTop: 2 }}>Cuota {d.installment} · finaliza {d.endDate}</div>
      </div>
      <div>
        <div style={{ background: C.creamWarm, height: 6, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${d.progress}%`, background: C.forest }} />
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted, marginTop: 4 }}>{d.progress}% pagado</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 500 }}>{fmtFull(d.amount)}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted }}>pendiente</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 500, color: C.rust }}>{fmtFull(d.monthly)}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted }}>/ mes</div>
      </div>
    </div>
  );
}

function CardTile({ c, onPay }) {
  const trendColor = c.trend <= 0 ? C.forest : C.rust;
  return (
    <div style={{ padding: '18px 18px', background: C.creamLight, border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500 }}>{c.name}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted }}>VENCE {c.dueDate}</div>
      </div>
      <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 500, letterSpacing: '-0.015em' }}>{fmtFull(c.current)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 14, fontSize: 12 }}>
        {c.trend <= 0 ? <ArrowDown size={12} color={trendColor} /> : <ArrowUp size={12} color={trendColor} />}
        <span style={{ color: trendColor, fontWeight: 500 }}>{Math.abs(c.trend)}%</span>
        <span style={{ color: C.muted, fontSize: 11 }}>próx: {fmtFull(c.nextMonth)}</span>
      </div>
      <button onClick={onPay} disabled={c.current === 0} style={{
        padding: '8px 12px',
        background: c.current === 0 ? C.lineSoft : C.ink,
        color: c.current === 0 ? C.muted : C.cream,
        border: 'none', fontFamily: T.body, fontSize: 12, fontWeight: 500,
        cursor: c.current === 0 ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        marginTop: 'auto',
      }}>
        <ArrowDownRight size={13} /> {c.current === 0 ? 'Sin saldo' : 'Pagar tarjeta'}
      </button>
    </div>
  );
}

// ==================== GOALS ====================
function GoalsView({ goals, setGoals, totalCash }) {
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const overallPct = (totalCurrent / totalTarget) * 100;

  return (
    <div>
      <PageHeader eyebrow="METAS DE AHORRO" title={<>Tu dinero con <em>propósito.</em></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${C.line}`, borderRight: 'none', borderBottom: 'none', marginBottom: 24 }}>
        <KPI label="Total objetivo"     value={fmtARS(totalTarget)}   sub={`${goals.length} metas activas`} />
        <KPI label="Total acumulado"    value={fmtARS(totalCurrent)}  sub={`${overallPct.toFixed(1)}% del total`} tone="success" />
        <KPI label="Falta para completar" value={fmtARS(totalTarget - totalCurrent)} sub={`al ritmo actual: ~${Math.round((totalTarget - totalCurrent) / goals.reduce((s, g) => s + g.monthlyPace, 1))} meses`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {goals.map(g => (
          <Card key={g.id}>
            <GoalProgress g={g} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function GoalProgress({ g }) {
  const pct = Math.min((g.current / g.target) * 100, 100);
  const remaining = g.target - g.current;
  const monthsLeft = g.monthlyPace ? Math.ceil(remaining / g.monthlyPace) : null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 28 }}>{g.icon}</div>
          <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 500, marginTop: 4 }}>{g.name}</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted, marginTop: 2 }}>LÍMITE · {fmtDate(g.deadline).toUpperCase()} {new Date(g.deadline).getFullYear()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 500 }}>{pct.toFixed(0)}%</div>
        </div>
      </div>
      <div style={{ background: C.creamWarm, height: 10, position: 'relative', borderRadius: 1, marginBottom: 10 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: `linear-gradient(90deg, ${C.forest}, ${C.forestSoft})`, borderRadius: 1 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11 }}>
        <span style={{ color: C.muted }}>Acumulado</span>
        <span style={{ fontWeight: 600 }}>{fmtFull(g.current)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11 }}>
        <span style={{ color: C.muted }}>Objetivo</span>
        <span>{fmtFull(g.target)}</span>
      </div>
      {monthsLeft && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: C.creamWarm, borderLeft: `3px solid ${C.forest}`, fontSize: 12, color: C.inkSoft }}>
          Al ritmo de <strong>{fmtARS(g.monthlyPace)}/mes</strong>, completás la meta en <strong>{monthsLeft} meses</strong>.
        </div>
      )}
    </div>
  );
}

// ==================== RECURRING ====================
function RecurringView({ recurring, setRecurring }) {
  const totalMonthly = recurring.filter(r => r.active).reduce((s, r) => s + r.amount, 0);
  const byMacro = {};
  recurring.filter(r => r.active).forEach(r => { byMacro[r.macro] = (byMacro[r.macro] || 0) + r.amount; });
  const sorted = [...recurring].sort((a, b) => a.day - b.day);

  const toggleActive = (id) => {
    setRecurring(recurring.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <div>
      <PageHeader eyebrow="GASTOS RECURRENTES" title={<>Lo que <em>se repite</em> cada mes.</>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${C.line}`, borderRight: 'none', borderBottom: 'none', marginBottom: 24 }}>
        <KPI label="Gasto comprometido" value={fmtARS(totalMonthly)} sub="por mes · activos" />
        <KPI label="Cantidad activa"    value={`${recurring.filter(r => r.active).length} / ${recurring.length}`} sub="recurrentes" />
        <KPI label="Próximos 7 días"    value={fmtARS(recurring.filter(r => r.active && r.day <= 25 && r.day >= 18).reduce((s, r) => s + r.amount, 0))} sub="por vencer" />
        <KPI label="% del ingreso"      value={`${((totalMonthly / 3000000) * 100).toFixed(0)}%`} sub="sobre $3M" tone="warn" />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader caption="CALENDARIO DEL MES" title="¿Qué sale y cuándo?" />
        <div style={{ marginTop: 8 }}>
          {sorted.map(r => <RecurringRow key={r.id} r={r} onToggle={() => toggleActive(r.id)} />)}
        </div>
      </Card>

      <Card>
        <CardHeader caption="DISTRIBUCIÓN" title="Compromisos por macro" />
        <div style={{ marginTop: 10 }}>
          {Object.entries(MACROS).map(([k, v]) => {
            const total = byMacro[k] || 0;
            const pct = totalMonthly ? (total / totalMonthly) * 100 : 0;
            return (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '14px 100px 1fr 100px', gap: 16, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.lineSoft}` }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: v.color }} />
                <div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 500 }}>{v.label}</div>
                <div style={{ background: C.creamWarm, height: 5, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: v.color }} />
                </div>
                <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{fmtARS(total)}</span>
                  <span style={{ color: C.muted, fontSize: 10, marginLeft: 6 }}>{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function RecurringRow({ r, onToggle }) {
  const method = PAYMENT_METHODS.find(m => m.id === r.method);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto 40px', gap: 14, alignItems: 'center', padding: '12px 4px', borderBottom: `1px solid ${C.lineSoft}`, opacity: r.active ? 1 : 0.5 }}>
      <div style={{ width: 36, height: 36, border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.creamLight }}>
        <div style={{ fontFamily: T.mono, fontSize: 8, color: C.muted, letterSpacing: '0.1em' }}>DÍA</div>
        <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 500, lineHeight: 1 }}>{r.day}</div>
      </div>
      <div>
        <div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 500 }}>{r.concept}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted, marginTop: 2 }}>
          {r.macro} · {r.sub} · {method?.label}
        </div>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600 }}>{fmtFull(r.amount)}</div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: T.mono, fontSize: 10, color: C.muted }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: UNITS[r.unit]?.color }} />
        {UNITS[r.unit]?.label}
      </span>
      <label style={{ cursor: 'pointer', display: 'flex', justifyContent: 'flex-end' }}>
        <input type="checkbox" checked={r.active} onChange={onToggle} style={{ accentColor: C.forest }} />
      </label>
    </div>
  );
}

// ==================== PROJECTION ====================
function Projection() {
  const [income, setIncome] = useState(3000000);
  const [ocio, setOcio] = useState(115000);
  const [infl, setInfl] = useState(2.5);
  const [topeOcio, setTopeOcio] = useState(false);
  const [auditAbast, setAuditAbast] = useState(false);
  const [cancelPF, setCancelPF] = useState(false);

  const months = useMemo(() => {
    const base = [
      { mes: 'May 26', fijo: 1627090, variable: 1001085 }, { mes: 'Jun 26', fijo: 1636607, variable: 1003800 },
      { mes: 'Jul 26', fijo: 1655577, variable: 1005800 }, { mes: 'Ago 26', fijo: 1694596, variable: 1010000 },
      { mes: 'Sep 26', fijo: 1676915, variable: 1010000 }, { mes: 'Oct 26', fijo: 1736404, variable: 1014200 },
      { mes: 'Nov 26', fijo: 1688020, variable: 1014200 }, { mes: 'Dic 26', fijo: 1622749, variable: 1024200 },
      { mes: 'Ene 27', fijo: 1558293, variable: 1034200 }, { mes: 'Feb 27', fijo: 1557485, variable: 1034200 },
      { mes: 'Mar 27', fijo: 1380394, variable: 1044200 }, { mes: 'Abr 27', fijo: 1378551, variable: 1054200 },
    ];
    let acum = 0;
    return base.map((m, i) => {
      const infFactor = 1 + (infl / 100 * i * 0.6);
      const vbl = m.variable * (auditAbast ? 0.93 : 1) * infFactor;
      let fijo = m.fijo;
      if (cancelPF && i < 3) fijo -= 29233;
      const oc = topeOcio ? Math.min(80000, ocio) : ocio;
      const gasto = fijo + vbl + oc;
      const saldo = income - gasto;
      acum += saldo;
      return { mes: m.mes, ingreso: income, gasto: Math.round(gasto), saldo: Math.round(saldo), acum: Math.round(acum) };
    });
  }, [income, ocio, infl, topeOcio, auditAbast, cancelPF]);

  const totalSaldo = months.reduce((s, m) => s + m.saldo, 0);
  const totalInc = months.reduce((s, m) => s + m.ingreso, 0);
  const tasa = (totalSaldo / totalInc) * 100;
  const negMeses = months.filter(m => m.saldo < 0).length;

  return (
    <div>
      <PageHeader eyebrow="PROYECCIÓN · 12 MESES · MAY 26 — ABR 27" title={<>¿Qué pasa si <em>movés las palancas?</em></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${C.line}`, borderRight: 'none', borderBottom: 'none', marginBottom: 20 }}>
        <KPI label="Saldo 12m" value={fmtARS(totalSaldo)} tone={totalSaldo > 0 ? 'success' : 'danger'} sub={`prom ${fmtARS(totalSaldo/12)}/mes`} />
        <KPI label="Tasa ahorro" value={`${tasa.toFixed(1)}%`} tone={tasa > 10 ? 'success' : tasa > 5 ? 'warn' : 'danger'} sub="sobre ingresos" />
        <KPI label="Meses en rojo" value={`${negMeses} / 12`} tone={negMeses ? 'danger' : 'success'} sub="saldo negativo" />
        <KPI label="Saldo final" value={fmtARS(months[months.length - 1]?.acum || 0)} sub="acumulado" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader caption="PARÁMETROS" title="Variables del escenario" />
          <Slider label="Ingreso mensual" value={income} setValue={setIncome} min={1500000} max={5000000} step={50000} format={fmtARS} color={C.forest} />
          <Slider label="Ocio / delivery no registrado" value={ocio} setValue={setOcio} min={0} max={300000} step={5000} format={fmtARS} color={C.ochre} />
          <Slider label="Inflación mensual (%)" value={infl} setValue={setInfl} min={0} max={8} step={0.1} format={v => `${v.toFixed(1)}%`} color={C.rust} />
        </Card>
        <Card>
          <CardHeader caption="PALANCAS" title="Acciones de ahorro" />
          <Toggle label="Tope al ocio: $80K/mes" desc="Techo mensual a delivery y salidas" state={topeOcio} set={setTopeOcio} />
          <Toggle label="Auditar abastecimiento −7%" desc="Mayorista · compras planificadas" state={auditAbast} set={setAuditAbast} />
          <Toggle label="Cancelar PFs chicos ($176K)" desc="Libera $29K/mes los primeros meses" state={cancelPF} set={setCancelPF} />
        </Card>
      </div>
      <Card style={{ marginBottom: 12 }}>
        <CardHeader caption="FLUJO" title="Ingresos vs. gastos mes a mes" />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={months} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.lineSoft} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fontFamily: T.mono, fill: C.muted2 }} stroke={C.line} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: C.muted2 }} stroke={C.line} tickFormatter={fmtARS} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => fmtFull(v)} />
            <ReferenceLine y={0} stroke={C.rust} strokeDasharray="2 2" />
            <Line type="monotone" dataKey="ingreso" stroke={C.forest} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="gasto"   stroke={C.terracotta} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="saldo"   stroke={C.ochre} strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <CardHeader caption="AHORRO ACUMULADO" title="Bolsillo de reserva" />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={months} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.lineSoft} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fontFamily: T.mono, fill: C.muted2 }} stroke={C.line} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: C.muted2 }} stroke={C.line} tickFormatter={fmtARS} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => fmtFull(v)} />
            <ReferenceLine y={0} stroke={C.rust} strokeDasharray="2 2" />
            <Area type="monotone" dataKey="acum" stroke={C.blueInk} strokeWidth={2} fill={C.blueInk} fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ==================== UNITS ====================
function UnitsView({ tx }) {
  const stats = {};
  Object.keys(UNITS).forEach(u => { stats[u] = { income: 0, expense: 0, tx: 0 }; });
  tx.forEach(t => {
    if (!stats[t.unit]) return;
    if (t.isIncome) stats[t.unit].income += t.amount;
    else { stats[t.unit].expense += t.amount; stats[t.unit].tx += 1; }
  });
  return (
    <div>
      <PageHeader eyebrow="UNIDADES FINANCIERAS" title={<>Tres <em>hogares</em>, un cauce.</>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {Object.entries(UNITS).map(([k, u]) => <UnitCard key={k} u={u} stats={stats[k]} />)}
      </div>
      <Card>
        <CardHeader caption="CONSOLIDADO" title="Flujo entre unidades" />
        <div style={{ padding: 20, background: C.creamLight, marginTop: 12 }}>
          <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>
            Cada unidad tiene sus propios ingresos, gastos y saldo. Cuando planifiques la <em>inversión en Balneário</em> o la <em>clínica propia</em>, ver cada unidad por separado te da el cuadro real. Próxima versión: transferencias inter-unidad con trazabilidad (ej: "consultorio aporta $X a hogar").
          </div>
        </div>
      </Card>
    </div>
  );
}
function UnitCard({ u, stats }) {
  const saldo = stats.income - stats.expense;
  return (
    <Card style={{ borderTop: `3px solid ${u.color}` }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', color: C.muted, marginBottom: 8 }}>{u.sub.toUpperCase()}</div>
      <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 500, marginBottom: 12 }}>{u.label}</div>
      <div style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 10 }}>
        <UnitStat label="Ingresos"    value={fmtARS(stats.income)}  color={stats.income > 0 ? C.forest : C.muted} />
        <UnitStat label="Gastos"      value={fmtARS(stats.expense)} color={C.terracotta} />
        <UnitStat label="Saldo"       value={fmtARS(saldo)}         color={saldo >= 0 ? C.forest : C.rust} bold />
        <UnitStat label="Movimientos" value={`${stats.tx}`}         color={C.muted} />
      </div>
    </Card>
  );
}
function UnitStat({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontFamily: T.mono, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

// ==================== MODALS ====================
function AddTxModal({ onClose, onSave, cards, rules }) {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [macro, setMacro] = useState('VIVIR');
  const [sub, setSub] = useState(SUBCATS.VIVIR[0]);
  const [unit, setUnit] = useState('HOGAR');
  const [isIncome, setIsIncome] = useState(false);
  const [method, setMethod] = useState('cash');
  const [cardId, setCardId] = useState(cards[0]?.id || '');
  const [installments, setInstallments] = useState(1);

  // Auto-suggest
  const suggestion = useMemo(() => suggestFromRules(concept, rules), [concept, rules]);
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(null);

  const applySuggestion = () => {
    if (!suggestion) return;
    setMacro(suggestion.macro);
    setSub(suggestion.sub);
    setAcceptedSuggestion(suggestion);
  };

  const canSave = concept.trim() && amount && parseFloat(amount) > 0 && (method !== 'credit' || cardId);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      concept: concept.trim(),
      amount: parseFloat(amount),
      macro: isIncome ? null : macro,
      sub: isIncome ? null : sub,
      unit,
      date: new Date().toISOString().split('T')[0],
      method: isIncome ? 'transfer' : method,
      cardId: method === 'credit' ? cardId : null,
      installments: method === 'credit' ? installments : 1,
      isIncome,
    });
  };

  return (
    <ModalShell onClose={onClose} title={<>Agregar <em style={{ color: C.terracotta }}>{isIncome ? 'ingreso' : 'gasto'}</em></>} eyebrow="NUEVO MOVIMIENTO" wide>
      {/* Type toggle */}
      <div style={{ display: 'flex', marginBottom: 18, border: `1px solid ${C.line}` }}>
        {[{ id: false, label: 'Gasto' }, { id: true, label: 'Ingreso' }].map(t => (
          <button key={t.id} onClick={() => setIsIncome(t.id)} style={{ flex: 1, padding: '10px 12px', background: isIncome === t.id ? C.ink : 'transparent', color: isIncome === t.id ? C.cream : C.inkSoft, border: 'none', fontFamily: T.body, fontSize: 12, cursor: 'pointer', fontWeight: isIncome === t.id ? 500 : 400 }}>{t.label}</button>
        ))}
      </div>

      <FormField label="Concepto">
        <input value={concept} onChange={e => setConcept(e.target.value)} placeholder="Ej: Delivery sushi, Nafta, Honorarios…" style={inputStyle} autoFocus />
      </FormField>

      {/* Sugerencia */}
      {suggestion && !isIncome && (!acceptedSuggestion || acceptedSuggestion.macro !== suggestion.macro) && (
        <div style={{ padding: '10px 12px', background: 'rgba(184,134,47,0.1)', borderLeft: `3px solid ${C.ochre}`, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 12, color: C.inkSoft }}>
            <Sparkles size={12} style={{ display: 'inline', marginRight: 6, color: C.ochre, verticalAlign: -2 }} />
            Sugerencia: <strong>{suggestion.macro} · {suggestion.sub}</strong>
          </div>
          <button onClick={applySuggestion} style={{ padding: '6px 10px', background: C.ochre, color: C.cream, border: 'none', fontFamily: T.body, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>Aplicar</button>
        </div>
      )}

      <FormField label="Monto (ARS)">
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inputStyle} />
      </FormField>

      {!isIncome && (
        <>
          <FormField label="Macro">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {Object.entries(MACROS).map(([k, v]) => (
                <button key={k} onClick={() => { setMacro(k); setSub(SUBCATS[k][0]); }} style={{ padding: '10px 6px', background: macro === k ? v.color : 'transparent', color: macro === k ? C.cream : C.inkSoft, border: `1px solid ${macro === k ? v.color : C.line}`, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer', fontWeight: 500 }}>{k}</button>
              ))}
            </div>
          </FormField>
          <FormField label="Subcategoría">
            <select value={sub} onChange={e => setSub(e.target.value)} style={inputStyle}>
              {SUBCATS[macro].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>

          {/* Método de pago */}
          <FormField label="Método de pago">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button key={m.id} onClick={() => setMethod(m.id)} style={{
                    padding: '10px 6px',
                    background: active ? C.ink : 'transparent',
                    color: active ? C.cream : C.inkSoft,
                    border: `1px solid ${active ? C.ink : C.line}`,
                    fontFamily: T.body, fontSize: 11, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <Icon size={14} strokeWidth={1.5} />
                    <span style={{ fontSize: 10 }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Si es crédito: tarjeta + cuotas */}
          {method === 'credit' && (
            <div style={{ padding: 14, background: 'rgba(139,58,43,0.05)', border: `1px solid ${C.terracotta}33`, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontFamily: T.mono, fontSize: 10, color: C.terracotta, letterSpacing: '0.1em' }}>
                <CreditCard size={12} /> TARJETA DE CRÉDITO
              </div>
              <FormField label="Tarjeta">
                <div style={{ display: 'flex', gap: 6 }}>
                  {cards.map(c => (
                    <button key={c.id} onClick={() => setCardId(c.id)} style={{
                      flex: 1, padding: '8px 10px',
                      background: cardId === c.id ? C.terracotta : 'transparent',
                      color: cardId === c.id ? C.cream : C.inkSoft,
                      border: `1px solid ${cardId === c.id ? C.terracotta : C.line}`,
                      fontFamily: T.body, fontSize: 11, cursor: 'pointer', fontWeight: 500,
                    }}>{c.name}</button>
                  ))}
                </div>
              </FormField>
              <FormField label="Cuotas">
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 3, 6, 12, 18, 24].map(n => (
                    <button key={n} onClick={() => setInstallments(n)} style={{
                      flex: 1, padding: '8px 0',
                      background: installments === n ? C.ink : 'transparent',
                      color: installments === n ? C.cream : C.inkSoft,
                      border: `1px solid ${installments === n ? C.ink : C.line}`,
                      fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: 500,
                    }}>{n}x</button>
                  ))}
                </div>
              </FormField>
              {amount && installments > 1 && (
                <div style={{ marginTop: 10, padding: 10, background: C.creamLight, fontSize: 12, color: C.muted, textAlign: 'center', fontFamily: T.mono }}>
                  {installments} cuotas de <strong style={{ color: C.ink }}>{fmtFull(parseFloat(amount) / installments)}</strong>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <FormField label="Unidad">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {Object.entries(UNITS).map(([k, u]) => (
            <button key={k} onClick={() => setUnit(k)} style={{ padding: '10px 6px', background: unit === k ? C.ink : 'transparent', color: unit === k ? C.cream : C.inkSoft, border: `1px solid ${unit === k ? C.ink : C.line}`, fontFamily: T.body, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: u.color }} />
              {u.label}
            </button>
          ))}
        </div>
      </FormField>

      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        <button onClick={onClose} style={{ ...secondaryBtn, flex: 1 }}>Cancelar</button>
        <button onClick={handleSave} disabled={!canSave} style={{ ...primaryBtn, flex: 2, opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}>
          <Check size={14} /> Guardar
        </button>
      </div>
    </ModalShell>
  );
}

function PayCardModal({ card, cashAccounts, onClose, onSave }) {
  const [amount, setAmount] = useState(card?.current || 0);
  const [fromAccount, setFromAccount] = useState(cashAccounts.find(a => a.balance > 0)?.id || cashAccounts[0]?.id);
  const source = cashAccounts.find(a => a.id === fromAccount);
  const insufficientFunds = source && amount > source.balance;
  const canSave = amount > 0 && amount <= (card?.current || 0) && fromAccount && !insufficientFunds;

  return (
    <ModalShell onClose={onClose} eyebrow="PAGO DE TARJETA · COMPENSACIÓN DE CAJA" title={<>Pagar <em>{card?.name}</em></>}>
      <div style={{ padding: 14, background: C.creamWarm, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted, letterSpacing: '0.1em' }}>SALDO ACTUAL</div>
          <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 500 }}>{fmtFull(card?.current || 0)}</div>
        </div>
        <ArrowDownRight size={26} color={C.terracotta} />
      </div>

      <FormField label="Monto a pagar">
        <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} max={card?.current} style={inputStyle} />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {[0.25, 0.5, 1].map(pct => (
            <button key={pct} onClick={() => setAmount(Math.round((card?.current || 0) * pct))} style={{
              padding: '5px 10px',
              background: 'transparent',
              border: `1px solid ${C.line}`,
              fontFamily: T.mono, fontSize: 10, cursor: 'pointer',
              color: C.inkSoft,
            }}>
              {pct === 1 ? 'TOTAL' : `${pct * 100}%`}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Pagar desde">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {cashAccounts.map(a => {
            const active = fromAccount === a.id;
            const insufficient = a.balance < amount;
            return (
              <button key={a.id} onClick={() => setFromAccount(a.id)} style={{
                padding: '10px 12px',
                background: active ? C.ink : 'transparent',
                color: active ? C.cream : (insufficient ? C.rust : C.inkSoft),
                border: `1px solid ${active ? C.ink : (insufficient ? C.rust : C.line)}`,
                fontFamily: T.body, fontSize: 12, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: insufficient && !active ? 0.6 : 1,
              }}>
                <span>{a.name}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11 }}>{fmtARS(a.balance)}</span>
              </button>
            );
          })}
        </div>
      </FormField>

      {insufficientFunds && (
        <div style={{ padding: 10, background: 'rgba(168,52,42,0.1)', borderLeft: `3px solid ${C.rust}`, marginBottom: 14, fontSize: 12, color: C.rust }}>
          Fondos insuficientes en {source?.name}. Faltan {fmtARS(amount - source.balance)}.
        </div>
      )}

      <div style={{ padding: 12, background: C.creamLight, marginBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
        El pago <strong>no se registra como gasto</strong> (los consumos ya se imputaron al usar la tarjeta). Solo compensa el pasivo pendiente y reduce tu saldo de caja.
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ ...secondaryBtn, flex: 1 }}>Cancelar</button>
        <button onClick={() => onSave({ cardId: card.id, amount, fromAccount })} disabled={!canSave} style={{ ...primaryBtn, flex: 2, opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}>
          <ArrowDownRight size={14} /> Confirmar pago
        </button>
      </div>
    </ModalShell>
  );
}

function RulesModal({ rules, setRules, onClose }) {
  return (
    <ModalShell onClose={onClose} eyebrow="REGLAS DE AUTO-CATEGORIZACIÓN" title={<>Que <em>Cauce</em> te sugiera la categoría</>} wide>
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 18, lineHeight: 1.5 }}>
        Cuando escribís un concepto que incluye alguna palabra clave, Cauce te sugiere automáticamente macro y subcategoría. Podés aceptar o ignorar la sugerencia.
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto', border: `1px solid ${C.line}` }}>
        {rules.map(r => (
          <div key={r.id} style={{ padding: '12px 14px', borderBottom: `1px solid ${C.lineSoft}`, display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {r.keywords.map(k => (
                <span key={k} style={{ padding: '3px 8px', background: C.creamWarm, fontFamily: T.mono, fontSize: 10, color: C.inkSoft, borderRadius: 2 }}>{k}</span>
              ))}
            </div>
            <ArrowRight size={12} color={C.muted2} />
            <div style={{ fontFamily: T.mono, fontSize: 10, color: C.ink, fontWeight: 500 }}>{r.macro}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{r.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, background: C.creamLight, marginTop: 14, fontSize: 11, color: C.muted }}>
        Próximo: poder editar y crear reglas desde la app. Por ahora son seed.
      </div>
    </ModalShell>
  );
}

// ==================== ATOMS ====================
function ModalShell({ onClose, title, eyebrow, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.cream, maxWidth: wide ? 560 : 480, width: '100%', padding: 28, border: `1px solid ${C.line}`, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', color: C.muted }}>{eyebrow}</div>
            <div style={{ fontFamily: T.display, fontSize: 24, fontWeight: 500, marginTop: 4, letterSpacing: '-0.01em' }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, action }) {
  return (
    <header style={{ marginBottom: 24, paddingBottom: 22, borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', color: C.muted }}>{eyebrow}</div>
        {action}
      </div>
      <h1 style={{ fontFamily: T.display, fontSize: 32, fontWeight: 500, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{title}</h1>
    </header>
  );
}

function KPI({ label, value, sub, tone }) {
  const color = tone === 'success' ? C.forest : tone === 'danger' ? C.rust : tone === 'warn' ? C.ochre : C.ink;
  return (
    <div style={{ padding: '18px 16px', borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, background: C.creamLight }}>
      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', color, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: C.muted }}>{sub}</div>
    </div>
  );
}

function Card({ children, style }) { return <div style={{ background: C.creamLight, border: `1px solid ${C.line}`, padding: 20, ...style }}>{children}</div>; }
function CardHeader({ caption, title, action }) {
  return (
    <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', color: C.muted, marginBottom: 4 }}>{caption}</div>
        <h3 style={{ fontFamily: T.display, fontSize: 18, fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
      </div>
      {action}
    </div>
  );
}

function Alert({ tone, title, desc }) {
  const colors = {
    warn:    { bg: 'rgba(184,134,47,0.08)', border: C.ochre,   icon: <AlertCircle size={14} color={C.ochre} /> },
    info:    { bg: 'rgba(44,71,88,0.08)',   border: C.blueInk, icon: <Zap size={14} color={C.blueInk} /> },
    success: { bg: 'rgba(61,107,79,0.08)',  border: C.forest,  icon: <Check size={14} color={C.forest} /> },
    danger:  { bg: 'rgba(168,52,42,0.08)',  border: C.rust,    icon: <AlertCircle size={14} color={C.rust} /> },
  };
  const c = colors[tone];
  return (
    <div style={{ padding: '14px 16px', background: c.bg, borderLeft: `3px solid ${c.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {c.icon}
        <span style={{ fontFamily: T.display, fontSize: 14, fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', color: C.muted, marginBottom: 6 }}>{label.toUpperCase()}</div>
      {children}
    </div>
  );
}

function Slider({ label, value, setValue, min, max, step, format, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: C.inkSoft }}>{label}</span>
        <span style={{ fontFamily: T.mono, color, fontWeight: 600 }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => setValue(parseFloat(e.target.value))} style={{ width: '100%', accentColor: color }} />
    </div>
  );
}

function Toggle({ label, desc, state, set }) {
  return (
    <label style={{ display: 'flex', gap: 12, padding: '12px 10px', marginBottom: 6, background: state ? 'rgba(61,107,79,0.08)' : 'transparent', border: `1px solid ${state ? C.forest : C.lineSoft}`, cursor: 'pointer', alignItems: 'flex-start', transition: 'all 0.15s' }}>
      <input type="checkbox" checked={state} onChange={e => set(e.target.checked)} style={{ marginTop: 2, accentColor: C.forest }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{desc}</div>
      </div>
    </label>
  );
}

const inputStyle = { width: '100%', padding: '10px 12px', background: C.creamLight, border: `1px solid ${C.line}`, fontFamily: T.body, fontSize: 13, color: C.ink, outline: 'none', boxSizing: 'border-box' };
const primaryBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: C.ink, color: C.cream, border: 'none', fontFamily: T.body, fontSize: 12, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.01em' };
const secondaryBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: 'transparent', color: C.inkSoft, border: `1px solid ${C.line}`, fontFamily: T.body, fontSize: 12, cursor: 'pointer' };
const linkBtn = { background: 'transparent', border: 'none', color: C.terracotta, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' };
const tooltipStyle = { background: C.ink, border: 'none', fontFamily: T.mono, fontSize: 11, color: C.cream, borderRadius: 2 };
