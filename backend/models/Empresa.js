const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        default: 'Mi Empresa'
    },
    ruc: {
        type: String,
        trim: true,
        default: ''
    },
    direccion: {
        type: String,
        trim: true,
        default: ''
    },
    telefono: {
        type: String,
        trim: true,
        default: ''
    },
    celular: {
        type: String,
        trim: true,
        default: ''
    },
    web: {
        type: String,
        trim: true,
        default: ''
    },
    correo: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    logoUrl: {
        type: String,
        default: '' // Ruta relativa donde se guardará el PNG
    },
    porcentajeCosto: {
        type: Number,
        default: 30, // 30% por defecto
        min: 0
    },
    valorDolar: {
        type: Number,
        default: 1, // Tasa de conversión (Ej: 36.50 córdobas por dólar)
        min: 0
    },
    mensaje_factura: {
        type: String,
        trim: true,
        default: 'GRACIAS POR SU COMPRA. Toda devolución o reclamo requiere presentación de factura original.'
    },
    mensaje_proforma: {
        type: String,
        trim: true,
        default: 'PROFORMA VÁLIDA POR 15 DÍAS. Precios sujetos a cambio sin previo aviso.'
    },
    mensaje_devolucion: {
        type: String,
        trim: true,
        default: 'DOCUMENTO VÁLIDO COMO CONSTANCIA DE REINGRESO. Este comprobante no es válido como factura de venta.'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Empresa', empresaSchema);
