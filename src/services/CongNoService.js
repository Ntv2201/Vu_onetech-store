const BaseService = require("./BaseService");
const { CongNo, KhachHang, NhaCungCap } = require("../models");
const ThanhToanService = require("./ThanhToanService");

const LOAI_DOI_TUONG = ["KhachHang", "NhaCungCap"];
const TRANG_THAI = ["Con no", "Da tra het", "Qua han"]; // đúng enum thật trong models/CongNo.js

/**
 * CongNoService
 * Phụ trách: Trương Thế An
 *
 * CONGNO là bảng đa hình (dùng chung công nợ Khách hàng lẫn Nhà cung cấp).
 * Model thật (models/CongNo.js) KHÔNG ràng buộc cứng ở tầng schema (khachHang/
 * nhaCungCap đều optional) — bắt buộc phải validate ở tầng Service này.
 */
class CongNoService extends BaseService {
  constructor() {
    super(CongNo);
  }

  /**
   * Validate đa hình cho CONGNO.
   * - loaiDoiTuong = 'KhachHang'   -> bắt buộc có khachHang, nhaCungCap phải null/undefined
   * - loaiDoiTuong = 'NhaCungCap'  -> bắt buộc có nhaCungCap, khachHang phải null/undefined
   */
  async validateDoiTuongCongNo({ loaiDoiTuong, khachHang, nhaCungCap }) {
    if (!LOAI_DOI_TUONG.includes(loaiDoiTuong)) {
      throw this.createError(
        `loaiDoiTuong không hợp lệ, phải là một trong: ${LOAI_DOI_TUONG.join(", ")}`,
        400,
      );
    }

    if (loaiDoiTuong === "KhachHang") {
      if (!khachHang)
        throw this.createError(
          "Thiếu khachHang khi loaiDoiTuong = KhachHang",
          400,
        );
      if (nhaCungCap)
        throw this.createError(
          "nhaCungCap phải để trống khi loaiDoiTuong = KhachHang",
          400,
        );
      const kh = await KhachHang.findById(khachHang);
      if (!kh)
        throw this.createError(`Không tìm thấy khách hàng ${khachHang}`, 404);
    }

    if (loaiDoiTuong === "NhaCungCap") {
      if (!nhaCungCap)
        throw this.createError(
          "Thiếu nhaCungCap khi loaiDoiTuong = NhaCungCap",
          400,
        );
      if (khachHang)
        throw this.createError(
          "khachHang phải để trống khi loaiDoiTuong = NhaCungCap",
          400,
        );
      const ncc = await NhaCungCap.findById(nhaCungCap);
      if (!ncc)
        throw this.createError(
          `Không tìm thấy nhà cung cấp ${nhaCungCap}`,
          404,
        );
    }

    return true;
  }

  /**
   * Tạo mới 1 khoản công nợ. Được gọi từ PhieuNhapService (Tuân, ghi nợ NCC khi
   * nhập hàng trả chậm) hoặc HoaDonService (Tuấn, khách mua chịu).
   */
  async taoCongNo({
    loaiDoiTuong,
    khachHang,
    nhaCungCap,
    hoaDon,
    phieuNhap,
    soTienNo,
    session = null,
  }) {
    await this.validateDoiTuongCongNo({ loaiDoiTuong, khachHang, nhaCungCap });

    const soTien = Number(soTienNo);
    if (!soTien || soTien <= 0) {
      throw this.createError("soTienNo phải lớn hơn 0", 400);
    }

    const congNo = new CongNo({
      loaiDoiTuong,
      khachHang: loaiDoiTuong === "KhachHang" ? khachHang : undefined,
      nhaCungCap: loaiDoiTuong === "NhaCungCap" ? nhaCungCap : undefined,
      hoaDon: hoaDon || undefined,
      phieuNhap: phieuNhap || undefined,
      soTienNo: soTien,
      soTienDaTra: 0,
      trangThai: "Con no",
    });
    await congNo.save({ session });
    return congNo;
  }

  /**
   * GET /api/cong-no
   * Lọc theo loaiDoiTuong / khachHang / nhaCungCap / trangThai.
   */
  async layDanhSachCongNo(query = {}) {
    const { loaiDoiTuong, maKH, maNCC, trangThai } = query;
    const filter = {};
    if (loaiDoiTuong) filter.loaiDoiTuong = loaiDoiTuong;
    if (maKH) filter.khachHang = maKH;
    if (maNCC) filter.nhaCungCap = maNCC;
    if (trangThai) filter.trangThai = trangThai;

    const { page, limit, skip } = this.getPaginationOptions(query);
    const [items, total] = await Promise.all([
      CongNo.find(filter)
        .populate("khachHang", "hoTen sdt")
        .populate("nhaCungCap", "tenNCC sdt")
        .populate("hoaDon", "soHD ngayLap")
        .populate("phieuNhap", "ngayNhap")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CongNo.countDocuments(filter),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * GET /api/cong-no/:id
   */
  async layChiTietCongNo(id) {
    const congNo = await CongNo.findById(id)
      .populate("khachHang", "hoTen sdt diaChi")
      .populate("nhaCungCap", "tenNCC sdt diaChi")
      .populate("hoaDon")
      .populate("phieuNhap");
    if (!congNo) throw this.createError("Không tìm thấy khoản công nợ", 404);
    return congNo;
  }

  /**
   * Tính lại trạng thái công nợ theo đúng enum thật: Con no / Da tra het / Qua han.
   * (Qua han do phía gọi tự set riêng khi có logic hạn thanh toán — hàm này chỉ
   * phân biệt Con no / Da tra het theo số tiền.)
   */
  tinhTrangThai(soTienNo, soTienDaTra, trangThaiHienTai) {
    if (soTienDaTra >= soTienNo) return "Da tra het";
    if (trangThaiHienTai === "Qua han") return "Qua han";
    return "Con no";
  }

  /**
   * POST /api/cong-no/:id/thanh-toan
   * KhachHang  -> THU nợ khách  -> gọi ThanhToanService.taoPhieuThu({ congNo })
   * NhaCungCap -> TRẢ nợ NCC    -> gọi ThanhToanService.taoPhieuChi({ phieuNhap })
   *   (PhieuChi không có field congNo trực tiếp trong model thật, nên trả nợ NCC
   *    phải tham chiếu qua phieuNhap gốc đã lưu sẵn trên bản ghi CongNo)
   */
  async thanhToanCongNo(id, { soTien, hinhThuc, ghiChu, session = null } = {}) {
    const amount = Number(soTien);
    if (!amount || amount <= 0) {
      throw this.createError("Số tiền thanh toán phải lớn hơn 0", 400);
    }

    const congNo = await CongNo.findById(id).session(session);
    if (!congNo) throw this.createError("Không tìm thấy khoản công nợ", 404);

    const soTienConLai = congNo.soTienNo - congNo.soTienDaTra;
    if (amount > soTienConLai) {
      throw this.createError(
        `Số tiền thanh toán (${amount}) vượt quá số còn nợ (${soTienConLai})`,
        400,
      );
    }

    let phieu;
    if (congNo.loaiDoiTuong === "KhachHang") {
      phieu = await ThanhToanService.taoPhieuThu({
        congNo: congNo._id,
        soTien: amount,
        hinhThuc,
        ghiChu: ghiChu || "Thu nợ khách hàng",
      });
    } else {
      phieu = await ThanhToanService.taoPhieuChi({
        phieuNhap: congNo.phieuNhap || null,
        maDT: String(congNo.nhaCungCap || ''),
        soTien: amount,
        hinhThuc,
        lyDo: ghiChu || "Trả nợ nhà cung cấp",
      });
    }

    congNo.soTienDaTra += amount;
    congNo.trangThai = this.tinhTrangThai(
      congNo.soTienNo,
      congNo.soTienDaTra,
      congNo.trangThai,
    );
    await congNo.save({ session });

    return { congNo, phieu };
  }
}

module.exports = new CongNoService();
