import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Service, ServiceStatus } from '../types';

export const useServices = (onlyActive = true) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const collectionRef = collection(db, 'services');
        let q = query(collectionRef, orderBy('dueDate'));

        if (onlyActive) {
            q = query(q, where('isActive', '==', true));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Service[];
            setServices(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching services:", err);
            setError('Error al cargar servicios');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [onlyActive]);

    const addService = async (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const now = Timestamp.now();
            await addDoc(collection(db, 'services'), {
                ...service,
                createdAt: now,
                updatedAt: now
            });
        } catch (err) {
            console.error("Error adding service:", err);
            throw err;
        }
    };

    const updateServiceStatus = async (id: string, status: ServiceStatus) => {
        try {
            const docRef = doc(db, 'services', id);
            await updateDoc(docRef, {
                status,
                updatedAt: Timestamp.now()
            });
        } catch (err) {
            console.error("Error updating service status:", err);
            throw err;
        }
    };

    const updateServiceAmount = async (id: string, amount: number) => {
        try {
            const service = services.find(s => s.id === id);
            if (!service) return;

            let variation: 'up' | 'down' | 'stable' = 'stable';
            if (service.amount > 0) {
                if (amount > service.amount) variation = 'up';
                else if (amount < service.amount) variation = 'down';
            }

            const docRef = doc(db, 'services', id);
            await updateDoc(docRef, {
                last_amount: service.amount,
                amount,
                variation,
                updatedAt: Timestamp.now()
            });
        } catch (err) {
            console.error("Error updating service amount:", err);
            throw err;
        }
    };

    const deleteService = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'services', id));
        } catch (err) {
            console.error("Error deleting service:", err);
            throw err;
        }
    };

    return { services, loading, error, addService, updateServiceStatus, updateServiceAmount, deleteService };
};
