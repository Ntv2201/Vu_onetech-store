const express = require('express');
const router = express.Router();
const phuKienController = require('../controllers/phuKienController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', phuKienController.index);
router.post('/them-moi', requireRole('Quản lý', 'Thủ kho'), phuKienController.postCreate);
router.post('/:id/chinh-sua', requireRole('Quản lý', 'Thủ kho'), phuKienController.postEdit);
router.post('/:id/xoa', requireRole('Quản lý'), phuKienController.delete);

module.exports = router;
