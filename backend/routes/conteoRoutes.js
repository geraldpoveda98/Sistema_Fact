const express = require('express');
const router = express.Router();
const conteoController = require('../controllers/conteoController');

router.get('/', conteoController.listar);
router.post('/', conteoController.crear);
router.delete('/:id', conteoController.eliminar);

module.exports = router;
