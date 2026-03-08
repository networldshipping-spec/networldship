import { useState, useEffect } from 'react';
import { TrackingData } from '../types/tracking';
import { fetchTrackingData } from '../lib/api/client';

const useTracking = (trackingNumber: string) => {
    const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getTrackingData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchTrackingData(trackingNumber);
                setTrackingData(data);
            } catch (err) {
                setError('Failed to fetch tracking data');
            } finally {
                setLoading(false);
            }
        };

        if (trackingNumber) {
            getTrackingData();
        }
    }, [trackingNumber]);

    return { trackingData, loading, error };
};

export default useTracking;