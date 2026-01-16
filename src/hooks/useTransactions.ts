import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    Timestamp,
    where,
    writeBatch,
    increment,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Transaction } from '../types';

export const useTransactions = (filters?: { category?: string; unit?: string; month?: Date }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const collectionRef = collection(db, 'transactions');
        let q = query(collectionRef, orderBy('date_operation', 'desc'));

        if (filters?.unit) {
            q = query(q, where('unit', '==', filters.unit));
        }

        if (filters?.category) {
            q = query(q, where('category', '==', filters.category));
        }

        if (filters?.month) {
            const start = new Date(filters.month.getFullYear(), filters.month.getMonth(), 1);
            const end = new Date(filters.month.getFullYear(), filters.month.getMonth() + 1, 0, 23, 59, 59);
            q = query(q, where('date_operation', '>=', Timestamp.fromDate(start)), where('date_operation', '<=', Timestamp.fromDate(end)));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Transaction[];
            setTransactions(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching transactions:", err);
            setError('Error al cargar transacciones');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [filters?.category, filters?.unit, filters?.month?.toISOString()]);

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'date_validation'>) => {
        try {
            const batch = writeBatch(db);

            const newTxRef = doc(collection(db, 'transactions'));
            const now = Timestamp.now();

            batch.set(newTxRef, {
                ...transaction,
                id: newTxRef.id,
                date_validation: now, // Validated at creation for manual entry
                createdAt: now,
                updatedAt: now
            });

            if (transaction.account) {
                const accountRef = doc(db, 'accounts', transaction.account);
                const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;

                batch.set(accountRef, {
                    balance: increment(balanceChange),
                    updatedAt: now
                }, { merge: true });
            }

            await batch.commit();
        } catch (err) {
            console.error("Error adding transaction:", err);
            throw err;
        }
    };

    const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
        try {
            const docRef = doc(db, 'transactions', id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: Timestamp.now()
            });
        } catch (err) {
            console.error("Error updating transaction:", err);
            throw err;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'transactions', id));
        } catch (err) {
            console.error("Error deleting transaction:", err);
            throw err;
        }
    };

    return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction };
};
