const BaseController = require('./BaseController');
const { DatTruocService } = require('../services');

/**
 * DatTruocController - Controller tiếp nhận HTTP requests cho Phân hệ Đặt hàng trước
 * Thành viên 6: Tô Quốc Việt
 */
class DatTruocController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.create = this.create.bind(this);
    this.cancel = this.cancel.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.chuyenHoaDon = this.chuyenHoaDon.bind(this);
  }

  /**
   * GET /api/dat-truoc - Lấy danh sách đơn đặt trước (query: trangThai, maKH, tuNgay, denNgay, search, page, limit)
   */
  async index(req, res) {
    try {
      const result = await DatTruocService.getDatTruocList(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách đơn đặt trước thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách đơn đặt trước');
    }
  }

  /**
   * GET /api/dat-truoc/:id - Chi tiết 1 đơn đặt trước kèm phiếu thu cọc & phiếu chi hoàn cọc
   */
  async getDetail(req, res) {
    try {
      const result = await DatTruocService.getDatTruocDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết đơn đặt trước thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải chi tiết đơn đặt trước');
    }
  }

  /**
   * POST /api/dat-truoc - Tiếp nhận đơn đặt hàng trước & tự động sinh phiếu thu cọc
   */
  async create(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await DatTruocService.createDatTruoc(req.body, sessionUser);
      return this.sendSuccess(res, result, 'Tiếp nhận đơn đặt trước và ghi nhận tiền cọc thành công!', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo đơn đặt trước');
    }
  }

  /**
   * PUT /api/dat-truoc/:id/huy - Khách hủy đơn đặt trước & tự động sinh phiếu chi hoàn cọc
   */
  async cancel(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await DatTruocService.huyDatTruoc(req.params.id, req.body, sessionUser);
      return this.sendSuccess(res, result, 'Hủy đơn đặt trước và tạo phiếu hoàn tiền cọc thành công!');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi hủy đơn đặt trước');
    }
  }

  /**
   * PUT /api/dat-truoc/:id/trang-thai - Cập nhật trạng thái / gán IMEI cho đơn đặt trước
   */
  async updateStatus(req, res) {
    try {
      const result = await DatTruocService.capNhatTrangThai(req.params.id, req.body);
      return this.sendSuccess(res, result, 'Cập nhật trạng thái đơn đặt trước thành công!');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật trạng thái đơn đặt trước');
    }
  }

  /**
   * PUT /api/dat-truoc/:id/chuyen-hoa-don - Khách nhận máy, cấn trừ cọc và xuất hóa đơn POS
   */
  async chuyenHoaDon(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await DatTruocService.chuyenHoaDon(req.params.id, req.body, sessionUser);
      return this.sendSuccess(res, result, 'Xuất hóa đơn bán hàng và cấn trừ tiền cọc thành công!');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi chuyển đơn đặt trước sang hóa đơn');
    }
  }
}

module.exports = new DatTruocController();
