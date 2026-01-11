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
import { ServiceItem, ServiceStatus } from '../types';

export const useServices = () => {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const collectionRef = collection(db, 'services');
        const q = query(collectionRef, orderBy('dueDate'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ServiceItem[];
            setServices(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching services:", err);
            setError('Error al cargar servicios');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addService = async (service: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt' | 'currentDueDate'>) => {
        try {
            const now = new Date();
            // Calculate current due date based on day of month
            const currentDueDate = new Date(now.getFullYear(), now.getMonth(), service.dueDate);

            await addDoc(collection(db, 'services'), {
                ...service,
                currentDueDate: Timestamp.fromDate(currentDueDate),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
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

            // Calculate variation
            let variation: 'up' | 'down' | 'stable' = 'stable';
            if (service.amount > 0) {
                if (amount > service.amount) variation = 'up';
                else if (amount < service.amount) variation = 'down';
            }

            const docRef = doc(db, 'services', id);
            await updateDoc(docRef, {
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
