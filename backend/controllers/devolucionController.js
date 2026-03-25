const Devolucion = require('../models/Devolucion');
const Venta = require('../models/Venta');
const Articulo = require('../models/Articulo');
const Serie = require('../models/Serie');

exports.listarDevoluciones = async (req, res) => {
    try {
        const devoluciones = await Devolucion.find()
            .populate({
                path: 'facturaOrigen',
                populate: [
                    { path: 'cliente', select: 'nombre num_documento' },
                    { 
                        path: 'detalles.articulo', 
                        select: 'nombre codigo' 
                    }
                ]
            })
            .populate('caja', 'nombre')
            .populate('usuario', 'nombre')
            .sort({ fecha: -1 });

        res.json(devoluciones);
    } catch (error) {
        console.error("Error listando devoluciones:", error);
        res.status(500).json({ error: 'Hubo un error al listar devoluciones' });
    }
};

exports.crearDevolucion = async (req, res) => {
    try {
        const { facturaOrigenId, caja, serie, numero, fecha, observaciones } = req.body;

        if (!facturaOrigenId || !caja || !serie || !numero) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para la devolución' });
        }

        // 1. Validar la factura original
        const factura = await Venta.findById(facturaOrigenId);
        if (!factura) {
            return res.status(404).json({ error: 'La factura origen no existe' });
        }
        if (factura.estado === 'Anulada') {
            return res.status(400).json({ error: 'Esta factura ya fue anulada/devuelta anteriormente' });
        }

        // 2. Crear el registro de Devolucion
        const nuevaDevolucion = new Devolucion({
            facturaOrigen: facturaOrigenId,
            caja,
            usuario: req.usuario ? req.usuario.id : "65b9a89d4f0c9f1a2b3c4d5e", // Mock ID if no auth
            serie,
            numero,
            fecha,
            observaciones
        });

        const devolucionGuardada = await nuevaDevolucion.save();

        // 3. Restaurar stock de los artículos de la factura al almacén
        for (let item of factura.detalles) {
            await Articulo.findByIdAndUpdate(item.articulo, {
                $inc: { stock: item.cantidad } // Suma para devolver
            });
        }

        // 4. Marcar la factura como anulada
        factura.estado = 'Anulada';
        await factura.save();

        res.status(201).json({
            mensaje: 'Devolución procesada, stock restaurado y factura anulada',
            devolucion: devolucionGuardada
        });

    } catch (error) {
        console.error("Error al procesar devolución:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El número de correlativo de devolución ya existe para esta serie.' });
        }
        res.status(500).json({ error: 'Error procesando la devolución' });
    }
};

exports.siguienteCorrelativoDevolucion = async (req, res) => {
    try {
        const { serieId } = req.params;
        const serieDoc = await Serie.findById(serieId);

        if (!serieDoc) return res.status(404).json({ error: 'Serie no encontrada' });

        const ultimaDev = await Devolucion.findOne({ serie: serieDoc.serie })
            .sort({ createdAt: -1 });

        let proximoNumero = (serieDoc.correlativo_actual !== undefined && serieDoc.correlativo_actual !== null) 
            ? Number(serieDoc.correlativo_actual) 
            : 1;
        if (ultimaDev && ultimaDev.numero) {
            const numEntero = parseInt(ultimaDev.numero, 10);
            if (!isNaN(numEntero)) proximoNumero = Math.max(proximoNumero, numEntero + 1);
        }

        const numeroFormateado = String(proximoNumero).padStart(6, '0');
        res.json({ siguiente_numero: numeroFormateado });
    } catch (error) {
        res.status(500).json({ error: 'Error calculando correlativo de devolución' });
    }
};
