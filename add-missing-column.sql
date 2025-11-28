-- Add missing package_image_path column to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_image_path VARCHAR(500);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_image_filename VARCHAR(255);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shipments' 
AND column_name LIKE '%image%';
