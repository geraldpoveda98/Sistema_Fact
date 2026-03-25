require('dotenv').config();
const mongoose = require('mongoose');
const Caja = require('./models/Caja');

mongoose.connect(process.env.MONGO_URI, {}).then(async () => {
    try {
        console.log('MongoDB Conectado, probando inserción de Caja...');
        const nuevaCaja = new Caja({
            nombre: 'Prueba',
            condicion: true,
            usuario_creacion: new mongoose.Types.ObjectId()
        });
        await nuevaCaja.save();
        console.log('✅ Caja guardada exitosamente');
        process.exit(0);
    } catch (err) {
        console.log('❌ Error capturado:', err.message, err.name);
        console.log(err);
        process.exit(1);
    }
});
