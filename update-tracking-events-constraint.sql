-- Drop the old status check constraint on tracking_events
ALTER TABLE tracking_events DROP CONSTRAINT IF EXISTS tracking_events_status_check;

-- Add new constraint with all status options
ALTER TABLE tracking_events ADD CONSTRAINT tracking_events_status_check 
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
