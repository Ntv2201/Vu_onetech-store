const BaseController = require('./BaseController');
const { HoaDonService } = require('../services');

class HoaDonController extends BaseController {
  constructor() {
    super();
    // Bind methods to keep `this` context when passed directly to express routes
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.create = this.create.bind(this);
    this.searchDonDatHang = this.searchDonDatHang.bind(this);
  }

  /**
   * GET /api/hoa-don/dat-truoc/tim-kiem - Tìm kiếm đơn đặt hàng trước còn hiệu lực
   */
  async searchDonDatHang(req, res) {
    try {
      const result = await HoaDonService.timKiemDonDatHang(req.query.search);
      return this.sendSuccess(res, result, 'Lấy danh sách đơn đặt trước thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tìm kiếm đơn đặt trước');
    }
  }

  /**
   * GET /api/hoa-don - Danh sách hóa đơn (query: tuNgay, denNgay, maKH, trangThai, search)
   */
  async index(req, res) {
    try {
      const result = await HoaDonService.getHoaDonList(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách hóa đơn thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách hóa đơn');
    }
  }

  /**
   * GET /api/hoa-don/:id - Chi tiết hóa đơn kèm danh sách IMEI máy, phụ kiện, phiếu xuất kho
   */
  async getDetail(req, res) {
    try {
      const result = await HoaDonService.getHoaDonDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết hóa đơn thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải chi tiết hóa đơn');
    }
  }

  /**
   * POST /api/hoa-don - Bán hàng theo danh sách IMEI và phụ kiện
   * Khóa trạng thái, kiểm tra xung đột (409 Conflict), sinh phiếu xuất kho
   */
  async create(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await HoaDonService.taoHoaDonBanHang(req.body, sessionUser);
      return this.sendSuccess(res, result, `Tạo hóa đơn bán hàng ${result.hoaDon.soHD} thành công!`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo hóa đơn bán hàng');
    }
  }
}

module.exports = new HoaDonController();
