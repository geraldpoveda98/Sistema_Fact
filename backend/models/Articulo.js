const mongoose = require('mongoose');

const articuloSchema = new mongoose.Schema({
    idcategoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        required: true
    },
    idmodelo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Modelo',
        required: true
    },
    codigo: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    numeroParte: {
        type: String,
        trim: true,
        default: ''
    },
    fabricante: {
        type: String,
        trim: true,
        default: ''
    },
    vehiculosCompatibles: [{
        type: String,
        trim: true
    }],
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    stock_minimo: {
        type: Number,
        required: true,
        default: 0
    },
    descripcion: {
        type: String,
        default: ''
    },
    imagen: {
        type: String,
        default: ''
    },
    costo_inventario: {
        type: Number,
        default: 0
    },
    precio_venta: {
        type: Number,
        default: 0
    },
    tipo_calculo_precio: {
        type: String,
        enum: ['Manual', 'Automatico'],
        default: 'Manual'
    },
    condicion: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Articulo', articuloSchema);
