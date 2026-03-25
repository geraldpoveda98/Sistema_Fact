const mongoose = require('mongoose');

async function checkInvoice() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gedsolution');
        const Venta = mongoose.model('Venta', new mongoose.Schema({
            serie: String,
            numero: String,
            estado: String
        }), 'ventas');

        const factura = await Venta.findOne({ serie: 'FACT0000', numero: '000001' });
        console.log('--- FACTURA ENCONTRADA ---');
        console.log(JSON.stringify(factura, null, 2));
        
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkInvoice();
