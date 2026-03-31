const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const check = async () => {
    try {
        console.log('Connecting to MONGO_URI:', process.env.MONGO_URI ? 'FOUND' : 'NOT FOUND');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const Empresa = mongoose.model('Empresa', new mongoose.Schema({}, { strict: false }), 'empresas');
        const empresa = await Empresa.findOne();
        console.log('--- EMPRESA ---');
        console.log('nombre:', empresa?.nombre);
        console.log('logoUrl:', empresa?.logoUrl);
        
        const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false }), 'usuarios');
        const user = await Usuario.findOne({ login: 'gpoveda' });
        console.log('\n--- USUARIO (gpoveda) ---');
        console.log('nombre:', user?.nombre);
        console.log('fotoUrl:', user?.fotoUrl);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

check();
