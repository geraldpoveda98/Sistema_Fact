const Modelo = require('../models/Modelo');

// Listar todos los modelos
exports.listar = async (req, res) => {
    try {
        const modelos = await Modelo.find().sort({ createdAt: -1 });
        res.json(modelos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Hubo un error al obtener los modelos' });
    }
};

// Crear modelo
exports.crear = async (req, res) => {
    try {
        const modelo = new Modelo(req.body);
        await modelo.save();
        res.status(201).json({ mensaje: 'Modelo guardado exitosamente', modelo });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El modelo ya existe' });
        }
        res.status(500).json({ error: 'Hubo un error al crear el modelo' });
    }
};

// Actualizar modelo
exports.actualizar = async (req, res) => {
    try {
        const modelo = await Modelo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!modelo) {
            return res.status(404).json({ error: 'Modelo no encontrado' });
        }
        res.json({ mensaje: 'Modelo actualizado exitosamente', modelo });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El modelo ya existe' });
        }
        res.status(500).json({ error: 'Hubo un error al actualizar el modelo' });
    }
};

// Cambiar estado de modelo (Habilitar / Deshabilitar)
const fs = require('fs');
const path = require('path');
exports.cambiarEstado = async (req, res) => {
    const logPath = path.join(__dirname, '../logs_toggle.txt');
    try {
        const { id } = req.params;
        const modelo = await Modelo.findById(id);
        if (!modelo) {
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] Error: No encontrado ${id}\n`);
            return res.status(404).json({ error: 'Modelo no encontrado' });
        }

        const estadoAnterior = modelo.condicion;
        modelo.condicion = !modelo.condicion;
        const guardado = await modelo.save();

        res.json({ 
            mensaje: `Modelo ${guardado.condicion ? 'habilitado' : 'deshabilitado'} exitosamente`, 
            modelo: guardado 
        });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al cambiar el estado del modelo' });
    }
};

// Eliminar modelo
exports.eliminar = async (req, res) => {
    try {
        const modelo = await Modelo.findByIdAndDelete(req.params.id);
        if (!modelo) {
            return res.status(404).json({ error: 'Modelo no encontrado' });
        }
        res.json({ mensaje: 'Modelo eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al eliminar el modelo' });
    }
};
