const mongoose = require('mongoose');
require('dotenv').config();
const Usuario = require('./models/Usuario');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log('✅ Conectado a MongoDB para la inyección de semilla (seeder).');

        // Limpiar tabla
        await Usuario.deleteMany();

        // Insertar usuario de prueba
        const nuevoUsuario = new Usuario({
            nombre: 'Gerald Poveda',
            tipo_documento: 'CEDULA',
            num_documento: '001-XXXXXX-XXXXX',
            direccion: 'Masaya',
            telefono: '87865819',
            email: 'gpoveda@ejemplo.com',
            cargo: 'Administrador',
            login: 'gpoveda',
            clave: 'admin',
            condicion: true,
            permisos: ['Escritorio', 'Almacen', 'Compras', 'Ventas', 'Administración']
        });

        await nuevoUsuario.save();
        console.log('✨ Base de datos alimentada con éxito: Creado usuario "gpoveda" con clave "admin".');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error sembrando la BD:', error);
        process.exit(1);
    }
};

seedDB();
