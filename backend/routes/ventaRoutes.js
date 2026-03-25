const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// Rutas de Cierre de Caja
router.get('/cierre-caja', ventaController.consultaCierreCaja);
router.post('/pasar-historial', ventaController.pasarAHistorial);

// Rutas de Facturación Oficial
router.get('/facturas', ventaController.listarFacturas);
router.post('/factura', ventaController.crearFactura);
router.get('/factura/siguiente_correlativo/:serieId', ventaController.siguienteCorrelativoFactura);
router.patch('/factura/:id/anular', ventaController.anularFactura);
module.exports = router;
