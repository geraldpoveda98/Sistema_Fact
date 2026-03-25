const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.listar);
router.post('/', categoriaController.crear);
router.put('/:id', categoriaController.actualizar);
router.patch('/:id/estado', categoriaController.cambiarEstado);
router.delete('/:id', categoriaController.eliminar);

module.exports = router;
