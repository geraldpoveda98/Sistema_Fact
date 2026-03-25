const Proveedor = require('../models/Proveedor');

exports.getAll = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            // Buscar por nombre de proveedor usando expresión regular (case-insensitive)
            query.nombre = { $regex: search, $options: 'i' };
        }

        const proveedores = await Proveedor.find(query)
            .populate('usuario_creacion', 'nombre')
            .sort({ createdAt: -1 });

        res.json(proveedores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
};

exports.getById = async (req, res) => {
    try {
        const proveedor = await Proveedor.findById(req.params.id)
            .populate('usuario_creacion', 'nombre');
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(proveedor);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener proveedor' });
    }
};

exports.create = async (req, res) => {
    try {
        // Validación básica 
        if (!req.body.nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        const nuevoProveedor = new Proveedor(req.body);
        await nuevoProveedor.save();

        const proveedorCreado = await Proveedor.findById(nuevoProveedor._id).populate('usuario_creacion', 'nombre');
        res.status(201).json(proveedorCreado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el proveedor' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedorActualizado = await Proveedor.findByIdAndUpdate(
            id,
            req.body,
            { new: true } // retornar el editado
        ).populate('usuario_creacion', 'nombre');

        if (!proveedorActualizado) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(proveedorActualizado);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

exports.delete = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByIdAndDelete(req.params.id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json({ mensaje: 'Proveedor eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
};
