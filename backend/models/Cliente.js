const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    tipo_documento: {
        type: String,
        default: 'DNI' // Ej: DNI, RUC, Pasaporte, Cédula
    },
    num_documento: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    telefono1: {
        type: String,
        trim: true
    },
    telefono2: {
        type: String,
        trim: true
    },
    direccion: {
        type: String,
        trim: true
    },
    credito: {
        type: Boolean,
        default: false
    },
    comentario: {
        type: String,
        trim: true
    },
    estado: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Cliente', clienteSchema);
