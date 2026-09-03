const BaseController = require('./BaseController');
const { HoaDonService } = require('../services');

class HoaDonController extends BaseController {
  constructor() {
    super();
    // Bind methods to keep `this` context when passed directly to express routes
    this.index = this.index.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.create = this.create.bind(this);
    this.searchDonDatHang = this.searchDonDatHang.bind(this);
    this.getImeiKhaDung = this.getImeiKhaDung.bind(this);
    this.kiemTraDoiTra = this.kiemTraDoiTra.bind(this);
    this.getThongKeNhanh = this.getThongKeNhanh.bind(this);
    this.getDoanhSoNhanVien = this.getDoanhSoNhanVien.bind(this);
    this.getTopSanPham = this.getTopSanPham.bind(this);
  }

  /**
   * GET /api/hoa-don/bao-cao/doanh-so-nhan-vien - Thống kê KPI doanh số nhân viên
   */
  async getDoanhSoNhanVien(req, res) {
    try {
      const result = await HoaDonService.getDoanhSoNhanVien(req.query);
      return this.sendSuccess(res, result, 'Lấy báo cáo doanh số nhân viên thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể lấy báo cáo doanh số nhân viên');
    }
  }

  /**
   * GET /api/hoa-don/bao-cao/top-san-pham - Top sản phẩm bán chạy
   */
  async getTopSanPham(req, res) {
    try {
      const result = await HoaDonService.getTopSanPham(req.query);
      return this.sendSuccess(res, result, 'Lấy top sản phẩm bán chạy thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể lấy top sản phẩm bán chạy');
    }
  }

  /**
   * GET /api/hoa-don/thong-ke-nhanh - Thống kê bán hàng nhanh trong ngày
   */
  async getThongKeNhanh(req, res) {
    try {
      const result = await HoaDonService.getThongKeNhanh();
      return this.sendSuccess(res, result, 'Lấy thống kê bán hàng nhanh thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể lấy thống kê bán hàng');
    }
  }

  /**
   * GET /api/hoa-don/imei-kha-dung - Danh sách máy IMEI khả dụng bán hàng POS
   */
  async getImeiKhaDung(req, res) {
    try {
      const result = await HoaDonService.layImeiKhaDung(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách máy IMEI khả dụng thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể lấy danh sách IMEI khả dụng');
    }
  }

  /**
   * GET /api/hoa-don/kiem-tra-doi-tra/:imei - Kiểm tra điều kiện đổi trả theo số IMEI
   */
  async kiemTraDoiTra(req, res) {
    try {
      const { imei } = req.params;
      const result = await HoaDonService.kiemTraImeiDoiTra(imei);
      return this.sendSuccess(res, result, 'Kiểm tra điều kiện đổi trả thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể kiểm tra điều kiện đổi trả');
    }
  }

  /**
   * GET /api/hoa-don/dat-truoc/tim-kiem - Tìm kiếm đơn đặt hàng trước còn hiệu lực
   */
  async searchDonDatHang(req, res) {
    try {
      const result = await HoaDonService.timKiemDonDatHang(req.query.search);
      return this.sendSuccess(res, result, 'Lấy danh sách đơn đặt trước thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tìm kiếm đơn đặt trước');
    }
  }

  /**
   * GET /api/hoa-don - Danh sách hóa đơn (query: tuNgay, denNgay, maKH, trangThai, search)
   */
  async index(req, res) {
    try {
      const result = await HoaDonService.getHoaDonList(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách hóa đơn thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải danh sách hóa đơn');
    }
  }

  /**
   * GET /api/hoa-don/:id - Chi tiết hóa đơn kèm danh sách IMEI máy, phụ kiện, phiếu xuất kho
   */
  async getDetail(req, res) {
    try {
      const result = await HoaDonService.getHoaDonDetail(req.params.id);
      return this.sendSuccess(res, result, 'Lấy chi tiết hóa đơn thành công');
    } catch (error) {
      return this.handleError(res, error, 'Không thể tải chi tiết hóa đơn');
    }
  }

  /**
   * POST /api/hoa-don - Bán hàng theo danh sách IMEI và phụ kiện
   * Khóa trạng thái, kiểm tra xung đột (409 Conflict), sinh phiếu xuất kho & liên kết Sổ quỹ/Công nợ
   */
  async create(req, res) {
    try {
      const sessionUser = req.session ? req.session.user : null;
      const result = await HoaDonService.taoHoaDonBanHang(req.body, sessionUser);
      return this.sendSuccess(res, result, `Tạo hóa đơn bán hàng ${result.hoaDon.soHD} thành công!`, 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo hóa đơn bán hàng');
    }
  }
}

module.exports = new HoaDonController();
