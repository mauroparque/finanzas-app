import React, { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAccounts } from '../../hooks/useAccounts';
import { Check, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface TransactionFormProps {
    onSuccess: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
    const { addTransaction } = useTransactions();
    const { accounts } = useAccounts();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'Alimentos',
        type: 'expense' as 'income' | 'expense',
        account: '',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = [
        'Alimentos', 'Transporte', 'Servicios', 'Salidas', 'Hogar', 'Salud', 'Educación', 'Regalos', 'Varios'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.account) return;

        setLoading(true);
        try {
            await addTransaction({
                amount: parseFloat(formData.amount),
                description: formData.description,
                category: formData.category,
                type: formData.type,
                currency: 'ARS', // Default for now
                account: formData.account,
                date: Timestamp.fromDate(new Date(formData.date)),
                source: 'manual'
            });
            setLoading(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-xl mb-6">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formData.type === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Gasto
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Ingreso
                </button>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monto</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                        type="number"
                        required
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</label>
                <input
                    type="text"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="¿En qué gastaste?"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
                    <select
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cuenta</label>
                <div className="grid grid-cols-3 gap-2">
                    {/* Fallback if no accounts exist yet */}
                    {accounts.length === 0 && (
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, account: 'Efectivo' })}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${formData.account === 'Efectivo' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        >
                            Efectivo
                        </button>
                    )}
                    {accounts.map(acc => (
                        <button
                            key={acc.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, account: acc.id })}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${formData.account === acc.id ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        >
                            {acc.name}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg run-button flex items-center justify-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Check />}
                Guardar Operación
            </button>
        </form>
    );
};

export default TransactionForm;
