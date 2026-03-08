-- Migration: Create notifications table for email tracking
-- Run this in pgAdmin to add notifications functionality

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL, -- 'sender' or 'receiver'
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_notifications_shipment ON notifications(shipment_id);
CREATE INDEX idx_notifications_tracking ON notifications(tracking_number);
CREATE INDEX idx_notifications_date ON notifications(sent_at DESC);

-- Add comment
COMMENT ON TABLE notifications IS 'Stores email notification history for shipments';
