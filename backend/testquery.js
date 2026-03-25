const mongoose = require('mongoose');
const Compra = require('./models/Compra');
const Articulo = require('./models/Articulo');

require('dotenv').config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rpm_admin');
    console.log("Connected");
    try {
        const query = { estado: 'Ingresos' };
        const compras = await Compra.find(query)
            .populate('usuario', 'nombre')
            .populate('proveedor', 'nombre ruc')
            .sort({ fecha: -1 })
            .lean();

        console.log("Found:", compras.length);
        console.log(compras[0]);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

test();
