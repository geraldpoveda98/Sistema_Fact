const express = require('express');
const router = express.Router();
const devolucionController = require('../controllers/devolucionController');

router.get('/', devolucionController.listarDevoluciones);
router.post('/', devolucionController.crearDevolucion);
router.get('/siguiente_correlativo/:serieId', devolucionController.siguienteCorrelativoDevolucion);

module.exports = router;
