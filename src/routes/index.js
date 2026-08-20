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

// Mount routes
router.use('/', authRoutes);
router.use('/', dashboardRoutes);
router.use('/san-pham', sanPhamRoutes);
router.use('/may-imei', mayImeiRoutes);
router.use('/khach-hang', khachHangRoutes);
router.use('/nha-cung-cap', nhaCungCapRoutes);
router.use('/nhan-vien', nhanVienRoutes);
router.use('/danh-muc', danhMucRoutes);
router.use('/phu-kien', phuKienRoutes);

module.exports = router;
