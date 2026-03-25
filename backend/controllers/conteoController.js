const Conteo = require('../models/Conteo');

// Listar conteos con filtros por mes y año
exports.listar = async (req, res) => {
    try {
        const { mes, anio } = req.query;
        let query = {}; // Por defecto trae todos

        if (mes && anio) {
            const startDate = new Date(anio, mes - 1, 1);
            const endDate = new Date(anio, mes, 0, 23, 59, 59, 999);
            query.fecha = { $gte: startDate, $lte: endDate };
        }

        const conteos = await Conteo.find(query)
            .populate('usuario', 'nombre')
            .populate({
                path: 'compra',
                select: 'comprobante proveedor',
                populate: { path: 'proveedor', select: 'nombre' }
            })
            .sort({ createdAt: -1 });

        res.json(conteos);
    } catch (error) {
        console.error("Error listar conteos:", error);
        res.status(500).json({ error: 'Hubo un error al obtener los conteos' });
    }
};

// Crear un nuevo conteo
exports.crear = async (req, res) => {
    try {
        const { compra, fecha, usuario, detalles } = req.body;

        // Validaciones básicas
        if (!compra || !usuario || !detalles || detalles.length === 0) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para el conteo' });
        }

        // Determinar si hay diferencias
        let tieneDiferencias = false;
        let totalItems = 0;

        const detallesProcesados = detalles.map(det => {
            const diferencia = det.conteo_fisico - det.cantidad_esperada;
            if (diferencia !== 0) tieneDiferencias = true;
            totalItems += 1;

            return {
                articulo: det.articulo,
                cantidad_esperada: det.cantidad_esperada,
                conteo_fisico: det.conteo_fisico,
                diferencia: diferencia
            };
        });

        const nuevoConteo = new Conteo({
            compra,
            fecha,
            usuario,
            detalles: detallesProcesados,
            total_items: totalItems,
            estado_diferencia: tieneDiferencias ? 'DIFERENCIAS' : 'OK'
        });

        await nuevoConteo.save();
        res.status(201).json({ mensaje: 'Auditoría de Conteo registrada exitosamente', conteo: nuevoConteo });

    } catch (error) {
        console.error("Error crear conteo:", error);
        res.status(500).json({ error: 'Hubo un error al guardar el conteo físico' });
    }
};

// Eliminar un conteo
exports.eliminar = async (req, res) => {
    try {
        const conteo = await Conteo.findByIdAndDelete(req.params.id);
        if (!conteo) {
            return res.status(404).json({ error: 'Conteo no encontrado' });
        }
        res.json({ mensaje: 'Auditoría de Conteo eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al eliminar el conteo' });
    }
};
