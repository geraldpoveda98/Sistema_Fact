const express = require('express');
const router = express.Router();
const articuloController = require('../controllers/articuloController');

router.get('/', articuloController.listar);
router.post('/', articuloController.crear);
router.put('/:id', articuloController.actualizar);
router.delete('/:id', articuloController.eliminar);

module.exports = router;
