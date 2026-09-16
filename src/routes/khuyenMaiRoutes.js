const express = require('express');
const router = express.Router();
const khuyenMaiController = require('../controllers/khuyenMaiController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ route Khuyến mãi yêu cầu đăng nhập
router.use(requireAuth);

// GET /api/khuyen-mai - Danh sách khuyến mãi (NV bán hàng, Thu ngân cũng xem được)
router.get('/', requireRole('Quản lý', 'Admin', 'NV bán hàng', 'Thu ngân', 'Kế toán'), khuyenMaiController.index);

// POST /api/khuyen-mai/check - Kiểm tra & tính tiền giảm của mã KM (NV bán hàng, Thu ngân gọi từ POS)
router.post('/check', requireRole('Quản lý', 'Admin', 'NV bán hàng', 'Thu ngân'), khuyenMaiController.checkCode);

// GET /api/khuyen-mai/:id - Chi tiết khuyến mãi
router.get('/:id', requireRole('Quản lý', 'Admin', 'NV bán hàng', 'Thu ngân', 'Kế toán'), khuyenMaiController.getDetail);

// POST /api/khuyen-mai - Tạo khuyến mãi (chỉ Quản lý / Admin)
router.post('/', requireRole('Quản lý', 'Admin'), khuyenMaiController.create);

// PUT /api/khuyen-mai/:id - Sửa khuyến mãi (chỉ Quản lý / Admin)
router.put('/:id', requireRole('Quản lý', 'Admin'), khuyenMaiController.update);

// DELETE /api/khuyen-mai/:id - Xóa khuyến mãi (chỉ Quản lý / Admin)
router.delete('/:id', requireRole('Quản lý', 'Admin'), khuyenMaiController.delete);

module.exports = router;
