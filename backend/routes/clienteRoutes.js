const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.listar);
router.post('/', clienteController.crear);
router.put('/:id', clienteController.actualizar);
router.patch('/:id/estado', clienteController.cambiarEstado);
router.delete('/:id', clienteController.eliminar);

module.exports = router;
