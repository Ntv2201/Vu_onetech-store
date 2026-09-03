const express = require('express');
const router = express.Router();
const datTruocController = require('../controllers/datTruocController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ route Đặt hàng trước yêu cầu đăng nhập
router.use(requireAuth);

// GET /api/dat-truoc - Lấy danh sách đơn đặt trước
router.get('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán'), datTruocController.index);

// GET /api/dat-truoc/:id - Lấy chi tiết đơn đặt trước
router.get('/:id', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán'), datTruocController.getDetail);

// POST /api/dat-truoc - Tạo đơn đặt trước (nhận cọc -> sinh phiếu thu)
router.post('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), datTruocController.create);

// PUT /api/dat-truoc/:id/huy - Hủy đơn đặt trước (hoàn cọc -> sinh phiếu chi)
router.put('/:id/huy', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), datTruocController.cancel);

// PUT /api/dat-truoc/:id/trang-thai - Cập nhật trạng thái / gán IMEI cho đơn đặt trước
router.put('/:id/trang-thai', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Thủ kho'), datTruocController.updateStatus);

// PUT /api/dat-truoc/:id/chuyen-hoa-don - Khách nhận máy, cấn trừ cọc và xuất hóa đơn POS
router.put('/:id/chuyen-hoa-don', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), datTruocController.chuyenHoaDon);

module.exports = router;
