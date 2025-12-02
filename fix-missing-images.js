// Script to clear image paths for files that don't exist
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixMissingImages() {
    try {
        console.log('🔍 Checking for shipments with missing image files...');
        
        // Get all shipments with image paths
        const result = await pool.query(
            'SELECT id, tracking_number, package_image_path, package_image_filename FROM shipments WHERE package_image_path IS NOT NULL'
        );
        
        if (result.rows.length === 0) {
            console.log('✅ No shipments with images found');
            process.exit(0);
        }
        
        console.log(`📦 Found ${result.rows.length} shipments with image paths`);
        
        let fixedCount = 0;
        
        for (const shipment of result.rows) {
            // Extract filename from path (e.g., /uploads/filename.jpg -> filename.jpg)
            const filename = shipment.package_image_path.replace('/uploads/', '');
            const filePath = path.join(__dirname, 'uploads', filename);
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log(`❌ Missing file for ${shipment.tracking_number}: ${filename}`);
                
                // Clear the image path in database
                await pool.query(
                    'UPDATE shipments SET package_image_path = NULL, package_image_filename = NULL WHERE id = $1',
                    [shipment.id]
                );
                
                console.log(`   ✅ Cleared image path for ${shipment.tracking_number}`);
                fixedCount++;
            } else {
                console.log(`✓ File exists for ${shipment.tracking_number}`);
            }
        }
        
        if (fixedCount > 0) {
            console.log(`\n🎉 Fixed ${fixedCount} shipment(s) with missing images`);
        } else {
            console.log('\n✅ All image files exist!');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixMissingImages();
