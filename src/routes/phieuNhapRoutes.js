const express = require('express');
const router = express.Router();
const phieuNhapController = require('../controllers/phieuNhapController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ phân hệ nhập kho cần đăng nhập
router.use(requireAuth);

// GET /api/phieu-nhap - Lấy danh sách phiếu nhập
router.get('/', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), phieuNhapController.getDanhSach);

// GET /api/phieu-nhap/:id - Lấy chi tiết phiếu nhập
router.get('/:id', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), phieuNhapController.getChiTiet);

// POST /api/phieu-nhap/import-hang-loat - Nhập hàng loạt nhiều IMEI
router.post('/import-hang-loat', requireRole('Quản lý', 'Thủ kho'), phieuNhapController.postImportHangLoat);

// POST /api/phieu-nhap - Tạo phiếu nhập kho mới
router.post('/', requireRole('Quản lý', 'Thủ kho'), phieuNhapController.taoPhieuNhap);

module.exports = router;
