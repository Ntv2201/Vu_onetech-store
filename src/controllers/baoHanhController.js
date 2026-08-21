const BaseController = require('./BaseController');
const { BaoHanhService } = require('../services');

class BaoHanhController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.traCuu = this.traCuu.bind(this);
    this.create = this.create.bind(this);
    this.xuatLinhKien = this.xuatLinhKien.bind(this);
    this.hoanTat = this.hoanTat.bind(this);
  }

  /**
   * GET /api/bao-hanh - Danh sách phiếu bảo hành
   */
  async index(req, res) {
    try {
      const result = await BaoHanhService.getPhieuBaoHanhList(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách phiếu bảo hành thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách phiếu bảo hành');
    }
  }

  /**
   * GET /api/bao-hanh/:id - Chi tiết phiếu bảo hành + linh kiện
   */
  async getDetail(req, res) {
    try {
      const result = await BaoHanhService.getPhieuBaoHanhDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết phiếu bảo hành thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải chi tiết phiếu bảo hành');
    }
  }

  /**
   * GET /api/bao-hanh/tra-cuu/:imei - Tra cứu dòng đời máy, hạn bảo hành, lịch sử sửa chữa
   */
  async traCuu(req, res) {
    try {
      const result = await BaoHanhService.traCuuBaoHanh(req.params.imei);
      return this.sendSuccess(res, result, `Tra cứu thông tin IMEI ${req.params.imei} thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tra cứu bảo hành');
    }
  }

  /**
   * POST /api/bao-hanh - Tiếp nhận bảo hành máy (Kiểm tra đã bán & thời hạn bảo hành)
   */
  async create(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await BaoHanhService.tiepNhanBaoHanh(req.body, sessionUser);
      return this.sendSuccess(res, result, `Tiếp nhận phiếu bảo hành ${result.phieuBaoHanh.maPBH} thành công`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Không thể tiếp nhận bảo hành');
    }
  }

  /**
   * POST /api/bao-hanh/:id/linh-kien - Xuất linh kiện thay thế cho phiếu bảo hành
   */
  async xuatLinhKien(req, res) {
    try {
      const result = await BaoHanhService.xuatLinhKienBaoHanh(req.params.id, req.body);
      return this.sendSuccess(res, result, 'Xuất linh kiện thay thế thành công', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi xuất linh kiện');
    }
  }

  /**
   * PUT /api/bao-hanh/:id/hoan-tat - Hoàn tất bảo hành, trả máy về trạng thái 'Da ban'
   */
  async hoanTat(req, res) {
    try {
      const result = await BaoHanhService.hoanTatBaoHanh(req.params.id, req.body);
      return this.sendSuccess(res, result, `Hoàn tất xử lý bảo hành phiếu ${result.phieuBaoHanh.maPBH}`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi hoàn tất bảo hành');
    }
  }
}

module.exports = new BaoHanhController();
