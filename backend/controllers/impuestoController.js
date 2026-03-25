const Impuesto = require('../models/Impuesto');

// Obtener todos los impuestos
exports.getAll = async (req, res) => {
    try {
        const impuestos = await Impuesto.find()
            .populate('usuario_creacion', 'nombre') // Traer el nombre del creador
            .sort({ createdAt: -1 });
        res.json(impuestos);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo impuestos' });
    }
};

// Crear impuesto
exports.create = async (req, res) => {
    try {
        const { documento_aplicar, descripcion, porcentaje, condicion, usuario_creacion } = req.body;

        const nuevoImpuesto = new Impuesto({
            documento_aplicar,
            descripcion,
            porcentaje,
            condicion: condicion !== undefined ? condicion : true,
            usuario_creacion
        });

        await nuevoImpuesto.save();

        // Devolver poblado para que la tabla en frontend se actualice de inmediato con el nombre
        const impuestoCreado = await Impuesto.findById(nuevoImpuesto._id).populate('usuario_creacion', 'nombre');

        res.status(201).json(impuestoCreado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el impuesto. ' + error.message });
    }
};

// Actualizar impuesto
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { documento_aplicar, descripcion, porcentaje, condicion } = req.body;

        const impuesto = await Impuesto.findById(id);
        if (!impuesto) {
            return res.status(404).json({ error: 'Impuesto no encontrado' });
        }

        if (documento_aplicar) impuesto.documento_aplicar = documento_aplicar;
        if (descripcion) impuesto.descripcion = descripcion;
        if (porcentaje !== undefined) impuesto.porcentaje = porcentaje;
        if (condicion !== undefined) impuesto.condicion = condicion;

        await impuesto.save();

        const impuestoActualizado = await Impuesto.findById(id).populate('usuario_creacion', 'nombre');
        res.json(impuestoActualizado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el impuesto' });
    }
};

// Eliminar impuesto
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await Impuesto.findByIdAndDelete(id);
        res.json({ mensaje: 'Impuesto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el impuesto' });
    }
};
