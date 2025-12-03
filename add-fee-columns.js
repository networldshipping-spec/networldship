const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function addFeeColumns() {
    try {
        console.log('🔧 Adding fee columns to shipments table...\n');

        // Add fee columns if they don't exist
        const alterQueries = [
            `ALTER TABLE shipments ADD COLUMN IF NOT EXISTS insurance_fee DECIMAL(10, 2) DEFAULT 25.00`,
            `ALTER TABLE shipments ADD COLUMN IF NOT EXISTS customs_fee DECIMAL(10, 2) DEFAULT 50.00`,
            `ALTER TABLE shipments ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(10, 2) DEFAULT 15.00`
        ];

        for (const query of alterQueries) {
            await pool.query(query);
            console.log(`✅ ${query.split('ADD COLUMN IF NOT EXISTS ')[1].split(' ')[0]} column added/verified`);
        }

        // Update existing shipments with default values if null
        await pool.query(`
            UPDATE shipments 
            SET insurance_fee = 25.00 
            WHERE insurance_fee IS NULL
        `);
        
        await pool.query(`
            UPDATE shipments 
            SET customs_fee = 50.00 
            WHERE customs_fee IS NULL
        `);
        
        await pool.query(`
            UPDATE shipments 
            SET handling_fee = 15.00 
            WHERE handling_fee IS NULL
        `);

        console.log('\n✅ All fee columns added successfully!');
        console.log('📊 Existing shipments updated with default fee values');

        // Show sample data
        const result = await pool.query(`
            SELECT tracking_number, shipping_cost, insurance_fee, customs_fee, handling_fee
            FROM shipments
            LIMIT 3
        `);

        if (result.rows.length > 0) {
            console.log('\n📋 Sample shipment fees:');
            result.rows.forEach(row => {
                console.log(`  ${row.tracking_number}:`);
                console.log(`    Shipping: $${row.shipping_cost || '0.00'}`);
                console.log(`    Insurance: $${row.insurance_fee || '0.00'}`);
                console.log(`    Customs: $${row.customs_fee || '0.00'}`);
                console.log(`    Handling: $${row.handling_fee || '0.00'}`);
            });
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

addFeeColumns();
