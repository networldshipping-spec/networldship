-- ========================================
-- RUN THIS IN PGADMIN TO UPDATE YOUR DATABASE
-- Database: networld
-- ========================================

-- Step 1: Add new columns to existing shipments table
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sender_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS sender_address TEXT,
ADD COLUMN IF NOT EXISTS sender_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS sender_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS receiver_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS receiver_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS receiver_address TEXT,
ADD COLUMN IF NOT EXISTS receiver_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS receiver_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS package_weight DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS package_dimensions VARCHAR(100),
ADD COLUMN IF NOT EXISTS package_description TEXT,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS invoice_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS invoice_filename VARCHAR(255),
ADD COLUMN IF NOT EXISTS receipt_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS receipt_filename VARCHAR(255);

-- Step 2: Update existing records with sample data (optional)
UPDATE shipments 
SET 
    sender_name = 'John Smith',
    sender_email = 'sender@email.com',
    sender_phone = '+1-555-0101',
    sender_address = '123 Main Street',
    sender_city = SPLIT_PART(origin, ',', 1),
    sender_country = TRIM(SPLIT_PART(origin, ',', 2)),
    receiver_name = 'Jane Doe',
    receiver_email = 'receiver@email.com',
    receiver_phone = '+1-555-0202',
    receiver_address = '456 Destination Street',
    receiver_city = SPLIT_PART(destination, ',', 1),
    receiver_country = TRIM(SPLIT_PART(destination, ',', 2)),
    package_weight = 5.0,
    package_description = 'General Package',
    shipping_cost = 100.00
WHERE sender_name IS NULL;

-- Step 3: Verify the changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'shipments'
ORDER BY ordinal_position;

-- Step 4: View updated data
SELECT 
    tracking_number,
    sender_name,
    sender_email,
    receiver_name,
    receiver_email,
    package_weight,
    shipping_cost
FROM shipments
LIMIT 5;

-- Success message
SELECT 'Database updated successfully! All new columns have been added.' AS status;
