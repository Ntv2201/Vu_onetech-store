const BaseController = require('./BaseController');
const { NhanVienService } = require('../services');

class NhanVienController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postEdit = this.postEdit.bind(this);
    this.delete = this.delete.bind(this);
  }

  // GET /api/nhan-vien
  async index(req, res) {
    try {
      const nhanViens = await NhanVienService.getAllNhanViens(req.query);
      return this.sendSuccess(res, nhanViens, 'Lấy danh sách nhân viên thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách nhân viên');
    }
  }

  // GET /api/nhan-vien/:id
  async getDetail(req, res) {
    try {
      const nhanVien = await NhanVienService.getNhanVienDetail(req.params.id);
      return this.sendSuccess(res, nhanVien, 'Lấy chi tiết nhân viên thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải thông tin nhân viên');
    }
  }

  // POST /api/nhan-vien
  async postCreate(req, res) {
    try {
      const nv = await NhanVienService.createNhanVien(req.body);
      return this.sendSuccess(res, nv, `Tạo tài khoản nhân viên "${nv.hoTen}" thành công`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo nhân viên');
    }
  }

  // PUT /api/nhan-vien/:id
  async postEdit(req, res) {
    try {
      const currentUserId = req.session && req.session.user ? req.session.user._id : null;
      const nv = await NhanVienService.updateNhanVien(req.params.id, req.body, currentUserId);
      return this.sendSuccess(res, nv, `Cập nhật thông tin nhân viên "${nv.hoTen}" thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật nhân viên');
    }
  }

  // DELETE /api/nhan-vien/:id
  async delete(req, res) {
    try {
      const currentUserId = req.session && req.session.user ? req.session.user._id : null;
      const result = await NhanVienService.deleteNhanVien(req.params.id, currentUserId);
      return this.sendSuccess(res, result, 'Xóa tài khoản nhân viên thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi xóa nhân viên');
    }
  }
}

module.exports = new NhanVienController();
