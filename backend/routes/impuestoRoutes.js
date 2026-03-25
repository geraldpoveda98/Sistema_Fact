const express = require('express');
const router = express.Router();
const impuestoController = require('../controllers/impuestoController');

// Rutas CRUD de Impuestos
router.get('/', impuestoController.getAll);
router.post('/', impuestoController.create);
router.put('/:id', impuestoController.update);
router.delete('/:id', impuestoController.delete);

module.exports = router;
