const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const empresaController = require('../controllers/empresaController');

// Configuración de Multer para el Logo de Empresa (Memoria para convertir a Base64)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Límite de 20MB
    fileFilter: (req, file, cb) => {
        // Permitir formatos comunes
        if (file.mimetype.match(/^image\/(jpeg|png|webp|gif|svg\+xml)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de imagen no válido.'));
        }
    }
});

// Rutas
router.get('/', empresaController.getEmpresa);

router.post('/', upload.single('logo'), empresaController.updateEmpresa);

module.exports = router;
