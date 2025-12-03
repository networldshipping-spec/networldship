const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function testOrder() {
    try {
        const result = await pool.query(`
            SELECT s.tracking_number, te.event_date, te.status, te.location 
            FROM shipments s 
            JOIN tracking_events te ON s.id = te.shipment_id 
            WHERE s.tracking_number LIKE 'NWS%' 
            ORDER BY s.tracking_number, te.event_date DESC 
            LIMIT 10
        `);
        
        console.log('\nTracking Events (DESC order - newest first):');
        console.log('='.repeat(80));
        result.rows.forEach(row => {
            const date = new Date(row.event_date).toLocaleString();
            console.log(`${row.tracking_number} | ${date} | ${row.status}`);
        });
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

testOrder();
