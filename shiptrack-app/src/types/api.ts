// This file defines TypeScript interfaces for API responses and requests.

export interface TrackingRequest {
    trackingNumber: string;
}

export interface TrackingResponse {
    status: string;
    location: string;
    estimatedDelivery: string;
    events: TrackingEvent[];
}

export interface TrackingEvent {
    timestamp: string;
    description: string;
    location?: string;
}

export interface ShipmentRequest {
    shipmentId: string;
    destination: string;
    weight: number;
}

export interface ShipmentResponse {
    shipmentId: string;
    status: string;
    trackingNumber: string;
    createdAt: string;
    updatedAt: string;
}