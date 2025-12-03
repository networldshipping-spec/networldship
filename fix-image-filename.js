const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function fixImagePath() {
    try {
        // Get shipment with space in filename
        const result = await pool.query(
            `SELECT * FROM shipments WHERE tracking_number = $1`,
            ['TRK342567219']
        );
        
        if (result.rows.length === 0) {
            console.log('Shipment not found');
            await pool.end();
            return;
        }
        
        const shipment = result.rows[0];
        const oldPath = shipment.package_image_path;
        const oldFilename = shipment.package_image_filename;
        
        console.log('Old path:', oldPath);
        console.log('Old filename:', oldFilename);
        
        if (!oldPath || !oldFilename) {
            console.log('No image to fix');
            await pool.end();
            return;
        }
        
        // Create new filename without spaces
        const newFilename = oldFilename.replace(/\s+/g, '-');
        const newPath = oldPath.replace(/\s+/g, '-');
        
        console.log('New path:', newPath);
        console.log('New filename:', newFilename);
        
        // Rename file on local server (if running locally)
        const localOldPath = path.join(__dirname, oldPath);
        const localNewPath = path.join(__dirname, newPath);
        
        if (fs.existsSync(localOldPath)) {
            fs.renameSync(localOldPath, localNewPath);
            console.log('File renamed locally');
        } else {
            console.log('File not found locally (might be on remote server)');
        }
        
        // Update database
        await pool.query(
            `UPDATE shipments 
             SET package_image_path = $1, package_image_filename = $2 
             WHERE id = $3`,
            [newPath, newFilename, shipment.id]
        );
        
        console.log('Database updated successfully');
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

fixImagePath();
