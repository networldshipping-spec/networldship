import React from 'react';
import { useShipments } from '../hooks/useShipments';

const ShipmentStatus: React.FC<{ trackingNumber: string }> = ({ trackingNumber }) => {
    const { shipment, error, isLoading } = useShipments(trackingNumber);

    if (isLoading) {
        return <div className="text-center">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">Error: {error.message}</div>;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">Shipment Status</h2>
            {shipment ? (
                <div>
                    <p><strong>Tracking Number:</strong> {shipment.trackingNumber}</p>
                    <p><strong>Status:</strong> {shipment.status}</p>
                    <p><strong>Estimated Delivery:</strong> {shipment.estimatedDelivery}</p>
                </div>
            ) : (
                <p>No shipment found for this tracking number.</p>
            )}
        </div>
    );
};

export default ShipmentStatus;