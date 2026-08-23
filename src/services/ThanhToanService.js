const BaseService = require('./BaseService');
const { PhieuThu, PhieuChi } = require('../models');

/**
 * ThanhToanService - Service quản lý Thu - Chi & Sổ quỹ dùng chung
 * Cung cấp 2 hàm dùng chung cốt lõi:
 * - taoPhieuThu: Cho phép tạo phiếu thu từ Đặt cọc (Việt), Hóa đơn (Tuấn), Trả góp/Công nợ (An), Đổi trả (Việt).
 * - taoPhieuChi: Cho phép tạo phiếu chi từ Hoàn tiền cọc (Việt), Nhập hàng (Tuân), Hoàn tiền đổi trả (Việt).
 */
class ThanhToanService extends BaseService {
  constructor() {
    super(PhieuThu);
  }

  /**
   * Tạo Phiếu Thu dùng chung cho toàn hệ thống
   * @param {Object} payload { hoaDon, donDatHang, congNo, soTien, hinhThuc, ghiChu, ngayThu, sessionUser }
   */
  async taoPhieuThu(payload = {}) {
    const {
      hoaDon,
      donDatHang,
      congNo,
      soTien,
      hinhThuc = 'Tien mat',
      ghiChu = '',
      ngayThu
    } = payload;

    const amount = Number(soTien);
    if (isNaN(amount) || amount <= 0) {
      throw this.createError('Số tiền thu phải lớn hơn 0', 400);
    }

    const validHinhThuc = ['Tien mat', 'Chuyen khoan', 'Quet the', 'Vi dien tu'];
    const selectedHinhThuc = validHinhThuc.includes(hinhThuc) ? hinhThuc : 'Tien mat';

    const phieuThu = await PhieuThu.create({
      hoaDon: hoaDon || null,
      donDatHang: donDatHang || null,
      congNo: congNo || null,
      soTien: amount,
      hinhThuc: selectedHinhThuc,
      ngayThu: ngayThu ? new Date(ngayThu) : new Date(),
      ghiChu: ghiChu || ''
    });

    return phieuThu;
  }

  /**
   * Tạo Phiếu Chi dùng chung cho toàn hệ thống
   * @param {Object} payload { phieuNhap, donDatHang, maDT, soTien, hinhThuc, lyDo, ngayChi, sessionUser }
   */
  async taoPhieuChi(payload = {}) {
    const {
      phieuNhap,
      donDatHang,
      maDT = '',
      soTien,
      hinhThuc = 'Tien mat',
      lyDo = '',
      ngayChi
    } = payload;

    const amount = Number(soTien);
    if (isNaN(amount) || amount <= 0) {
      throw this.createError('Số tiền chi phải lớn hơn 0', 400);
    }

    const validHinhThuc = ['Tien mat', 'Chuyen khoan', 'Quet the', 'Vi dien tu'];
    const selectedHinhThuc = validHinhThuc.includes(hinhThuc) ? hinhThuc : 'Tien mat';

    const phieuChi = await PhieuChi.create({
      phieuNhap: phieuNhap || null,
      donDatHang: donDatHang || null,
      maDT: maDT || '',
      soTien: amount,
      hinhThuc: selectedHinhThuc,
      ngayChi: ngayChi ? new Date(ngayChi) : new Date(),
      lyDo: lyDo || ''
    });

    return phieuChi;
  }

  /**
   * Lấy lịch sử Phiếu Thu theo đối tượng
   */
  async getPhieuThuList(query = {}) {
    const filter = {};
    if (query.donDatHang) filter.donDatHang = query.donDatHang;
    if (query.hoaDon) filter.hoaDon = query.hoaDon;
    if (query.congNo) filter.congNo = query.congNo;

    const { page, limit, skip } = this.getPaginationOptions(query);
    const [list, total] = await Promise.all([
      PhieuThu.find(filter)
        .populate('hoaDon')
        .populate('donDatHang')
        .sort({ ngayThu: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PhieuThu.countDocuments(filter)
    ]);

    return { list, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Lấy lịch sử Phiếu Chi theo đối tượng
   */
  async getPhieuChiList(query = {}) {
    const filter = {};
    if (query.donDatHang) filter.donDatHang = query.donDatHang;
    if (query.phieuNhap) filter.phieuNhap = query.phieuNhap;

    const { page, limit, skip } = this.getPaginationOptions(query);
    const [list, total] = await Promise.all([
      PhieuChi.find(filter)
        .populate('phieuNhap')
        .populate('donDatHang')
        .sort({ ngayChi: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PhieuChi.countDocuments(filter)
    ]);

    return { list, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

module.exports = new ThanhToanService();
