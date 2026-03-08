// Quick script to run database migration
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'networld',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function runMigration() {
    try {
        console.log('Running migration: Add attachments column...');
        
        await pool.query(`
            ALTER TABLE conversations 
            ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_conversations_attachments 
            ON conversations USING gin(attachments);
        `);
        
        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
