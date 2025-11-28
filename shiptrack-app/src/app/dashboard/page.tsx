import React from 'react';
import { useShipments } from '../../hooks/useShipments';
import ShipmentStatus from '../../components/ShipmentStatus';
import TrackingTimeline from '../../components/TrackingTimeline';

const Dashboard: React.FC = () => {
    const { shipments, loading, error } = useShipments();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading shipments: {error.message}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shipments.map((shipment) => (
                    <div key={shipment.id} className="bg-white shadow-md rounded-lg p-4">
                        <ShipmentStatus shipment={shipment} />
                        <TrackingTimeline shipmentId={shipment.id} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;