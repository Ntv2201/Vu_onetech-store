const BaseService = require('./BaseService');
const {
  SanPham,
  MayImei,
  KhachHang,
  NhaCungCap,
  NhanVien,
  DanhMuc,
  PhuKien,
  HoaDon,
  PhieuBaoHanh
} = require('../models');

class DashboardService extends BaseService {
  async getDashboardStats() {
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
      totalHoaDon,
      totalPhieuBaoHanh,
      recentMayImei,
      recentSanPham,
      recentHoaDon
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
      HoaDon.countDocuments(),
      PhieuBaoHanh.countDocuments(),
      MayImei.find().populate('sanPham').sort({ createdAt: -1 }).limit(6),
      SanPham.find().populate('danhMuc').sort({ createdAt: -1 }).limit(6),
      HoaDon.find().populate('khachHang', 'hoTen').sort({ ngayLap: -1 }).limit(5)
    ]);

    return {
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
        totalPhuKien,
        totalHoaDon,
        totalPhieuBaoHanh
      },
      recentMayImei,
      recentSanPham,
      recentHoaDon
    };
  }
}

module.exports = new DashboardService();
