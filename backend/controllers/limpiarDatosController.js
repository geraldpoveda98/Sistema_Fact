const mongoose = require('mongoose');

// Mapeo de Colecciones vs Modelos 
// (Debemos asegurarnos de que el nombre coincida con cómo Mongoose los registró)
const modelosMap = {
    'Artículos': 'Articulo',
    'Categorías': 'Categoria',
    'Modelos': 'Modelo',
    'Cajas': 'Caja',
    'Series': 'Serie',
    'Clientes': 'Cliente',
    'Proveedores': 'Proveedor',
    'Impuestos': 'Impuesto',
    'Proformas': 'Proforma',
    'Compras': 'Compra',
    'Facturas': 'Venta',
    'Devoluciones': 'Devolucion',
    'Conteos': 'Conteo',
    'Créditos': 'Credito',
    'Usuarios': 'Usuario',
    'Formatos Facturación': 'FormatoImpresion'
};

exports.obtenerConteo = async (req, res) => {
    try {
        const conteos = [];

        for (const [nombreVista, nombreModelo] of Object.entries(modelosMap)) {
            try {
                // Verificar si el modelo existe en mongoose
                if (mongoose.models[nombreModelo]) {
                    const count = await mongoose.model(nombreModelo).countDocuments();
                    conteos.push({ coleccion: nombreVista, modelo: nombreModelo, cantidad: count });
                } else {
                    // Intento de requerir el archivo si no está cacheado por mongoose
                    require(`../models/${nombreModelo}`);
                    const count = await mongoose.model(nombreModelo).countDocuments();
                    conteos.push({ coleccion: nombreVista, modelo: nombreModelo, cantidad: count });
                }
            } catch (err) {
                // Si un modelo no existe todavía, lo ignoramos amablemente
                conteos.push({ coleccion: nombreVista, modelo: nombreModelo, cantidad: 0, error: true });
            }
        }

        res.json(conteos);
    } catch (error) {
        console.error("Error al obtener conteos de BD:", error);
        res.status(500).json({ error: 'Hubo un error al leer la base de datos' });
    }
};

exports.vaciarColeccion = async (req, res) => {
    try {
        const { modelo } = req.params;

        if (!mongoose.models[modelo]) {
            try {
                require(`../models/${modelo}`);
            } catch (e) {
                return res.status(404).json({ error: `El modelo ${modelo} no existe en el sistema.` });
            }
        }

        const ModeloDB = mongoose.model(modelo);
        await ModeloDB.deleteMany({});

        res.json({ mensaje: `Todos los datos de ${modelo} han sido eliminados correctamente.` });
    } catch (error) {
        console.error(`Error al vaciar colección ${req.params.modelo}:`, error);
        res.status(500).json({ error: 'Clave de seguridad requerida o error interno al vaciar datos.' });
    }
};
