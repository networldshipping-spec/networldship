interface Shipment {
  id: string;
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  origin: string;
  destination: string;
  estimatedDeliveryDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ShipmentDetails extends Shipment {
  events: ShipmentEvent[];
}

interface ShipmentEvent {
  timestamp: string;
  location: string;
  description: string;
}