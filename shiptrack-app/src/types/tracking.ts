interface TrackingInfo {
  trackingNumber: string;
  status: string;
  estimatedDelivery: string;
  currentLocation: string;
  events: TrackingEvent[];
}

interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
}

interface TrackingResponse {
  success: boolean;
  data: TrackingInfo | null;
  error?: string;
}