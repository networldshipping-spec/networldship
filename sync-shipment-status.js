// Script to update shipment status to in-transit
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

async function updateShipmentStatus() {
    try {
        console.log('🔍 Finding shipment TRK465820417...\n');
        
        // Find the shipment
        const shipmentResult = await pool.query(`
            SELECT * FROM shipments WHERE tracking_number = 'TRK465820417'
        `);
        
        if (shipmentResult.rows.length === 0) {
            console.log('❌ Shipment not found');
            process.exit(1);
        }
        
        const shipment = shipmentResult.rows[0];
        console.log('Found shipment:');
        console.log(`  Tracking: ${shipment.tracking_number}`);
        console.log(`  Current Status: ${shipment.status}`);
        console.log(`  Current Location: ${shipment.current_location}\n`);
        
        // Get latest tracking event
        const latestEvent = await pool.query(`
            SELECT * FROM tracking_events
            WHERE shipment_id = $1
            ORDER BY event_date DESC
            LIMIT 1
        `, [shipment.id]);
        
        if (latestEvent.rows.length > 0) {
            const event = latestEvent.rows[0];
            console.log('Latest tracking event:');
            console.log(`  Status: ${event.status}`);
            console.log(`  Location: ${event.location}`);
            console.log(`  Date: ${new Date(event.event_date).toLocaleString()}\n`);
            
            // Update shipment to match latest event
            console.log('Updating shipment status to match latest event...');
            await pool.query(`
                UPDATE shipments
                SET status = $1, current_location = $2
                WHERE id = $3
            `, [event.status, event.location, shipment.id]);
            
            console.log('✅ Successfully updated!');
            console.log(`   Status: ${shipment.status} → ${event.status}`);
            console.log(`   Location: ${shipment.current_location} → ${event.location}`);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateShipmentStatus();
