// Script to update the airport event description
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

async function updateDescription() {
    try {
        console.log('🔍 Finding event with "Package departed from Warsaw Chopin Airport"...\n');
        
        // Find the event
        const findResult = await pool.query(`
            SELECT te.id, te.status, te.location, te.description, te.event_date, s.tracking_number
            FROM tracking_events te
            JOIN shipments s ON te.shipment_id = s.id
            WHERE te.description = 'Package departed from Warsaw Chopin Airport'
            ORDER BY te.event_date DESC
            LIMIT 1
        `);
        
        if (findResult.rows.length === 0) {
            console.log('❌ No event found with that description');
            process.exit(1);
        }
        
        const event = findResult.rows[0];
        console.log('Found event:');
        console.log(`  Tracking: ${event.tracking_number}`);
        console.log(`  ID: ${event.id}`);
        console.log(`  Status: ${event.status}`);
        console.log(`  Location: ${event.location}`);
        console.log(`  Current Description: ${event.description}`);
        console.log(`  Date: ${new Date(event.event_date).toLocaleString()}\n`);
        
        // Update the description
        console.log('Updating description...');
        await pool.query(`
            UPDATE tracking_events
            SET description = $1
            WHERE id = $2
        `, [
            'Package departed to Warsaw Chopin Airport',
            event.id
        ]);
        
        console.log('✅ Successfully updated!');
        console.log('   Description: "from" → "to"');
        console.log('   New description: "Package departed to Warsaw Chopin Airport"');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateDescription();
