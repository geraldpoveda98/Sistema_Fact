// Run this script from the local machine against the live Render API
async function checkEnv() {
    try {
        console.log('Testing Render Env Variables...');
        const response = await fetch('https://sistema-fact-backend.onrender.com/api/empresa/testEnv');
        const text = await response.text();
        console.log('\n--- RENDER ENV CHECK ---');
        console.log('Status code:', response.status);
        console.log('Response:', text.substring(0, 500));
        console.log('------------------------\n');
    } catch (error) {
        console.error('Test failed:', error);
    }
}
checkEnv();
