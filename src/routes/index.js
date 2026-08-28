const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const sanPhamRoutes = require('./sanPhamRoutes');
const mayImeiRoutes = require('./mayImeiRoutes');
const khachHangRoutes = require('./khachHangRoutes');
const nhaCungCapRoutes = require('./nhaCungCapRoutes');
const nhanVienRoutes = require('./nhanVienRoutes');
const danhMucRoutes = require('./danhMucRoutes');
const phuKienRoutes = require('./phuKienRoutes');
const hoaDonRoutes = require('./hoaDonRoutes');
const baoHanhRoutes = require('./baoHanhRoutes');
const datTruocRoutes = require('./datTruocRoutes');
const doiTraRoutes = require('./doiTraRoutes');
const thanhToanRoutes = require('./thanhToanRoutes');
const phieuNhapRoutes = require('./phieuNhapRoutes');
const khoRoutes = require('./khoRoutes');
const congNoRoutes = require('./congNoRoutes');
const traGopRoutes = require('./traGopRoutes');
const kiemKeRoutes = require('./kiemKeRoutes');
const baoCaoRoutes = require('./baoCaoRoutes');

// Mount toàn bộ REST API endpoints
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/san-pham', sanPhamRoutes);
router.use('/may-imei', mayImeiRoutes);
router.use('/khach-hang', khachHangRoutes);
router.use('/nha-cung-cap', nhaCungCapRoutes);
router.use('/nhan-vien', nhanVienRoutes);
router.use('/danh-muc', danhMucRoutes);
router.use('/phu-kien', phuKienRoutes);
router.use('/hoa-don', hoaDonRoutes);
router.use('/bao-hanh', baoHanhRoutes);
router.use('/dat-truoc', datTruocRoutes);
router.use('/doi-tra', doiTraRoutes);
router.use('/thanh-toan', thanhToanRoutes);
router.use('/phieu-nhap', phieuNhapRoutes);
router.use('/kho', khoRoutes);
router.use('/cong-no', congNoRoutes);
router.use('/tra-gop', traGopRoutes);
router.use('/kiem-ke', kiemKeRoutes);
router.use('/bao-cao', baoCaoRoutes);

module.exports = router;
