-- ========================================
-- UPDATE EXISTING SHIPMENTS WITH SENDER/RECEIVER DATA
-- Run this in pgAdmin Query Tool for database: networld
-- ========================================

-- Update TRK123456789
UPDATE shipments 
SET 
    sender_name = 'John Smith',
    sender_email = 'john.smith@email.com',
    sender_phone = '+1-555-0101',
    sender_address = '123 Main St',
    sender_city = 'New York',
    sender_country = 'USA',
    receiver_name = 'Jane Doe',
    receiver_email = 'jane.doe@email.com',
    receiver_phone = '+44-20-1234-5678',
    receiver_address = '456 Oxford St',
    receiver_city = 'London',
    receiver_country = 'UK',
    package_weight = 5.5,
    package_description = 'Electronics - Laptop',
    shipping_cost = 150.00
WHERE tracking_number = 'TRK123456789';

-- Update TRK987654321
UPDATE shipments 
SET 
    sender_name = 'Mike Johnson',
    sender_email = 'mike.j@email.com',
    sender_phone = '+1-555-0202',
    sender_address = '789 Beach Blvd',
    sender_city = 'Los Angeles',
    sender_country = 'USA',
    receiver_name = 'Yuki Tanaka',
    receiver_email = 'yuki.t@email.com',
    receiver_phone = '+81-3-1234-5678',
    receiver_address = '321 Shibuya',
    receiver_city = 'Tokyo',
    receiver_country = 'Japan',
    package_weight = 3.2,
    package_description = 'Documents - Contracts',
    shipping_cost = 89.99
WHERE tracking_number = 'TRK987654321';

-- Update TRK456789123
UPDATE shipments 
SET 
    sender_name = 'Marie Laurent',
    sender_email = 'marie.l@email.com',
    sender_phone = '+33-1-4567-8901',
    sender_address = '45 Rue de Rivoli',
    sender_city = 'Paris',
    sender_country = 'France',
    receiver_name = 'David Wilson',
    receiver_email = 'david.w@email.com',
    receiver_phone = '+61-2-9876-5432',
    receiver_address = '12 Harbour St',
    receiver_city = 'Sydney',
    receiver_country = 'Australia',
    package_weight = 12.0,
    package_description = 'Fashion - Clothing',
    shipping_cost = 210.50
WHERE tracking_number = 'TRK456789123';

-- Update TRK789456123
UPDATE shipments 
SET 
    sender_name = 'Hans Mueller',
    sender_email = 'hans.m@email.com',
    sender_phone = '+49-30-1234-5678',
    sender_address = '78 Unter den Linden',
    sender_city = 'Berlin',
    sender_country = 'Germany',
    receiver_name = 'Sarah Brown',
    receiver_email = 'sarah.b@email.com',
    receiver_phone = '+1-555-0303',
    receiver_address = '890 5th Avenue',
    receiver_city = 'New York',
    receiver_country = 'USA',
    package_weight = 8.5,
    package_description = 'Medical Equipment',
    shipping_cost = 320.00
WHERE tracking_number = 'TRK789456123';

-- Update TRK321654987
UPDATE shipments 
SET 
    sender_name = 'Ahmed Al-Farsi',
    sender_email = 'ahmed.af@email.com',
    sender_phone = '+971-4-123-4567',
    sender_address = '234 Sheikh Zayed Rd',
    sender_city = 'Dubai',
    sender_country = 'UAE',
    receiver_name = 'Li Wei',
    receiver_email = 'li.wei@email.com',
    receiver_phone = '+65-6123-4567',
    receiver_address = '567 Orchard Rd',
    receiver_city = 'Singapore',
    receiver_country = 'Singapore',
    package_weight = 6.0,
    package_description = 'Technology - Smartphones',
    shipping_cost = 180.75
WHERE tracking_number = 'TRK321654987';

-- Update TRK654987321
UPDATE shipments 
SET 
    sender_name = 'Emily Chen',
    sender_email = 'emily.c@email.com',
    sender_phone = '+1-416-123-4567',
    sender_address = '901 Bay Street',
    sender_city = 'Toronto',
    sender_country = 'Canada',
    receiver_name = 'Raj Patel',
    receiver_email = 'raj.p@email.com',
    receiver_phone = '+91-22-1234-5678',
    receiver_address = '123 Marine Drive',
    receiver_city = 'Mumbai',
    receiver_country = 'India',
    package_weight = 15.5,
    package_description = 'Books - Educational Materials',
    shipping_cost = 125.00
WHERE tracking_number = 'TRK654987321';

-- Verify updates
SELECT 
    tracking_number, 
    sender_name, 
    receiver_name, 
    shipping_cost,
    package_description
FROM shipments 
ORDER BY tracking_number;

SELECT 'All shipments updated with sender/receiver information!' AS status;
