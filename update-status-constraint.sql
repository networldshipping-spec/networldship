-- Drop the old status check constraint
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;

-- Add new constraint with all status options
ALTER TABLE shipments ADD CONSTRAINT shipments_status_check 
CHECK (status IN (
    'shipment-created',
    'processing',
    'pending',
    'custom-check',
    'detained',
    'in-transit',
    'out-for-delivery',
    'arrived',
    'awaiting-clearance',
    'cleared',
    'awaiting-payment',
    'payment-received',
    'delivered'
));
