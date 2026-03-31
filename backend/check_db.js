const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sistema_fact');
        console.log('Connected to DB');
        
        const Empresa = mongoose.model('Empresa', new mongoose.Schema({}, { strict: false }), 'empresas');
        const empresa = await Empresa.findOne();
        console.log('Empresa Data:', JSON.stringify(empresa, null, 2));
        
        const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false }), 'usuarios');
        const usuarios = await Usuario.find({}, { nombre: 1, fotoUrl: 1 });
        console.log('Usuarios Data:', JSON.stringify(usuarios, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
