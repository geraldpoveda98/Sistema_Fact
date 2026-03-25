const mongoose = require('mongoose');

const impuestoSchema = new mongoose.Schema({
    documento_aplicar: {
        type: String,
        required: true,
        enum: ['Venta', 'Compra']
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    porcentaje: {
        type: Number,
        required: true,
        min: 0,
        max: 100
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

module.exports = mongoose.model('Impuesto', impuestoSchema);
