const BaseService = require('./BaseService');
const { NhanVien } = require('../models');

class AuthService extends BaseService {
  constructor() {
    super(NhanVien);
  }

  async login(tenDangNhap, matKhau) {
    if (!tenDangNhap || !matKhau) {
      throw this.createError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu', 400);
    }

    const nhanVien = await NhanVien.findOne({ tenDangNhap: tenDangNhap.trim().toLowerCase() });
    if (!nhanVien) {
      throw this.createError('Tên đăng nhập hoặc mật khẩu không chính xác', 401);
    }

    if (nhanVien.trangThai === 'Khóa') {
      throw this.createError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý.', 403);
    }

    const isMatch = await nhanVien.comparePassword(matKhau);
    if (!isMatch) {
      throw this.createError('Tên đăng nhập hoặc mật khẩu không chính xác', 401);
    }

    return {
      _id: nhanVien._id,
      hoTen: nhanVien.hoTen,
      tenDangNhap: nhanVien.tenDangNhap,
      vaiTro: nhanVien.vaiTro,
      sdt: nhanVien.sdt
    };
  }
}

module.exports = new AuthService();
