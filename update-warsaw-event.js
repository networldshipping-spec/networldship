// Script to update specific tracking event
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
        console.log('🔍 Finding event with "Warsaw, Canada"...\n');
        
        // Find the event
        const findResult = await pool.query(`
            SELECT te.id, te.status, te.location, te.description, te.event_date, s.tracking_number, s.id as shipment_id
            FROM tracking_events te
            JOIN shipments s ON te.shipment_id = s.id
            WHERE te.location LIKE '%Warsaw, Canada%'
            ORDER BY te.event_date DESC
            LIMIT 1
        `);
        
        if (findResult.rows.length === 0) {
            console.log('❌ No event found with "Warsaw, Canada"');
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
            SET status = $1, location = $2, description = $3
            WHERE id = $4
        `, [
            'processing',
            'Warsaw, Poland',
            'Shipment created and received at Warsaw, Poland',
            event.id
        ]);
        
        // Also update the shipment's current location and status if this is the latest event
        await pool.query(`
            UPDATE shipments
            SET status = $1, current_location = $2
            WHERE id = $3
        `, [
            'processing',
            'Warsaw, Poland',
            event.shipment_id
        ]);
        
        console.log('✅ Successfully updated!');
        console.log('   Status: pending → processing');
        console.log('   Location: Warsaw, Canada → Warsaw, Poland');
        console.log('   Description updated');
        console.log('   Shipment status and location also updated');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateEvent();
