const express = require('express');
const router = express.Router();
const hoaDonController = require('../controllers/hoaDonController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ route Hóa đơn yêu cầu đăng nhập
router.use(requireAuth);

// GET /api/hoa-don - Danh sách hóa đơn
router.get('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán'), hoaDonController.index);

// GET /api/hoa-don/:id - Chi tiết hóa đơn
router.get('/:id', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán'), hoaDonController.getDetail);

// POST /api/hoa-don - Bán hàng (tạo hóa đơn theo danh sách IMEI & phụ kiện, trừ kho, sinh phiếu xuất)
router.post('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), hoaDonController.create);

module.exports = router;
