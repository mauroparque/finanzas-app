import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAccounts } from '../../hooks/useAccounts';
import { Check, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import {
    CLASSIFICATION_MAP,
    getCategoriesForUnit,
    getConceptsForCategory,
    getDetailsForConcept
} from '../../config/classificationMap';

interface TransactionFormProps {
    onSuccess: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
    const { addTransaction } = useTransactions();
    const { accounts } = useAccounts();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        unit: 'HOGAR' as 'HOGAR' | 'PROFESIONAL' | 'BRASIL',
        category: 'Vivienda y Vida Diaria',
        concept: 'Abastecimiento',
        detail: '',
        type: 'expense' as 'income' | 'expense',
        account: '',
        currency: 'ARS' as 'ARS' | 'USD' | 'USDT' | 'BRL',
        date_operation: new Date().toISOString().split('T')[0],
        isRecurring: false
    });

    // Dynamic options based on selection
    const categories = useMemo(() => getCategoriesForUnit(formData.unit), [formData.unit]);
    const concepts = useMemo(() => getConceptsForCategory(formData.unit, formData.category), [formData.unit, formData.category]);
    const detailSuggestions = useMemo(() => getDetailsForConcept(formData.unit, formData.category, formData.concept), [formData.unit, formData.category, formData.concept]);

    // Reset dependent fields when parent changes
    const handleUnitChange = (unit: 'HOGAR' | 'PROFESIONAL' | 'BRASIL') => {
        const newCategories = getCategoriesForUnit(unit);
        const firstCategory = newCategories[0]?.name || '';
        const firstConcept = newCategories[0]?.concepts[0]?.name || '';
        setFormData({ ...formData, unit, category: firstCategory, concept: firstConcept, detail: '' });
    };

    const handleCategoryChange = (category: string) => {
        const newConcepts = getConceptsForCategory(formData.unit, category);
        const firstConcept = newConcepts[0]?.name || '';
        setFormData({ ...formData, category, concept: firstConcept, detail: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.account) return;

        setLoading(true);
        try {
            await addTransaction({
                amount: parseFloat(formData.amount),
                type: formData.type,
                currency: formData.currency,
                unit: formData.unit,
                category: formData.category,
                concept: formData.concept,
                detail: formData.detail || formData.concept,
                date_operation: Timestamp.fromDate(new Date(formData.date_operation)),
                account: formData.account,
                isRecurring: formData.isRecurring,
                source: 'manual'
            });
            setLoading(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const currencies = ['ARS', 'USD', 'USDT', 'BRL'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Type Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-xl mb-4">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${formData.type === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Gasto
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Ingreso
                </button>
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monto</label>
                    <input
                        type="number"
                        required
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-xl font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Moneda</label>
                    <select
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-2 text-white font-bold appearance-none"
                        value={formData.currency}
                        onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
                    >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Unit & Date */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unidad</label>
                    <div className="flex gap-1">
                        {CLASSIFICATION_MAP.map(u => (
                            <button
                                key={u.name}
                                type="button"
                                onClick={() => handleUnitChange(u.name)}
                                className={`flex-1 py-2 rounded-lg text-[9px] font-bold transition-all border ${formData.unit === u.name ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                            >
                                {u.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Op.</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                        value={formData.date_operation}
                        onChange={e => setFormData({ ...formData, date_operation: e.target.value })}
                    />
                </div>
            </div>

            {/* Category (Dynamic) */}
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoría</label>
                <select
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 px-4 text-sm text-white appearance-none"
                    value={formData.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                >
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {/* Concept (Dynamic) */}
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Concepto</label>
                <select
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 px-4 text-sm text-white appearance-none"
                    value={formData.concept}
                    onChange={e => setFormData({ ...formData, concept: e.target.value, detail: '' })}
                >
                    {concepts.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {/* Detail (Manual input with suggestions) */}
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detalle / Comercio</label>
                <input
                    type="text"
                    list="detail-suggestions"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 px-4 text-sm text-white"
                    placeholder="Escribí o elegí una sugerencia..."
                    value={formData.detail}
                    onChange={e => setFormData({ ...formData, detail: e.target.value })}
                    required
                />
                <datalist id="detail-suggestions">
                    {detailSuggestions.map(d => <option key={d} value={d} />)}
                </datalist>
            </div>

            {/* Account Selection */}
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cuenta de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                    {accounts.map(acc => (
                        <button
                            key={acc.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, account: acc.id })}
                            className={`py-2 px-3 rounded-xl border text-[10px] font-bold transition-all truncate ${formData.account === acc.id ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                        >
                            {acc.name}
                        </button>
                    ))}
                    {accounts.length === 0 && <p className="text-[10px] text-slate-500 italic col-span-2">No hay cuentas...</p>}
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                Confirmar Carga
            </button>
        </form>
    );
};

export default TransactionForm;
