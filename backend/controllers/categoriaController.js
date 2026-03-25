const Categoria = require('../models/Categoria');

// Listar todas las categorias
exports.listar = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ createdAt: -1 });
        res.json(categorias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Hubo un error al obtener las categorías' });
    }
};

// Crear categoria
exports.crear = async (req, res) => {
    try {
        const categoria = new Categoria(req.body);
        await categoria.save();
        res.status(201).json({ mensaje: 'Categoría guardada exitosamente', categoria });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'La categoría ya existe' });
        }
        res.status(500).json({ error: 'Hubo un error al crear la categoría' });
    }
};

// Actualizar categoria
exports.actualizar = async (req, res) => {
    try {
        const categoria = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ mensaje: 'Categoría actualizada exitosamente', categoria });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'La categoría ya existe' });
        }
        res.status(500).json({ error: 'Hubo un error al actualizar la categoría' });
    }
};

// Cambiar estado de categoria (Habilitar / Deshabilitar)
exports.cambiarEstado = async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        categoria.condicion = !categoria.condicion;
        await categoria.save();
        res.json({ mensaje: `Categoría ${categoria.condicion ? 'habilitada' : 'deshabilitada'} exitosamente`, categoria });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al cambiar el estado de la categoría' });
    }
};

// Eliminar categoria
exports.eliminar = async (req, res) => {
    try {
        const categoria = await Categoria.findByIdAndDelete(req.params.id);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ mensaje: 'Categoría eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al eliminar la categoría' });
    }
};
