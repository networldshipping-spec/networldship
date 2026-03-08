const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function addRecipientTypeColumn() {
    try {
        console.log('🔧 Adding recipient_type column to notifications table...\n');

        // Add recipient_type column if it doesn't exist
        await pool.query(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20)
        `);

        console.log('✅ recipient_type column added successfully!');

        // Show table structure
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'notifications'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 Notifications table columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

addRecipientTypeColumn();
