const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const empresaController = require('../controllers/empresaController');

// Configuración de Multer para el Logo de Empresa
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'uploads'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Límite de 20MB
    fileFilter: (req, file, cb) => {
        // Solo permitir archivos PNG
        if (file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes en formato PNG.'));
        }
    }
});

// Rutas
router.get('/', empresaController.getEmpresa);
router.post('/', upload.single('logo'), empresaController.updateEmpresa);

module.exports = router;
