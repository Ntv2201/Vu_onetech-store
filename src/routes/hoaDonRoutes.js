const express = require('express');
const router = express.Router();
const hoaDonController = require('../controllers/hoaDonController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ route Hóa đơn yêu cầu đăng nhập
router.use(requireAuth);

// GET /api/hoa-don/thong-ke-nhanh - Thống kê bán hàng nhanh
router.get('/thong-ke-nhanh', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán'), hoaDonController.getThongKeNhanh);

// GET /api/hoa-don/imei-kha-dung - Tìm kiếm máy IMEI khả dụng bán hàng POS
router.get('/imei-kha-dung', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), hoaDonController.getImeiKhaDung);

// GET /api/hoa-don/kiem-tra-doi-tra/:imei - Kiểm tra điều kiện đổi trả theo số IMEI
router.get('/kiem-tra-doi-tra/:imei', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), hoaDonController.kiemTraDoiTra);

// GET /api/hoa-don/dat-truoc/tim-kiem - Tìm kiếm đơn đặt trước phục vụ POS bán hàng
router.get('/dat-truoc/tim-kiem', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), hoaDonController.searchDonDatHang);

// GET /api/hoa-don - Danh sách hóa đơn
router.get('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán'), hoaDonController.index);

// GET /api/hoa-don/:id - Chi tiết hóa đơn
router.get('/:id', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán'), hoaDonController.getDetail);

// POST /api/hoa-don - Bán hàng (tạo hóa đơn theo danh sách IMEI & phụ kiện, trừ kho, sinh phiếu xuất, liên kết Sổ quỹ/Công nợ)
router.post('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), hoaDonController.create);

module.exports = router;
