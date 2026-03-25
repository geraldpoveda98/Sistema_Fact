const mongoose = require('mongoose');
require('dotenv').config();
const Categoria = require('./models/Categoria');
const Modelo = require('./models/Modelo');
const Articulo = require('./models/Articulo');

const testInventario = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log('✅ Conectado a MongoDB para inyectar datos de prueba de inventario.');

        // Limpiar colecciones
        await Categoria.deleteMany();
        await Modelo.deleteMany();
        await Articulo.deleteMany();

        // 1. Crear Categorías
        const catRedes = await Categoria.create({ nombre: 'Equipos de Red', descripcion: 'Routers, Switches, Access Points' });
        const catCCTV = await Categoria.create({ nombre: 'Cámaras CCTV', descripcion: 'Cámaras de seguridad análogas e IP' });

        // 2. Crear Modelos
        const modTpLink = await Modelo.create({ nombre: 'TP-Link TL-WR841N', descripcion: 'Router Inalámbrico N 300Mbps' });
        const modHikvision = await Modelo.create({ nombre: 'Hikvision DS-2CE56D0T-IRF', descripcion: 'Cámara Domo 1080p' });

        // 3. Crear Artículos
        const art1 = await Articulo.create({
            idcategoria: catRedes._id,
            idmodelo: modTpLink._id,
            codigo: 'RED-001',
            nombre: 'Router TP-Link Básico',
            stock: 15,
            stock_minimo: 5,
            descripcion: 'Router ideal para el hogar.'
        });

        const art2 = await Articulo.create({
            idcategoria: catCCTV._id,
            idmodelo: modHikvision._id,
            codigo: 'CAM-001',
            nombre: 'Cámara Domo Hikvision 2MP',
            stock: 8,
            stock_minimo: 3,
            descripcion: 'Cámara para interiores.'
        });

        console.log('✨ Datos de inventario inyectados exitosamente.');

        // Verificar listado
        const articulosGuardados = await Articulo.find()
            .populate('idcategoria', 'nombre')
            .populate('idmodelo', 'nombre');

        console.log('📌 Artículos en BD:', JSON.stringify(articulosGuardados, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error inyectando datos de inventario:', error);
        process.exit(1);
    }
};

testInventario();
