import React, { useEffect, useState } from 'react';
import TrackingForm from '../../components/TrackingForm';
import TrackingTimeline from '../../components/TrackingTimeline';
import { ShipmentTrackingData } from '../../types/tracking';

const TrackingPage: React.FC = () => {
  const [trackingData, setTrackingData] = useState<ShipmentTrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingData = async (trackingNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tracking?number=${trackingNumber}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracking data');
      }
      const data = await response.json();
      setTrackingData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Track Your Shipment</h1>
      <TrackingForm onSubmit={fetchTrackingData} />
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {trackingData && <TrackingTimeline data={trackingData} />}
    </div>
  );
};

export default TrackingPage;