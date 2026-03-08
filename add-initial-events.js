// Script to add initial tracking events to shipments that don't have any
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

async function addInitialEvents() {
    try {
        console.log('🔍 Checking for shipments without tracking events...');
        
        // Find all shipments that don't have any tracking events
        const shipmentsWithoutEvents = await pool.query(`
            SELECT s.* 
            FROM shipments s
            LEFT JOIN tracking_events te ON s.id = te.shipment_id
            WHERE te.id IS NULL
        `);
        
        if (shipmentsWithoutEvents.rows.length === 0) {
            console.log('✅ All shipments already have tracking events!');
            process.exit(0);
        }
        
        console.log(`📦 Found ${shipmentsWithoutEvents.rows.length} shipments without events`);
        
        // Add initial tracking event for each shipment
        for (const shipment of shipmentsWithoutEvents.rows) {
            const initialLocation = shipment.current_location || shipment.origin;
            const initialDescription = `Shipment created and received at ${initialLocation}`;
            
            await pool.query(
                `INSERT INTO tracking_events 
                (shipment_id, event_date, status, location, description) 
                VALUES ($1, $2, $3, $4, $5)`,
                [shipment.id, shipment.created_at, shipment.status, initialLocation, initialDescription]
            );
            
            console.log(`✅ Added initial event for tracking number: ${shipment.tracking_number}`);
        }
        
        console.log(`\n🎉 Successfully added initial events to ${shipmentsWithoutEvents.rows.length} shipments!`);
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error adding initial events:', error);
        process.exit(1);
    }
}

addInitialEvents();
