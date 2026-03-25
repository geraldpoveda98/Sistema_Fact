const mongoose = require('mongoose');

const compraSchema = new mongoose.Schema({
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    comprobante: {
        type: String,
        required: true
    },
    tipo_comprobante: {
        type: String,
        enum: ['factura', 'boleta', 'ticket', 'guia', 'inicial'],
        required: true,
        default: 'factura'
    },
    serie: {
        type: String,
        required: true
    },
    numero: {
        type: String,
        required: true
    },
    proveedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proveedor',
        required: true
    },
    comprador: {
        type: String
    },
    detalles: [{
        articulo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Articulo',
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            min: 1
        },
        precio_compra: {
            type: Number,
            required: true,
            min: 0
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    total_compra: {
        type: Number,
        required: true,
        default: 0
    },
    impuesto_nombre: {
        type: String
    },
    impuesto_porcentaje: {
        type: Number,
        default: 0
    },
    total_impuesto: {
        type: Number,
        default: 0
    },
    total_ingreso: {
        type: Number,
        required: true,
        default: 0
    },
    estado: {
        type: String,
        enum: ['Ingresos', 'Devolución', 'Anulado'],
        default: 'Ingresos'
    }
}, { timestamps: true });

module.exports = mongoose.model('Compra', compraSchema);
