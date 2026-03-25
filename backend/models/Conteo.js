const mongoose = require('mongoose');

const conteoSchema = new mongoose.Schema({
    compra: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Compra',
        required: true
    },
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
    detalles: [{
        articulo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Articulo',
            required: true
        },
        cantidad_esperada: {
            type: Number,
            required: true
        },
        conteo_fisico: {
            type: Number,
            required: true
        },
        diferencia: {
            type: Number,
            required: true
        }
    }],
    total_items: {
        type: Number,
        required: true
    },
    estado_diferencia: {
        type: String,
        enum: ['OK', 'DIFERENCIAS'],
        required: true,
        default: 'OK'
    },
    estado: {
        type: String,
        enum: ['Activo', 'Anulado'],
        default: 'Activo'
    }
}, { timestamps: true });

module.exports = mongoose.model('Conteo', conteoSchema);
