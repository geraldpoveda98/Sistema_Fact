const mongoose = require('mongoose');
require('dotenv').config();
const Articulo = require('./models/Articulo');
const Compra = require('./models/Compra');

async function debugPricing() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const code = '000205321564';
        const articulo = await Articulo.findOne({ codigo: code });
        
        if (!articulo) {
            console.log('Articulo not found');
            return;
        }

        console.log('Articulo Data:', {
            nombre: articulo.nombre,
            costo: articulo.costo_inventario,
            precio: articulo.precio_venta,
            tipo: articulo.tipo_calculo_precio
        });

        const ultimasCompras = await Compra.find({ 'detalles.articulo': articulo._id })
            .sort({ fecha: -1 })
            .limit(1);

        if (ultimasCompras.length > 0) {
            console.log('Last Purchase found:', {
                fecha: ultimasCompras[0].fecha,
                comprobante: ultimasCompras[0].comprobante,
                detalles: ultimasCompras[0].detalles.find(d => d.articulo.toString() === articulo._id.toString())
            });
        } else {
            console.log('No purchases found for this article.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugPricing();
