const express = require('express');
const router = express.Router();
const phieuNhapController = require('../controllers/phieuNhapController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ phân hệ nhập kho cần đăng nhập và có quyền QuanLy hoặc ThuKho
router.use(requireAuth);
router.use(requireRole(['QuanLy', 'ThuKho']));

// API endpoints
router.post('/', phieuNhapController.taoPhieuNhap);
router.get('/', phieuNhapController.getDanhSach);
router.get('/:id', phieuNhapController.getChiTiet);

module.exports = router;
