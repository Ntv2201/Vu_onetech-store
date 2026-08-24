const BaseController = require('./BaseController');
const { PhieuNhapService } = require('../services');

class PhieuNhapController extends BaseController {
  
  /**
   * [POST] /api/phieu-nhap
   */
  taoPhieuNhap = async (req, res) => {
    try {
      // req.user được set từ middleware requireAuth
      const maNV = req.user ? req.user._id : req.body.maNV; 
      
      const payload = {
        ...req.body,
        maNV
      };

      const result = await PhieuNhapService.taoPhieuNhap(payload);
      return this.sendSuccess(res, result, 'Tạo phiếu nhập thành công', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo phiếu nhập');
    }
  };

  /**
   * [GET] /api/phieu-nhap
   */
  getDanhSach = async (req, res) => {
    try {
      const result = await PhieuNhapService.getDanhSachPhieuNhap(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách phiếu nhập thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi lấy danh sách phiếu nhập');
    }
  };

  /**
   * [GET] /api/phieu-nhap/:id
   */
  getChiTiet = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await PhieuNhapService.getChiTietPhieuNhap(id);
      return this.sendSuccess(res, result, 'Lấy chi tiết phiếu nhập thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi lấy chi tiết phiếu nhập');
    }
  };
}

module.exports = new PhieuNhapController();
