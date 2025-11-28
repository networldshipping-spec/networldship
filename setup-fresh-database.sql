-- ========================================
-- FRESH DATABASE SETUP FOR SHIPTRACK
-- Run this in pgAdmin Query Tool for database: networld
-- ========================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;

-- Create shipments table with ALL fields
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    carrier VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Location Information
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    current_location VARCHAR(255),
    
    -- Dates
    estimated_delivery DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Sender Information
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    sender_phone VARCHAR(50),
    sender_address TEXT,
    sender_city VARCHAR(100),
    sender_country VARCHAR(100),
    
    -- Receiver Information
    receiver_name VARCHAR(255),
    receiver_email VARCHAR(255),
    receiver_phone VARCHAR(50),
    receiver_address TEXT,
    receiver_city VARCHAR(100),
    receiver_country VARCHAR(100),
    
    -- Package Details
    package_weight DECIMAL(10, 2),
    package_dimensions VARCHAR(100),
    package_description TEXT,
    shipping_cost DECIMAL(10, 2),
    
    -- Package Image (Optional)
    package_image_path VARCHAR(500),
    package_image_filename VARCHAR(255)
);

-- Create tracking_events table
CREATE TABLE tracking_events (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    event_date TIMESTAMP NOT NULL,
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX idx_tracking_events_date ON tracking_events(event_date);
CREATE INDEX idx_notifications_shipment ON notifications(shipment_id);
CREATE INDEX idx_notifications_tracking ON notifications(tracking_number);
CREATE INDEX idx_notifications_date ON notifications(sent_at DESC);

-- Insert sample data
INSERT INTO shipments (
    tracking_number, carrier, status, origin, destination, current_location, estimated_delivery,
    sender_name, sender_email, sender_phone, sender_address, sender_city, sender_country,
    receiver_name, receiver_email, receiver_phone, receiver_address, receiver_city, receiver_country,
    package_weight, package_description, shipping_cost
) VALUES 
(
    'TRK123456789', 'Express Shipping Co.', 'in-transit', 'New York, USA', 'London, UK', 'Frankfurt, Germany', '2025-11-30',
    'John Smith', 'john.smith@email.com', '+1-555-0101', '123 Main St', 'New York', 'USA',
    'Jane Doe', 'jane.doe@email.com', '+44-20-1234-5678', '456 Oxford St', 'London', 'UK',
    5.5, 'Electronics - Laptop', 150.00
),
(
    'TRK987654321', 'Global Express', 'delivered', 'Los Angeles, USA', 'Tokyo, Japan', 'Tokyo, Japan', '2025-11-28',
    'Mike Johnson', 'mike.j@email.com', '+1-555-0202', '789 Beach Blvd', 'Los Angeles', 'USA',
    'Yuki Tanaka', 'yuki.t@email.com', '+81-3-1234-5678', '321 Shibuya', 'Tokyo', 'Japan',
    3.2, 'Documents - Contracts', 89.99
),
(
    'TRK456789123', 'Pacific Cargo', 'pending', 'Paris, France', 'Sydney, Australia', 'Paris, France', '2025-12-03',
    'Marie Laurent', 'marie.l@email.com', '+33-1-4567-8901', '45 Rue de Rivoli', 'Paris', 'France',
    'David Wilson', 'david.w@email.com', '+61-2-9876-5432', '12 Harbour St', 'Sydney', 'Australia',
    12.0, 'Fashion - Clothing', 210.50
),
(
    'TRK789456123', 'Atlantic Freight', 'in-transit', 'Berlin, Germany', 'New York, USA', 'London, UK', '2025-12-01',
    'Hans Mueller', 'hans.m@email.com', '+49-30-1234-5678', '78 Unter den Linden', 'Berlin', 'Germany',
    'Sarah Brown', 'sarah.b@email.com', '+1-555-0303', '890 5th Avenue', 'New York', 'USA',
    8.5, 'Medical Equipment', 320.00
),
(
    'TRK321654987', 'Asia Express', 'in-transit', 'Dubai, UAE', 'Singapore', 'Mumbai, India', '2025-11-29',
    'Ahmed Al-Farsi', 'ahmed.af@email.com', '+971-4-123-4567', '234 Sheikh Zayed Rd', 'Dubai', 'UAE',
    'Li Wei', 'li.wei@email.com', '+65-6123-4567', '567 Orchard Rd', 'Singapore', 'Singapore',
    6.0, 'Technology - Smartphones', 180.75
),
(
    'TRK654987321', 'Continental Cargo', 'pending', 'Toronto, Canada', 'Mumbai, India', 'Toronto, Canada', '2025-12-02',
    'Emily Chen', 'emily.c@email.com', '+1-416-123-4567', '901 Bay Street', 'Toronto', 'Canada',
    'Raj Patel', 'raj.p@email.com', '+91-22-1234-5678', '123 Marine Drive', 'Mumbai', 'India',
    15.5, 'Books - Educational Materials', 125.00
);

-- Insert tracking events for sample shipments
INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT id, TIMESTAMP '2025-11-27 08:00:00', 'Package picked up', origin, 'Package has been picked up from sender'
FROM shipments WHERE tracking_number = 'TRK123456789';

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT id, TIMESTAMP '2025-11-27 14:30:00', 'Arrived at sorting facility', 'New York Hub', 'Package arrived at sorting facility'
FROM shipments WHERE tracking_number = 'TRK123456789';

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT id, TIMESTAMP '2025-11-27 22:15:00', 'In transit to international hub', 'JFK Airport', 'Package departed to international destination'
FROM shipments WHERE tracking_number = 'TRK123456789';

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT id, TIMESTAMP '2025-11-22 10:00:00', 'Package picked up', 'Los Angeles, USA', 'Package has been picked up from sender'
FROM shipments WHERE tracking_number = 'TRK987654321';

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT id, TIMESTAMP '2025-11-25 14:20:00', 'Delivered', 'Tokyo, Japan', 'Package has been successfully delivered'
FROM shipments WHERE tracking_number = 'TRK987654321';

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT id, TIMESTAMP '2025-11-27 11:00:00', 'Package received', 'Paris, France', 'Package received at origin facility'
FROM shipments WHERE tracking_number = 'TRK456789123';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for shipments table
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Display success message and table info
SELECT 'Database setup complete!' AS status;
SELECT 'Shipments table created with ' || COUNT(*) || ' sample records' AS info FROM shipments;
SELECT 'Tracking events table created with ' || COUNT(*) || ' events' AS info FROM tracking_events;

-- Show table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'shipments'
ORDER BY ordinal_position;
