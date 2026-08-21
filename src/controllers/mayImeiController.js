const BaseController = require('./BaseController');
const { MayImeiService } = require('../services');

class MayImeiController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postEdit = this.postEdit.bind(this);
    this.delete = this.delete.bind(this);
  }

  // GET /api/may-imei
  async index(req, res) {
    try {
      const result = await MayImeiService.getAllImeis(req.query);
      return this.sendSuccess(res, { data: result.imeis, sanPhams: result.sanPhams }, 'Lấy danh sách IMEI thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách máy IMEI');
    }
  }

  // GET /api/may-imei/:imei
  async getDetail(req, res) {
    try {
      const result = await MayImeiService.getImeiDetail(req.params.imei);
      return this.sendSuccess(res, result, 'Lấy chi tiết IMEI thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tải thông tin IMEI');
    }
  }

  // POST /api/may-imei
  async postCreate(req, res) {
    try {
      const result = await MayImeiService.importImeis(req.body);
      return this.sendSuccess(res, result, `Đã nhập thành công ${result.count} máy IMEI vào kho`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi nhập IMEI');
    }
  }

  // PUT /api/may-imei/:imei
  async postEdit(req, res) {
    try {
      const updated = await MayImeiService.updateImei(req.params.imei, req.body);
      return this.sendSuccess(res, updated, `Cập nhật thông tin IMEI ${req.params.imei} thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật IMEI');
    }
  }

  // DELETE /api/may-imei/:imei
  async delete(req, res) {
    try {
      const result = await MayImeiService.deleteImei(req.params.imei);
      return this.sendSuccess(res, result, `Đã xóa IMEI ${req.params.imei} thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi xóa IMEI');
    }
  }
}

module.exports = new MayImeiController();
