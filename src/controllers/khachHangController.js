const BaseController = require('./BaseController');
const { KhachHangService } = require('../services');

class KhachHangController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postEdit = this.postEdit.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
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

  // PUT /api/khach-hang/:id/toggle-status
  async toggleStatus(req, res) {
    try {
      const result = await KhachHangService.toggleStatusKhachHang(req.params.id);
      const action = result.status ? 'Mở khóa' : 'Khóa';
      return this.sendSuccess(res, result, `${action} khách hàng thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi thay đổi trạng thái khách hàng');
    }
  }
}

module.exports = new KhachHangController();
