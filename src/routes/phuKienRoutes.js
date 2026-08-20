const express = require('express');
const router = express.Router();
const phuKienController = require('../controllers/phuKienController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', phuKienController.index);
router.get('/:id', phuKienController.getDetail);
router.post('/', requireRole('Quản lý', 'Thủ kho'), phuKienController.postCreate);
router.put('/:id', requireRole('Quản lý', 'Thủ kho'), phuKienController.postEdit);
router.delete('/:id', requireRole('Quản lý'), phuKienController.delete);

module.exports = router;
