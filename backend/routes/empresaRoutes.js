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

// Ruta temporal de debug de entorno (solo loguea tamaños, no claves completas)
router.get('/testEnv', (req, res) => {
    res.json({
        url_exists: !!process.env.SUPABASE_URL,
        url_length: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
        key_exists: !!process.env.SUPABASE_KEY,
        key_length: process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.length : 0,
        bucket: 'gedsolution'
    });
});

// Ruta temporal de debug
router.post('/debug_upload', upload.single('logo'), (req, res) => {
    res.json({
        message: 'Debug upload info',
        fileProvided: !!req.file,
        fileDetails: req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'No file detected'
    });
});

router.post('/', upload.single('logo'), empresaController.updateEmpresa);

module.exports = router;
