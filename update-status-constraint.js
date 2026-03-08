require('dotenv').config({ override: true });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function updateStatusConstraint() {
    try {
        console.log('🔄 Updating status constraint...');
        
        const sql = fs.readFileSync(path.join(__dirname, 'update-status-constraint.sql'), 'utf8');
        
        await pool.query(sql);
        
        console.log('✅ Status constraint updated successfully!');
        console.log('📋 New allowed statuses:');
        console.log('   - shipment-created');
        console.log('   - processing');
        console.log('   - pending');
        console.log('   - custom-check');
        console.log('   - detained');
        console.log('   - in-transit');
        console.log('   - out-for-delivery');
        console.log('   - arrived');
        console.log('   - awaiting-clearance');
        console.log('   - cleared');
        console.log('   - awaiting-payment');
        console.log('   - payment-received');
        console.log('   - delivered');
        
    } catch (error) {
        console.error('❌ Error updating constraint:', error.message);
    } finally {
        await pool.end();
        console.log('👋 Database connection closed');
    }
}

updateStatusConstraint();
