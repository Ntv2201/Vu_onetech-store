const BaseController = require('./BaseController');
const { PhuKienService } = require('../services');

class PhuKienController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postEdit = this.postEdit.bind(this);
    this.delete = this.delete.bind(this);
  }

  // GET /api/phu-kien
  async index(req, res) {
    try {
      const result = await PhuKienService.getAllPhuKiens(req.query);
      return this.sendSuccess(res, { data: result.phuKiens, danhMucs: result.danhMucs }, 'Lấy danh sách phụ kiện thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách phụ kiện');
    }
  }

  // GET /api/phu-kien/:id
  async getDetail(req, res) {
    try {
      const result = await PhuKienService.getPhuKienDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết phụ kiện thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải thông tin phụ kiện');
    }
  }

  // POST /api/phu-kien
  async postCreate(req, res) {
    try {
      const pk = await PhuKienService.createPhuKien(req.body);
      return this.sendSuccess(res, pk, `Thêm phụ kiện "${pk.tenPK}" thành công`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi thêm phụ kiện');
    }
  }

  // PUT /api/phu-kien/:id
  async postEdit(req, res) {
    try {
      const pk = await PhuKienService.updatePhuKien(req.params.id, req.body);
      return this.sendSuccess(res, pk, `Cập nhật phụ kiện "${pk.tenPK}" thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật phụ kiện');
    }
  }

  // DELETE /api/phu-kien/:id
  async delete(req, res) {
    try {
      const result = await PhuKienService.deletePhuKien(req.params.id);
      return this.sendSuccess(res, result, 'Xóa phụ kiện thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi xóa phụ kiện');
    }
  }
}

module.exports = new PhuKienController();
