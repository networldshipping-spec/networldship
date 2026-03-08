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

async function updateEvent() {
    try {
        // Get the processing event for shipment TRK342567219
        const result = await pool.query(
            `SELECT te.* FROM tracking_events te
             JOIN shipments s ON te.shipment_id = s.id
             WHERE s.tracking_number = $1 AND te.status = $2
             ORDER BY te.event_date DESC
             LIMIT 1`,
            ['TRK342567219', 'processing']
        );
        
        if (result.rows.length === 0) {
            console.log('Processing event not found');
            await pool.end();
            return;
        }
        
        const event = result.rows[0];
        console.log('Found event:', event);
        
        // Update to Dec 1, 2025 at 2:55 PM
        const updateResult = await pool.query(
            `UPDATE tracking_events 
             SET event_date = $1 
             WHERE id = $2
             RETURNING *`,
            ['2025-12-01T14:55:00', event.id]
        );
        
        console.log('Event updated:', updateResult.rows[0]);
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

updateEvent();
