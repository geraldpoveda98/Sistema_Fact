const Caja = require('../models/Caja');

// Obtener todas las cajas
exports.getAll = async (req, res) => {
    try {
        const cajas = await Caja.find()
            .populate('usuario_creacion', 'nombre')
            .sort({ createdAt: -1 });
        res.json(cajas);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo cajas' });
    }
};

// Crear caja
exports.create = async (req, res) => {
    try {
        const { nombre, condicion, usuario_creacion } = req.body;

        // Validar si existe caja con el mismo nombre
        const existeCaja = await Caja.findOne({ nombre: new RegExp(`^${nombre}$`, 'i') });
        if (existeCaja) {
            return res.status(400).json({ error: 'Ya existe una caja con ese nombre' });
        }

        const nuevaCaja = new Caja({
            nombre,
            condicion: condicion !== undefined ? condicion : true,
            usuario_creacion
        });

        await nuevaCaja.save();
        const cajaCreada = await Caja.findById(nuevaCaja._id).populate('usuario_creacion', 'nombre');

        res.status(201).json(cajaCreada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la caja. ' + error.message });
    }
};

// Actualizar caja
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, condicion } = req.body;

        const caja = await Caja.findById(id);
        if (!caja) return res.status(404).json({ error: 'Caja no encontrada' });

        if (nombre) {
            // Verificar colisión
            const existeCaja = await Caja.findOne({ nombre: new RegExp(`^${nombre}$`, 'i'), _id: { $ne: id } });
            if (existeCaja) return res.status(400).json({ error: 'Ese nombre de caja ya está en uso' });
            caja.nombre = nombre;
        }

        if (condicion !== undefined) caja.condicion = condicion;

        await caja.save();
        const cajaActualizada = await Caja.findById(id).populate('usuario_creacion', 'nombre');
        res.json(cajaActualizada);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la caja' });
    }
};

// Eliminar caja
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        // Opcional: Validar si la caja está siendo usada en una Serie antes de eliminar
        await Caja.findByIdAndDelete(id);
        res.json({ mensaje: 'Caja eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la caja' });
    }
};
