const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addInvoiceToAllShipments() {
    try {
        console.log('Adding invoice and receipt documents to all shipments...\n');
        
        // Get all shipments
        const allShipments = await pool.query('SELECT tracking_number FROM shipments');
        
        console.log(`Found ${allShipments.rows.length} shipments\n`);
        
        // Update each shipment
        for (const shipment of allShipments.rows) {
            const trackingNumber = shipment.tracking_number;
            
            const result = await pool.query(`
                UPDATE shipments 
                SET 
                    invoice_path = $1,
                    invoice_filename = $2,
                    receipt_path = $3,
                    receipt_filename = $4
                WHERE tracking_number = $5
                RETURNING tracking_number
            `, [
                `https://networldship.com/uploads/invoices/${trackingNumber}-invoice.pdf`,
                `${trackingNumber}-invoice.pdf`,
                `https://networldship.com/uploads/receipts/${trackingNumber}-receipt.pdf`,
                `${trackingNumber}-receipt.pdf`,
                trackingNumber
            ]);
            
            if (result.rows.length > 0) {
                console.log(`✓ ${trackingNumber} - Invoice and receipt added`);
            }
        }
        
        console.log('\n✅ All shipments updated successfully!');
        
        // Verify
        const verify = await pool.query(
            'SELECT COUNT(*) as total, COUNT(invoice_path) as with_invoice FROM shipments'
        );
        
        console.log(`\nVerification: ${verify.rows[0].with_invoice}/${verify.rows[0].total} shipments have invoice documents\n`);
        
    } catch (error) {
        console.error('Error adding invoice documents:', error);
    } finally {
        await pool.end();
    }
}

addInvoiceToAllShipments();
