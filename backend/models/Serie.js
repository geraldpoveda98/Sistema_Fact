const mongoose = require('mongoose');

const serieSchema = new mongoose.Schema({
    documento: {
        type: String,
        required: true,
        enum: ['Venta', 'Compra']
    },
    tipo: {
        type: String,
        required: true,
        enum: ['Proforma', 'Factura', 'Devolución', 'Inicial', 'Ingreso']
    },
    serie: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    caja: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caja',
        required: false // Solo requerido si es Venta
    },
    proveedor: {
        type: String,
        required: false, // Solo para compras
        trim: true
    },
    correlativo_actual: {
        type: Number,
        default: 1
    },
    condicion: {
        type: Boolean,
        default: true
    },
    usuario_creacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Serie', serieSchema);
