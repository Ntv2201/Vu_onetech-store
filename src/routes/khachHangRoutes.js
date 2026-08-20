const express = require('express');
const router = express.Router();
const khachHangController = require('../controllers/khachHangController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', khachHangController.index);
router.get('/them-moi', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), khachHangController.getCreate);
router.post('/them-moi', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), khachHangController.postCreate);
router.get('/:id/chinh-sua', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), khachHangController.getEdit);
router.post('/:id/chinh-sua', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), khachHangController.postEdit);
router.post('/:id/xoa', requireRole('Quản lý'), khachHangController.delete);

module.exports = router;
