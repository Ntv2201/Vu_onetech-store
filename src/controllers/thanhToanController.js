const BaseController = require('./BaseController');
const { ThanhToanService } = require('../services');

/**
 * ThanhToanController - Controller tiếp nhận HTTP requests cho Phân hệ Thu - Chi & Sổ quỹ
 * Thành viên 5: Đinh Đức Vượng
 */
class ThanhToanController extends BaseController {
  constructor() {
    super();
    this.indexThu = this.indexThu.bind(this);
    this.getPhieuThuDetail = this.getPhieuThuDetail.bind(this);
    this.createPhieuThu = this.createPhieuThu.bind(this);
    this.indexChi = this.indexChi.bind(this);
    this.getPhieuChiDetail = this.getPhieuChiDetail.bind(this);
    this.createPhieuChi = this.createPhieuChi.bind(this);
    this.getSoQuy = this.getSoQuy.bind(this);
  }

  /**
   * GET /api/thanh-toan/thu - Lấy danh sách phiếu thu
   */
  async indexThu(req, res) {
    try {
      const result = await ThanhToanService.getPhieuThuList(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách phiếu thu thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách phiếu thu');
    }
  }

  /**
   * GET /api/thanh-toan/thu/:id - Chi tiết 1 phiếu thu
   */
  async getPhieuThuDetail(req, res) {
    try {
      const result = await ThanhToanService.getPhieuThuDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết phiếu thu thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải chi tiết phiếu thu');
    }
  }

  /**
   * POST /api/thanh-toan/thu - Tạo phiếu thu mới
   */
  async createPhieuThu(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await ThanhToanService.taoPhieuThu({ ...req.body, sessionUser });
      return this.sendSuccess(res, result, 'Tạo phiếu thu thành công!', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo phiếu thu');
    }
  }

  /**
   * GET /api/thanh-toan/chi - Lấy danh sách phiếu chi
   */
  async indexChi(req, res) {
    try {
      const result = await ThanhToanService.getPhieuChiList(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách phiếu chi thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách phiếu chi');
    }
  }

  /**
   * GET /api/thanh-toan/chi/:id - Chi tiết 1 phiếu chi
   */
  async getPhieuChiDetail(req, res) {
    try {
      const result = await ThanhToanService.getPhieuChiDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết phiếu chi thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải chi tiết phiếu chi');
    }
  }

  /**
   * POST /api/thanh-toan/chi - Tạo phiếu chi mới
   */
  async createPhieuChi(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await ThanhToanService.taoPhieuChi({ ...req.body, sessionUser });
      return this.sendSuccess(res, result, 'Tạo phiếu chi thành công!', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo phiếu chi');
    }
  }

  /**
   * GET /api/thanh-toan/so-quy - Lấy báo cáo sổ quỹ tổng hợp
   */
  async getSoQuy(req, res) {
    try {
      const result = await ThanhToanService.getSoQuy(req.query);
      return this.sendSuccess(res, result, 'Lấy báo cáo sổ quỹ thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải báo cáo sổ quỹ');
    }
  }
}

module.exports = new ThanhToanController();
