-- Database Setup for ShipTrack Application
-- Database: networld
-- User: postgres
-- Password: 103258

-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    carrier VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    estimated_delivery DATE,
    current_location VARCHAR(255),
    
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
    
    -- Shipment Details
    package_weight DECIMAL(10, 2),
    package_dimensions VARCHAR(100),
    package_description TEXT,
    shipping_cost DECIMAL(10, 2),
    
    -- Document Storage
    invoice_path VARCHAR(500),
    invoice_filename VARCHAR(255),
    receipt_path VARCHAR(500),
    receipt_filename VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tracking_events table
CREATE TABLE IF NOT EXISTS tracking_events (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    event_date TIMESTAMP NOT NULL,
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_date ON tracking_events(event_date);

-- Insert sample data
INSERT INTO shipments (
    tracking_number, origin, destination, carrier, status, estimated_delivery, current_location,
    sender_name, sender_email, sender_phone, sender_address, sender_city, sender_country,
    receiver_name, receiver_email, receiver_phone, receiver_address, receiver_city, receiver_country,
    package_weight, package_description, shipping_cost
)
VALUES 
    ('TRK123456789', 'New York, USA', 'London, UK', 'Express Shipping Co.', 'in-transit', '2025-11-28', 'Frankfurt, Germany',
     'John Smith', 'john.smith@email.com', '+1-555-0101', '123 Main St', 'New York', 'USA',
     'Jane Doe', 'jane.doe@email.com', '+44-20-1234-5678', '456 Oxford St', 'London', 'UK',
     5.5, 'Electronics - Laptop', 150.00),
    ('TRK987654321', 'Los Angeles, USA', 'Tokyo, Japan', 'Global Express', 'delivered', '2025-11-25', 'Tokyo, Japan',
     'Mike Johnson', 'mike.j@email.com', '+1-555-0202', '789 Beach Blvd', 'Los Angeles', 'USA',
     'Yuki Tanaka', 'yuki.t@email.com', '+81-3-1234-5678', '321 Shibuya', 'Tokyo', 'Japan',
     3.2, 'Documents - Contracts', 89.99),
    ('TRK456789123', 'Paris, France', 'Sydney, Australia', 'Pacific Cargo', 'pending', '2025-12-01', 'Paris, France',
     'Marie Laurent', 'marie.l@email.com', '+33-1-4567-8901', '45 Rue de Rivoli', 'Paris', 'France',
     'David Wilson', 'david.w@email.com', '+61-2-9876-5432', '12 Harbour St', 'Sydney', 'Australia',
     12.0, 'Fashion - Clothing', 210.50),
    ('TRK789456123', 'Berlin, Germany', 'New York, USA', 'Atlantic Freight', 'in-transit', '2025-11-29', 'London, UK',
     'Hans Mueller', 'hans.m@email.com', '+49-30-1234-5678', '78 Unter den Linden', 'Berlin', 'Germany',
     'Sarah Brown', 'sarah.b@email.com', '+1-555-0303', '890 5th Avenue', 'New York', 'USA',
     8.5, 'Medical Equipment', 320.00),
    ('TRK321654987', 'Dubai, UAE', 'Singapore', 'Asia Express', 'in-transit', '2025-11-27', 'Mumbai, India',
     'Ahmed Al-Farsi', 'ahmed.af@email.com', '+971-4-123-4567', '234 Sheikh Zayed Rd', 'Dubai', 'UAE',
     'Li Wei', 'li.wei@email.com', '+65-6123-4567', '567 Orchard Rd', 'Singapore', 'Singapore',
     6.0, 'Technology - Smartphones', 180.75),
    ('TRK654987321', 'Toronto, Canada', 'Mumbai, India', 'Continental Cargo', 'pending', '2025-11-30', 'Toronto, Canada',
     'Emily Chen', 'emily.c@email.com', '+1-416-123-4567', '901 Bay Street', 'Toronto', 'Canada',
     'Raj Patel', 'raj.p@email.com', '+91-22-1234-5678', '123 Marine Drive', 'Mumbai', 'India',
     15.5, 'Books - Educational Materials', 125.00)
ON CONFLICT (tracking_number) DO NOTHING;

-- Insert tracking events for TRK123456789
INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-26 08:00:00',
    'Package picked up',
    'New York, USA',
    'Package has been picked up from sender'
FROM shipments WHERE tracking_number = 'TRK123456789'
ON CONFLICT DO NOTHING;

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-26 14:30:00',
    'Arrived at sorting facility',
    'New York Hub',
    'Package arrived at sorting facility'
FROM shipments WHERE tracking_number = 'TRK123456789'
ON CONFLICT DO NOTHING;

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-26 22:15:00',
    'In transit to international hub',
    'JFK Airport',
    'Package departed to international destination'
FROM shipments WHERE tracking_number = 'TRK123456789'
ON CONFLICT DO NOTHING;

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-27 06:45:00',
    'Arrived at transit point',
    'Frankfurt, Germany',
    'Package arrived at transit hub'
FROM shipments WHERE tracking_number = 'TRK123456789'
ON CONFLICT DO NOTHING;

-- Insert tracking events for TRK987654321
INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-22 10:00:00',
    'Package picked up',
    'Los Angeles, USA',
    'Package has been picked up from sender'
FROM shipments WHERE tracking_number = 'TRK987654321'
ON CONFLICT DO NOTHING;

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-22 16:30:00',
    'Departed from origin',
    'LAX Airport',
    'Package departed from origin country'
FROM shipments WHERE tracking_number = 'TRK987654321'
ON CONFLICT DO NOTHING;

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-24 08:15:00',
    'Arrived at destination country',
    'Tokyo Hub',
    'Package cleared customs and arrived at local hub'
FROM shipments WHERE tracking_number = 'TRK987654321'
ON CONFLICT DO NOTHING;

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-25 09:30:00',
    'Out for delivery',
    'Tokyo, Japan',
    'Package is out for delivery'
FROM shipments WHERE tracking_number = 'TRK987654321'
ON CONFLICT DO NOTHING;

INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-25 14:20:00',
    'Delivered',
    'Tokyo, Japan',
    'Package has been successfully delivered'
FROM shipments WHERE tracking_number = 'TRK987654321'
ON CONFLICT DO NOTHING;

-- Insert tracking events for TRK456789123
INSERT INTO tracking_events (shipment_id, event_date, status, location, description)
SELECT 
    id,
    TIMESTAMP '2025-11-26 11:00:00',
    'Package received',
    'Paris, France',
    'Package received at origin facility'
FROM shipments WHERE tracking_number = 'TRK456789123'
ON CONFLICT DO NOTHING;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for shipments table
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Display table information
SELECT 'Shipments table created and populated' as message;
SELECT COUNT(*) as total_shipments FROM shipments;
SELECT COUNT(*) as total_tracking_events FROM tracking_events;
