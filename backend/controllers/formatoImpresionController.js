const FormatoImpresion = require('../models/FormatoImpresion');

// Listar todos los formatos
exports.listar = async (req, res) => {
    try {
        const formatos = await FormatoImpresion.find().sort({ tipo_documento: 1, nombre: 1 });
        res.json(formatos);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar formatos de impresión' });
    }
};

// Crear nuevo formato
exports.crear = async (req, res) => {
    try {
        const { nombre, tipo_documento, tamano, mensaje_pie, predeterminado } = req.body;

        // Si este formato es predeterminado, quitar el predeterminado a los demás del mismo tipo
        if (predeterminado) {
            await FormatoImpresion.updateMany({ tipo_documento }, { predeterminado: false });
        } else {
            // Si no es predeterminado, verificar si es el primero de su tipo, si es el primero forzar predeterminado true
            const conteo = await FormatoImpresion.countDocuments({ tipo_documento });
            if (conteo === 0) {
                req.body.predeterminado = true;
            }
        }

        const nuevoFormato = new FormatoImpresion({
            nombre,
            tipo_documento,
            tamano,
            mensaje_pie,
            predeterminado: req.body.predeterminado || predeterminado
        });

        await nuevoFormato.save();
        res.status(201).json(nuevoFormato);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el formato de impresión' });
    }
};

// Actualizar formato
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo_documento, tamano, mensaje_pie, predeterminado } = req.body;

        if (predeterminado) {
            await FormatoImpresion.updateMany({ tipo_documento, _id: { $ne: id } }, { predeterminado: false });
        }

        const formatoActualizado = await FormatoImpresion.findByIdAndUpdate(
            id,
            { nombre, tipo_documento, tamano, mensaje_pie, predeterminado },
            { new: true }
        );

        if (!formatoActualizado) return res.status(404).json({ error: 'Formato no encontrado' });
        res.json(formatoActualizado);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el formato' });
    }
};

// Cambiar estado
exports.cambiarEstado = async (req, res) => {
    try {
        const formato = await FormatoImpresion.findById(req.params.id);
        if (!formato) return res.status(404).json({ error: 'Formato no encontrado' });

        formato.estado = !formato.estado;
        await formato.save();
        res.json(formato);
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
};

// Eliminar formato
exports.eliminar = async (req, res) => {
    try {
        const formato = await FormatoImpresion.findById(req.params.id);
        if (!formato) return res.status(404).json({ error: 'Formato no encontrado' });

        // Si eliminamos uno predeterminado, intentar hacer predeterminado a otro
        if (formato.predeterminado) {
            const otroFormato = await FormatoImpresion.findOne({ tipo_documento: formato.tipo_documento, _id: { $ne: formato._id } });
            if (otroFormato) {
                otroFormato.predeterminado = true;
                await otroFormato.save();
            }
        }

        await FormatoImpresion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Formato eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el formato' });
    }
};
