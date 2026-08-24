const express = require('express');
const router = express.Router();
const doiTraController = require('../controllers/doiTraController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ route Đổi trả máy yêu cầu đăng nhập
router.use(requireAuth);

// GET /api/doi-tra - Lấy danh sách phiếu đổi trả
router.get('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Thủ kho', 'Kỹ thuật'), doiTraController.index);

// GET /api/doi-tra/lich-su-imei/:imei - Tra cứu lịch sử đổi trả theo số IMEI
router.get('/lich-su-imei/:imei', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Thủ kho', 'Kỹ thuật'), doiTraController.getHistoryByImei);

// POST /api/doi-tra/kiem-tra - Kiểm tra nhanh điều kiện đổi trả
router.post('/kiem-tra', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kỹ thuật'), doiTraController.checkCondition);

// GET /api/doi-tra/:id - Xem chi tiết 1 phiếu đổi trả
router.get('/:id', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Thủ kho', 'Kỹ thuật'), doiTraController.getDetail);

// POST /api/doi-tra - Lập phiếu đổi trả máy (Chỉ cho phép Quản lý, NV bán hàng, Thu ngân; Chặn Kỹ thuật/Thủ kho)
router.post('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), doiTraController.create);

module.exports = router;
