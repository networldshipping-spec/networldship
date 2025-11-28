-- Migration: Replace invoice/receipt fields with package image field
-- Run this in pgAdmin to update existing database

-- Drop old document columns
ALTER TABLE shipments 
DROP COLUMN IF EXISTS invoice_path,
DROP COLUMN IF EXISTS invoice_filename,
DROP COLUMN IF EXISTS receipt_path,
DROP COLUMN IF EXISTS receipt_filename;

-- Add new package image columns
ALTER TABLE shipments 
ADD COLUMN package_image_path VARCHAR(500),
ADD COLUMN package_image_filename VARCHAR(255);

-- Note: This migration will remove existing invoice and receipt file references
-- Make sure to backup the database before running this migration
