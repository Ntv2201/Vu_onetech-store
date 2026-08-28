const BaseService = require('./BaseService');
const {
  BienBanKiemKe,
  DieuChinhKho,
  MayImei,
  SanPham,
  Kho,
  TonKho,
  NhanVien
} = require('../models');
const TonKhoService = require('./TonKhoService');

/**
 * KiemKeService - Phân hệ Kiểm kê kho & Xử lý Lệch IMEI
 * Phụ trách: Đinh Đức Vương (Thành viên 5 - Tuần 4)
 * Kế thừa: BaseService
 */
class KiemKeService extends BaseService {
  constructor() {
    super(BienBanKiemKe);
  }

  /**
   * Sinh mã biên bản kiểm kê tự động: BBKK-YYYYMMDD-XXXX
   */
  async _generateMaBienBan() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `BBKK-${yyyy}${mm}${dd}-`;

    const countToday = await BienBanKiemKe.countDocuments({
      maBienBan: { $regex: `^${datePrefix}` }
    });

    const sequence = String(countToday + 1).padStart(4, '0');
    return `${datePrefix}${sequence}`;
  }

  /**
   * GET /api/kiem-ke/imei-ly-thuyet/:khoId
   * Lấy toàn bộ danh sách IMEI đang 'Con hang' trong DB để đối chiếu kiểm kê
   */
  async layDanhSachImeiLyThuyet(khoId) {
    let targetKhoId = khoId;
    if (!targetKhoId) {
      const defaultKho = await Kho.findOne();
      if (!defaultKho) {
        throw this.createError('Hệ thống chưa cấu hình kho hàng nào', 400);
      }
      targetKhoId = defaultKho._id;
    }

    const kho = await Kho.findById(targetKhoId).lean();
    if (!kho) {
      throw this.createError('Không tìm thấy kho hàng yêu cầu', 404);
    }

    // Lấy tất cả máy IMEI đang còn hàng
    const mayImeiList = await MayImei.find({ trangThai: 'Con hang' })
      .populate('sanPham', 'tenMay hang giaBan mauSac dungLuong')
      .sort({ ngayNhap: -1 })
      .lean();

    // Lấy tồn kho tổng hợp tại kho này
    const tonKhoList = await TonKho.find({ kho: targetKhoId })
      .populate('sanPham', 'tenMay hang giaBan')
      .lean();

    return {
      kho,
      tongSoLuong: mayImeiList.length,
      danhSachImei: mayImeiList.map(m => ({
        _id: m._id,
        imei: m.imei,
        sanPhamId: m.sanPham?._id,
        tenMay: m.sanPham?.tenMay || 'Không rõ',
        hang: m.sanPham?.hang || 'N/A',
        giaNhap: m.giaNhap,
        mauSac: m.mauSac,
        dungLuong: m.dungLuong,
        trangThai: m.trangThai,
        ngayNhap: m.ngayNhap
      })),
      tonKhoTongHop: tonKhoList
    };
  }

  /**
   * POST /api/kiem-ke
   * Thực hiện đối soát kiểm kê kho giữa DB lý thuyết và danh sách IMEI quét thực tế
   * @param {Object} params
   * @param {String} params.khoId
   * @param {Array|String} params.danhSachImeiThucTe
   * @param {String} [params.ghiChu]
   * @param {Object} [params.sessionUser]
   */
  async thucHienKiemKe({ khoId, danhSachImeiThucTe, ghiChu, sessionUser }) {
    let targetKhoId = khoId;
    if (!targetKhoId) {
      const defaultKho = await Kho.findOne();
      if (!defaultKho) throw this.createError('Chưa có kho hàng trong hệ thống', 400);
      targetKhoId = defaultKho._id;
    }

    const kho = await Kho.findById(targetKhoId);
    if (!kho) throw this.createError('Kho hàng không tồn tại', 404);

    // Chuẩn hóa danh sách IMEI thực tế quét được
    let rawList = [];
    if (Array.isArray(danhSachImeiThucTe)) {
      rawList = danhSachImeiThucTe;
    } else if (typeof danhSachImeiThucTe === 'string') {
      rawList = danhSachImeiThucTe.split(/[\n,;\t\r]+/);
    }

    const imeiThucTeList = [
      ...new Set(
        rawList
          .map(item => String(item).trim())
          .filter(item => item.length > 0)
      )
    ];

    // Lấy toàn bộ máy IMEI trong DB đang 'Con hang' (Lý thuyết)
    const dbConHangList = await MayImei.find({ trangThai: 'Con hang' })
      .populate('sanPham', 'tenMay hang giaBan')
      .lean();

    const mapDbConHang = new Map();
    dbConHangList.forEach(m => {
      mapDbConHang.set(m.imei, m);
    });

    const setThucTe = new Set(imeiThucTeList);

    const danhSachKhop = [];
    const danhSachThieu = [];
    const danhSachThua = [];
    const danhSachBatThuong = [];

    // 1. Kiểm tra tập hợp trong DB: Khớp vs Thiếu
    for (const [imei, mayDb] of mapDbConHang.entries()) {
      if (setThucTe.has(imei)) {
        danhSachKhop.push({
          imei,
          sanPham: mayDb.sanPham?._id,
          tenMay: mayDb.sanPham?.tenMay || 'N/A',
          hang: mayDb.sanPham?.hang || 'N/A',
          trangThaiMayDB: 'Con hang',
          loaiLech: 'Khop',
          ghiChu: 'Khớp 100% giữa lý thuyết và thực tế'
        });
      } else {
        danhSachThieu.push({
          imei,
          sanPham: mayDb.sanPham?._id,
          tenMay: mayDb.sanPham?.tenMay || 'N/A',
          hang: mayDb.sanPham?.hang || 'N/A',
          trangThaiMayDB: 'Con hang',
          loaiLech: 'Thieu',
          soLuongDC: -1,
          lyDo: 'Có trong DB nhưng thực tế kiểm kê không quét thấy máy'
        });
      }
    }

    // 2. Kiểm tra tập hợp quét thực tế mà không có trong mapDbConHang: Thừa vs Bất thường
    const imeiNgoaiDbConHang = imeiThucTeList.filter(imei => !mapDbConHang.has(imei));

    if (imeiNgoaiDbConHang.length > 0) {
      // Tra cứu xem những IMEI này có trong DB ở trạng thái khác (Da ban, Bao hanh, Loi, Tra NCC) không
      const otherMayList = await MayImei.find({ imei: { $in: imeiNgoaiDbConHang } })
        .populate('sanPham', 'tenMay hang')
        .lean();

      const mapOtherMay = new Map();
      otherMayList.forEach(m => mapOtherMay.set(m.imei, m));

      for (const imei of imeiNgoaiDbConHang) {
        const mayDbKhac = mapOtherMay.get(imei);
        if (mayDbKhac) {
          // Có trong DB nhưng trạng thái khác 'Con hang' -> Bất thường
          danhSachBatThuong.push({
            imei,
            sanPham: mayDbKhac.sanPham?._id,
            tenMay: mayDbKhac.sanPham?.tenMay || 'N/A',
            hang: mayDbKhac.sanPham?.hang || 'N/A',
            trangThaiMayDB: mayDbKhac.trangThai,
            loaiLech: 'Bat thuong',
            soLuongDC: 0,
            lyDo: `Quét thấy thực tế nhưng DB đang ở trạng thái "${mayDbKhac.trangThai}"`
          });
        } else {
          // Hoàn toàn không có trong DB -> Thừa
          danhSachThua.push({
            imei,
            sanPham: null,
            tenMay: 'Chưa xác định',
            hang: 'N/A',
            trangThaiMayDB: 'Khong ton tai',
            loaiLech: 'Thua',
            soLuongDC: 1,
            lyDo: 'Quét thực tế có IMEI nhưng hệ thống chưa có dữ liệu máy'
          });
        }
      }
    }

    const tongLyThuyet = dbConHangList.length;
    const tongThucTe = imeiThucTeList.length;
    const tongKhop = danhSachKhop.length;
    const tongThieu = danhSachThieu.length;
    const tongThua = danhSachThua.length;
    const tongBatThuong = danhSachBatThuong.length;
    const tongLech = tongThieu + tongThua + tongBatThuong;

    // Sinh mã và tạo bản ghi BienBanKiemKe
    const maBienBan = await this._generateMaBienBan();
    let nhanVienId = sessionUser?._id || sessionUser?.id;
    if (!nhanVienId) {
      const defaultNv = await NhanVien.findOne();
      nhanVienId = defaultNv?._id;
    }

    const bienBan = new BienBanKiemKe({
      maBienBan,
      kho: targetKhoId,
      nhanVien: nhanVienId,
      ngay: new Date(),
      tongLyThuyet,
      tongThucTe,
      tongKhop,
      tongLech,
      tongThieu,
      tongThua: tongThua + tongBatThuong,
      trangThai: 'Da kiem ke',
      ghiChu: ghiChu || ''
    });

    await bienBan.save();

    // Tạo các dòng DieuChinhKho cho các mục lệch
    const cacDongDieuChinh = [];

    // 1. Thêm dòng Thiếu
    danhSachThieu.forEach(item => {
      cacDongDieuChinh.push({
        bienBan: bienBan._id,
        sanPham: item.sanPham,
        imei: item.imei,
        loaiLech: 'Thieu',
        trangThaiMayDB: item.trangThaiMayDB,
        soLuongDC: -1,
        lyDo: item.lyDo,
        daXuLy: false
      });
    });

    // 2. Thêm dòng Thừa
    danhSachThua.forEach(item => {
      cacDongDieuChinh.push({
        bienBan: bienBan._id,
        sanPham: null,
        imei: item.imei,
        loaiLech: 'Thua',
        trangThaiMayDB: item.trangThaiMayDB,
        soLuongDC: 1,
        lyDo: item.lyDo,
        daXuLy: false
      });
    });

    // 3. Thêm dòng Bất thường
    danhSachBatThuong.forEach(item => {
      cacDongDieuChinh.push({
        bienBan: bienBan._id,
        sanPham: item.sanPham,
        imei: item.imei,
        loaiLech: 'Bat thuong',
        trangThaiMayDB: item.trangThaiMayDB,
        soLuongDC: 0,
        lyDo: item.lyDo,
        daXuLy: false
      });
    });

    let insertedDieuChinh = [];
    if (cacDongDieuChinh.length > 0) {
      insertedDieuChinh = await DieuChinhKho.insertMany(cacDongDieuChinh);
    }

    return {
      bienBan: await BienBanKiemKe.findById(bienBan._id)
        .populate('kho', 'tenKho diaChi')
        .populate('nhanVien', 'hoTen tenDangNhap vaiTro')
        .lean(),
      tongKet: {
        tongLyThuyet,
        tongThucTe,
        tongKhop,
        tongLech,
        tongThieu,
        tongThua,
        tongBatThuong
      },
      danhSachKhop,
      danhSachThieu,
      danhSachThua,
      danhSachBatThuong,
      chiTietDieuChinh: insertedDieuChinh
    };
  }

  /**
   * GET /api/kiem-ke
   * Lấy danh sách biên bản kiểm kê phân trang
   */
  async layDanhSachBienBan(query = {}) {
    const { page, limit, skip } = this.getPaginationOptions(query);
    const filter = {};

    if (query.kho) {
      filter.kho = query.kho;
    }
    if (query.trangThai) {
      filter.trangThai = query.trangThai;
    }
    if (query.tuNgay || query.denNgay) {
      filter.ngay = {};
      if (query.tuNgay) filter.ngay.$gte = new Date(query.tuNgay);
      if (query.denNgay) {
        const den = new Date(query.denNgay);
        den.setHours(23, 59, 59, 999);
        filter.ngay.$lte = den;
      }
    }

    const [items, total] = await Promise.all([
      BienBanKiemKe.find(filter)
        .populate('kho', 'tenKho diaChi')
        .populate('nhanVien', 'hoTen tenDangNhap vaiTro')
        .sort({ ngay: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BienBanKiemKe.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * GET /api/kiem-ke/:id
   * Xem chi tiết biên bản kiểm kê và các dòng điều chỉnh
   */
  async layChiTietBienBan(bienBanId) {
    const bienBan = await BienBanKiemKe.findById(bienBanId)
      .populate('kho', 'tenKho diaChi')
      .populate('nhanVien', 'hoTen tenDangNhap vaiTro')
      .lean();

    if (!bienBan) {
      throw this.createError('Không tìm thấy biên bản kiểm kê', 404);
    }

    const chiTiet = await DieuChinhKho.find({ bienBan: bienBanId })
      .populate('sanPham', 'tenMay hang giaBan mauSac')
      .sort({ loaiLech: 1, createdAt: 1 })
      .lean();

    return {
      bienBan,
      chiTiet
    };
  }

  /**
   * PUT /api/kiem-ke/:id/ap-dung
   * Áp dụng điều chỉnh kho cho biên bản kiểm kê
   * Cập nhật tồn kho TonKho và trạng thái máy MayImei
   */
  async apDungDieuChinh(bienBanId, sessionUser) {
    const bienBan = await BienBanKiemKe.findById(bienBanId);
    if (!bienBan) {
      throw this.createError('Không tìm thấy biên bản kiểm kê', 404);
    }

    if (bienBan.trangThai === 'Da dieu chinh') {
      throw this.createError('Biên bản kiểm kê này đã được áp dụng điều chỉnh kho trước đó', 400);
    }
    if (bienBan.trangThai === 'Huy') {
      throw this.createError('Không thể áp dụng điều chỉnh cho biên bản đã bị hủy', 400);
    }

    const chiTietList = await DieuChinhKho.find({ bienBan: bienBanId, daXuLy: false });

    for (const item of chiTietList) {
      if (item.loaiLech === 'Thieu') {
        // Đổi trạng thái máy trong DB sang 'Loi' hoặc đánh dấu mất
        if (item.imei) {
          await MayImei.updateOne(
            { imei: item.imei, trangThai: 'Con hang' },
            { $set: { trangThai: 'Loi', status: false } }
          );
        }
        // Giảm tồn kho sản phẩm tương ứng
        if (item.sanPham) {
          try {
            await TonKhoService.capNhatTonKho(item.sanPham, bienBan.kho, -1, { choPhepAm: true });
          } catch (e) {
            console.warn(`[KiemKe] Cảnh báo cập nhật tồn kho khi thiếu sản phẩm ${item.sanPham}:`, e.message);
          }
        }
      }

      item.daXuLy = true;
      await item.save();
    }

    bienBan.trangThai = 'Da dieu chinh';
    await bienBan.save();

    return {
      message: 'Áp dụng điều chỉnh kho thành công',
      bienBan: await BienBanKiemKe.findById(bienBanId)
        .populate('kho', 'tenKho diaChi')
        .populate('nhanVien', 'hoTen tenDangNhap vaiTro')
        .lean()
    };
  }

  /**
   * PUT /api/kiem-ke/:id/huy
   * Hủy biên bản kiểm kê (Chỉ cho phép Quản lý khi chưa áp dụng điều chỉnh)
   */
  async huyBienBan(bienBanId, sessionUser) {
    const bienBan = await BienBanKiemKe.findById(bienBanId);
    if (!bienBan) {
      throw this.createError('Không tìm thấy biên bản kiểm kê', 404);
    }

    if (bienBan.trangThai === 'Da dieu chinh') {
      throw this.createError('Không thể hủy biên bản đã áp dụng điều chỉnh kho vào hệ thống', 400);
    }
    if (bienBan.trangThai === 'Huy') {
      throw this.createError('Biên bản này đã ở trạng thái Đã hủy', 400);
    }

    bienBan.trangThai = 'Huy';
    await bienBan.save();

    return {
      message: 'Hủy biên bản kiểm kê thành công',
      bienBan
    };
  }
}

module.exports = new KiemKeService();
