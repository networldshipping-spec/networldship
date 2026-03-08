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

async function addInvoiceDocuments() {
    try {
        console.log('Adding invoice and receipt documents to TRK098765432...');
        
        const result = await pool.query(`
            UPDATE shipments 
            SET 
                invoice_path = $1,
                invoice_filename = $2,
                receipt_path = $3,
                receipt_filename = $4
            WHERE tracking_number = $5
            RETURNING tracking_number, invoice_path, receipt_path
        `, [
            'https://networldship.com/uploads/invoices/TRK098765432-invoice.pdf',
            'TRK098765432-invoice.pdf',
            'https://networldship.com/uploads/receipts/TRK098765432-receipt.pdf',
            'TRK098765432-receipt.pdf',
            'TRK098765432'
        ]);
        
        if (result.rows.length > 0) {
            console.log('✓ Successfully added invoice documents to:', result.rows[0].tracking_number);
            console.log('  Invoice:', result.rows[0].invoice_path);
            console.log('  Receipt:', result.rows[0].receipt_path);
        } else {
            console.log('✗ Tracking number not found');
        }
        
        // Verify
        const verify = await pool.query(
            'SELECT tracking_number, invoice_path, receipt_path, invoice_filename, receipt_filename FROM shipments WHERE tracking_number = $1',
            ['TRK098765432']
        );
        
        console.log('\nVerification:', verify.rows[0]);
        
    } catch (error) {
        console.error('Error adding invoice documents:', error);
    } finally {
        await pool.end();
    }
}

addInvoiceDocuments();
