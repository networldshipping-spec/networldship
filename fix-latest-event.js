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

async function fixLatestEvent() {
    try {
        console.log('🔄 Fixing latest tracking event description...\n');
        
        // Find the latest event for this shipment
        const findResult = await pool.query(`
            SELECT te.*, s.tracking_number 
            FROM tracking_events te
            JOIN shipments s ON te.shipment_id = s.id
            WHERE s.tracking_number = 'TRK465820417'
            ORDER BY te.event_date DESC
            LIMIT 1
        `);
        
        if (findResult.rows.length === 0) {
            console.log('❌ No tracking event found');
            return;
        }
        
        const event = findResult.rows[0];
        console.log('Found event:');
        console.log(`  ID: ${event.id}`);
        console.log(`  Date: ${event.event_date}`);
        console.log(`  Status: ${event.status}`);
        console.log(`  Location: ${event.location}`);
        console.log(`  Old Description: ${event.description}\n`);
        
        // Update with concise description
        const newDescription = 'Package out for delivery to Dover Delaware, United States of America';
        
        await pool.query(
            'UPDATE tracking_events SET description = $1 WHERE id = $2',
            [newDescription, event.id]
        );
        
        console.log('✅ Updated description to:');
        console.log(`  ${newDescription}\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

fixLatestEvent();
