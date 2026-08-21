const express = require('express');
const router = express.Router();
const baoHanhController = require('../controllers/baoHanhController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ route Bảo hành yêu cầu đăng nhập
router.use(requireAuth);

// GET /api/bao-hanh/tra-cuu/:imei - Tra cứu bảo hành máy theo IMEI (tất cả nhân viên đã login)
router.get('/tra-cuu/:imei', baoHanhController.traCuu);

// GET /api/bao-hanh - Danh sách phiếu bảo hành
router.get('/', requireRole('Quản lý', 'Kỹ thuật', 'NV bán hàng'), baoHanhController.index);

// GET /api/bao-hanh/:id - Chi tiết phiếu bảo hành
router.get('/:id', requireRole('Quản lý', 'Kỹ thuật', 'NV bán hàng'), baoHanhController.getDetail);

// POST /api/bao-hanh - Tiếp nhận bảo hành (kiểm tra ngày bán + hạn BH)
router.post('/', requireRole('Quản lý', 'Kỹ thuật', 'NV bán hàng'), baoHanhController.create);

// POST /api/bao-hanh/:id/linh-kien - Xuất linh kiện thay thế (trừ tồn kho)
router.post('/:id/linh-kien', requireRole('Quản lý', 'Kỹ thuật'), baoHanhController.xuatLinhKien);

// PUT /api/bao-hanh/:id/hoan-tat - Hoàn tất bảo hành, trả trạng thái IMEI về 'Da ban'
router.put('/:id/hoan-tat', requireRole('Quản lý', 'Kỹ thuật'), baoHanhController.hoanTat);

module.exports = router;
