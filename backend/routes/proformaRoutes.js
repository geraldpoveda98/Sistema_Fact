const express = require('express');
const router = express.Router();
const proformaController = require('../controllers/proformaController');

router.get('/', proformaController.listarProformas);
router.post('/', proformaController.crearProforma);
router.get('/siguiente_correlativo/:serieId', proformaController.siguienteCorrelativo);
router.patch('/:id/estado', proformaController.cambiarEstado);

module.exports = router;
