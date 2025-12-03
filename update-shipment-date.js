const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function updateDate() {
    try {
        // Update the shipment created_at date
        await pool.query(
            `UPDATE shipments 
            SET created_at = $1 
            WHERE tracking_number = $2`,
            ['2025-12-01T11:42:00', 'TRK342567219']
        );
        
        console.log('Shipment date updated to Dec 1, 2025');
        
        // Update the tracking event date
        await pool.query(
            `UPDATE tracking_events 
            SET event_date = $1 
            WHERE shipment_id = (SELECT id FROM shipments WHERE tracking_number = $2)`,
            ['2025-12-01T11:42:00', 'TRK342567219']
        );
        
        console.log('Tracking event date updated to Dec 1, 2025');
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

updateDate();
