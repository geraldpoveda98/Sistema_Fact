const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para la foto de perfil (Memoria para subir a Supabase)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Formato de imagen no soportado. Usa PNG o JPG.'), false);
        }
    }
});

// Ruta para el inicio de sesión
router.post('/login', usuarioController.login);

// Rutas CRUD de Usuarios
router.get('/', usuarioController.getAll);
router.post('/', upload.single('foto'), usuarioController.create);
router.put('/:id', upload.single('foto'), usuarioController.update);
router.delete('/:id', usuarioController.delete);

module.exports = router;
