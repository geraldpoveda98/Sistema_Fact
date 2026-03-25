const express = require('express');
const router = express.Router();
const limpierDatosController = require('../controllers/limpiarDatosController');

router.get('/conteo', limpierDatosController.obtenerConteo);
router.delete('/:modelo', limpierDatosController.vaciarColeccion);

module.exports = router;
