const express = require('express');
const router = express.Router();
const modeloController = require('../controllers/modeloController');

router.get('/', modeloController.listar);
router.post('/', modeloController.crear);
router.put('/:id', modeloController.actualizar);
router.patch('/:id/estado', modeloController.cambiarEstado);
router.delete('/:id', modeloController.eliminar);

module.exports = router;
