const mongoose = require('mongoose');

const creditoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    definicion: {
        type: String,
        trim: true
    },
    porcentaje: {
        type: Number,
        default: 0
    },
    tiempo: {
        type: Number,
        default: 0
    },
    plazo: {
        type: String,
        enum: ['Dias', 'Meses', 'Años'],
        default: 'Dias'
    },
    estado: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Credito', creditoSchema);
