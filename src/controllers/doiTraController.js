const BaseController = require('./BaseController');
const { DoiTraService } = require('../services');

/**
 * DoiTraController - Controller tiếp nhận HTTP requests cho Phân hệ Đổi trả máy
 * Thành viên 6: Tô Quốc Việt (Tuần 4)
 */
class DoiTraController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.checkCondition = this.checkCondition.bind(this);
    this.create = this.create.bind(this);
    this.getHistoryByImei = this.getHistoryByImei.bind(this);
  }

  /**
   * GET /api/doi-tra - Lấy danh sách phiếu đổi trả (lọc theo soHD, imei, loaiDoiTra, tuNgay, denNgay, search, page, limit)
   */
  async index(req, res) {
    try {
      const result = await DoiTraService.getDoiTraList(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách phiếu đổi trả thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách phiếu đổi trả');
    }
  }

  /**
   * GET /api/doi-tra/:id - Chi tiết 1 phiếu đổi trả kèm thông tin Hóa đơn, máy và Phiếu Thu/Chi
   */
  async getDetail(req, res) {
    try {
      const result = await DoiTraService.getDoiTraDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết phiếu đổi trả thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải chi tiết phiếu đổi trả');
    }
  }

  /**
   * POST /api/doi-tra/kiem-tra - Kiểm tra nhanh điều kiện đổi trả (soHD, imei)
   */
  async checkCondition(req, res) {
    try {
      const { soHD, imei } = req.body;
      const result = await DoiTraService.kiemTraDieuKienDoiTra(soHD, imei);
      return this.sendSuccess(res, result, 'Kiểm tra điều kiện đổi trả thành công');
    } catch (error) {
      return this.handleError(res, error, 'Điều kiện đổi trả không hợp lệ');
    }
  }

  /**
   * POST /api/doi-tra - Tạo phiếu đổi trả máy & tự động xử lý chênh lệch tiền
   */
  async create(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await DoiTraService.taoPhieuDoiTra(req.body, sessionUser);
      return this.sendSuccess(res, result, 'Lập phiếu đổi trả máy thành công!', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi lập phiếu đổi trả máy');
    }
  }

  /**
   * GET /api/doi-tra/lich-su-imei/:imei - Tra cứu lịch sử đổi trả theo số IMEI
   */
  async getHistoryByImei(req, res) {
    try {
      const result = await DoiTraService.getLichSuImei(req.params.imei);
      return this.sendSuccess(res, result, 'Tra cứu lịch sử IMEI thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tra cứu lịch sử IMEI');
    }
  }
}

module.exports = new DoiTraController();
