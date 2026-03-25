const express = require('express');
const router = express.Router();
const serieController = require('../controllers/serieController');

router.get('/', serieController.getAll);
router.post('/', serieController.create);
router.put('/:id', serieController.update);
router.delete('/:id', serieController.delete);
router.get('/uso/:id', serieController.checkUso);

module.exports = router;
