const express = require('express');
const router = express.Router();
const creditoController = require('../controllers/creditoController');

router.get('/', creditoController.listar);
router.post('/', creditoController.crear);
router.put('/:id', creditoController.actualizar);
router.patch('/:id/estado', creditoController.cambiarEstado);
router.delete('/:id', creditoController.eliminar);

module.exports = router;
