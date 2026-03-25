const mongoose = require('mongoose');

const devolucionSchema = new mongoose.Schema({
    facturaOrigen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venta',
        required: true
    },
    caja: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caja',
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    serie: {
        type: String, // Serie de la devolución, ej: D001
        required: true
    },
    numero: {
        type: String, // Correlativo de la devolución
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now,
        required: true
    },
    observaciones: {
        type: String,
        default: 'Devolución de factura procesada por garantía/error.'
    },
    estado: {
        type: String,
        enum: ['Procesada', 'Anulada'],
        default: 'Procesada'
    }
}, { timestamps: true });

// Índice para asegurar correlativos únicos por serie
devolucionSchema.index({ serie: 1, numero: 1 }, { unique: true });

module.exports = mongoose.model('Devolucion', devolucionSchema);
