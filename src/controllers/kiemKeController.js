const BaseController = require('./BaseController');
const { KiemKeService } = require('../services');

class KiemKeController extends BaseController {
  constructor() {
    super();
    this.layDanhSachImeiLyThuyet = this.layDanhSachImeiLyThuyet.bind(this);
    this.thucHienKiemKe = this.thucHienKiemKe.bind(this);
    this.layDanhSachBienBan = this.layDanhSachBienBan.bind(this);
    this.layChiTietBienBan = this.layChiTietBienBan.bind(this);
    this.apDungDieuChinh = this.apDungDieuChinh.bind(this);
    this.huyBienBan = this.huyBienBan.bind(this);
  }

  /**
   * GET /api/kiem-ke/imei-ly-thuyet/:khoId?
   */
  async layDanhSachImeiLyThuyet(req, res) {
    try {
      const khoId = req.params.khoId || req.query.khoId;
      const result = await KiemKeService.layDanhSachImeiLyThuyet(khoId);
      return this.sendSuccess(res, result, 'Lấy danh sách IMEI lý thuyết thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * POST /api/kiem-ke
   */
  async thucHienKiemKe(req, res) {
    try {
      const { khoId, danhSachImeiThucTe, ghiChu } = req.body;
      const sessionUser = req.user || req.session?.user;

      const result = await KiemKeService.thucHienKiemKe({
        khoId,
        danhSachImeiThucTe,
        ghiChu,
        sessionUser
      });

      return this.sendSuccess(res, result, 'Thực hiện kiểm kê kho và lập biên bản thành công', 201);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * GET /api/kiem-ke
   */
  async layDanhSachBienBan(req, res) {
    try {
      const result = await KiemKeService.layDanhSachBienBan(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách biên bản kiểm kê thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * GET /api/kiem-ke/:id
   */
  async layChiTietBienBan(req, res) {
    try {
      const result = await KiemKeService.layChiTietBienBan(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết biên bản kiểm kê thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * PUT /api/kiem-ke/:id/ap-dung
   */
  async apDungDieuChinh(req, res) {
    try {
      const sessionUser = req.user || req.session?.user;
      const result = await KiemKeService.apDungDieuChinh(req.params.id, sessionUser);
      return this.sendSuccess(res, result, 'Áp dụng điều chỉnh kho thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * PUT /api/kiem-ke/:id/huy
   */
  async huyBienBan(req, res) {
    try {
      const sessionUser = req.user || req.session?.user;
      const result = await KiemKeService.huyBienBan(req.params.id, sessionUser);
      return this.sendSuccess(res, result, 'Hủy biên bản kiểm kê thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new KiemKeController();
