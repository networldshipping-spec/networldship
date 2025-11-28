import { useEffect, useState } from 'react';
import { Shipment } from '../types/shipment';
import { fetchShipments } from '../lib/api/client';

const useShipments = () => {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadShipments = async () => {
            try {
                const data = await fetchShipments();
                setShipments(data);
            } catch (err) {
                setError('Failed to load shipments');
            } finally {
                setLoading(false);
            }
        };

        loadShipments();
    }, []);

    return { shipments, loading, error };
};

export default useShipments;