// Script to view and delete specific tracking events
require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function manageTrackingEvents() {
    try {
        // Ask for tracking number
        const trackingNumber = await question('Enter tracking number: ');
        
        if (!trackingNumber) {
            console.log('❌ Tracking number is required');
            rl.close();
            process.exit(1);
        }
        
        // Get shipment
        const shipmentResult = await pool.query(
            'SELECT * FROM shipments WHERE tracking_number = $1',
            [trackingNumber]
        );
        
        if (shipmentResult.rows.length === 0) {
            console.log(`❌ No shipment found with tracking number: ${trackingNumber}`);
            rl.close();
            process.exit(1);
        }
        
        const shipment = shipmentResult.rows[0];
        console.log(`\n📦 Shipment: ${shipment.tracking_number}`);
        console.log(`   Origin: ${shipment.origin} → Destination: ${shipment.destination}\n`);
        
        // Get all tracking events
        const eventsResult = await pool.query(
            'SELECT * FROM tracking_events WHERE shipment_id = $1 ORDER BY event_date DESC',
            [shipment.id]
        );
        
        if (eventsResult.rows.length === 0) {
            console.log('No tracking events found');
            rl.close();
            process.exit(0);
        }
        
        console.log(`Found ${eventsResult.rows.length} tracking event(s):\n`);
        
        eventsResult.rows.forEach((event, index) => {
            console.log(`${index + 1}. ID: ${event.id}`);
            console.log(`   Status: ${event.status}`);
            console.log(`   Location: ${event.location}`);
            console.log(`   Date: ${new Date(event.event_date).toLocaleString()}`);
            console.log(`   Description: ${event.description || 'N/A'}`);
            console.log('');
        });
        
        // Ask which to delete
        const deleteChoice = await question('Enter the ID of the event to delete (or "cancel" to exit): ');
        
        if (deleteChoice.toLowerCase() === 'cancel') {
            console.log('Operation cancelled');
            rl.close();
            process.exit(0);
        }
        
        const eventId = parseInt(deleteChoice);
        if (isNaN(eventId)) {
            console.log('❌ Invalid ID');
            rl.close();
            process.exit(1);
        }
        
        // Confirm deletion
        const confirm = await question(`Are you sure you want to delete event ID ${eventId}? (yes/no): `);
        
        if (confirm.toLowerCase() !== 'yes') {
            console.log('Operation cancelled');
            rl.close();
            process.exit(0);
        }
        
        // Delete the event
        const deleteResult = await pool.query(
            'DELETE FROM tracking_events WHERE id = $1 RETURNING *',
            [eventId]
        );
        
        if (deleteResult.rows.length === 0) {
            console.log(`❌ Event ID ${eventId} not found`);
        } else {
            console.log(`✅ Successfully deleted event ID ${eventId}`);
        }
        
        rl.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        rl.close();
        process.exit(1);
    }
}

manageTrackingEvents();
