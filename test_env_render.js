// Run this script from the local machine against the live Render API
async function checkEnv() {
    try {
        console.log('Testing Render Env Variables...');
        const response = await fetch('https://sistema-fact-backend.onrender.com/api/testEnv');
        const result = await response.json();
        console.log('\n--- RENDER ENV CHECK ---');
        console.log(result);
        console.log('------------------------\n');
    } catch (error) {
        console.error('Test failed:', error);
    }
}
checkEnv();
