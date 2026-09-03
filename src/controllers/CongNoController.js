const BaseController = require('./BaseController');
const CongNoService = require('../services/CongNoService');

class CongNoController extends BaseController {
  constructor() {
    super();
    this.layDanhSach = this.layDanhSach.bind(this);
    this.layChiTiet = this.layChiTiet.bind(this);
    this.thanhToan = this.thanhToan.bind(this);
    this.kiemTraQuaHan = this.kiemTraQuaHan.bind(this);
    this.layThongKeDoiSoat = this.layThongKeDoiSoat.bind(this);
  }

  /**
   * GET /api/cong-no
   */
  async layDanhSach(req, res) {
    try {
      const data = await CongNoService.layDanhSachCongNo(req.query);
      return this.sendSuccess(res, data, 'Lấy danh sách công nợ thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * GET /api/cong-no/doi-soat
   */
  async layThongKeDoiSoat(req, res) {
    try {
      const data = await CongNoService.layThongKeDoiSoat(req.query);
      return this.sendSuccess(res, data, 'Lấy thống kê đối soát công nợ thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * POST /api/cong-no/kiem-tra-qua-han
   */
  async kiemTraQuaHan(req, res) {
    try {
      const data = await CongNoService.kiemTraVaCapNhatQuaHan();
      return this.sendSuccess(res, data, 'Kiểm tra và cập nhật công nợ quá hạn thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * GET /api/cong-no/:id
   */
  async layChiTiet(req, res) {
    try {
      const data = await CongNoService.layChiTietCongNo(req.params.id);
      return this.sendSuccess(res, data, 'Lấy chi tiết công nợ thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * POST /api/cong-no/:id/thanh-toan
   * body: { soTien, hinhThuc, ghiChu }
   */
  async thanhToan(req, res) {
    try {
      const { soTien, hinhThuc, ghiChu } = req.body;
      const data = await CongNoService.thanhToanCongNo(req.params.id, {
        soTien, hinhThuc, ghiChu
      });
      return this.sendSuccess(res, data, 'Thanh toán công nợ thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new CongNoController();