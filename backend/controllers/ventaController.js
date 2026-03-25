const Venta = require('../models/Venta');

// Obtener consulta de cierre de caja por fechas y filtros
exports.consultaCierreCaja = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, tipoDocumento, caja } = req.query;

        // Construir Query dinámico
        let query = {};

        // Filtro de Fechas (Rango)
        if (fechaInicio && fechaFin) {
            // El usuario envía strings (YYYY-MM-DD), las convertimos para cubrir el día completo
            const startDate = new Date(fechaInicio);
            startDate.setUTCHours(0, 0, 0, 0);

            const endDate = new Date(fechaFin);
            endDate.setUTCHours(23, 59, 59, 999);

            query.fecha = { $gte: startDate, $lte: endDate };
        }

        // Filtro de Documento
        if (tipoDocumento && tipoDocumento !== 'Todos') {
            query.comprobante = tipoDocumento;
        }

        // Filtro de Caja
        if (caja && caja !== 'Todas') {
            query.caja = caja;
        }

        // Ejecutar búsqueda separando en dos arreglos: Emitidos (Activos) e Históricos
        // Populamos Usuario y Cliente para tener sus Nombres en la Tabla
        const ventas = await Venta.find(query)
            .populate('usuario', 'nombre')
            .populate('cliente', 'nombre')
            .sort({ fecha: -1 });

        const activas = ventas.filter(v => v.estado === 'Emitido');
        const historicas = ventas.filter(v => v.estado === 'Histórico');

        // Calcular los 4 subtotales requeridos basado SOLO en las activas (lo normal en un Cierre)
        // Puedes cambiar esto si los "Totales" deben incluir históricos también.
        const totales = activas.reduce((acc, current) => {
            acc.total_ventas += current.total_ventas || 0;
            acc.impuesto_total += current.impuesto_total || 0;
            acc.total_factura += current.total_factura || 0;
            acc.total_credito += current.total_credito || 0;
            return acc;
        }, {
            total_ventas: 0,
            impuesto_total: 0,
            total_factura: 0,
            total_credito: 0
        });

        res.json({
            totales,
            activas,
            historicas
        });

    } catch (error) {
        console.error("Error en Cierre de Caja:", error);
        res.status(500).json({ error: 'Hubo un error al procesar el Cierre de Caja' });
    }
};

// Pasar documentos a histórico (Cerrar el día/caja)
exports.pasarAHistorial = async (req, res) => {
    try {
        const { ventasIds } = req.body; // Array de IDs de las facturas activas mostradas

        if (!ventasIds || !ventasIds.length) {
            return res.status(400).json({ error: 'No se enviaron documentos para procesar' });
        }

        // Actualización masiva (Bulk update)
        await Venta.updateMany(
            { _id: { $in: ventasIds }, estado: 'Emitido' },
            { $set: { estado: 'Histórico' } }
        );

        res.json({ mensaje: `${ventasIds.length} Documentos pasados a Histórico exitosamente` });
    } catch (error) {
        console.error("Error pasando a historial:", error);
        res.status(500).json({ error: 'Error al cambiar estado de las ventas' });
    }
};

const Articulo = require('../models/Articulo');
const Serie = require('../models/Serie');
const Proforma = require('../models/Proforma');

// ==========================================
// MÓDULO DE FACTURACIÓN (NUEVA VENTA)
// ==========================================

exports.listarFacturas = async (req, res) => {
    try {
        const facturas = await Venta.find({ comprobante: 'Factura' })
            .populate('caja', 'nombre')
            .populate('cliente', 'nombre num_documento email telefono1')
            .populate('impuesto_obj', 'nombre valor')
            .populate('usuario', 'nombre')
            .populate('detalles.articulo', 'nombre codigo')
            .sort({ fecha: -1 });
        res.json(facturas);
    } catch (error) {
        console.error("Error al listar facturas:", error);
        res.status(500).json({ error: 'Hubo un error al obtener las facturas' });
    }
};

exports.crearFactura = async (req, res) => {
    // Necesitamos una transacción para asegurar que si falla el descuento de stock, no se cree la factura
    // Mongoose soporta sesiones, pero para simplificar en local usaremos promesas atómicas
    try {
        const {
            caja, serie, numero, fecha, cliente, impuesto_obj, tipo_pago,
            detalles, total_ventas, impuesto_total, total_factura, total_credito, dias_credito, observaciones,
            proformaIdOrigen // ID de la proforma si proviene de una importación
        } = req.body;

        if (!caja || !serie || !numero || !detalles || detalles.length === 0) {
            return res.status(400).json({ error: 'Faltan datos obligatorios o el carrito está vacío' });
        }

        // 1. Validar Stock Suficiente Primero
        for (let item of detalles) {
            const articuloBD = await Articulo.findById(item.articulo);
            if (!articuloBD) {
                return res.status(404).json({ error: `Artículo no encontrado: ${item.articulo}` });
            }
            if (articuloBD.stock < item.cantidad) {
                return res.status(400).json({
                    error: `Stock insuficiente para el artículo '${articuloBD.nombre}'. Disp: ${articuloBD.stock}, Req: ${item.cantidad}`
                });
            }
        }

        // 2. Crear la Venta (Factura)
        const nuevaFactura = new Venta({
            usuario: req.usuario ? req.usuario.id : "65b9a89d4f0c9f1a2b3c4d5e", // Mock fallback
            caja, serie, numero, fecha, cliente, impuesto_obj, tipo_pago,
            detalles, total_ventas, impuesto_total, total_factura, total_credito, dias_credito, observaciones,
            comprobante: 'Factura', estado: 'Emitida'
        });

        const facturaGuardada = await nuevaFactura.save();

        // 3. Descontar el Stock del Inventario
        for (let item of detalles) {
            await Articulo.findByIdAndUpdate(item.articulo, {
                $inc: { stock: -item.cantidad } // Resta la cantidad
            });
        }

        // 4. Si viene de una Proforma, actualizar el estado de la proforma
        if (proformaIdOrigen) {
            await Proforma.findByIdAndUpdate(proformaIdOrigen, { estado: 'Convertida_Factura' });
        }

        res.status(201).json({ mensaje: 'Factura generada y stock descontado', factura: facturaGuardada });
    } catch (error) {
        console.error("Error al crear factura:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El número de factura ya existe para esta serie.' });
        }
        res.status(500).json({ error: 'Hubo un error al guardar la factura' });
    }
};

exports.siguienteCorrelativoFactura = async (req, res) => {
    try {
        const { serieId } = req.params;
        const serieDoc = await Serie.findById(serieId);

        if (!serieDoc) return res.status(404).json({ error: 'Serie no encontrada' });

        const ultimaVenta = await Venta.findOne({ serie: serieDoc.serie, comprobante: 'Factura' })
            .sort({ createdAt: -1 });

        let proximoNumero = (serieDoc.correlativo_actual !== undefined && serieDoc.correlativo_actual !== null) 
            ? Number(serieDoc.correlativo_actual) 
            : 1;
        if (ultimaVenta && ultimaVenta.numero) {
            const numEntero = parseInt(ultimaVenta.numero, 10);
            if (!isNaN(numEntero)) proximoNumero = Math.max(proximoNumero, numEntero + 1);
        }

        const numeroFormateado = String(proximoNumero).padStart(6, '0');
        res.json({ siguiente_numero: numeroFormateado });
    } catch (error) {
        res.status(500).json({ error: 'Error calculando correlativo' });
    }
};

exports.anularFactura = async (req, res) => {
    try {
        const factura = await Venta.findById(req.params.id);
        if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
        if (factura.estado === 'Anulada') return res.status(400).json({ error: 'Ya está anulada' });

        // 1. Devolver el Stock al Inventario
        for (let item of factura.detalles) {
            await Articulo.findByIdAndUpdate(item.articulo, {
                $inc: { stock: item.cantidad } // Suma la cantidad devuelta
            });
        }

        // 2. Cambiar estado a Anulada
        factura.estado = 'Anulada';
        await factura.save();

        res.json({ mensaje: 'Factura anulada y stock devuelto exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al anular la factura' });
    }
};
