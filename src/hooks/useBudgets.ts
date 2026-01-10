import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Budget } from '../types';

export const useBudgets = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const collectionRef = collection(db, 'budgets');

        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Budget[];
            setBudgets(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateBudget = async (id: string, updates: Partial<Budget>) => {
        const docRef = doc(db, 'budgets', id);
        await updateDoc(docRef, updates);
    };

    return { budgets, loading, updateBudget };
};
