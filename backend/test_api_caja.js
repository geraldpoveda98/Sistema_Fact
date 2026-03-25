const https = require('https');

const data = JSON.stringify({
    nombre: 'Caja API Test 2',
    condicion: true,
    usuario_creacion: '6593a8d11b34a6e8df888888'
});

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/cajas',
    method: 'POST',
    rejectUnauthorized: false,
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log(`BODY: ${body}`));
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
