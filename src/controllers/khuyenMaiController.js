const BaseController = require('./BaseController');
const KhuyenMaiService = require('../services/KhuyenMaiService');

/**
 * KhuyenMaiController - Quản lý chương trình Khuyến mãi
 */
class KhuyenMaiController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.checkCode = this.checkCode.bind(this);
  }

  // GET /api/khuyen-mai
  async index(req, res) {
    try {
      const result = await KhuyenMaiService.getKhuyenMaiList(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách khuyến mãi thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi lấy danh sách khuyến mãi');
    }
  }

  // GET /api/khuyen-mai/:id
  async getDetail(req, res) {
    try {
      const result = await KhuyenMaiService.getKhuyenMaiDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết khuyến mãi thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi lấy chi tiết khuyến mãi');
    }
  }

  // POST /api/khuyen-mai
  async create(req, res) {
    try {
      const result = await KhuyenMaiService.createKhuyenMai(req.body);
      return this.sendSuccess(res, result, `Tạo chương trình khuyến mãi "${result.tenKM}" thành công`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo khuyến mãi');
    }
  }

  // PUT /api/khuyen-mai/:id
  async update(req, res) {
    try {
      const result = await KhuyenMaiService.updateKhuyenMai(req.params.id, req.body);
      return this.sendSuccess(res, result, `Cập nhật khuyến mãi "${result.tenKM}" thành công`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi cập nhật khuyến mãi');
    }
  }

  // DELETE /api/khuyen-mai/:id
  async delete(req, res) {
    try {
      const result = await KhuyenMaiService.deleteKhuyenMai(req.params.id);
      return this.sendSuccess(res, result, 'Xóa chương trình khuyến mãi thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi xóa khuyến mãi');
    }
  }

  // POST /api/khuyen-mai/check — Kiểm tra mã KM và tính số tiền giảm (preview, không tăng lượt dùng)
  async checkCode(req, res) {
    try {
      const { maKM, tongTien } = req.body;
      if (!maKM || !maKM.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã khuyến mãi' });
      }
      if (!tongTien || Number(tongTien) <= 0) {
        return res.status(400).json({ success: false, message: 'Tổng tiền phải lớn hơn 0' });
      }
      const result = await KhuyenMaiService.checkKhuyenMai(maKM.trim(), Number(tongTien));
      return this.sendSuccess(res, result, 'Kiểm tra mã khuyến mãi thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi kiểm tra mã khuyến mãi');
    }
  }
}

module.exports = new KhuyenMaiController();
