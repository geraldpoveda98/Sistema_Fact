const mongoose = require('mongoose');

async function listCollections() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gedsolution');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('--- COLECCIONES EN gedsolution ---');
        collections.forEach(c => console.log(`- ${c.name}`));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

listCollections();
