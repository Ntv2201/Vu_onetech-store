const BaseController = require('./BaseController');
const { AuthService } = require('../services');

class AuthController extends BaseController {
  constructor() {
    super();
    this.postLogin = this.postLogin.bind(this);
    this.logout = this.logout.bind(this);
    this.getMe = this.getMe.bind(this);
  }

  // POST /api/auth/login
  async postLogin(req, res) {
    try {
      const { tenDangNhap, matKhau } = req.body;
      const user = await AuthService.login(tenDangNhap, matKhau);

      // Lưu session
      req.session.user = user;

      return this.sendSuccess(
        res,
        { user },
        `Chào mừng ${user.hoTen} (${user.vaiTro}) quay trở lại!`,
        200,
        { user }
      );
    } catch (error) {
      return this.handleError(res, error, 'Lỗi trong quá trình đăng nhập');
    }
  }

  // POST /api/auth/logout
  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return this.sendError(res, 'Lỗi khi đăng xuất', 500);
      }
      res.clearCookie('connect.sid');
      return this.sendSuccess(res, null, 'Đã đăng xuất thành công');
    });
  }

  // GET /api/auth/me
  getMe(req, res) {
    if (req.session && req.session.user) {
      return this.sendSuccess(
        res,
        { user: req.session.user },
        'Thông tin người dùng hiện tại',
        200,
        { user: req.session.user }
      );
    }
    return this.sendError(res, 'Chưa đăng nhập', 401);
  }
}

module.exports = new AuthController();
