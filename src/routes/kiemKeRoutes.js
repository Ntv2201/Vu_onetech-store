const express = require('express');
const router = express.Router();
const kiemKeController = require('../controllers/kiemKeController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Tra cứu danh sách IMEI lý thuyết theo kho
router.get('/imei-ly-thuyet/:khoId?', requireAuth, requireRole('Quản lý', 'Thủ kho'), kiemKeController.layDanhSachImeiLyThuyet);

// Lập biên bản kiểm kê kho & đối soát IMEI thực tế
router.post('/', requireAuth, requireRole('Quản lý', 'Thủ kho'), kiemKeController.thucHienKiemKe);

// Lấy danh sách biên bản kiểm kê
router.get('/', requireAuth, requireRole('Quản lý', 'Thủ kho', 'Kế toán'), kiemKeController.layDanhSachBienBan);

// Xem chi tiết biên bản kiểm kê & danh sách dòng điều chỉnh
router.get('/:id', requireAuth, requireRole('Quản lý', 'Thủ kho', 'Kế toán'), kiemKeController.layChiTietBienBan);

// Áp dụng điều chỉnh tồn kho và trạng thái máy
router.put('/:id/ap-dung', requireAuth, requireRole('Quản lý', 'Thủ kho'), kiemKeController.apDungDieuChinh);

// Hủy biên bản kiểm kê (Chỉ Quản lý)
router.put('/:id/huy', requireAuth, requireRole('Quản lý'), kiemKeController.huyBienBan);

module.exports = router;
