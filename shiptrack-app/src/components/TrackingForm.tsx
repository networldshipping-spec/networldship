import React, { useState } from 'react';
import { useTracking } from '../hooks/useTracking';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

const TrackingForm: React.FC = () => {
    const [trackingNumber, setTrackingNumber] = useState('');
    const { trackShipment, loading, error } = useTracking();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingNumber) {
            await trackShipment(trackingNumber);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <Input
                type="text"
                placeholder="Enter Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
            />
            <Button type="submit" disabled={loading}>
                {loading ? 'Tracking...' : 'Track Shipment'}
            </Button>
            {error && <p className="text-red-500">{error}</p>}
        </form>
    );
};

export default TrackingForm;