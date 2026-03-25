const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    tipo_documento: {
        type: String,
        required: true,
    },
    num_documento: {
        type: String,
        required: true,
    },
    direccion: {
        type: String,
        required: false,
    },
    telefono: {
        type: String,
        required: false,
    },
    celular: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    cargo: {
        type: String,
        required: false,
    },
    login: {
        type: String,
        required: true,
        unique: true,
    },
    clave: {
        type: String,
        required: true,
    },
    condicion: {
        type: Boolean,
        default: true,
    },
    fotoUrl: {
        type: String,
        required: false,
    },
    // Relacionados con permisos simplificados por ahora
    permisos: [{
        type: String
    }]
}, {
    timestamps: true // Agrega createdAt y updatedAt automaticamente
});

// Encriptar la contraseña antes de guardarla
usuarioSchema.pre('save', async function () {
    if (!this.isModified('clave')) {
        return;
    }
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.clave = await bcrypt.hash(this.clave, salt);
});

// Método para verificar la contraseña
usuarioSchema.methods.matchClave = async function (claveIngresada) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(claveIngresada, this.clave);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
