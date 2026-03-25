const mongoose = require('mongoose');
const Modelo = require('./models/Modelo');

async function inspectRaw() {
    const id = '69b6ea01adb7f318ef5ef9bb';
    try {
        await mongoose.connect('mongodb://localhost:27017/gedsolution');
        
        const raw = await mongoose.connection.db.collection('modelos').findOne({ _id: new mongoose.Types.ObjectId(id) });
        console.log('--- RAW BSON FROM MONGODB ---');
        console.log(JSON.stringify(raw, null, 2));
        console.log('Type of condicion:', typeof raw.condicion);
        
        const m = await Modelo.findById(id);
        console.log('--- MOONGOOSE MODEL OBJECT ---');
        console.log('ID:', m._id);
        console.log('Condicion:', m.condicion);
        console.log('Type of m.condicion:', typeof m.condicion);
        
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

inspectRaw();
