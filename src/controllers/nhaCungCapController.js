const BaseController = require('./BaseController');
const { NhaCungCapService } = require('../services');

class NhaCungCapController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postEdit = this.postEdit.bind(this);
    this.delete = this.delete.bind(this);
  }

  // GET /api/nha-cung-cap
  async index(req, res) {
    try {
      const nhaCungCaps = await NhaCungCapService.getAllNhaCungCaps(req.query);
      return this.sendSuccess(res, nhaCungCaps, 'Lấy danh sách nhà cung cấp thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách nhà cung cấp');
    }
  }

  // GET /api/nha-cung-cap/:id
  async getDetail(req, res) {
    try {
      const ncc = await NhaCungCapService.getNhaCungCapDetail(req.params.id);
      return this.sendSuccess(res, ncc, 'Lấy chi tiết nhà cung cấp thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải thông tin nhà cung cấp');
    }
  }

  // POST /api/nha-cung-cap
  async postCreate(req, res) {
    try {
      const ncc = await NhaCungCapService.createNhaCungCap(req.body);
      return this.sendSuccess(res, ncc, `Thêm nhà cung cấp "${ncc.tenNCC}" thành công`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi thêm nhà cung cấp');
    }
  }

  // PUT /api/nha-cung-cap/:id
  async postEdit(req, res) {
    try {
      const ncc = await NhaCungCapService.updateNhaCungCap(req.params.id, req.body);
      return this.sendSuccess(res, ncc, `Cập nhật thông tin nhà cung cấp "${ncc.tenNCC}" thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật nhà cung cấp');
    }
  }

  // DELETE /api/nha-cung-cap/:id
  async delete(req, res) {
    try {
      const result = await NhaCungCapService.deleteNhaCungCap(req.params.id);
      return this.sendSuccess(res, result, 'Xóa nhà cung cấp thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi xóa nhà cung cấp');
    }
  }
}

module.exports = new NhaCungCapController();
