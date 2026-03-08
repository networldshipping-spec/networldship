-- ========================================
-- CREATE CONVERSATIONS TABLE FOR EMAIL INBOX
-- Run this in pgAdmin Query Tool for database: networld
-- ========================================

-- Create conversations table to store email threads
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id),
    tracking_number VARCHAR(50),
    sender_type VARCHAR(20) CHECK (sender_type IN ('admin', 'sender', 'receiver')),
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    subject VARCHAR(500),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_conversations_shipment ON conversations(shipment_id);
CREATE INDEX idx_conversations_tracking ON conversations(tracking_number);
CREATE INDEX idx_conversations_read ON conversations(is_read);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

SELECT 'Conversations table created successfully!' AS status;
