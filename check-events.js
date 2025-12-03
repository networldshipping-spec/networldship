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

async function checkEvents() {
    try {
        // Check shipment
        const shipment = await pool.query(
            'SELECT * FROM shipments WHERE tracking_number = $1',
            ['TRK342567219']
        );
        console.log('Shipment:', shipment.rows[0]);
        
        if (shipment.rows.length > 0) {
            // Check events for this shipment
            const events = await pool.query(
                'SELECT * FROM tracking_events WHERE shipment_id = $1 ORDER BY event_date DESC',
                [shipment.rows[0].id]
            );
            console.log('\nTracking Events Count:', events.rows.length);
            console.log('Events:', JSON.stringify(events.rows, null, 2));
        }
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
    }
}

checkEvents();
