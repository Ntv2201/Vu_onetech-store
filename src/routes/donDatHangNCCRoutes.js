const express = require('express');
const router = express.Router();
const donDatHangNCCController = require('../controllers/donDatHangNCCController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ route Đơn đặt hàng NCC yêu cầu đăng nhập
router.use(requireAuth);

// GET /api/don-dat-hang-ncc - Danh sách đơn đặt hàng NCC
router.get('/', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), donDatHangNCCController.index);

// GET /api/don-dat-hang-ncc/:id - Xem chi tiết
router.get('/:id', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), donDatHangNCCController.getDetail);

// POST /api/don-dat-hang-ncc - Tạo đơn đặt hàng NCC
router.post('/', requireRole('Quản lý'), donDatHangNCCController.create);

// PUT /api/don-dat-hang-ncc/:id/duyet - Duyệt đơn đặt hàng NCC (chỉ Quản lý)
router.put('/:id/duyet', requireRole('Quản lý'), donDatHangNCCController.approve);

// PUT /api/don-dat-hang-ncc/:id/trang-thai - Cập nhật trạng thái
router.put('/:id/trang-thai', requireRole('Quản lý'), donDatHangNCCController.updateStatus);

module.exports = router;
