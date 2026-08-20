const {
  SanPham,
  MayImei,
  KhachHang,
  NhaCungCap,
  NhanVien,
  DanhMuc,
  PhuKien
} = require('../models');

const dashboardController = {
  // GET /api/dashboard
  index: async (req, res) => {
    try {
      const [
        totalSanPham,
        totalMayImei,
        imeiConHang,
        imeiDaBan,
        imeiBaoHanh,
        imeiLoi,
        totalKhachHang,
        totalNhaCungCap,
        totalNhanVien,
        totalDanhMuc,
        totalPhuKien,
        recentMayImei,
        recentSanPham
      ] = await Promise.all([
        SanPham.countDocuments(),
        MayImei.countDocuments(),
        MayImei.countDocuments({ trangThai: 'Con hang' }),
        MayImei.countDocuments({ trangThai: 'Da ban' }),
        MayImei.countDocuments({ trangThai: 'Bao hanh' }),
        MayImei.countDocuments({ trangThai: 'Loi' }),
        KhachHang.countDocuments(),
        NhaCungCap.countDocuments(),
        NhanVien.countDocuments(),
        DanhMuc.countDocuments(),
        PhuKien.countDocuments(),
        MayImei.find().populate('sanPham').sort({ createdAt: -1 }).limit(6),
        SanPham.find().populate('danhMuc').sort({ createdAt: -1 }).limit(6)
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalSanPham,
          totalMayImei,
          imeiConHang,
          imeiDaBan,
          imeiBaoHanh,
          imeiLoi,
          totalKhachHang,
          totalNhaCungCap,
          totalNhanVien,
          totalDanhMuc,
          totalPhuKien
        },
        recentMayImei,
        recentSanPham
      });
    } catch (error) {
      console.error('Lỗi dashboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải dữ liệu thống kê dashboard: ' + error.message
      });
    }
  }
};

module.exports = dashboardController;
