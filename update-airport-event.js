// Script to update the airport event
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateEvent() {
    try {
        console.log('🔍 Finding event at "Lotnisko Chopina Warszawa"...\n');
        
        // Find the event
        const findResult = await pool.query(`
            SELECT te.id, te.status, te.location, te.description, te.event_date, s.tracking_number, s.id as shipment_id
            FROM tracking_events te
            JOIN shipments s ON te.shipment_id = s.id
            WHERE te.location = 'Lotnisko Chopina Warszawa'
            ORDER BY te.event_date DESC
            LIMIT 1
        `);
        
        if (findResult.rows.length === 0) {
            console.log('❌ No event found at "Lotnisko Chopina Warszawa"');
            process.exit(1);
        }
        
        const event = findResult.rows[0];
        console.log('Found event:');
        console.log(`  Tracking: ${event.tracking_number}`);
        console.log(`  ID: ${event.id}`);
        console.log(`  Status: ${event.status}`);
        console.log(`  Location: ${event.location}`);
        console.log(`  Description: ${event.description}`);
        console.log(`  Date: ${new Date(event.event_date).toLocaleString()}\n`);
        
        // Update the event
        console.log('Updating event...');
        await pool.query(`
            UPDATE tracking_events
            SET description = $1
            WHERE id = $2
        `, [
            'Package departed from Warsaw Chopin Airport',
            event.id
        ]);
        
        console.log('✅ Successfully updated!');
        console.log('   Description: Updated to "Package departed from Warsaw Chopin Airport"');
        console.log('   Status and location remain: in-transit at Lotnisko Chopina Warszawa');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateEvent();
