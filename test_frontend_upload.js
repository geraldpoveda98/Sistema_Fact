const fs = require('fs');

async function testUpload() {
    try {
        const fileBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
        const data = new FormData();
        data.append('nombre', 'GEDSODLUTION');
        data.append('logo', new Blob([fileBuffer], { type: 'image/png' }), 'test.png');

        console.log('Testing debug endpoint...');
        const response = await fetch('https://sistema-fact-backend.onrender.com/api/empresa/debug_upload', {
            method: 'POST',
            body: data
        });

        const text = await response.text();
        console.log('\n--- DEBUG ENDPOINT ---');
        console.log('Status code:', response.status);
        console.log('Raw Response:', text.substring(0, 500));
        console.log('----------------------\n');
        
        console.log('Testing actual upload endpoint...');
        const responseReal = await fetch('https://sistema-fact-backend.onrender.com/api/empresa', {
            method: 'POST',
            body: data
        });

        const textReal = await responseReal.text();
        console.log('\n--- REAL UPLOAD ---');
        console.log('Status code:', responseReal.status);
        console.log('Raw Response:', textReal.substring(0, 500));
        console.log('----------------------\n');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testUpload();
