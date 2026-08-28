const BaseController = require('./BaseController');
const { BaoCaoService } = require('../services');

class BaoCaoController extends BaseController {
  constructor() {
    super();
    this.getBaoCaoDoanhThu = this.getBaoCaoDoanhThu.bind(this);
    this.getTopSanPham = this.getTopSanPham.bind(this);
    this.getHangTonLauNgay = this.getHangTonLauNgay.bind(this);
    this.getBaoCaoTaiChinhTongHop = this.getBaoCaoTaiChinhTongHop.bind(this);
  }

  /**
   * GET /api/bao-cao/doanh-thu
   */
  async getBaoCaoDoanhThu(req, res) {
    try {
      const data = await BaoCaoService.getBaoCaoDoanhThu(req.query);
      return this.sendSuccess(res, data, 'Lấy báo cáo doanh thu thành công');
    } catch (err) {
      return this.handleError(res, err, 'Lỗi khi lấy báo cáo doanh thu');
    }
  }

  /**
   * GET /api/bao-cao/top-san-pham
   */
  async getTopSanPham(req, res) {
    try {
      const data = await BaoCaoService.getTopSanPham(req.query);
      return this.sendSuccess(res, data, 'Lấy top sản phẩm bán chạy thành công');
    } catch (err) {
      return this.handleError(res, err, 'Lỗi khi lấy top sản phẩm');
    }
  }

  /**
   * GET /api/bao-cao/ton-lau-ngay
   */
  async getHangTonLauNgay(req, res) {
    try {
      const data = await BaoCaoService.getHangTonLauNgay(req.query);
      return this.sendSuccess(res, data, 'Lấy danh sách hàng tồn lâu ngày thành công');
    } catch (err) {
      return this.handleError(res, err, 'Lỗi khi lấy danh sách hàng tồn lâu ngày');
    }
  }

  /**
   * GET /api/bao-cao/tong-hop-tai-chinh
   */
  async getBaoCaoTaiChinhTongHop(req, res) {
    try {
      const data = await BaoCaoService.getBaoCaoTaiChinhTongHop();
      return this.sendSuccess(res, data, 'Lấy báo cáo tổng hợp tài chính thành công');
    } catch (err) {
      return this.handleError(res, err, 'Lỗi khi lấy báo cáo tổng hợp tài chính');
    }
  }
}

module.exports = new BaoCaoController();
