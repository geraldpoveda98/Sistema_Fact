const express = require('express');
const router = express.Router();
const controller = require('../controllers/formatoImpresionController');

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.patch('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;
