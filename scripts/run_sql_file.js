const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function runSqlFile(filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');

    const connectionString = process.env.DATABASE_URL || process.env.DB_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not set in environment');
        process.exit(1);
    }

    // Enable SSL if host is not localhost (common for managed Postgres)
    const useSsl = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

    const client = new Client({
        connectionString,
        ssl: useSsl ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('Connected to database. Running SQL file:', filePath);
        // Split into statements and run each to allow continuing past existing objects
        const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
        for (const stmt of statements) {
            try {
                await client.query(stmt);
            } catch (err) {
                console.warn('Statement failed (continuing):', err.message || err);
            }
        }
        console.log('SQL file executed (attempted all statements).');
    } catch (err) {
        console.error('Error executing SQL file:', err.message || err);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '002_conversations_table.sql');
runSqlFile(sqlPath);
