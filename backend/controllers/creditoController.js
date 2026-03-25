const Credito = require('../models/Credito');

// Obtener todos los créditos
exports.listar = async (req, res) => {
    try {
        const creditos = await Credito.find().sort({ createdAt: -1 });
        res.json(creditos);
    } catch (error) {
        console.error("Error listar creditos:", error);
        res.status(500).json({ error: 'Error al obtener los créditos' });
    }
};

// Crear crédito
exports.crear = async (req, res) => {
    try {
        const credito = new Credito(req.body);
        await credito.save();
        res.status(201).json({ mensaje: 'Política de Crédito guardada exitosamente', credito });
    } catch (error) {
        console.error("Error crear credito:", error);
        res.status(500).json({ error: 'Hubo un error al crear la política de crédito' });
    }
};

// Actualizar crédito
exports.actualizar = async (req, res) => {
    try {
        const credito = await Credito.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' });
        res.json({ mensaje: 'Crédito actualizado exitosamente', credito });
    } catch (error) {
        console.error("Error actualizar credito:", error);
        res.status(500).json({ error: 'Hubo un error al actualizar el crédito' });
    }
};

// Cambiar estado
exports.cambiarEstado = async (req, res) => {
    try {
        const credito = await Credito.findById(req.params.id);
        if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' });

        credito.estado = !credito.estado;
        await credito.save();
        res.json({ mensaje: `Crédito ${credito.estado ? 'habilitado' : 'deshabilitado'} exitosamente`, credito });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al cambiar el estado del crédito' });
    }
};

// Eliminar
exports.eliminar = async (req, res) => {
    try {
        const credito = await Credito.findByIdAndDelete(req.params.id);
        if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' });

        res.json({ mensaje: 'Política de Crédito eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al eliminar el crédito' });
    }
};
