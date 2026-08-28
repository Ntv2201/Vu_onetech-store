const BaseService = require('./BaseService');
const {
  HoaDon,
  CT_HoaDon_May,
  CT_HoaDon_PhuKien,
  PhieuNhap,
  PhieuChi,
  PhieuThu,
  MayImei,
  SanPham,
  PhuKien,
  CongNo,
  Kho,
  TonKho
} = require('../models');

/**
 * BaoCaoService - Phân hệ Báo cáo Thống kê Doanh thu, Chi phí, Top Sản phẩm & Tồn kho
 * Phụ trách: Đinh Đức Vương (Thành viên 5 - Tuần 5 & 6)
 * Kế thừa: BaseService
 */
class BaoCaoService extends BaseService {
  constructor() {
    super();
  }

  /**
   * GET /api/bao-cao/doanh-thu
   * Báo cáo Doanh thu thuần, Chi phí và Lợi nhuận gộp theo khoảng thời gian và nhóm thời gian (ngày / tuần / tháng)
   * @param {Object} query
   * @param {String} [query.tuNgay]
   * @param {String} [query.denNgay]
   * @param {String} [query.nhom='ngay'] - 'ngay' | 'tuan' | 'thang'
   */
  async getBaoCaoDoanhThu(query = {}) {
    const { tuNgay, denNgay, nhom = 'ngay' } = query;

    // Khoảng thời gian lọc
    const filterHD = { trangThai: { $ne: 'Da huy' } };
    const filterPN = {};
    const filterPC = {};

    if (tuNgay || denNgay) {
      filterHD.ngayLap = {};
      filterPN.ngayNhap = {};
      filterPC.ngayChi = {};

      if (tuNgay) {
        const dTu = new Date(tuNgay);
        dTu.setHours(0, 0, 0, 0);
        filterHD.ngayLap.$gte = dTu;
        filterPN.ngayNhap.$gte = dTu;
        filterPC.ngayChi.$gte = dTu;
      }
      if (denNgay) {
        const dDen = new Date(denNgay);
        dDen.setHours(23, 59, 59, 999);
        filterHD.ngayLap.$lte = dDen;
        filterPN.ngayNhap.$lte = dDen;
        filterPC.ngayChi.$lte = dDen;
      }
    }

    const [hoaDons, phieuNhaps, phieuChis] = await Promise.all([
      HoaDon.find(filterHD).lean(),
      PhieuNhap.find(filterPN).lean(),
      PhieuChi.find(filterPC).lean()
    ]);

    let tongDoanhThu = 0;
    let tongTienGiam = 0;
    let tongTienHang = 0;
    let tongChiPhiNhap = 0;
    let tongChiPhiKhac = 0;

    // Map nhóm theo mốc thời gian phục vụ vẽ biểu đồ
    const groupMap = new Map();

    const getGroupKey = (dateObj) => {
      const d = new Date(dateObj);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      if (nhom === 'thang') {
        return `${yyyy}-${mm}`;
      } else if (nhom === 'tuan') {
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil((((d - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
        return `${yyyy}-W${String(week).padStart(2, '0')}`;
      }
      return `${yyyy}-${mm}-${dd}`;
    };

    // 1. Tính Doanh thu từ Hóa đơn
    hoaDons.forEach(hd => {
      const dt = hd.soTienThanhToan || hd.tongTien || 0;
      tongDoanhThu += dt;
      tongTienGiam += (hd.soTienGiam || 0);
      tongTienHang += (hd.tongTien || 0);

      const key = getGroupKey(hd.ngayLap || hd.createdAt);
      const cur = groupMap.get(key) || { doanhThu: 0, chiPhi: 0, loiNhuan: 0, soDon: 0 };
      cur.doanhThu += dt;
      cur.soDon += 1;
      groupMap.set(key, cur);
    });

    // 2. Tính Chi phí từ Phiếu Nhập
    phieuNhaps.forEach(pn => {
      const cp = pn.tongTien || 0;
      tongChiPhiNhap += cp;

      const key = getGroupKey(pn.ngayNhap || pn.createdAt);
      const cur = groupMap.get(key) || { doanhThu: 0, chiPhi: 0, loiNhuan: 0, soDon: 0 };
      cur.chiPhi += cp;
      groupMap.set(key, cur);
    });

    // 3. Tính Chi phí khác từ Phiếu Chi (không gắn với phiếu nhập để tránh đúp)
    phieuChis.forEach(pc => {
      if (!pc.phieuNhap) {
        const cp = pc.soTien || 0;
        tongChiPhiKhac += cp;

        const key = getGroupKey(pc.ngayChi || pc.createdAt);
        const cur = groupMap.get(key) || { doanhThu: 0, chiPhi: 0, loiNhuan: 0, soDon: 0 };
        cur.chiPhi += cp;
        groupMap.set(key, cur);
      }
    });

    const tongChiPhi = tongChiPhiNhap + tongChiPhiKhac;
    const loiNhuanGop = tongDoanhThu - tongChiPhi;

    // Sắp xếp các mốc thời gian tăng dần
    const sortedKeys = [...groupMap.keys()].sort();
    const series = sortedKeys.map(k => {
      const val = groupMap.get(k);
      val.loiNhuan = val.doanhThu - val.chiPhi;
      return {
        label: k,
        doanhThu: val.doanhThu,
        chiPhi: val.chiPhi,
        loiNhuan: val.loiNhuan,
        soDon: val.soDon
      };
    });

    return {
      tongQuan: {
        tongDoanhThu,
        tongTienHang,
        tongTienGiam,
        tongChiPhi,
        tongChiPhiNhap,
        tongChiPhiKhac,
        loiNhuanGop,
        tongSoHoaDon: hoaDons.length,
        tongSoPhieuNhap: phieuNhaps.length
      },
      bieuDo: {
        nhom,
        labels: sortedKeys,
        doanhThu: series.map(s => s.doanhThu),
        chiPhi: series.map(s => s.chiPhi),
        loiNhuan: series.map(s => s.loiNhuan)
      },
      chiTietTheoThoiGian: series
    };
  }

  /**
   * GET /api/bao-cao/top-san-pham
   * Top sản phẩm bán chạy nhất theo số lượng bán và theo doanh thu
   * @param {Object} query
   * @param {Number} [query.limit=10]
   * @param {String} [query.tuNgay]
   * @param {String} [query.denNgay]
   */
  async getTopSanPham(query = {}) {
    const limit = Math.max(1, parseInt(query.limit) || 10);
    const { tuNgay, denNgay } = query;

    const filterHD = { trangThai: { $ne: 'Da huy' } };
    if (tuNgay || denNgay) {
      filterHD.ngayLap = {};
      if (tuNgay) filterHD.ngayLap.$gte = new Date(tuNgay);
      if (denNgay) {
        const d = new Date(denNgay);
        d.setHours(23, 59, 59, 999);
        filterHD.ngayLap.$lte = d;
      }
    }

    const hoaDons = await HoaDon.find(filterHD).select('_id').lean();
    const hdIds = hoaDons.map(h => h._id);

    // Lấy chi tiết hóa đơn máy và phụ kiện
    const [ctMays, sanPhams] = await Promise.all([
      CT_HoaDon_May.find({ hoaDon: { $in: hdIds } }).lean(),
      SanPham.find().select('tenMay hang giaBan hinhAnh').lean()
    ]);

    // Map danh sách IMEI sang Sản Phẩm
    const imeisList = ctMays.map(c => c.imei).filter(Boolean);
    const mayImeis = await MayImei.find({ imei: { $in: imeisList } })
      .populate('sanPham', 'tenMay hang giaBan')
      .lean();

    const imeiToSpMap = new Map();
    mayImeis.forEach(m => {
      if (m.sanPham) {
        imeiToSpMap.set(m.imei, m.sanPham);
      }
    });

    const spMap = new Map();
    sanPhams.forEach(sp => {
      spMap.set(String(sp._id), {
        sanPhamId: sp._id,
        tenMay: sp.tenMay,
        hang: sp.hang,
        giaBan: sp.giaBan,
        soLuongBan: 0,
        doanhThu: 0
      });
    });

    ctMays.forEach(ct => {
      const spObj = imeiToSpMap.get(ct.imei);
      if (spObj && spObj._id) {
        const key = String(spObj._id);
        const cur = spMap.get(key) || {
          sanPhamId: spObj._id,
          tenMay: spObj.tenMay,
          hang: spObj.hang,
          giaBan: spObj.giaBan,
          soLuongBan: 0,
          doanhThu: 0
        };
        cur.soLuongBan += 1;
        cur.doanhThu += (ct.donGiaBan || spObj.giaBan || 0);
        spMap.set(key, cur);
      }
    });

    const listAll = [...spMap.values()];

    // Sắp xếp theo số lượng bán chạy
    const topTheoSoLuong = [...listAll]
      .filter(s => s.soLuongBan > 0)
      .sort((a, b) => b.soLuongBan - a.soLuongBan)
      .slice(0, limit);

    // Sắp xếp theo doanh thu cao nhất
    const topTheoDoanhThu = [...listAll]
      .filter(s => s.doanhThu > 0)
      .sort((a, b) => b.doanhThu - a.doanhThu)
      .slice(0, limit);

    return {
      topTheoSoLuong,
      topTheoDoanhThu,
      tongSanPhamDaBan: listAll.reduce((acc, s) => acc + s.soLuongBan, 0),
      tongDoanhThuSanPham: listAll.reduce((acc, s) => acc + s.doanhThu, 0)
    };
  }

  /**
   * GET /api/bao-cao/ton-lau-ngay
   * Danh sách các máy IMEI tồn kho lâu ngày chưa bán được (> soNgay)
   * @param {Object} query
   * @param {Number} [query.soNgay=60]
   * @param {Number} [query.limit=50]
   */
  async getHangTonLauNgay(query = {}) {
    const soNgay = Math.max(1, parseInt(query.soNgay) || 60);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 50));

    const thresholdDate = new Date(Date.now() - soNgay * 24 * 60 * 60 * 1000);

    const filter = {
      trangThai: 'Con hang',
      ngayNhap: { $lte: thresholdDate }
    };

    const [items, total] = await Promise.all([
      MayImei.find(filter)
        .populate('sanPham', 'tenMay hang giaBan mauSac dungLuong')
        .sort({ ngayNhap: 1 })
        .limit(limit)
        .lean(),
      MayImei.countDocuments(filter)
    ]);

    const now = Date.now();
    let tongVonTonLau = 0;

    const formattedList = items.map(m => {
      const nhap = new Date(m.ngayNhap || m.createdAt).getTime();
      const soNgayTon = Math.floor((now - nhap) / (1000 * 60 * 60 * 24));
      tongVonTonLau += (m.giaNhap || 0);

      return {
        _id: m._id,
        imei: m.imei,
        sanPham: m.sanPham,
        tenMay: m.sanPham?.tenMay || 'N/A',
        hang: m.sanPham?.hang || 'N/A',
        mauSac: m.mauSac,
        dungLuong: m.dungLuong,
        giaNhap: m.giaNhap,
        ngayNhap: m.ngayNhap,
        soNgayTon
      };
    });

    return {
      tieuChi: `Tồn kho > ${soNgay} ngày`,
      tongSoLuong: total,
      tongVonTonLau,
      danhSach: formattedList
    };
  }

  /**
   * GET /api/bao-cao/tong-hop-tai-chinh
   * Báo cáo tổng hợp đối soát chéo tài chính toàn hệ thống
   */
  async getBaoCaoTaiChinhTongHop() {
    const [
      phieuThus,
      phieuChis,
      congNos,
      mayImeis,
      phuKiens,
      hoaDons
    ] = await Promise.all([
      PhieuThu.find({ trangThai: { $ne: 'Da huy' } }).lean(),
      PhieuChi.find({ trangThai: { $ne: 'Da huy' } }).lean(),
      CongNo.find().lean(),
      MayImei.find({ trangThai: 'Con hang' }).lean(),
      PhuKien.find().lean(),
      HoaDon.find({ trangThai: { $ne: 'Da huy' } }).lean()
    ]);

    // 1. Số dư Sổ Quỹ
    let tongThu = 0;
    let thuTienMat = 0;
    let thuNganHang = 0;
    phieuThus.forEach(pt => {
      const st = pt.soTien || 0;
      tongThu += st;
      if (pt.hinhThuc === 'Tien mat') thuTienMat += st;
      else thuNganHang += st;
    });

    let tongChi = 0;
    let chiTienMat = 0;
    let chiNganHang = 0;
    phieuChis.forEach(pc => {
      const st = pc.soTien || 0;
      tongChi += st;
      if (pc.hinhThuc === 'Tien mat') chiTienMat += st;
      else chiNganHang += st;
    });

    const tonQuy = tongThu - tongChi;
    const tonQuyTienMat = thuTienMat - chiTienMat;
    const tonQuyNganHang = thuNganHang - chiNganHang;

    // 2. Công nợ
    let noPhaiThuKH = 0;
    let noPhaiTraNCC = 0;
    congNos.forEach(cn => {
      const conNo = Math.max(0, (cn.soTienNo || 0) - (cn.soTienDaTra || 0));
      if (cn.loaiDoiTuong === 'KhachHang') noPhaiThuKH += conNo;
      else if (cn.loaiDoiTuong === 'NhaCungCap') noPhaiTraNCC += conNo;
    });

    // 3. Giá trị kho hàng máy IMEI & Phụ kiện
    let giaTriKhoMay = 0;
    mayImeis.forEach(m => {
      giaTriKhoMay += (m.giaNhap || 0);
    });

    let giaTriKhoPhuKien = 0;
    phuKiens.forEach(pk => {
      giaTriKhoPhuKien += (pk.giaNhap || 0) * (pk.soLuongTon || 0);
    });
    const tongGiaTriKho = giaTriKhoMay + giaTriKhoPhuKien;

    // 4. Doanh thu bán hàng
    const tongDoanhThuBanHang = hoaDons.reduce((acc, h) => acc + (h.soTienThanhToan || h.tongTien || 0), 0);

    return {
      soQuy: {
        tongThu,
        tongChi,
        tonQuy,
        tonQuyTienMat,
        tonQuyNganHang
      },
      congNo: {
        noPhaiThuKH,
        noPhaiTraNCC
      },
      tonKho: {
        soLuongMayConHang: mayImeis.length,
        giaTriKhoMay,
        giaTriKhoPhuKien,
        tongGiaTriKho
      },
      kinhDoanh: {
        tongDoanhThuBanHang,
        tongHoaDon: hoaDons.length
      }
    };
  }
}

module.exports = new BaoCaoService();
