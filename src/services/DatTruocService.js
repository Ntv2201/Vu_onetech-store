const mongoose = require('mongoose');
const BaseService = require('./BaseService');
const ThanhToanService = require('./ThanhToanService');
const {
  DonDatHangTruoc,
  KhachHang,
  SanPham,
  MayImei,
  PhieuThu,
  PhieuChi,
  HoaDon
} = require('../models');

/**
 * DatTruocService - Phân hệ Đặt hàng trước (Pre-order)
 * Module Thành viên 6: Tô Quốc Việt
 */
class DatTruocService extends BaseService {
  constructor() {
    super(DonDatHangTruoc);
  }

  /**
   * Tạo Đơn Đặt Hàng Trước & Tự động ghi nhận Phiếu Thu tiền cọc
   * @param {Object} payload { maKH, khachHang, maSP, sanPham, soTienCoc, hanLay, ghiChu, hinhThuc, imei }
   * @param {Object} sessionUser Nhân viên thực hiện thao tác
   */
  async createDatTruoc(payload = {}, sessionUser = null) {
    const {
      maKH,
      khachHang,
      maSP,
      sanPham,
      soTienCoc = 0,
      hanLay,
      ghiChu = '',
      hinhThuc = 'Tien mat',
      imei
    } = payload;

    const targetKH = khachHang || maKH;
    const targetSP = sanPham || maSP;

    if (!targetKH) {
      throw this.createError('Vui lòng chọn khách hàng đặt trước', 400);
    }
    if (!targetSP) {
      throw this.createError('Vui lòng chọn sản phẩm cần đặt trước', 400);
    }

    // 1. Kiểm tra khách hàng tồn tại
    let khDoc;
    if (mongoose.Types.ObjectId.isValid(targetKH)) {
      khDoc = await KhachHang.findById(targetKH);
    } else {
      khDoc = await KhachHang.findOne({ sdt: targetKH });
    }
    if (!khDoc) {
      throw this.createError(`Không tìm thấy khách hàng trong hệ thống (${targetKH})`, 404);
    }

    // 2. Kiểm tra sản phẩm tồn tại
    let spDoc;
    if (mongoose.Types.ObjectId.isValid(targetSP)) {
      spDoc = await SanPham.findById(targetSP);
    } else {
      spDoc = await SanPham.findOne({ tenMay: { $regex: new RegExp(`^${targetSP}$`, 'i') } });
    }
    if (!spDoc) {
      throw this.createError(`Không tìm thấy sản phẩm trong hệ thống (${targetSP})`, 404);
    }

    // 3. Kiểm tra số tiền cọc hợp lệ
    const depositAmount = Math.max(0, Number(soTienCoc) || 0);

    // 4. Nếu có chỉ định IMEI trước, kiểm tra IMEI tồn tại
    let imeiTarget = '';
    if (imei && typeof imei === 'string' && imei.trim()) {
      const cleanImei = imei.trim();
      const mayDoc = await MayImei.findOne({ imei: cleanImei });
      if (!mayDoc) {
        throw this.createError(`IMEI ${cleanImei} không tồn tại trong hệ thống`, 404);
      }
      imeiTarget = cleanImei;
    }

    // 5. Tạo bản ghi DonDatHangTruoc
    const donDatHang = await DonDatHangTruoc.create({
      khachHang: khDoc._id,
      sanPham: spDoc._id,
      imei: imeiTarget || undefined,
      soTienCoc: depositAmount,
      hanLay: hanLay ? new Date(hanLay) : undefined,
      trangThai: 'Da dat coc',
      ghiChu: ghiChu || ''
    });

    // 6. Tự động sinh Phiếu Thu nếu có tiền cọc
    let phieuThu = null;
    if (depositAmount > 0) {
      phieuThu = await ThanhToanService.taoPhieuThu({
        donDatHang: donDatHang._id,
        soTien: depositAmount,
        hinhThuc,
        ghiChu: `Thu tiền cọc đơn đặt trước ${spDoc.tenMay} của KH ${khDoc.hoTen}`,
        sessionUser
      });
    }

    const detail = await this.getDatTruocDetail(donDatHang._id);
    return {
      ...detail,
      phieuThu
    };
  }

  /**
   * Lấy danh sách đơn đặt trước có bộ lọc, tìm kiếm và phân trang
   */
  async getDatTruocList(query = {}) {
    const { trangThai, maKH, khachHang, maSP, sanPham, tuNgay, denNgay, search } = query;
    const filter = {};

    if (trangThai && trangThai !== 'All') {
      filter.trangThai = trangThai;
    }

    const targetKH = khachHang || maKH;
    if (targetKH && mongoose.Types.ObjectId.isValid(targetKH)) {
      filter.khachHang = targetKH;
    }

    const targetSP = sanPham || maSP;
    if (targetSP && mongoose.Types.ObjectId.isValid(targetSP)) {
      filter.sanPham = targetSP;
    }

    if (tuNgay || denNgay) {
      filter.createdAt = {};
      if (tuNgay) filter.createdAt.$gte = new Date(tuNgay + 'T00:00:00.000Z');
      if (denNgay) filter.createdAt.$lte = new Date(denNgay + 'T23:59:59.999Z');
    }

    const { page, limit, skip } = this.getPaginationOptions(query);

    let queryBuilder = DonDatHangTruoc.find(filter)
      .populate('khachHang', 'hoTen sdt diaChi')
      .populate('sanPham', 'tenMay hang giaBan soThangBH')
      .sort({ createdAt: -1 });

    const [donDatHangsRaw, total] = await Promise.all([
      queryBuilder.skip(skip).limit(limit),
      DonDatHangTruoc.countDocuments(filter)
    ]);

    let donDatHangs = donDatHangsRaw;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      donDatHangs = donDatHangs.filter(d => {
        const tenKH = d.khachHang ? d.khachHang.hoTen.toLowerCase() : '';
        const sdtKH = d.khachHang ? d.khachHang.sdt : '';
        const tenSP = d.sanPham ? d.sanPham.tenMay.toLowerCase() : '';
        const idStr = d._id.toString();
        const imeiStr = d.imei ? d.imei.toLowerCase() : '';
        return tenKH.includes(q) || sdtKH.includes(q) || tenSP.includes(q) || idStr.includes(q) || imeiStr.includes(q);
      });
    }

    return {
      donDatHangs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Lấy chi tiết đơn đặt trước kèm lịch sử Phiếu Thu (tiền cọc), Phiếu Chi (hoàn cọc) và Hóa đơn liên kết
   */
  async getDatTruocDetail(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã đơn đặt trước không hợp lệ', 400);
    }

    const donDatHang = await DonDatHangTruoc.findById(id)
      .populate('khachHang', 'hoTen sdt diaChi email')
      .populate('sanPham', 'tenMay hang giaBan soThangBH moTa');

    if (!donDatHang) {
      throw this.createError('Không tìm thấy đơn đặt hàng trước', 404);
    }

    const [phieuThuList, phieuChiList, hoaDon] = await Promise.all([
      PhieuThu.find({ donDatHang: donDatHang._id }).sort({ ngayThu: -1 }),
      PhieuChi.find({ donDatHang: donDatHang._id }).sort({ ngayChi: -1 }),
      HoaDon.findOne({ donDatHang: donDatHang._id }).populate('nhanVien', 'hoTen vaiTro')
    ]);

    return {
      donDatHang,
      phieuThuList,
      phieuChiList,
      hoaDon
    };
  }

  /**
   * Hủy Đơn Đặt Hàng Trước & Tự động sinh Phiếu Chi hoàn cọc
   * @param {String} id ID đơn đặt trước
   * @param {Object} payload { lyDo, hinhThuc }
   * @param {Object} sessionUser Nhân viên thực hiện
   */
  async huyDatTruoc(id, payload = {}, sessionUser = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã đơn đặt hàng trước không hợp lệ', 400);
    }

    const don = await DonDatHangTruoc.findById(id).populate('khachHang sanPham');
    if (!don) {
      throw this.createError('Không tìm thấy đơn đặt hàng trước', 404);
    }

    if (don.trangThai === 'Da nhan hang' || don.trangThai === 'Da nhan may') {
      throw this.createError('Đơn đặt hàng này đã nhận máy thành công, không thể hủy đơn', 400);
    }

    if (don.trangThai === 'Da huy') {
      throw this.createError('Đơn đặt hàng này đã bị hủy trước đó', 400);
    }

    const { lyDo = 'Khách hàng yêu cầu hủy đơn đặt trước', hinhThuc = 'Tien mat' } = payload;

    // 1. Cập nhật trạng thái đơn sang 'Da huy'
    don.trangThai = 'Da huy';
    don.ghiChu = (don.ghiChu ? don.ghiChu + ' | ' : '') + `Đã hủy: ${lyDo}`;
    await don.save();

    // 2. Tự động sinh Phiếu Chi hoàn cọc nếu đơn có tiền cọc
    let phieuChi = null;
    if (don.soTienCoc > 0) {
      phieuChi = await ThanhToanService.taoPhieuChi({
        donDatHang: don._id,
        soTien: don.soTienCoc,
        hinhThuc,
        lyDo: `Hoàn tiền cọc đơn đặt trước ${don._id} (${don.sanPham ? don.sanPham.tenMay : ''}) cho KH ${don.khachHang ? don.khachHang.hoTen : ''}. Lý do: ${lyDo}`,
        sessionUser
      });
    }

    const updatedDetail = await this.getDatTruocDetail(don._id);
    return {
      ...updatedDetail,
      phieuChi
    };
  }

  /**
   * Cập nhật trạng thái hoặc gán IMEI cho đơn đặt trước
   * @param {String} id
   * @param {Object} payload { trangThai, imei, ghiChu, hanLay }
   */
  async capNhatTrangThai(id, payload = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã đơn đặt trước không hợp lệ', 400);
    }

    const don = await DonDatHangTruoc.findById(id);
    if (!don) {
      throw this.createError('Không tìm thấy đơn đặt trước', 404);
    }

    if (don.trangThai === 'Da huy' || don.trangThai === 'Da nhan hang' || don.trangThai === 'Da nhan may') {
      throw this.createError(`Không thể thay đổi trạng thái đơn đã ở trạng thái "${don.trangThai}"`, 400);
    }

    const { trangThai, imei, ghiChu, hanLay } = payload;

    if (trangThai) {
      const validStatuses = ['Cho xu ly', 'Da dat coc', 'Da co hang', 'Da nhan hang', 'Da nhan may', 'Da huy'];
      if (!validStatuses.includes(trangThai)) {
        throw this.createError(`Trạng thái "${trangThai}" không hợp lệ`, 400);
      }
      don.trangThai = trangThai;
    }

    if (imei !== undefined) {
      if (imei && imei.trim()) {
        const cleanImei = imei.trim();
        const mayDoc = await MayImei.findOne({ imei: cleanImei });
        if (!mayDoc) {
          throw this.createError(`IMEI ${cleanImei} không tồn tại trong hệ thống`, 404);
        }
        don.imei = cleanImei;
        if (!trangThai) {
          don.trangThai = 'Da co hang';
        }
      } else {
        don.imei = undefined;
      }
    }

    if (ghiChu !== undefined) {
      don.ghiChu = ghiChu;
    }

    if (hanLay) {
      don.hanLay = new Date(hanLay);
    }

    await don.save();
    return await this.getDatTruocDetail(don._id);
  }

  /**
   * Chuyển đơn đặt trước sang Hóa đơn bán hàng POS (Khách đến nhận máy)
   * Tự động cấn trừ tiền cọc vào hóa đơn và cập nhật trạng thái đơn
   * @param {String} id ID đơn đặt trước
   * @param {Object} payload { imei, danhSachPhuKien, hinhThucThanhToan, ghiChu }
   * @param {Object} sessionUser Nhân viên bán hàng
   */
  async chuyenHoaDon(id, payload = {}, sessionUser = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã đơn đặt hàng trước không hợp lệ', 400);
    }

    const don = await DonDatHangTruoc.findById(id).populate('khachHang sanPham');
    if (!don) {
      throw this.createError('Không tìm thấy đơn đặt hàng trước', 404);
    }

    if (don.trangThai === 'Da huy') {
      throw this.createError('Đơn đặt hàng trước đã bị hủy, không thể xuất bán', 400);
    }

    if (don.trangThai === 'Da nhan hang' || don.trangThai === 'Da nhan may') {
      throw this.createError('Đơn đặt hàng trước đã được xuất hóa đơn nhận máy trước đó', 400);
    }

    const selectedImei = payload.imei || don.imei;
    if (!selectedImei) {
      throw this.createError('Vui lòng chọn hoặc nhập số IMEI máy xuất cho khách', 400);
    }

    const HoaDonService = require('./HoaDonService');

    const orderPayload = {
      khachHang: don.khachHang._id,
      nhanVien: sessionUser ? (sessionUser._id || sessionUser.id) : undefined,
      danhSachIMEI: [selectedImei],
      danhSachPhuKien: payload.danhSachPhuKien || [],
      donDatHangId: don._id,
      hinhThucThanhToan: payload.hinhThucThanhToan || 'Da thanh toan',
      ghiChu: payload.ghiChu || `Xuất máy theo đơn đặt trước #${don._id}`
    };

    const result = await HoaDonService.taoHoaDonBanHang(orderPayload, sessionUser);

    don.trangThai = 'Da nhan hang';
    don.imei = selectedImei;
    await don.save();

    const updatedDetail = await this.getDatTruocDetail(don._id);

    return {
      hoaDon: result.hoaDon,
      phieuXuatKho: result.phieuXuatKho,
      donDatHang: updatedDetail.donDatHang,
      tienCocDaTru: result.hoaDon.tienCocDaTru || 0,
      soTienThanhToan: result.hoaDon.soTienThanhToan || result.hoaDon.tongTien
    };
  }
}

module.exports = new DatTruocService();
