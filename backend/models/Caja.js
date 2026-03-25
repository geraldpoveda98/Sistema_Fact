const mongoose = require('mongoose');

const cajaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        unique: true
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

module.exports = mongoose.model('Caja', cajaSchema);
