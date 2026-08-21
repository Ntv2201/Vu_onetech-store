const BaseController = require('./BaseController');
const { DanhMucService } = require('../services');

class DanhMucController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postEdit = this.postEdit.bind(this);
    this.delete = this.delete.bind(this);
  }

  // GET /api/danh-muc
  async index(req, res) {
    try {
      const danhMucs = await DanhMucService.getAllDanhMucs();
      return this.sendSuccess(res, danhMucs, 'Lấy danh sách danh mục thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách danh mục');
    }
  }

  // GET /api/danh-muc/:id
  async getDetail(req, res) {
    try {
      const danhMuc = await DanhMucService.getDanhMucDetail(req.params.id);
      return this.sendSuccess(res, danhMuc, 'Lấy chi tiết danh mục thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải thông tin danh mục');
    }
  }

  // POST /api/danh-muc
  async postCreate(req, res) {
    try {
      const dm = await DanhMucService.createDanhMuc(req.body);
      return this.sendSuccess(res, dm, `Thêm danh mục "${dm.tenDanhMuc}" thành công`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi thêm danh mục');
    }
  }

  // PUT /api/danh-muc/:id
  async postEdit(req, res) {
    try {
      const dm = await DanhMucService.updateDanhMuc(req.params.id, req.body);
      return this.sendSuccess(res, dm, `Cập nhật danh mục "${dm.tenDanhMuc}" thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật danh mục');
    }
  }

  // DELETE /api/danh-muc/:id
  async delete(req, res) {
    try {
      const result = await DanhMucService.deleteDanhMuc(req.params.id);
      return this.sendSuccess(res, result, 'Xóa danh mục thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi xóa danh mục');
    }
  }
}

module.exports = new DanhMucController();
