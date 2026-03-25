const mongoose = require('mongoose');

async function detectCorruptIds() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gedsolution');
        const db = mongoose.connection.db;
        const collection = db.collection('modelos');
        
        const all = await collection.find({}).toArray();
        console.log(`Total documentos: ${all.length}`);
        
        all.forEach(doc => {
            console.log(`- ID: ${doc._id} | Type: ${typeof doc._id} | Constructor: ${doc._id.constructor.name} | Nombre: ${doc.nombre}`);
        });
        
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

detectCorruptIds();
