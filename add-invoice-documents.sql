-- Add invoice and receipt paths to shipment TRK098765432
UPDATE shipments 
SET 
    invoice_path = 'https://networldship.com/uploads/invoices/TRK098765432-invoice.pdf',
    invoice_filename = 'TRK098765432-invoice.pdf',
    receipt_path = 'https://networldship.com/uploads/receipts/TRK098765432-receipt.pdf',
    receipt_filename = 'TRK098765432-receipt.pdf'
WHERE tracking_number = 'TRK098765432';

-- Verify the update
SELECT tracking_number, invoice_path, receipt_path, invoice_filename, receipt_filename 
FROM shipments 
WHERE tracking_number = 'TRK098765432';
