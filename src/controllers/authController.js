const { NhanVien } = require('../models');

const authController = {
  // POST /api/auth/login
  postLogin: async (req, res) => {
    try {
      const { tenDangNhap, matKhau } = req.body;

      if (!tenDangNhap || !matKhau) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
        });
      }

      const nhanVien = await NhanVien.findOne({ tenDangNhap: tenDangNhap.trim().toLowerCase() });
      if (!nhanVien) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
        });
      }

      if (nhanVien.trangThai === 'Khóa') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý.'
        });
      }

      const isMatch = await nhanVien.comparePassword(matKhau);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
        });
      }

      // Lưu thông tin phiên đăng nhập
      req.session.user = {
        _id: nhanVien._id,
        hoTen: nhanVien.hoTen,
        tenDangNhap: nhanVien.tenDangNhap,
        vaiTro: nhanVien.vaiTro,
        sdt: nhanVien.sdt
      };

      return res.status(200).json({
        success: true,
        message: `Chào mừng ${nhanVien.hoTen} (${nhanVien.vaiTro}) quay trở lại!`,
        user: req.session.user
      });
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi máy chủ trong quá trình xử lý'
      });
    }
  },

  // POST /api/auth/logout
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Lỗi đăng xuất:', err);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi đăng xuất'
        });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Đã đăng xuất thành công'
      });
    });
  },

  // GET /api/auth/me
  getMe: (req, res) => {
    if (req.session && req.session.user) {
      return res.status(200).json({
        success: true,
        user: req.session.user
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Chưa đăng nhập'
    });
  }
};

module.exports = authController;
