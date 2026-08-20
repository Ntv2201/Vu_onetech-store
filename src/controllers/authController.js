const { NhanVien } = require('../models');

const authController = {
  // GET /login
  getLogin: (req, res) => {
    if (req.session && req.session.user) {
      return res.redirect('/dashboard');
    }
    res.render('auth/login', {
      title: 'Đăng nhập - One Tech Store',
      layout: false,
      error: req.flash('error_msg')
    });
  },

  // POST /login
  postLogin: async (req, res) => {
    try {
      const { tenDangNhap, matKhau } = req.body;

      if (!tenDangNhap || !matKhau) {
        req.flash('error_msg', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
        return res.redirect('/login');
      }

      const nhanVien = await NhanVien.findOne({ tenDangNhap: tenDangNhap.trim().toLowerCase() });
      if (!nhanVien) {
        req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không chính xác');
        return res.redirect('/login');
      }

      if (nhanVien.trangThai === 'Khóa') {
        req.flash('error_msg', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý.');
        return res.redirect('/login');
      }

      const isMatch = await nhanVien.comparePassword(matKhau);
      if (!isMatch) {
        req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không chính xác');
        return res.redirect('/login');
      }

      // Lưu thông tin phiên đăng nhập
      req.session.user = {
        _id: nhanVien._id,
        hoTen: nhanVien.hoTen,
        tenDangNhap: nhanVien.tenDangNhap,
        vaiTro: nhanVien.vaiTro,
        sdt: nhanVien.sdt
      };

      req.flash('success_msg', `Chào mừng ${nhanVien.hoTen} (${nhanVien.vaiTro}) quay trở lại!`);
      const returnTo = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;
      res.redirect(returnTo);
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      req.flash('error_msg', 'Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.');
      res.redirect('/login');
    }
  },

  // GET /logout
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Lỗi đăng xuất:', err);
      }
      res.redirect('/login');
    });
  }
};

module.exports = authController;
