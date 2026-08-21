const BaseService = require('./BaseService');
const { NhanVien } = require('../models');

class NhanVienService extends BaseService {
  constructor() {
    super(NhanVien);
  }

  async getAllNhanViens(query = {}) {
    const { search, vaiTro } = query;
    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { hoTen: { $regex: search.trim(), $options: 'i' } },
        { sdt: { $regex: search.trim(), $options: 'i' } },
        { tenDangNhap: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    if (vaiTro) {
      filter.vaiTro = vaiTro;
    }

    return await NhanVien.find(filter).select('-matKhau').sort({ createdAt: -1 });
  }

  async getNhanVienDetail(id) {
    const nhanVien = await NhanVien.findById(id).select('-matKhau');
    if (!nhanVien) {
      throw this.createError('Không tìm thấy nhân viên', 404);
    }
    return nhanVien;
  }

  async createNhanVien(payload = {}) {
    const { hoTen, sdt, vaiTro, tenDangNhap, matKhau } = payload;

    if (!hoTen || !vaiTro || !tenDangNhap || !matKhau) {
      throw this.createError('Vui lòng điền đầy đủ Họ tên, Vai trò, Tên đăng nhập và Mật khẩu', 400);
    }

    const existing = await NhanVien.findOne({ tenDangNhap: tenDangNhap.trim() });
    if (existing) {
      throw this.createError('Tên đăng nhập đã tồn tại trong hệ thống', 409);
    }

    const nv = await NhanVien.create({
      hoTen: hoTen.trim(),
      sdt: sdt ? sdt.trim() : '',
      vaiTro,
      tenDangNhap: tenDangNhap.trim(),
      matKhau
    });

    const nvObj = nv.toObject();
    delete nvObj.matKhau;
    return nvObj;
  }

  async updateNhanVien(id, payload = {}, currentUserId = null) {
    const { hoTen, sdt, vaiTro, tenDangNhap, matKhau } = payload;

    const nv = await NhanVien.findById(id);
    if (!nv) {
      throw this.createError('Không tìm thấy nhân viên để cập nhật', 404);
    }

    if (tenDangNhap && tenDangNhap.trim() !== nv.tenDangNhap) {
      const dup = await NhanVien.findOne({ tenDangNhap: tenDangNhap.trim() });
      if (dup) {
        throw this.createError('Tên đăng nhập mới đã tồn tại', 409);
      }
      nv.tenDangNhap = tenDangNhap.trim();
    }

    if (hoTen) nv.hoTen = hoTen.trim();
    if (sdt !== undefined) nv.sdt = sdt.trim();
    if (vaiTro) nv.vaiTro = vaiTro;
    if (matKhau && matKhau.trim()) {
      nv.matKhau = matKhau;
    }

    await nv.save();
    const nvObj = nv.toObject();
    delete nvObj.matKhau;
    return nvObj;
  }

  async deleteNhanVien(id, currentUserId = null) {
    if (currentUserId && id.toString() === currentUserId.toString()) {
      throw this.createError('Bạn không thể tự xóa tài khoản của chính mình!', 400);
    }

    const deleted = await NhanVien.findByIdAndDelete(id);
    if (!deleted) {
      throw this.createError('Không tìm thấy nhân viên', 404);
    }

    return { success: true, id };
  }
}

module.exports = new NhanVienService();
