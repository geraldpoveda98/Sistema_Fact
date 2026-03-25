const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    direccion: {
        type: String,
        trim: true
    },
    correo: {
        type: String,
        trim: true,
        lowercase: true
    },
    web_oficial: {
        type: String,
        trim: true
    },
    ruc: {
        type: String,
        trim: true
    },
    telefono_1: {
        type: String,
        trim: true
    },
    telefono_2: {
        type: String,
        trim: true
    },
    contacto_nombre: {
        type: String,
        trim: true
    },
    contacto_telefono: {
        type: String,
        trim: true
    },
    estado: {
        type: Boolean,
        default: true
    },
    usuario_creacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, { timestamps: true });

module.exports = mongoose.model('Proveedor', proveedorSchema);
