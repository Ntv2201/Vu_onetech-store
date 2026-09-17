const BaseService = require('./BaseService');
const { KhuyenMai } = require('../models');

/**
 * KhuyenMaiService - Quản lý chương trình Khuyến mãi / Mã giảm giá
 */
class KhuyenMaiService extends BaseService {
  constructor() {
    super(KhuyenMai);
  }

  /**
   * Lấy danh sách khuyến mãi (hỗ trợ lọc trạng thái, tìm kiếm, phân trang)
   */
  async getKhuyenMaiList(query = {}) {
    const { trangThai, search } = query;
    const filter = {};

    if (trangThai) filter.trangThai = trangThai;
    if (search && search.trim()) {
      filter.$or = [
        { maKM: { $regex: search.trim(), $options: 'i' } },
        { tenKM: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const { page, limit, skip } = this.getPaginationOptions(query);

    const [khuyenMais, total] = await Promise.all([
      KhuyenMai.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      KhuyenMai.countDocuments(filter)
    ]);

    return {
      khuyenMais,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Lấy chi tiết 1 khuyến mãi
   */
  async getKhuyenMaiDetail(id) {
    const km = await KhuyenMai.findById(id).lean();
    if (!km) {
      throw this.createError('Không tìm thấy chương trình khuyến mãi', 404);
    }
    return km;
  }

  /**
   * Tạo mới chương trình khuyến mãi
   */
  async createKhuyenMai(payload = {}) {
    const { tenKM, maKM, loaiGiam, giaTriGiam, giaTriToiDa, ngayBatDau, ngayKetThuc, soLuotToiDa, ghiChu } = payload;

    if (!tenKM || !tenKM.trim()) {
      throw this.createError('Vui lòng nhập tên chương trình khuyến mãi', 400);
    }
    if (!giaTriGiam || Number(giaTriGiam) <= 0) {
      throw this.createError('Giá trị giảm phải lớn hơn 0', 400);
    }
    if (!ngayBatDau || !ngayKetThuc) {
      throw this.createError('Vui lòng chọn ngày bắt đầu và ngày kết thúc', 400);
    }

    const start = new Date(ngayBatDau);
    const end = new Date(ngayKetThuc);
    if (end <= start) {
      throw this.createError('Ngày kết thúc phải sau ngày bắt đầu', 400);
    }

    // Validate % giảm không quá 100%
    if ((loaiGiam === 'Phan tram' || !loaiGiam) && Number(giaTriGiam) > 100) {
      throw this.createError('Phần trăm giảm không được vượt quá 100%', 400);
    }

    const km = await KhuyenMai.create({
      maKM: maKM ? maKM.trim() : undefined,
      tenKM: tenKM.trim(),
      loaiGiam: loaiGiam || 'Phan tram',
      giaTriGiam: Number(giaTriGiam),
      giaTriToiDa: Number(giaTriToiDa) || 0,
      ngayBatDau: start,
      ngayKetThuc: end,
      soLuotToiDa: Number(soLuotToiDa) || 0,
      trangThai: 'Hoat dong',
      ghiChu: ghiChu || ''
    });

    return km;
  }

  /**
   * Cập nhật chương trình khuyến mãi
   */
  async updateKhuyenMai(id, payload = {}) {
    const km = await KhuyenMai.findById(id);
    if (!km) {
      throw this.createError('Không tìm thấy chương trình khuyến mãi', 404);
    }

    const { tenKM, loaiGiam, giaTriGiam, giaTriToiDa, ngayBatDau, ngayKetThuc, soLuotToiDa, trangThai, ghiChu } = payload;

    if (tenKM) km.tenKM = tenKM.trim();
    if (loaiGiam) km.loaiGiam = loaiGiam;
    if (giaTriGiam !== undefined) km.giaTriGiam = Number(giaTriGiam);
    if (giaTriToiDa !== undefined) km.giaTriToiDa = Number(giaTriToiDa);
    if (ngayBatDau) km.ngayBatDau = new Date(ngayBatDau);
    if (ngayKetThuc) km.ngayKetThuc = new Date(ngayKetThuc);
    if (soLuotToiDa !== undefined) km.soLuotToiDa = Number(soLuotToiDa);
    if (trangThai) km.trangThai = trangThai;
    if (ghiChu !== undefined) km.ghiChu = ghiChu;

    await km.save();
    return km;
  }

  /**
  /**
   * Áp dụng mã khuyến mãi vào hóa đơn — Tính toán số tiền giảm
   * Gọi bởi HoaDonService khi tạo hóa đơn
   * @param {String} khuyenMaiId - ID hoặc mã KM
   * @param {Number} tongTien - Tổng tiền hóa đơn trước giảm
   * @returns {{ khuyenMai, soTienGiam }} Đối tượng KM và số tiền giảm thực tế
   */
  async apDungKhuyenMai(khuyenMaiId, tongTien) {
    if (!khuyenMaiId) return { khuyenMai: null, soTienGiam: 0 };

    // Tìm theo ID hoặc mã KM
    let km;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(khuyenMaiId)) {
      km = await KhuyenMai.findById(khuyenMaiId);
    }
    if (!km) {
      km = await KhuyenMai.findOne({ maKM: khuyenMaiId.toString().trim() });
    }

    if (!km) {
      throw this.createError(`Không tìm thấy mã khuyến mãi: ${khuyenMaiId}`, 404);
    }

    // Kiểm tra trạng thái
    if (km.trangThai !== 'Hoat dong') {
      throw this.createError(`Chương trình khuyến mãi "${km.tenKM}" hiện đang ${km.trangThai === 'Het han' ? 'hết hạn' : 'tạm ngưng'}`, 400);
    }

    // Kiểm tra thời hạn
    const now = new Date();
    if (now < km.ngayBatDau) {
      throw this.createError(`Chương trình khuyến mãi "${km.tenKM}" chưa bắt đầu (Từ ${km.ngayBatDau.toLocaleDateString('vi-VN')})`, 400);
    }
    if (now > km.ngayKetThuc) {
      // Tự cập nhật trạng thái hết hạn
      km.trangThai = 'Het han';
      await km.save();
      throw this.createError(`Chương trình khuyến mãi "${km.tenKM}" đã hết hạn (Đến ${km.ngayKetThuc.toLocaleDateString('vi-VN')})`, 400);
    }

    // Kiểm tra số lượt sử dụng
    if (km.soLuotToiDa > 0 && km.soLuotDaDung >= km.soLuotToiDa) {
      throw this.createError(`Chương trình khuyến mãi "${km.tenKM}" đã hết lượt sử dụng (${km.soLuotToiDa}/${km.soLuotToiDa})`, 400);
    }

    // Tính toán số tiền giảm
    let soTienGiam = 0;
    if (km.loaiGiam === 'Phan tram') {
      soTienGiam = Math.round(tongTien * km.giaTriGiam / 100);
      // Áp giới hạn tối đa nếu có
      if (km.giaTriToiDa > 0 && soTienGiam > km.giaTriToiDa) {
        soTienGiam = km.giaTriToiDa;
      }
    } else {
      // Trực tiếp
      soTienGiam = km.giaTriGiam;
    }

    // Đảm bảo không giảm vượt quá tổng tiền
    soTienGiam = Math.min(soTienGiam, tongTien);

    // Tăng số lượt đã dùng
    km.soLuotDaDung += 1;
    await km.save();

    return { khuyenMai: km, soTienGiam };
  }

  /**
   * Kiểm tra mã khuyến mãi (Dành cho frontend kiểm tra trước khi thanh toán)
   * Giống apDungKhuyenMai nhưng KHÔNG làm tăng số lượt sử dụng
   */
  async kiemTraKhuyenMai(khuyenMaiId, tongTien) {
    if (!khuyenMaiId) return { khuyenMai: null, soTienGiam: 0 };

    let km;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(khuyenMaiId)) {
      km = await KhuyenMai.findById(khuyenMaiId);
    }
    if (!km) {
      km = await KhuyenMai.findOne({ maKM: khuyenMaiId.toString().trim() });
    }

    if (!km) {
      throw this.createError(`Không tìm thấy mã khuyến mãi: ${khuyenMaiId}`, 404);
    }

    if (km.trangThai !== 'Hoat dong') {
      throw this.createError(`Chương trình khuyến mãi "${km.tenKM}" hiện đang ${km.trangThai === 'Het han' ? 'hết hạn' : 'tạm ngưng'}`, 400);
    }

    const now = new Date();
    if (now < km.ngayBatDau) {
      throw this.createError(`Chương trình khuyến mãi "${km.tenKM}" chưa bắt đầu (Từ ${km.ngayBatDau.toLocaleDateString('vi-VN')})`, 400);
    }
    if (now > km.ngayKetThuc) {
      throw this.createError(`Chương trình khuyến mãi "${km.tenKM}" đã hết hạn (Đến ${km.ngayKetThuc.toLocaleDateString('vi-VN')})`, 400);
    }

    if (km.soLuotToiDa > 0 && km.soLuotDaDung >= km.soLuotToiDa) {
      throw this.createError(`Chương trình khuyến mãi "${km.tenKM}" đã hết lượt sử dụng (${km.soLuotToiDa}/${km.soLuotToiDa})`, 400);
    }

    let soTienGiam = 0;
    if (km.loaiGiam === 'Phan tram') {
      soTienGiam = Math.round(tongTien * km.giaTriGiam / 100);
      if (km.giaTriToiDa > 0 && soTienGiam > km.giaTriToiDa) {
        soTienGiam = km.giaTriToiDa;
      }
    } else {
      soTienGiam = km.giaTriGiam;
    }

    soTienGiam = Math.min(soTienGiam, tongTien);

    // KHÔNG TĂNG SỐ LƯỢT VÀ KHÔNG SAVE
    return { khuyenMai: km, soTienGiam };
  }

  /**
   * Xóa chương trình khuyến mãi
   */
  async deleteKhuyenMai(id) {
    const deleted = await KhuyenMai.findByIdAndDelete(id);
    if (!deleted) {
      throw this.createError('Không tìm thấy chương trình khuyến mãi', 404);
    }
    return { success: true, id };
  }
}

module.exports = new KhuyenMaiService();
