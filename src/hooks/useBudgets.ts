import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    Timestamp,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Budget } from '../types';

export const useBudgets = (unit?: string) => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const collectionRef = collection(db, 'budgets');
        let q = query(collectionRef);

        if (unit) {
            q = query(q, where('unit', '==', unit));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Budget[];
            setBudgets(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching budgets:", err);
            setError('Error al cargar presupuestos');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [unit]);

    const addBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = Timestamp.now();
        await addDoc(collection(db, 'budgets'), {
            ...budget,
            createdAt: now,
            updatedAt: now
        });
    };

    const updateBudget = async (id: string, updates: Partial<Budget>) => {
        const docRef = doc(db, 'budgets', id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now()
        });
    };

    return { budgets, loading, error, addBudget, updateBudget };
};
