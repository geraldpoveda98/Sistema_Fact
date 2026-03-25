const mongoose = require('mongoose');

const detalleProformaSchema = new mongoose.Schema({
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
    precio_venta: {
        type: Number,
        required: true
    },
    descuento: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        required: true
    }
});

const proformaSchema = new mongoose.Schema({
    caja: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caja',
        required: true
    },
    serie: {
        type: String,
        required: true // Ej. PRF
    },
    numero: {
        type: String,
        required: true // Ej. 000001
    },
    fecha: {
        type: Date,
        default: Date.now,
        required: true
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    impuesto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Impuesto',
        // Puede ser null si es Exento de IVA, pero es buena práctica ligarlo
        required: false
    },
    tipo_pago: {
        type: String,
        enum: ['Efectivo', 'Tarjeta', 'Crédito', 'Transferencia', 'Cheque'],
        required: true,
        default: 'Efectivo'
    },
    detalles: [detalleProformaSchema],
    subtotal: {
        type: Number,
        required: true
    },
    iva: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    dias_credito: {
        type: Number,
        default: 0
    },
    estado: {
        type: String,
        enum: ['Emitida', 'Vencida', 'Convertida_Factura', 'Anulada'],
        default: 'Emitida'
    },
    observaciones: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Índice para asegurar que Número de Proforma + Serie sean únicos
proformaSchema.index({ serie: 1, numero: 1 }, { unique: true });

module.exports = mongoose.model('Proforma', proformaSchema);
