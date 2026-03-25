const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

router.get('/consultar', compraController.getByFilters);
router.get('/para-conteo', compraController.getParaConteo);
router.post('/', compraController.create);
router.post('/devolucion', compraController.createDevolucion);
router.get('/siguiente_correlativo/:serieId', compraController.siguienteCorrelativo);

module.exports = router;
