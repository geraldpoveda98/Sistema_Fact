const Compra = require('../models/Compra');
const Articulo = require('../models/Articulo');
const Serie = require('../models/Serie');
const Empresa = require('../models/Empresa');

// Consulta de Compras por Fecha (y ahora populando Proveedor)
exports.getByFilters = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, estado, search, mes, anio } = req.query;
        let query = {};

        // Filtros por Mes y Año exactos
        if (mes && anio) {
            const numMes = Number(mes);
            const numAnio = Number(anio);
            if (!isNaN(numMes) && !isNaN(numAnio)) {
                const startDate = new Date(numAnio, numMes - 1, 1);
                const endDate = new Date(numAnio, numMes, 0, 23, 59, 59, 999);
                query.fecha = { $gte: startDate, $lte: endDate };
            }
        } else if (fechaInicio || fechaFin) {
            // Filtro por Rangos de Fechas Clásicos
            query.fecha = {};
            if (fechaInicio) {
                query.fecha.$gte = new Date(new Date(fechaInicio).setHours(0, 0, 0, 0));
            }
            if (fechaFin) {
                query.fecha.$lte = new Date(new Date(fechaFin).setHours(23, 59, 59, 999));
            }
        }

        // Filtro por Estado exacto
        if (estado && estado !== 'Todos') {
            query.estado = estado;
        }

        // Búsqueda general por Comprobante o Comprador directo
        if (search) {
            query.$or = [
                { comprobante: { $regex: search, $options: 'i' } },
                { comprador: { $regex: search, $options: 'i' } }
            ];
        }

        const compras = await Compra.find(query)
            .populate('usuario', 'nombre')
            .populate('proveedor', 'nombre ruc')
            .sort({ fecha: -1 })
            .lean(); // ADD .LEAN() TO RETURN PLAIN OBJECTS

        // Filtrado en memoria para buscar dentro del nombre del Proveedor o Usuario populado
        let resultados = compras;
        if (search) {
            const regex = new RegExp(search, 'i');
            resultados = compras.filter(c => {
                const matchComprobante = c.comprobante && regex.test(c.comprobante);
                const matchComprador = c.comprador && regex.test(c.comprador);
                const matchUsuario = c.usuario && c.usuario.nombre && regex.test(c.usuario.nombre);
                const matchProveedor = c.proveedor && c.proveedor.nombre && regex.test(c.proveedor.nombre);
                const matchEstado = c.estado && regex.test(c.estado);

                return matchComprobante || matchComprador || matchUsuario || matchProveedor || matchEstado;
            });
        }

        res.json(resultados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar las compras.' });
    }
};

// Crear una compra de Ingreso (Afecta Stock)
exports.create = async (req, res) => {
    try {
        const { detalles, ...compraData } = req.body;

        // 1. Obtener configuración de empresa para porcentajes de utilidad
        const empresa = await Empresa.findOne();
        const porcentajeUtilidad = empresa ? (empresa.porcentajeCosto / 100) : 0.30;

        // 2. Crear documento de compra
        const nuevaCompra = new Compra({
            ...compraData,
            detalles
        });

        // 3. Transacción manual para actualizar el stock, costo y precio de venta
        if (detalles && detalles.length > 0) {
            const taxRate = (compraData.impuesto_porcentaje || 0) / 100;
            
            for (const item of detalles) {
                const articulo = await Articulo.findById(item.articulo);
                if (articulo) {
                    // Actualizar Stock
                    articulo.stock += item.cantidad; 
                    
                    // Actualizar Costo de Inventario (Precio compra + Impuesto prorrateado)
                    const costoConImpuesto = item.precio_compra * (1 + taxRate);
                    articulo.costo_inventario = costoConImpuesto;

                    // Si el cálculo es automático, actualizar el precio de venta basado en el nuevo costo
                    if (articulo.tipo_calculo_precio === 'Automatico') {
                        articulo.precio_venta = costoConImpuesto * (1 + porcentajeUtilidad);
                    }

                    await articulo.save();
                }
            }
        }

        await nuevaCompra.save();
        const compraCreada = await Compra.findById(nuevaCompra._id)
            .populate('usuario', 'nombre')
            .populate('proveedor', 'nombre')
            .populate('detalles.articulo', 'nombre codigo');

        res.status(201).json(compraCreada);
    } catch (error) {
        console.error("Error al crear la compra:", error);
        res.status(500).json({ error: 'Error interno al registrar el ingreso y actualizar stock.' });
    }
};

// Crear una Devolución de Compra (Resta Stock)
exports.createDevolucion = async (req, res) => {
    try {
        const { detalles, ...compraData } = req.body;

        // 1. Crear documento de compra (devolución)
        const nuevaDevolucion = new Compra({
            ...compraData,
            estado: 'Devolución', // Forzar estado
            detalles
        });

        // 2. Transacción manual para actualizar (restar) el stock
        if (detalles && detalles.length > 0) {
            for (const item of detalles) {
                const articulo = await Articulo.findById(item.articulo);
                if (articulo) {
                    // Restar stock
                    articulo.stock -= item.cantidad;
                    if (articulo.stock < 0) articulo.stock = 0; // Prevenir stocks negativos por seguridad
                    await articulo.save();
                }
            }
        }

        await nuevaDevolucion.save();
        const devolucionCreada = await Compra.findById(nuevaDevolucion._id)
            .populate('usuario', 'nombre')
            .populate('proveedor', 'nombre')
            .populate('detalles.articulo', 'nombre codigo');

        res.status(201).json(devolucionCreada);
    } catch (error) {
        console.error("Error al crear la devolución:", error);
        res.status(500).json({ error: 'Error interno al registrar la devolución y descontar stock.' });
    }
};

// Obtener solo las compras que no han sido anuladas, para llenar el select de Conteo
exports.getParaConteo = async (req, res) => {
    try {
        const compras = await Compra.find({ estado: 'Ingresos' })
            .populate('proveedor', 'nombre')
            .populate({
                path: 'detalles.articulo',
                populate: [
                    { path: 'idcategoria', select: 'nombre' },
                    { path: 'idmodelo', select: 'nombre' }
                ]
            })
            .sort({ fecha: -1 });

        // Formatear respuesta para el frontend
        const resultado = compras.map(c => ({
            _id: c._id,
            comprobante: `${c.comprobante} - ${c.proveedor?.nombre || 'General'}`,
            proveedor_id: c.proveedor?._id,
            proveedor_nombre: c.proveedor?.nombre,
            fecha: c.fecha,
            detalles: c.detalles.map(d => ({
                articulo_id: d.articulo._id,
                codigo: d.articulo.codigo,
                nombre: d.articulo.nombre,
                categoria: d.articulo.idcategoria?.nombre || '-',
                modelo: d.articulo.idmodelo?.nombre || '-',
                cantidad_esperada: d.cantidad
            }))
        }));

        res.json(resultado);
    } catch (error) {
        console.error("Error getParaConteo:", error);
        res.status(500).json({ error: 'Error al consultar compras para conteo' });
    }
};
// Obtener siguiente correlativo para una serie de compra
exports.siguienteCorrelativo = async (req, res) => {
    try {
        const { serieId } = req.params;
        console.log(`Buscando correlativo para serieId: ${serieId}`);
        
        if (!serieId || serieId === 'undefined') {
            return res.status(400).json({ error: 'serieId no proporcionado' });
        }

        const serieDoc = await Serie.findById(serieId);
        if (!serieDoc) {
            console.error(`Serie con ID ${serieId} no encontrada`);
            return res.status(404).json({ error: 'Serie no encontrada en la base de datos' });
        }

        // Buscamos la última compra registrada con esta serie literal (nombre)
        const ultimaCompra = await Compra.findOne({ serie: serieDoc.serie })
            .sort({ createdAt: -1 });

        let proximoNumero = (serieDoc.correlativo_actual !== undefined && serieDoc.correlativo_actual !== null) 
            ? Number(serieDoc.correlativo_actual) 
            : 1;

        if (ultimaCompra && ultimaCompra.numero) {
            const numEntero = parseInt(ultimaCompra.numero, 10);
            if (!isNaN(numEntero)) proximoNumero = Math.max(proximoNumero, numEntero + 1);
        }

        const numeroFormateado = String(proximoNumero).padStart(6, '0');
        console.log(`Correlativo generado: ${numeroFormateado} para serie: ${serieDoc.serie}`);
        res.json({ siguiente_numero: numeroFormateado });
    } catch (error) {
        console.error("Error CRITICO calculando correlativo compra:", error);
        res.status(500).json({ error: 'Error interno: ' + error.message });
    }
};
