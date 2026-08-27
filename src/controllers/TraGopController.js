const BaseController = require('./BaseController');
const TraGopService = require('../services/TraGopService');

class TraGopController extends BaseController {
  constructor() {
    super();
    this.taoHopDong = this.taoHopDong.bind(this);
    this.layDanhSach = this.layDanhSach.bind(this);
    this.layChiTiet = this.layChiTiet.bind(this);
    this.layLichThu = this.layLichThu.bind(this);
    this.thuTienKy = this.thuTienKy.bind(this);
  }

  /**
   * POST /api/tra-gop
   * body: { hoaDonId, soTienTraTruoc, soKy, ghiChu }
   */
  async taoHopDong(req, res) {
    try {
      const { hoaDonId, soTienTraTruoc, soKy, ghiChu } = req.body;
      const data = await TraGopService.taoHopDongTraGop({
        hoaDonId, soTienTraTruoc, soKy, ghiChu
      });
      return this.sendSuccess(res, data, 'Lập hợp đồng trả góp thành công', 201);
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * GET /api/tra-gop
   */
  async layDanhSach(req, res) {
    try {
      const data = await TraGopService.layDanhSachHopDong(req.query);
      return this.sendSuccess(res, data, 'Lấy danh sách hợp đồng trả góp thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * GET /api/tra-gop/:id
   */
  async layChiTiet(req, res) {
    try {
      const data = await TraGopService.layChiTietHopDong(req.params.id);
      return this.sendSuccess(res, data, 'Lấy chi tiết hợp đồng trả góp thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * GET /api/tra-gop/:id/lich-thu
   */
  async layLichThu(req, res) {
    try {
      const data = await TraGopService.layLichThuKy(req.params.id);
      return this.sendSuccess(res, data, 'Lấy lịch thu kỳ hạn trả góp thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * POST /api/tra-gop/:id/thu-ky
   * body: { hinhThuc, ghiChu }
   */
  async thuTienKy(req, res) {
    try {
      const { hinhThuc, ghiChu } = req.body;
      const data = await TraGopService.thuTienKy(req.params.id, { hinhThuc, ghiChu });
      return this.sendSuccess(res, data, 'Thu tiền kỳ hạn trả góp thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new TraGopController();
