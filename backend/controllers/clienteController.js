const Cliente = require('../models/Cliente');

// Obtener todos los clientes
exports.listar = async (req, res) => {
    try {
        const clientes = await Cliente.find().sort({ createdAt: -1 });
        res.json(clientes);
    } catch (error) {
        console.error("Error listar clientes:", error);
        res.status(500).json({ error: 'Error al obtener los clientes' });
    }
};

// Crear cliente
exports.crear = async (req, res) => {
    try {
        const cliente = new Cliente(req.body);
        await cliente.save();
        res.status(201).json({ mensaje: 'Cliente guardado exitosamente', cliente });
    } catch (error) {
        console.error("Error crear cliente:", error);
        res.status(500).json({ error: 'Hubo un error al crear el cliente' });
    }
};

// Actualizar cliente
exports.actualizar = async (req, res) => {
    try {
        const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json({ mensaje: 'Cliente actualizado exitosamente', cliente });
    } catch (error) {
        console.error("Error actualizar cliente:", error);
        res.status(500).json({ error: 'Hubo un error al actualizar el cliente' });
    }
};

// Cambiar estado
exports.cambiarEstado = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

        cliente.estado = !cliente.estado;
        await cliente.save();
        res.json({ mensaje: `Cliente ${cliente.estado ? 'habilitado' : 'deshabilitado'} exitosamente`, cliente });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al cambiar el estado del cliente' });
    }
};

// Eliminar
exports.eliminar = async (req, res) => {
    try {
        const cliente = await Cliente.findByIdAndDelete(req.params.id);
        if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

        res.json({ mensaje: 'Cliente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al eliminar el cliente' });
    }
};
