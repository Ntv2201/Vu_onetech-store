const express = require('express');
const router = express.Router();
const KhoController = require('../controllers/KhoController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Xem tồn kho: mọi vai trò đã đăng nhập đều được xem
router.get('/ton-kho', requireAuth, KhoController.layTonKho);
// Xem phiếu xuất kho: chỉ Thủ kho (Quản lý luôn được phép nhờ requireRole tự cho qua)
router.get('/phieu-xuat', requireAuth, requireRole('Thủ kho'), KhoController.layPhieuXuat);

module.exports = router;