import React from 'react';
import { useTracking } from '../hooks/useTracking';
import { TrackingEvent } from '../types/tracking';

const TrackingTimeline: React.FC = () => {
    const { trackingData, loading, error } = useTracking();

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">Error: {error.message}</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Shipment Tracking Timeline</h2>
            <ul className="space-y-4">
                {trackingData.map((event: TrackingEvent) => (
                    <li key={event.id} className="bg-white shadow-md rounded-lg p-4">
                        <h3 className="font-bold">{event.status}</h3>
                        <p className="text-gray-600">{event.timestamp}</p>
                        <p>{event.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TrackingTimeline;