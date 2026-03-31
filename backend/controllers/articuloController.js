const Articulo = require('../models/Articulo');
const Empresa = require('../models/Empresa');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer a memoria para procesar con Sharp y subir a Supabase
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
            return cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, webp)'));
        }
        cb(null, true);
    }
}).single('imagen');

exports.listar = async (req, res) => {
    try {
        const articulos = await Articulo.find()
            .populate('idcategoria', 'nombre')
            .populate('idmodelo', 'nombre')
            .sort({ createdAt: -1 });
        res.json(articulos);
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al obtener los artículos' });
    }
};

exports.crear = (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'Error al subir archivo (Max 20MB)' });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const data = { ...req.body };
            data.stock = 0; // Se fuerza a 0 inicialmente

            if (req.file) {
                const imageHelper = require('../utils/imageHelper');
                data.imagen = await imageHelper.compressAndUpload(req.file.buffer, 'images', 'articulos');
            }

            // Lógica Cálculo de Precio Automático
            if (data.tipo_calculo_precio === 'Automatico') {
                const empresa = await Empresa.findOne();
                const porcentaje = empresa && empresa.porcentajeCosto ? empresa.porcentajeCosto : 0;
                const costo = Number(data.costo_inventario) || 0;
                data.precio_venta = costo + (costo * porcentaje / 100);
            } else {
                data.precio_venta = Number(data.precio_venta) || 0;
            }

            const articulo = new Articulo(data);
            await articulo.save();

            const articuloGuardado = await Articulo.findById(articulo._id)
                .populate('idcategoria', 'nombre')
                .populate('idmodelo', 'nombre');

            res.status(201).json({ mensaje: 'Artículo guardado exitosamente', articulo: articuloGuardado });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ error: 'El código del artículo ya existe' });
            }
            res.status(500).json({ error: 'Hubo un error al crear el artículo' });
        }
    });
};

exports.actualizar = (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'Error al subir archivo (Max 20MB)' });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const { id } = req.params;
            const articuloActual = await Articulo.findById(id);
            if (!articuloActual) {
                return res.status(404).json({ error: 'Artículo no encontrado' });
            }

            const data = { ...req.body };
            delete data.stock; // Prohibir alterar el stock manuamente desde el form principal

            if (req.file) {
                const imageHelper = require('../utils/imageHelper');
                data.imagen = await imageHelper.compressAndUpload(req.file.buffer, 'images', 'articulos');
            }

            // Lógica Cálculo de Precio Automático
            if (data.tipo_calculo_precio === 'Automatico') {
                const empresa = await Empresa.findOne();
                const porcentaje = empresa && empresa.porcentajeCosto ? empresa.porcentajeCosto : 0;
                const costo = Number(data.costo_inventario) || Number(articuloActual.costo_inventario) || 0;
                data.precio_venta = costo + (costo * porcentaje / 100);
            } else {
                data.precio_venta = Number(data.precio_venta) || 0;
            }

            const articuloVirtual = await Articulo.findByIdAndUpdate(id, data, { new: true })
                .populate('idcategoria', 'nombre')
                .populate('idmodelo', 'nombre');

            res.json({ mensaje: 'Artículo actualizado exitosamente', articulo: articuloVirtual });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ error: 'El código del artículo ya pertenece a otro registro' });
            }
            res.status(500).json({ error: 'Hubo un error al actualizar el artículo' });
        }
    });
};

exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const articulo = await Articulo.findById(id);

        if (!articulo) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        if (articulo.stock > 0) {
            return res.status(400).json({ error: 'No se puede eliminar un artículo con stock disponible' });
        }

        await Articulo.findByIdAndDelete(id);
        res.json({ mensaje: 'Artículo eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al eliminar el artículo' });
    }
};
