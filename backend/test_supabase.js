require('dotenv').config({ path: __dirname + '/.env' });
const { compressAndUpload } = require('./utils/imageHelper');

async function testUpload() {
    try {
        console.log('Testing Supabase upload...');
        
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            console.error('❌ Missing Supabase credentials in .env');
            return;
        }
        console.log('Credentials loaded. Target bucket: gedsolution');

        // Create a dummy image buffer (a tiny 1x1 transparent PNG)
        const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

        const url = await compressAndUpload(dummyImageBuffer, 'gedsolution', 'test');
        console.log('✅ Upload successful! Public URL:', url);
    } catch (error) {
        console.error('❌ Upload failed:');
        console.error(error);
    }
}

testUpload();
