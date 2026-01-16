import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Account } from '../types';

export const useAccounts = (onlyActive = true) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const collectionRef = collection(db, 'accounts');
        let q = query(collectionRef);

        if (onlyActive) {
            q = query(q, where('isActive', '==', true));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Account[];
            setAccounts(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching accounts:", err);
            setError('Error al cargar cuentas');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [onlyActive]);

    const addAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = Timestamp.now();
        await addDoc(collection(db, 'accounts'), {
            ...account,
            createdAt: now,
            updatedAt: now
        });
    };

    const updateAccount = async (id: string, updates: Partial<Account>) => {
        const docRef = doc(db, 'accounts', id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now()
        });
    };

    return { accounts, loading, error, addAccount, updateAccount };
};
