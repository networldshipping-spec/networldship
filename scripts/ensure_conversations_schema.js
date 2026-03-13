const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.DB_URL;
if (!connectionString) {
    console.error('DATABASE_URL not set in environment');
    process.exit(1);
}

const useSsl = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';
const client = new Client({ connectionString, ssl: useSsl ? { rejectUnauthorized: false } : false });

const statements = [
    `CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY
    );`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS shipment_id INTEGER;`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(50);`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20);`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sender_email VARCHAR(255);`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS subject VARCHAR(500);`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS message TEXT;`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `CREATE INDEX IF NOT EXISTS idx_conversations_shipment ON conversations(shipment_id);`,
    `CREATE INDEX IF NOT EXISTS idx_conversations_tracking ON conversations(tracking_number);`,
    `CREATE INDEX IF NOT EXISTS idx_conversations_read ON conversations(is_read);`,
    `CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);`
];

async function ensure() {
    try {
        await client.connect();
        console.log('Connected to DB — ensuring conversations schema');
        for (const s of statements) {
            try {
                await client.query(s);
            } catch (err) {
                console.warn('Statement failed (continuing):', err.message || err);
            }
        }
        console.log('Schema ensure completed');
    } catch (err) {
        console.error('Error ensuring schema:', err.message || err);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

ensure();
