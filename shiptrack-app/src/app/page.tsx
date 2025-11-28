import React from 'react';
import Header from '../components/Header';
import { useShipments } from '../hooks/useShipments';

const HomePage: React.FC = () => {
  const { shipments, loading, error } = useShipments();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading shipments: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Header />
      <h1 className="text-2xl font-bold mb-4">Welcome to ShipTrack</h1>
      <p className="mb-4">Track your shipments in real-time.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold">{shipment.title}</h2>
            <p>Status: {shipment.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;