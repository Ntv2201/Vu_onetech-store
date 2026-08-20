const {
  SanPham,
  MayImei,
  KhachHang,
  NhaCungCap,
  NhanVien,
  DanhMuc,
  HoaDon,
  PhieuBaoHanh
} = require('../models');

const dashboardController = {
  index: async (req, res) => {
    try {
      // Đếm số lượng sản phẩm, IMEI theo trạng thái
      const [
        totalSanPham,
        totalMayImei,
        imeiConHang,
        imeiDaBan,
        imeiBaoHanh,
        totalKhachHang,
        totalNhaCungCap,
        totalNhanVien,
        recentMayImei,
        recentSanPham
      ] = await Promise.all([
        SanPham.countDocuments(),
        MayImei.countDocuments(),
        MayImei.countDocuments({ trangThai: 'Con hang' }),
        MayImei.countDocuments({ trangThai: 'Da ban' }),
        MayImei.countDocuments({ trangThai: 'Bao hanh' }),
        KhachHang.countDocuments(),
        NhaCungCap.countDocuments(),
        NhanVien.countDocuments(),
        MayImei.find().populate('sanPham').sort({ createdAt: -1 }).limit(6),
        SanPham.find().populate('danhMuc').sort({ createdAt: -1 }).limit(6)
      ]);

      res.render('dashboard/index', {
        title: 'Tổng quan hệ thống - One Tech Store',
        stats: {
          totalSanPham,
          totalMayImei,
          imeiConHang,
          imeiDaBan,
          imeiBaoHanh,
          totalKhachHang,
          totalNhaCungCap,
          totalNhanVien
        },
        recentMayImei,
        recentSanPham
      });
    } catch (error) {
      console.error('Lỗi dashboard:', error);
      res.render('dashboard/index', {
        title: 'Tổng quan hệ thống',
        stats: {
          totalSanPham: 0,
          totalMayImei: 0,
          imeiConHang: 0,
          imeiDaBan: 0,
          imeiBaoHanh: 0,
          totalKhachHang: 0,
          totalNhaCungCap: 0,
          totalNhanVien: 0
        },
        recentMayImei: [],
        recentSanPham: []
      });
    }
  }
};

module.exports = dashboardController;
