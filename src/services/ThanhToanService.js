const mongoose = require('mongoose');
const BaseService = require('./BaseService');
const { PhieuThu, PhieuChi } = require('../models');

/**
 * ThanhToanService - Service quản lý Thu - Chi & Sổ quỹ dùng chung
 * Thành viên 5: Đinh Đức Vượng
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
   * Lấy lịch sử Phiếu Thu theo đối tượng / bộ lọc
   */
  async getPhieuThuList(query = {}) {
    const filter = {};
    if (query.donDatHang) filter.donDatHang = query.donDatHang;
    if (query.hoaDon) filter.hoaDon = query.hoaDon;
    if (query.congNo) filter.congNo = query.congNo;
    if (query.hinhThuc) filter.hinhThuc = query.hinhThuc;

    if (query.tuNgay || query.denNgay) {
      filter.ngayThu = {};
      if (query.tuNgay) {
        const d = new Date(query.tuNgay);
        d.setHours(0, 0, 0, 0);
        filter.ngayThu.$gte = d;
      }
      if (query.denNgay) {
        const d = new Date(query.denNgay);
        d.setHours(23, 59, 59, 999);
        filter.ngayThu.$lte = d;
      }
    }

    if (query.search) {
      filter.ghiChu = { $regex: query.search.trim(), $options: 'i' };
    }

    const { page, limit, skip } = this.getPaginationOptions(query);
    const [list, total] = await Promise.all([
      PhieuThu.find(filter)
        .populate('hoaDon')
        .populate('donDatHang')
        .populate('congNo')
        .sort({ ngayThu: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PhieuThu.countDocuments(filter)
    ]);

    return { list, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Lấy chi tiết 1 Phiếu Thu
   */
  async getPhieuThuDetail(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã phiếu thu không hợp lệ', 400);
    }
    const phieuThu = await PhieuThu.findById(id)
      .populate('hoaDon')
      .populate('donDatHang')
      .populate('congNo');

    if (!phieuThu) {
      throw this.createError('Không tìm thấy phiếu thu yêu cầu', 404);
    }
    return phieuThu;
  }

  /**
   * Lấy lịch sử Phiếu Chi theo đối tượng / bộ lọc
   */
  async getPhieuChiList(query = {}) {
    const filter = {};
    if (query.donDatHang) filter.donDatHang = query.donDatHang;
    if (query.phieuNhap) filter.phieuNhap = query.phieuNhap;
    if (query.maDT) filter.maDT = query.maDT;
    if (query.hinhThuc) filter.hinhThuc = query.hinhThuc;

    if (query.tuNgay || query.denNgay) {
      filter.ngayChi = {};
      if (query.tuNgay) {
        const d = new Date(query.tuNgay);
        d.setHours(0, 0, 0, 0);
        filter.ngayChi.$gte = d;
      }
      if (query.denNgay) {
        const d = new Date(query.denNgay);
        d.setHours(23, 59, 59, 999);
        filter.ngayChi.$lte = d;
      }
    }

    if (query.search) {
      filter.$or = [
        { lyDo: { $regex: query.search.trim(), $options: 'i' } },
        { maDT: { $regex: query.search.trim(), $options: 'i' } }
      ];
    }

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

  /**
   * Lấy chi tiết 1 Phiếu Chi
   */
  async getPhieuChiDetail(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã phiếu chi không hợp lệ', 400);
    }
    const phieuChi = await PhieuChi.findById(id)
      .populate('phieuNhap')
      .populate('donDatHang');

    if (!phieuChi) {
      throw this.createError('Không tìm thấy phiếu chi yêu cầu', 404);
    }
    return phieuChi;
  }

  /**
   * Báo cáo Sổ quỹ: Tổng thu, Tổng chi, Tồn quỹ và phân loại theo hình thức thanh toán
   * @param {Object} query { tuNgay, denNgay, hinhThuc }
   */
  async getSoQuy(query = {}) {
    const filterThu = {};
    const filterChi = {};

    if (query.tuNgay || query.denNgay) {
      filterThu.ngayThu = {};
      filterChi.ngayChi = {};

      if (query.tuNgay) {
        const d = new Date(query.tuNgay);
        d.setHours(0, 0, 0, 0);
        filterThu.ngayThu.$gte = d;
        filterChi.ngayChi.$gte = d;
      }
      if (query.denNgay) {
        const d = new Date(query.denNgay);
        d.setHours(23, 59, 59, 999);
        filterThu.ngayThu.$lte = d;
        filterChi.ngayChi.$lte = d;
      }
    }

    if (query.hinhThuc) {
      filterThu.hinhThuc = query.hinhThuc;
      filterChi.hinhThuc = query.hinhThuc;
    }

    const [danhSachThu, danhSachChi] = await Promise.all([
      PhieuThu.find(filterThu).sort({ ngayThu: -1, createdAt: -1 }),
      PhieuChi.find(filterChi).sort({ ngayChi: -1, createdAt: -1 })
    ]);

    let tongThu = 0;
    let tongChi = 0;

    const theoHinhThuc = {
      'Tien mat': { thu: 0, chi: 0, ton: 0 },
      'Chuyen khoan': { thu: 0, chi: 0, ton: 0 },
      'Quet the': { thu: 0, chi: 0, ton: 0 },
      'Vi dien tu': { thu: 0, chi: 0, ton: 0 }
    };

    danhSachThu.forEach(pt => {
      const amount = pt.soTien || 0;
      tongThu += amount;
      if (theoHinhThuc[pt.hinhThuc]) {
        theoHinhThuc[pt.hinhThuc].thu += amount;
      }
    });

    danhSachChi.forEach(pc => {
      const amount = pc.soTien || 0;
      tongChi += amount;
      if (theoHinhThuc[pc.hinhThuc]) {
        theoHinhThuc[pc.hinhThuc].chi += amount;
      }
    });

    Object.keys(theoHinhThuc).forEach(ht => {
      theoHinhThuc[ht].ton = theoHinhThuc[ht].thu - theoHinhThuc[ht].chi;
    });

    const tonQuy = tongThu - tongChi;

    // Tổng hợp danh sách giao dịch gần nhất
    const giaoDichGanDay = [
      ...danhSachThu.map(pt => ({
        _id: pt._id,
        loai: 'THU',
        soTien: pt.soTien,
        hinhThuc: pt.hinhThuc,
        ngay: pt.ngayThu,
        noiDung: pt.ghiChu || 'Thu tiền hệ thống',
        lienKet: pt.hoaDon ? 'Hóa đơn' : (pt.donDatHang ? 'Đơn đặt trước' : (pt.congNo ? 'Công nợ' : 'Khác')),
        hoaDon: pt.hoaDon,
        donDatHang: pt.donDatHang,
        congNo: pt.congNo,
        createdAt: pt.createdAt
      })),
      ...danhSachChi.map(pc => ({
        _id: pc._id,
        loai: 'CHI',
        soTien: pc.soTien,
        hinhThuc: pc.hinhThuc,
        ngay: pc.ngayChi,
        noiDung: pc.lyDo || 'Chi tiền hệ thống',
        lienKet: pc.phieuNhap ? 'Phiếu nhập' : (pc.donDatHang ? 'Hoàn cọc đặt trước' : (pc.maDT ? `Đối tượng ${pc.maDT}` : 'Khác')),
        phieuNhap: pc.phieuNhap,
        donDatHang: pc.donDatHang,
        maDT: pc.maDT,
        createdAt: pc.createdAt
      }))
    ].sort((a, b) => new Date(b.ngay || b.createdAt) - new Date(a.ngay || a.createdAt)).slice(0, 30);

    return {
      tongThu,
      tongChi,
      tonQuy,
      soPhieuThu: danhSachThu.length,
      soPhieuChi: danhSachChi.length,
      theoHinhThuc,
      giaoDichGanDay,
      tuNgay: query.tuNgay || null,
      denNgay: query.denNgay || null
    };
  }
}

module.exports = new ThanhToanService();
