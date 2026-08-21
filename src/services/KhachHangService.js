const BaseService = require('./BaseService');
const { KhachHang, HoaDon } = require('../models');

class KhachHangService extends BaseService {
  constructor() {
    super(KhachHang);
  }

  async getAllKhachHangs(query = {}) {
    const { search } = query;
    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { hoTen: { $regex: search.trim(), $options: 'i' } },
        { sdt: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    return await KhachHang.find(filter).sort({ createdAt: -1 });
  }

  async getKhachHangDetail(id) {
    const khachHang = await KhachHang.findById(id);
    if (!khachHang) {
      throw this.createError('Không tìm thấy khách hàng', 404);
    }

    // Lịch sử mua hàng
    const hoaDons = await HoaDon.find({ khachHang: id }).sort({ ngayLap: -1 });

    return { khachHang, hoaDons };
  }

  async createKhachHang(payload = {}) {
    const { hoTen, sdt, diaChi, email } = payload;
    if (!hoTen || !hoTen.trim()) {
      throw this.createError('Vui lòng nhập họ tên khách hàng', 400);
    }

    return await KhachHang.create({
      hoTen: hoTen.trim(),
      sdt: sdt ? sdt.trim() : '',
      diaChi: diaChi ? diaChi.trim() : '',
      email: email ? email.trim() : ''
    });
  }

  async updateKhachHang(id, payload = {}) {
    const { hoTen, sdt, diaChi, email } = payload;
    const updated = await KhachHang.findByIdAndUpdate(
      id,
      {
        hoTen: hoTen ? hoTen.trim() : undefined,
        sdt: sdt !== undefined ? sdt.trim() : undefined,
        diaChi: diaChi !== undefined ? diaChi.trim() : undefined,
        email: email !== undefined ? email.trim() : undefined
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw this.createError('Không tìm thấy khách hàng để cập nhật', 404);
    }

    return updated;
  }

  async deleteKhachHang(id) {
    const hdCount = await HoaDon.countDocuments({ khachHang: id });
    if (hdCount > 0) {
      throw this.createError(`Không thể xóa khách hàng đã có ${hdCount} hóa đơn giao dịch!`, 400);
    }

    const deleted = await KhachHang.findByIdAndDelete(id);
    if (!deleted) {
      throw this.createError('Không tìm thấy khách hàng', 404);
    }

    return { success: true, id };
  }
}

module.exports = new KhachHangService();
