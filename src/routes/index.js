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
const khoRoutes = require('./KhoRoutes');
const congNoRoutes = require('./CongNoRoutes');
const thanhToanRoutes = require('./thanhToanRoutes');
const phieuNhapRoutes = require('./phieuNhapRoutes');

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
router.use('/kho', khoRoutes);
router.use('/cong-no', congNoRoutes);
router.use('/thanh-toan', thanhToanRoutes);
router.use('/phieu-nhap', phieuNhapRoutes);

module.exports = router;
