// Script to remove duplicate tracking events
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

async function removeDuplicates() {
    try {
        console.log('🔍 Searching for duplicate tracking events...\n');
        
        // Find duplicate events (same shipment_id, status, location, and similar timestamps)
        const duplicatesQuery = `
            SELECT 
                t1.id as id1,
                t2.id as id2,
                t1.shipment_id,
                t1.status,
                t1.location,
                t1.event_date as date1,
                t2.event_date as date2,
                t1.description,
                s.tracking_number
            FROM tracking_events t1
            JOIN tracking_events t2 ON 
                t1.shipment_id = t2.shipment_id 
                AND t1.status = t2.status 
                AND t1.location = t2.location
                AND t1.id < t2.id
                AND ABS(EXTRACT(EPOCH FROM (t1.event_date - t2.event_date))) < 10
            JOIN shipments s ON t1.shipment_id = s.id
            ORDER BY t1.shipment_id, t1.event_date DESC
        `;
        
        const result = await pool.query(duplicatesQuery);
        
        if (result.rows.length === 0) {
            console.log('✅ No duplicate tracking events found!');
            process.exit(0);
        }
        
        console.log(`Found ${result.rows.length} duplicate event(s):\n`);
        
        // Display duplicates
        result.rows.forEach((dup, index) => {
            console.log(`${index + 1}. Tracking: ${dup.tracking_number}`);
            console.log(`   Status: ${dup.status}`);
            console.log(`   Location: ${dup.location}`);
            console.log(`   Event 1 ID: ${dup.id1} - ${new Date(dup.date1).toLocaleString()}`);
            console.log(`   Event 2 ID: ${dup.id2} - ${new Date(dup.date2).toLocaleString()}`);
            console.log(`   Will keep: ID ${dup.id1}, Will delete: ID ${dup.id2}\n`);
        });
        
        // Delete the newer duplicate (keep the older one)
        let deletedCount = 0;
        for (const dup of result.rows) {
            await pool.query('DELETE FROM tracking_events WHERE id = $1', [dup.id2]);
            deletedCount++;
            console.log(`✅ Deleted duplicate event ID ${dup.id2}`);
        }
        
        console.log(`\n🎉 Successfully removed ${deletedCount} duplicate tracking event(s)!`);
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

removeDuplicates();
