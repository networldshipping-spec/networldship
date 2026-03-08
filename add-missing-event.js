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

async function addEvent() {
    try {
        // Get shipment
        const shipment = await pool.query(
            'SELECT * FROM shipments WHERE tracking_number = $1',
            ['TRK342567219']
        );
        
        if (shipment.rows.length === 0) {
            console.log('Shipment not found');
            await pool.end();
            return;
        }
        
        const s = shipment.rows[0];
        
        // Create initial tracking event
        const result = await pool.query(
            `INSERT INTO tracking_events 
            (shipment_id, event_date, status, location, description) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [s.id, s.created_at, s.status, s.origin, 'Shipment created and processing initiated']
        );
        
        console.log('Event created:', result.rows[0]);
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

addEvent();
