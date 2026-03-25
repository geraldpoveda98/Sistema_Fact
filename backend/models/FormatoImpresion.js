const mongoose = require('mongoose');

const formatoImpresionSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    tipo_documento: {
        type: String,
        required: true,
        enum: ['Factura', 'Proforma', 'Devolución'],
        default: 'Factura'
    },
    tamano: {
        type: String,
        required: true,
        enum: ['Carta', 'Rollo POS', 'Oficial DGI'],
        default: 'Carta'
    },
    mensaje_pie: {
        type: String,
        trim: true,
        default: ''
    },
    predeterminado: {
        type: Boolean,
        default: false
    },
    estado: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FormatoImpresion', formatoImpresionSchema);
