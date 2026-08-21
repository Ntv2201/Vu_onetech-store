const BaseController = require('./BaseController');
const { KhachHangService } = require('../services');

class KhachHangController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postEdit = this.postEdit.bind(this);
    this.delete = this.delete.bind(this);
  }

  // GET /api/khach-hang
  async index(req, res) {
    try {
      const khachHangs = await KhachHangService.getAllKhachHangs(req.query);
      return this.sendSuccess(res, khachHangs, 'Lấy danh sách khách hàng thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách khách hàng');
    }
  }

  // GET /api/khach-hang/:id
  async getDetail(req, res) {
    try {
      const result = await KhachHangService.getKhachHangDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết khách hàng thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải thông tin khách hàng');
    }
  }

  // POST /api/khach-hang
  async postCreate(req, res) {
    try {
      const kh = await KhachHangService.createKhachHang(req.body);
      return this.sendSuccess(res, kh, `Thêm khách hàng "${kh.hoTen}" thành công`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi thêm khách hàng');
    }
  }

  // PUT /api/khach-hang/:id
  async postEdit(req, res) {
    try {
      const kh = await KhachHangService.updateKhachHang(req.params.id, req.body);
      return this.sendSuccess(res, kh, `Cập nhật thông tin khách hàng "${kh.hoTen}" thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật khách hàng');
    }
  }

  // DELETE /api/khach-hang/:id
  async delete(req, res) {
    try {
      const result = await KhachHangService.deleteKhachHang(req.params.id);
      return this.sendSuccess(res, result, 'Xóa khách hàng thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi xóa khách hàng');
    }
  }
}

module.exports = new KhachHangController();
