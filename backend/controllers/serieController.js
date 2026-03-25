const Serie = require('../models/Serie');
const Venta = require('../models/Venta');
const Compra = require('../models/Compra');
const Proforma = require('../models/Proforma');
const Devolucion = require('../models/Devolucion');

exports.getAll = async (req, res) => {
    try {
        const series = await Serie.find()
            .populate('caja', 'nombre')
            .populate('usuario_creacion', 'nombre')
            .sort({ createdAt: -1 });
        res.json(series);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo series' });
    }
};

exports.create = async (req, res) => {
    try {
        const { documento, tipo, serie, caja, proveedor, correlativo_actual, condicion, usuario_creacion } = req.body;

        // Validar unique serie
        const existeSerie = await Serie.findOne({ serie: new RegExp(`^${serie}$`, 'i') });
        if (existeSerie) {
            return res.status(400).json({ error: 'Ya existe este consecutivo/serie' });
        }

        const nuevaSerie = new Serie({
            documento,
            tipo,
            serie,
            // Guardar caja solo si aplica y viene relleno
            caja: caja || undefined,
            proveedor: documento === 'Compra' ? proveedor : undefined,
            correlativo_actual: correlativo_actual !== undefined ? correlativo_actual : 1,
            condicion: condicion !== undefined ? condicion : true,
            usuario_creacion
        });

        await nuevaSerie.save();

        const serieCreada = await Serie.findById(nuevaSerie._id)
            .populate('caja', 'nombre')
            .populate('usuario_creacion', 'nombre');

        res.status(201).json(serieCreada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la serie. ' + error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { documento, tipo, serie, caja, proveedor, correlativo_actual, condicion } = req.body;

        const item = await Serie.findById(id);
        if (!item) return res.status(404).json({ error: 'Serie no encontrada' });

        if (documento) item.documento = documento;
        if (tipo) item.tipo = tipo;
        if (serie) {
            const existeSerie = await Serie.findOne({ serie: new RegExp(`^${serie}$`, 'i'), _id: { $ne: id } });
            if (existeSerie) return res.status(400).json({ error: 'Ese número de serie ya está en uso' });
            item.serie = serie;
        }

        // Permitir limpiar caja ("" o nulo)
        if (caja !== undefined) {
            item.caja = caja || undefined;
        }

        if (proveedor !== undefined) {
            item.proveedor = item.documento === 'Compra' ? proveedor : undefined;
        }

        if (correlativo_actual !== undefined) {
            item.correlativo_actual = correlativo_actual;
        }

        if (condicion !== undefined) item.condicion = condicion;

        await item.save();

        const serieActualizada = await Serie.findById(id)
            .populate('caja', 'nombre')
            .populate('usuario_creacion', 'nombre');

        res.json(serieActualizada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la serie' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await Serie.findByIdAndDelete(id);
        res.json({ mensaje: 'Serie eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la serie' });
    }
};
// Verificar si una serie está en uso por algún documento
exports.checkUso = async (req, res) => {
    try {
        const { id } = req.params;
        const serieDoc = await Serie.findById(id);
        if (!serieDoc) return res.status(404).json({ error: 'Serie no encontrada' });

        const nombreSerie = serieDoc.serie;
        let enUso = false;

        // Verificar en Ventas
        const venta = await Venta.findOne({ serie: nombreSerie });
        if (venta) enUso = true;

        // Verificar en Compras
        if (!enUso) {
            const compra = await Compra.findOne({ serie: nombreSerie });
            if (compra) enUso = true;
        }

        // Verificar en Proformas
        if (!enUso) {
            const proforma = await Proforma.findOne({ serie: nombreSerie });
            if (proforma) enUso = true;
        }

        // Verificar en Devoluciones
        if (!enUso) {
            const devolucion = await Devolucion.findOne({ serie: nombreSerie });
            if (devolucion) enUso = true;
        }

        res.json({ enUso });
    } catch (error) {
        console.error("Error al verificar uso de serie:", error);
        res.status(500).json({ error: 'Error interno al verificar uso' });
    }
};
