require('dotenv').config({ override: true });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

async function checkTrackingEvents() {
    try {
        console.log('🔍 Checking tracking events for TRK465820417...\n');
        
        const result = await pool.query(`
            SELECT te.*, s.tracking_number 
            FROM tracking_events te
            JOIN shipments s ON te.shipment_id = s.id
            WHERE s.tracking_number = 'TRK465820417'
            ORDER BY te.event_date DESC
        `);
        
        console.log(`Found ${result.rows.length} tracking events:\n`);
        
        result.rows.forEach((event, index) => {
            console.log(`Event ${index + 1}:`);
            console.log(`  ID: ${event.id}`);
            console.log(`  Date: ${event.event_date}`);
            console.log(`  Status: ${event.status}`);
            console.log(`  Location: ${event.location}`);
            console.log(`  Description: ${event.description}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTrackingEvents();
