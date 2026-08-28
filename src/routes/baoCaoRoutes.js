const express = require('express');
const router = express.Router();
const baoCaoController = require('../controllers/baoCaoController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

// Báo cáo Doanh thu, Chi phí & Lợi nhuận gộp
router.get('/doanh-thu', requireRole('Quản lý', 'Kế toán'), baoCaoController.getBaoCaoDoanhThu);

// Top sản phẩm bán chạy nhất
router.get('/top-san-pham', requireRole('Quản lý', 'Kế toán', 'NV bán hàng', 'Thủ kho'), baoCaoController.getTopSanPham);

// Danh sách máy IMEI tồn kho lâu ngày (> 60 ngày)
router.get('/ton-lau-ngay', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), baoCaoController.getHangTonLauNgay);

// Báo cáo đối soát tài chính tổng hợp
router.get('/tong-hop-tai-chinh', requireRole('Quản lý', 'Kế toán'), baoCaoController.getBaoCaoTaiChinhTongHop);

module.exports = router;
