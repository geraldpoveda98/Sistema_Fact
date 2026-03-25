const mongoose = require('mongoose');
require('dotenv').config();
const Articulo = require('./models/Articulo');
const Compra = require('./models/Compra');
const Empresa = require('./models/Empresa');

async function syncInventory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        const empresa = await Empresa.findOne();
        const porcentajeUtilidad = empresa ? (empresa.porcentajeCosto / 100) : 0.30;
        console.log(`ℹ️ Base Utility Margin: ${porcentajeUtilidad * 100}%`);

        const articulos = await Articulo.find({});
        console.log(`🔍 Found ${articulos.length} articles to process.`);

        let updatedCount = 0;

        for (const articulo of articulos) {
            // Buscamos la ULTIMA compra de este articulo (estado 'Ingresos')
            const ultimaCompra = await Compra.findOne({ 
                'detalles.articulo': articulo._id,
                estado: 'Ingresos'
            }).sort({ fecha: -1, createdAt: -1 });

            if (ultimaCompra) {
                const detalle = ultimaCompra.detalles.find(d => d.articulo.toString() === articulo._id.toString());
                if (detalle) {
                    const taxRate = (ultimaCompra.impuesto_porcentaje || 0) / 100;
                    const costoConImpuesto = detalle.precio_compra * (1 + taxRate);
                    
                    articulo.costo_inventario = costoConImpuesto;
                    
                    if (articulo.tipo_calculo_precio === 'Automatico') {
                        articulo.precio_venta = costoConImpuesto * (1 + porcentajeUtilidad);
                    }

                    await articulo.save();
                    updatedCount++;
                    console.log(`✨ Updated: ${articulo.nombre} (Code: ${articulo.codigo}) | New Cost: ${costoConImpuesto} | New Price: ${articulo.precio_venta}`);
                }
            }
        }

        console.log(`\n✅ Finished sync. Updated ${updatedCount} articles.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during sync:', err);
        process.exit(1);
    }
}

syncInventory();
