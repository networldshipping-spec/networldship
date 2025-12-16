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

async function updateInvoiceUrls() {
    try {
        console.log('Updating invoice URLs to localhost...\n');
        
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
                `http://localhost:3000/uploads/invoices/${trackingNumber}-invoice.pdf`,
                `${trackingNumber}-invoice.pdf`,
                `http://localhost:3000/uploads/receipts/${trackingNumber}-receipt.pdf`,
                `${trackingNumber}-receipt.pdf`,
                trackingNumber
            ]);
            
            if (result.rows.length > 0) {
                console.log(`✓ ${trackingNumber} - URLs updated to localhost`);
            }
        }
        
        console.log('\n✅ All invoice URLs updated successfully!');
        
    } catch (error) {
        console.error('Error updating invoice URLs:', error);
    } finally {
        await pool.end();
    }
}

updateInvoiceUrls();
