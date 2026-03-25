const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
    fecha: {
        type: Date,
        default: Date.now,
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        // Para ventas de "contado" rápidos podría ser opcional, depende la lógica
        required: false
    },
    caja: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caja',
        required: true
    },
    comprobante: {
        type: String,
        enum: ['Factura', 'Recibo', 'Ticket'],
        default: 'Factura'
    },
    tipo_pago: {
        type: String,
        enum: ['Efectivo', 'Tarjeta', 'Crédito', 'Transferencia', 'Cheque'],
        default: 'Efectivo'
    },
    serie: {
        type: String, // literal
        required: true
    },
    numero: {
        type: String,
        required: true
    },
    detalles: [{
        articulo: { type: mongoose.Schema.Types.ObjectId, ref: 'Articulo', required: true },
        cantidad: { type: Number, required: true },
        precio_venta: { type: Number, required: true },
        descuento: { type: Number, default: 0 },
        subtotal: { type: Number, required: true }
    }],
    total_ventas: { // subtotal sin iva
        type: Number,
        required: true,
        default: 0
    },
    impuesto_obj: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Impuesto'
    },
    impuesto_total: { // iva cantidad
        type: Number,
        required: true,
        default: 0
    },
    total_factura: { // Gran total
        type: Number,
        required: true,
        default: 0
    },
    total_credito: {
        type: Number,
        default: 0
    },
    dias_credito: {
        type: Number,
        default: 0
    },
    observaciones: {
        type: String,
        default: ''
    },
    estado: {
        type: String,
        enum: ['Emitida', 'Histórico', 'Anulada'], // Cambiado Emitido por Emitida
        default: 'Emitida'
    }
}, { timestamps: true });

// Índice para asegurar correlativos únicos por serie
ventaSchema.index({ serie: 1, numero: 1, comprobante: 1 }, { unique: true });

module.exports = mongoose.model('Venta', ventaSchema);
