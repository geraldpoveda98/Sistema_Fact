const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');

router.get('/', cajaController.getAll);
router.post('/', cajaController.create);
router.put('/:id', cajaController.update);
router.delete('/:id', cajaController.delete);

module.exports = router;
