import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useMediosPago } from '../../hooks/useMediosPago';
import { Check, Loader2 } from 'lucide-react';
import {
    getCategoriesForUnit,
    getConceptsForCategory,
    getDetailsForConcept
} from '../../config/classificationMap';
import { Button } from '../common/ui/Button';
import { Input } from '../common/ui/Input';
import { cn } from '../../utils/cn';

interface TransactionFormProps {
    onSuccess: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
    const { addTransaction } = useTransactions();
    const { accounts } = useMediosPago();

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
                monto: parseFloat(formData.amount),
                tipo: formData.type === 'expense' ? 'gasto' : 'ingreso',
                moneda: formData.currency,
                unidad: formData.unit,
                categoria: formData.category,
                concepto: formData.concept,
                detalle: formData.detail || formData.concept,
                fecha_operacion: new Date(formData.date_operation).toISOString(),
                medio_pago: String(formData.account),
                fuente: 'manual'
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
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar bg-white rounded-3xl p-6">
            {/* Type Toggle */}
            <div className="flex bg-stone-100 p-1 rounded-xl mb-4">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={cn(
                        'flex-1 py-3 rounded-lg text-xs font-bold transition-all',
                        formData.type === 'expense'
                            ? 'bg-terracotta-500 text-white shadow-sm'
                            : 'text-stone-500 hover:text-stone-800'
                    )}
                >
                    Gasto
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={cn(
                        'flex-1 py-3 rounded-lg text-xs font-bold transition-all',
                        formData.type === 'income'
                            ? 'bg-sage-500 text-white shadow-sm'
                            : 'text-stone-500 hover:text-stone-800'
                    )}
                >
                    Ingreso
                </button>
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                    <Input
                        label="Monto"
                        type="number"
                        required
                        placeholder="0.00"
                        className="text-xl font-bold py-3"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Moneda</label>
                    <select
                        className="w-full bg-white border border-stone-300 rounded-xl py-3 px-2 text-stone-800 font-bold appearance-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-200 focus:outline-none transition-colors"
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
                    <label className="block text-sm font-medium text-stone-700 mb-1">Unidad</label>
                    <div className="flex gap-1">
                        {(['HOGAR', 'PROFESIONAL', 'BRASIL'] as const).map(u => (
                            <button
                                key={u}
                                type="button"
                                onClick={() => handleUnitChange(u)}
                                className={cn(
                                    'flex-1 py-2 rounded-lg text-[9px] font-bold transition-all border',
                                    formData.unit === u
                                        ? 'bg-terracotta-500 border-terracotta-500 text-white'
                                        : 'bg-stone-100 border-stone-200 text-stone-500'
                                )}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <Input
                        label="Fecha Op."
                        type="date"
                        required
                        value={formData.date_operation}
                        onChange={e => setFormData({ ...formData, date_operation: e.target.value })}
                    />
                </div>
            </div>

            {/* Category (Dynamic) */}
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Categoría</label>
                <select
                    className="w-full bg-white border border-stone-300 rounded-xl py-2 px-4 text-sm text-stone-800 appearance-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-200 focus:outline-none transition-colors"
                    value={formData.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                >
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {/* Concept (Dynamic) */}
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Concepto</label>
                <select
                    className="w-full bg-white border border-stone-300 rounded-xl py-2 px-4 text-sm text-stone-800 appearance-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-200 focus:outline-none transition-colors"
                    value={formData.concept}
                    onChange={e => setFormData({ ...formData, concept: e.target.value, detail: '' })}
                >
                    {concepts.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {/* Detail (Manual input with suggestions) */}
            <div>
                <Input
                    label="Detalle / Comercio"
                    type="text"
                    list="detail-suggestions"
                    placeholder="Escribí o elegí una sugerencia..."
                    required
                    value={formData.detail}
                    onChange={e => setFormData({ ...formData, detail: e.target.value })}
                />
                <datalist id="detail-suggestions">
                    {detailSuggestions.map(d => <option key={d} value={d} />)}
                </datalist>
            </div>

            {/* Account Selection */}
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Cuenta de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                    {accounts.map(acc => (
                        <button
                            key={acc.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, account: acc.nombre })}
                            className={cn(
                                'py-2 px-3 rounded-2xl border text-[10px] font-bold transition-all truncate',
                                formData.account === acc.nombre
                                    ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-700'
                                    : 'bg-stone-50 border-stone-200 text-stone-600'
                            )}
                        >
                            {acc.nombre}
                        </button>
                    ))}
                    {accounts.length === 0 && <p className="text-[10px] text-stone-400 italic col-span-2">No hay cuentas...</p>}
                </div>
            </div>

            <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                Confirmar Carga
            </Button>
        </form>
    );
};

export default TransactionForm;
