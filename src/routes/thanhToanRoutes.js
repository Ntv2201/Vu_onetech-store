const express = require('express');
const router = express.Router();
const thanhToanController = require('../controllers/thanhToanController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ routes Thu - Chi & Sổ quỹ yêu cầu đăng nhập
router.use(requireAuth);

// GET /api/thanh-toan/so-quy - Lấy báo cáo sổ quỹ
router.get('/so-quy', requireRole('Quản lý', 'Kế toán', 'Thu ngân'), thanhToanController.getSoQuy);

// GET /api/thanh-toan/thu - Lấy danh sách phiếu thu
router.get('/thu', requireRole('Quản lý', 'Thu ngân', 'Kế toán', 'NV bán hàng'), thanhToanController.indexThu);

// GET /api/thanh-toan/thu/:id - Lấy chi tiết phiếu thu
router.get('/thu/:id', requireRole('Quản lý', 'Thu ngân', 'Kế toán', 'NV bán hàng'), thanhToanController.getPhieuThuDetail);

// POST /api/thanh-toan/thu - Tạo phiếu thu mới
router.post('/thu', requireRole('Quản lý', 'Thu ngân', 'Kế toán', 'NV bán hàng'), thanhToanController.createPhieuThu);

// GET /api/thanh-toan/chi - Lấy danh sách phiếu chi
router.get('/chi', requireRole('Quản lý', 'Thu ngân', 'Kế toán', 'Thủ kho'), thanhToanController.indexChi);

// GET /api/thanh-toan/chi/:id - Lấy chi tiết phiếu chi
router.get('/chi/:id', requireRole('Quản lý', 'Thu ngân', 'Kế toán', 'Thủ kho'), thanhToanController.getPhieuChiDetail);

// POST /api/thanh-toan/chi - Tạo phiếu chi mới
router.post('/chi', requireRole('Quản lý', 'Thu ngân', 'Kế toán'), thanhToanController.createPhieuChi);

module.exports = router;
