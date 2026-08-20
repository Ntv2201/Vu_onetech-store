const express = require('express');
const router = express.Router();
const khachHangController = require('../controllers/khachHangController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', khachHangController.index);
router.get('/:id', khachHangController.getDetail);
router.post('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), khachHangController.postCreate);
router.put('/:id', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), khachHangController.postEdit);
router.delete('/:id', requireRole('Quản lý'), khachHangController.delete);

module.exports = router;
