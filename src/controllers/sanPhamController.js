const BaseController = require('./BaseController');
const { SanPhamService } = require('../services');

class SanPhamController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postEdit = this.postEdit.bind(this);
    this.delete = this.delete.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
  }

  // GET /api/san-pham
  async index(req, res) {
    try {
      const result = await SanPhamService.getAllSanPhams(req.query);
      return this.sendSuccess(res, { sanPhams: result.sanPhams, danhMucs: result.danhMucs, allHangs: result.allHangs }, 'Lấy danh sách sản phẩm thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách sản phẩm');
    }
  }

  // GET /api/san-pham/:id
  async getDetail(req, res) {
    try {
      const result = await SanPhamService.getSanPhamDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết sản phẩm thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải chi tiết sản phẩm');
    }
  }

  // POST /api/san-pham
  async postCreate(req, res) {
    try {
      const sp = await SanPhamService.createSanPham(req.body);
      return this.sendSuccess(res, sp, `Thêm sản phẩm "${sp.tenMay}" thành công`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi thêm sản phẩm');
    }
  }

  // PUT /api/san-pham/:id
  async postEdit(req, res) {
    try {
      const sp = await SanPhamService.updateSanPham(req.params.id, req.body);
      return this.sendSuccess(res, sp, `Cập nhật sản phẩm "${sp.tenMay}" thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật sản phẩm');
    }
  }

  // PUT /api/san-pham/:id/toggle-status
  async toggleStatus(req, res) {
    try {
      const result = await SanPhamService.toggleStatusSanPham(req.params.id);
      const action = result.status ? 'Mở khóa' : 'Khóa';
      return this.sendSuccess(res, result, `${action} sản phẩm thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi thay đổi trạng thái sản phẩm');
    }
  }

  // DELETE /api/san-pham/:id (Alias hỗ trợ backward compatibility)
  async delete(req, res) {
    return this.toggleStatus(req, res);
  }
}

module.exports = new SanPhamController();
