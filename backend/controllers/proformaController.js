const Proforma = require('../models/Proforma');
const Serie = require('../models/Serie');

// Obtener todas las proformas (historial)
exports.listarProformas = async (req, res) => {
    try {
        const proformas = await Proforma.find()
            .populate('caja', 'nombre')
            .populate('cliente', 'nombre num_documento email telefono1')
            .populate('impuesto', 'nombre valor')
            .sort({ fecha: -1 });
        res.json(proformas);
    } catch (error) {
        console.error("Error al listar proformas:", error);
        res.status(500).json({ error: 'Hubo un error al obtener las proformas' });
    }
};

// Crear una nueva Proforma
exports.crearProforma = async (req, res) => {
    try {
        const {
            caja, serie, numero, fecha, cliente, impuesto, tipo_pago,
            detalles, subtotal, iva, total, dias_credito, observaciones
        } = req.body;

        if (!cliente || !caja || !serie || !numero || !detalles || detalles.length === 0) {
            return res.status(400).json({ error: 'Faltan datos obligatorios o el carrito está vacío' });
        }

        const nuevaProforma = new Proforma({
            caja, serie, numero, fecha, cliente, impuesto, tipo_pago,
            detalles, subtotal, iva, total, dias_credito, observaciones
        });

        await nuevaProforma.save();

        // (Opcional) Si llevamos un correlativo automático en la colección "Serie", deberíamos actualizarlo incrementándolo.
        // Asumiremos que el frontend enviará el número actualizado, pero aquí podríamos asegurar que la serie avance:
        // await Serie.findOneAndUpdate({ serie: serie, tipo_comprobante: 'Proforma' }, { $inc: { correlativo_actual: 1 } });

        res.status(201).json({ mensaje: 'Proforma guardada exitosamente', proforma: nuevaProforma });
    } catch (error) {
        console.error("Error al crear proforma:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El número de proforma ya existe para esta serie.' });
        }
        res.status(500).json({ error: 'Hubo un error al guardar la proforma' });
    }
};

// Obtener el siguiente número correlativo para una Serie de Proforma
exports.siguienteCorrelativo = async (req, res) => {
    try {
        const { serieId } = req.params;
        const serieDoc = await Serie.findById(serieId);

        if (!serieDoc) {
            return res.status(404).json({ error: 'Serie no encontrada' });
        }

        // Buscamos la última proforma con esa serie literal
        const ultimaProforma = await Proforma.findOne({ serie: serieDoc.serie })
            .sort({ createdAt: -1 }); // La más reciente

        let proximoNumero = (serieDoc.correlativo_actual !== undefined && serieDoc.correlativo_actual !== null) 
            ? Number(serieDoc.correlativo_actual) 
            : 1;

        if (ultimaProforma && ultimaProforma.numero) {
            const numEntero = parseInt(ultimaProforma.numero, 10);
            if (!isNaN(numEntero)) proximoNumero = Math.max(proximoNumero, numEntero + 1);
        }

        // Formateamos con ceros a la izquierda (ej. 6 dígitos)
        const numeroFormateado = String(proximoNumero).padStart(6, '0');

        res.json({ siguiente_numero: numeroFormateado });
    } catch (error) {
        console.error("Error calculando correlativo:", error);
        res.status(500).json({ error: 'Error al calcular el siguiente número de comprobante' });
    }
};

// Cambiar estado a Anulada o Vencida
exports.cambiarEstado = async (req, res) => {
    try {
        const proforma = await Proforma.findById(req.params.id);
        if (!proforma) return res.status(404).json({ error: 'Proforma no encontrada' });

        const { estado } = req.body;
        if (estado) {
            proforma.estado = estado;
            await proforma.save();
        }

        res.json({ mensaje: 'Estado actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al actualizar el estado' });
    }
};
