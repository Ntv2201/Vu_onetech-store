const BaseController = require('./BaseController');
const { PhieuNhapService } = require('../services');

class PhieuNhapController extends BaseController {
  constructor() {
    super();
    this.taoPhieuNhap = this.taoPhieuNhap.bind(this);
    this.getDanhSach = this.getDanhSach.bind(this);
    this.getChiTiet = this.getChiTiet.bind(this);
    this.postImportHangLoat = this.postImportHangLoat.bind(this);
    this.postTraHangNCC = this.postTraHangNCC.bind(this);
  }
  
  /**
   * [POST] /api/phieu-nhap - Tiếp nhận nhập kho máy IMEI & phụ kiện
   */
  async taoPhieuNhap(req, res) {
    try {
      const maNV = req.session && req.session.user ? req.session.user._id : (req.user ? req.user._id : req.body.maNV);
      
      const payload = {
        ...req.body,
        maNV
      };

      const result = await PhieuNhapService.taoPhieuNhap(payload, req.session ? req.session.user : null);
      return this.sendSuccess(res, result, 'Tạo phiếu nhập thành công', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo phiếu nhập');
    }
  }

  /**
   * [POST] /api/phieu-nhap/import-hang-loat - Nhập hàng loạt IMEI theo chuỗi
   */
  async postImportHangLoat(req, res) {
    try {
      const maNV = req.session && req.session.user ? req.session.user._id : (req.user ? req.user._id : req.body.maNV);
      const payload = {
        ...req.body,
        maNV
      };

      const result = await PhieuNhapService.importHangLoat(payload);
      return this.sendSuccess(res, result, 'Nhập hàng loạt thành công', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi nhập hàng loạt');
    }
  }

  /**
   * [GET] /api/phieu-nhap - Lấy danh sách phiếu nhập
   */
  async getDanhSach(req, res) {
    try {
      const result = await PhieuNhapService.getDanhSachPhieuNhap(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách phiếu nhập thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi lấy danh sách phiếu nhập');
    }
  }

  /**
   * [GET] /api/phieu-nhap/:id - Chi tiết phiếu nhập & danh sách IMEI
   */
  async getChiTiet(req, res) {
    try {
      const { id } = req.params;
      const result = await PhieuNhapService.getChiTietPhieuNhap(id);
      return this.sendSuccess(res, result, 'Lấy chi tiết phiếu nhập thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi lấy chi tiết phiếu nhập');
    }
  }

  /**
   * [POST] /api/phieu-nhap/tra-hang-ncc - Trả hàng cho Nhà Cung Cấp
   * Body: { imeiList: string[], maNCC: string, lyDo?: string }
   */
  async postTraHangNCC(req, res) {
    try {
      const result = await PhieuNhapService.traHangNhaCungCap(req.body);
      return this.sendSuccess(res, result, `Trả hàng cho nhà cung cấp thành công (${result.soLuongTra} máy)`);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi trả hàng cho nhà cung cấp');
    }
  }
}

module.exports = new PhieuNhapController();

