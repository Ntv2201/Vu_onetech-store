const mongoose = require('mongoose');
const BaseService = require('./BaseService');
const ThanhToanService = require('./ThanhToanService');
const {
  PhieuDoiTra,
  HoaDon,
  CT_HoaDon_May,
  MayImei,
  KhachHang,
  PhieuThu,
  PhieuChi,
  PhuKien
} = require('../models');

/**
 * DoiTraService - Phân hệ Đổi Trả Máy & Hoàn Tiền Chênh Lệch
 * Module Thành viên 6: Tô Quốc Việt (Tuần 4 - 5)
 */
class DoiTraService extends BaseService {
  constructor() {
    super(PhieuDoiTra);
  }

  /**
   * Kiểm tra điều kiện đổi trả của một chiếc máy theo Hóa đơn
   * @param {String} soHD Số hóa đơn hoặc ID hóa đơn
   * @param {String} imei Số IMEI máy cũ cần kiểm tra
   */
  async kiemTraDieuKienDoiTra(soHD, imei) {
    if (!soHD || !imei) {
      throw this.createError('Vui lòng cung cấp đầy đủ số hóa đơn và số IMEI cần kiểm tra', 400);
    }

    const cleanImei = String(imei).trim();
    const cleanSoHD = String(soHD).trim();

    // 1. Tìm Hóa đơn
    let hoaDonDoc;
    if (mongoose.Types.ObjectId.isValid(cleanSoHD)) {
      hoaDonDoc = await HoaDon.findById(cleanSoHD).populate('khachHang nhanVien');
    } else {
      hoaDonDoc = await HoaDon.findOne({ soHD: cleanSoHD }).populate('khachHang nhanVien');
    }

    if (!hoaDonDoc) {
      throw this.createError(`Không tìm thấy hóa đơn "${cleanSoHD}" trong hệ thống`, 404);
    }

    if (hoaDonDoc.trangThai === 'Da huy') {
      throw this.createError(`Hóa đơn ${hoaDonDoc.soHD} đã bị hủy, không thể thực hiện đổi trả`, 400);
    }

    // 2. Kiểm tra thời hạn đổi trả (Quy định: tối đa 30 ngày kể từ ngày mua)
    const ngayMua = new Date(hoaDonDoc.ngayLap || hoaDonDoc.createdAt);
    const diffTime = Date.now() - ngayMua.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      const formattedDate = ngayMua.toLocaleDateString('vi-VN');
      throw this.createError(`Hóa đơn mua ngày ${formattedDate} đã quá thời hạn đổi trả cho phép (Đã mua ${Math.floor(diffDays)} ngày, tối đa 30 ngày)`, 400);
    }

    // 3. Kiểm tra số IMEI có nằm trong chi tiết hóa đơn không
    const ctHoaDonMay = await CT_HoaDon_May.findOne({
      hoaDon: hoaDonDoc._id,
      imei: cleanImei
    });

    if (!ctHoaDonMay) {
      throw this.createError(`Số IMEI "${cleanImei}" không thuộc danh sách sản phẩm của hóa đơn ${hoaDonDoc.soHD}`, 400);
    }

    // 4. Kiểm tra máy đã từng được đổi trả trước đó hay chưa (loại trừ các phiếu đã bị hủy hoặc từ chối)
    const existingDoiTra = await PhieuDoiTra.findOne({
      $or: [{ imeiCu: cleanImei }, { imei: cleanImei }],
      trangThai: { $nin: ['Tu choi', 'Da huy'] }
    });

    if (existingDoiTra) {
      throw this.createError(`Máy IMEI "${cleanImei}" đã được lập phiếu đổi trả trước đó (#${existingDoiTra.maDT || existingDoiTra._id})`, 400);
    }

    // 5. Lấy thông tin chi tiết máy cũ
    const mayCuDoc = await MayImei.findOne({ imei: cleanImei }).populate('sanPham');
    const giaMayCu = ctHoaDonMay.donGiaBan || (mayCuDoc && mayCuDoc.sanPham ? mayCuDoc.sanPham.giaBan : 0);

    return {
      hopLe: true,
      hoaDon: hoaDonDoc,
      ctHoaDonMay,
      mayCu: mayCuDoc,
      giaMayCu,
      soNgayDaMua: Math.max(0, Math.floor(diffDays)),
      thoiHanConLai: Math.max(0, 30 - Math.floor(diffDays))
    };
  }

  /**
   * Tạo Phiếu Đổi Trả Máy & Tự động sinh Phiếu Thu / Chi chênh lệch tiền
   * Hỗ trợ đổi máy kèm phụ kiện phát sinh (Tuần 5)
   * @param {Object} payload { soHD, imeiCu, imeiMoi, loaiDoiTra, danhSachPhuKien, lyDo, hinhThuc, ghiChu }
   * @param {Object} sessionUser Nhân viên thực hiện
   */
  async taoPhieuDoiTra(payload = {}, sessionUser = null) {
    const {
      soHD,
      imeiCu,
      imeiMoi,
      loaiDoiTra,
      danhSachPhuKien = [],
      lyDo,
      hinhThuc = 'Tien mat',
      ghiChu = ''
    } = payload;

    if (!soHD) {
      throw this.createError('Vui lòng cung cấp số hóa đơn mua hàng', 400);
    }
    if (!imeiCu) {
      throw this.createError('Vui lòng cung cấp số IMEI máy cũ cần đổi/trả', 400);
    }
    if (!lyDo || !lyDo.trim()) {
      throw this.createError('Vui lòng nhập lý do đổi trả hàng', 400);
    }

    const cleanImeiCu = String(imeiCu).trim();
    const cleanImeiMoi = imeiMoi ? String(imeiMoi).trim() : '';

    // 1. Kiểm tra điều kiện đổi trả
    const checkResult = await this.kiemTraDieuKienDoiTra(soHD, cleanImeiCu);
    const { hoaDon, mayCu, giaMayCu } = checkResult;

    // 2. Xác định loại đổi trả (Đổi máy hoặc Trả hàng)
    let loai = loaiDoiTra;
    if (!loai) {
      loai = cleanImeiMoi ? 'Doi may' : 'Tra hang';
    }

    let giaMayMoi = 0;
    let mayMoiDoc = null;

    if (loai === 'Doi may') {
      if (!cleanImeiMoi) {
        throw this.createError('Vui lòng chọn số IMEI máy mới cần đổi', 400);
      }
      if (cleanImeiMoi === cleanImeiCu) {
        throw this.createError('Số IMEI máy mới không được trùng với số IMEI máy cũ', 400);
      }

      // 3. Kiểm tra máy mới trong kho
      mayMoiDoc = await MayImei.findOne({ imei: cleanImeiMoi }).populate('sanPham');
      if (!mayMoiDoc) {
        throw this.createError(`Không tìm thấy máy mới có IMEI "${cleanImeiMoi}" trong kho`, 404);
      }
      if (mayMoiDoc.trangThai !== 'Con hang') {
        throw this.createError(`Máy mới IMEI "${cleanImeiMoi}" không thể đổi vì đang ở trạng thái "${mayMoiDoc.trangThai}" (Yêu cầu: "Con hang")`, 409);
      }

      giaMayMoi = mayMoiDoc.sanPham ? mayMoiDoc.sanPham.giaBan : (mayMoiDoc.giaNhap ? Math.round(mayMoiDoc.giaNhap * 1.15) : giaMayCu);

      // 4. Khóa nguyên tử cập nhật trạng thái máy mới -> 'Da ban'
      const lockNew = await MayImei.updateOne(
        { imei: cleanImeiMoi, trangThai: 'Con hang' },
        { $set: { trangThai: 'Da ban' } }
      );
      if (lockNew.modifiedCount === 0) {
        throw this.createError(`Máy mới IMEI "${cleanImeiMoi}" vừa được giao dịch ở phiên khác. Vui lòng chọn máy khác`, 409);
      }

      // 5. Cập nhật máy cũ -> 'Loi'
      await MayImei.updateOne(
        { imei: cleanImeiCu },
        { $set: { trangThai: 'Loi' } }
      );
    } else {
      // Nghiệp vụ Trả hàng hoàn tiền 100%
      loai = 'Tra hang';
      giaMayMoi = 0;

      // Cập nhật máy cũ -> 'Loi'
      await MayImei.updateOne(
        { imei: cleanImeiCu },
        { $set: { trangThai: 'Loi' } }
      );
    }

    // 6. Xử lý danh sách phụ kiện kèm theo (nếu có - Tuần 5 Edge Case)
    let formattedPhuKien = [];
    let tongTienPhuKien = 0;

    if (Array.isArray(danhSachPhuKien) && danhSachPhuKien.length > 0) {
      for (const item of danhSachPhuKien) {
        const pkId = item.phuKien || item._id || item.id;
        const qty = Number(item.soLuong) || 1;
        if (qty <= 0) continue;

        const pkDoc = await PhuKien.findById(pkId);
        if (!pkDoc) {
          throw this.createError(`Không tìm thấy phụ kiện ID ${pkId}`, 404);
        }
        if (pkDoc.soLuongTon < qty) {
          throw this.createError(`Phụ kiện "${pkDoc.tenPK}" không đủ tồn kho (Còn ${pkDoc.soLuongTon}, yêu cầu ${qty})`, 400);
        }

        const donGia = Number(item.donGia) !== undefined && !isNaN(Number(item.donGia)) ? Number(item.donGia) : pkDoc.giaBan;
        formattedPhuKien.push({
          phuKien: pkDoc._id,
          soLuong: qty,
          donGia
        });

        tongTienPhuKien += donGia * qty;

        // Trừ tồn kho phụ kiện
        await PhuKien.updateOne(
          { _id: pkDoc._id, soLuongTon: { $gte: qty } },
          { $inc: { soLuongTon: -qty } }
        );
      }
    }

    // 7. Tính tổng tiền chênh lệch
    let tienChenhLech = 0;
    if (loai === 'Doi may') {
      tienChenhLech = (giaMayMoi + tongTienPhuKien) - giaMayCu;
    } else {
      tienChenhLech = -giaMayCu;
    }

    let phieuThu = null;
    let phieuChi = null;

    if (tienChenhLech > 0) {
      // Khách cần trả thêm tiền chênh lệch -> Sinh Phiếu Thu
      phieuThu = await ThanhToanService.taoPhieuThu({
        hoaDon: hoaDon._id,
        soTien: tienChenhLech,
        hinhThuc,
        ghiChu: `Thu chênh lệch đổi máy ${cleanImeiCu} -> ${cleanImeiMoi || 'máy mới'}${tongTienPhuKien > 0 ? ` (kèm phụ kiện ${tongTienPhuKien.toLocaleString('vi-VN')} đ)` : ''} theo HĐ ${hoaDon.soHD}`,
        sessionUser
      });
    } else if (tienChenhLech < 0) {
      // Cửa hàng hoàn tiền cho khách -> Sinh Phiếu Chi
      const refundAmount = Math.abs(tienChenhLech);
      phieuChi = await ThanhToanService.taoPhieuChi({
        maDT: hoaDon.khachHang ? hoaDon.khachHang.hoTen : 'Khách hàng',
        soTien: refundAmount,
        hinhThuc,
        lyDo: loai === 'Tra hang'
          ? `Hoàn tiền 100% trả máy ${cleanImeiCu} theo HĐ ${hoaDon.soHD}. Lý do: ${lyDo}`
          : `Hoàn tiền chênh lệch đổi máy ${cleanImeiCu} -> ${cleanImeiMoi} theo HĐ ${hoaDon.soHD}`,
        sessionUser
      });
    }

    // 8. Tạo bản ghi PhieuDoiTra
    const phieuDoiTra = await PhieuDoiTra.create({
      hoaDon: hoaDon._id,
      khachHang: hoaDon.khachHang ? hoaDon.khachHang._id : undefined,
      nhanVien: sessionUser ? (sessionUser._id || sessionUser.id) : undefined,
      imeiCu: cleanImeiCu,
      imei: cleanImeiCu,
      imeiMoi: cleanImeiMoi || undefined,
      loaiDoiTra: loai,
      giaMayCu,
      giaMayMoi,
      danhSachPhuKien: formattedPhuKien,
      tongTienPhuKien,
      tienChenhLech,
      phieuThu: phieuThu ? phieuThu._id : null,
      phieuChi: phieuChi ? phieuChi._id : null,
      hinhThuc,
      lyDo: lyDo.trim(),
      trangThai: 'Hoan tat',
      ghiChu: ghiChu.trim()
    });

    // 9. Cập nhật liên kết ngược vào phiếu thu/chi
    if (phieuThu) {
      await PhieuThu.updateOne({ _id: phieuThu._id }, { $set: { phieuDoiTra: phieuDoiTra._id } });
    }
    if (phieuChi) {
      await PhieuChi.updateOne({ _id: phieuChi._id }, { $set: { phieuDoiTra: phieuDoiTra._id } });
    }

    return await this.getDoiTraDetail(phieuDoiTra._id);
  }

  /**
   * Hủy / Thu hồi Phiếu Đổi Trả (Dành riêng cho Quản lý - Tuần 5 Edge Case)
   * Khôi phục trạng thái 2 máy và hoàn tác tài chính vào Sổ Quỹ
   * @param {String} id ID phiếu đổi trả
   * @param {Object} payload { lyDoHuy }
   * @param {Object} sessionUser Quản lý thực hiện
   */
  async huyPhieuDoiTra(id, payload = {}, sessionUser = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã phiếu đổi trả không hợp lệ', 400);
    }

    const phieu = await PhieuDoiTra.findById(id).populate('phieuThu phieuChi');
    if (!phieu) {
      throw this.createError('Không tìm thấy phiếu đổi trả yêu cầu', 404);
    }

    if (phieu.trangThai === 'Da huy') {
      throw this.createError('Phiếu đổi trả này đã bị hủy trước đó', 400);
    }

    const lyDoHuy = payload.lyDoHuy ? String(payload.lyDoHuy).trim() : 'Quản lý thu hồi / hủy phiếu đổi trả';

    // 1. Khôi phục máy cũ: 'Loi' -> 'Da ban'
    await MayImei.updateOne(
      { imei: phieu.imeiCu },
      { $set: { trangThai: 'Da ban' } }
    );

    // 2. Khôi phục máy mới (nếu có): 'Da ban' -> 'Con hang'
    if (phieu.imeiMoi) {
      await MayImei.updateOne(
        { imei: phieu.imeiMoi },
        { $set: { trangThai: 'Con hang' } }
      );
    }

    // 3. Hoàn trả tồn kho phụ kiện (nếu có)
    if (Array.isArray(phieu.danhSachPhuKien) && phieu.danhSachPhuKien.length > 0) {
      for (const item of phieu.danhSachPhuKien) {
        if (item.phuKien && item.soLuong > 0) {
          await PhuKien.updateOne(
            { _id: item.phuKien },
            { $inc: { soLuongTon: item.soLuong } }
          );
        }
      }
    }

    // 4. Đảo ngược giao dịch tài chính
    let phieuChiDaoNguoc = null;
    let phieuThuDaoNguoc = null;

    if (phieu.phieuThu && phieu.phieuThu.soTien > 0) {
      // Trước đó đã thu thêm tiền -> Nay hoàn lại tiền cho khách qua Phiếu Chi
      phieuChiDaoNguoc = await ThanhToanService.taoPhieuChi({
        maDT: phieu.khachHang ? String(phieu.khachHang) : 'Khách hàng',
        soTien: phieu.phieuThu.soTien,
        hinhThuc: phieu.hinhThuc || 'Tien mat',
        lyDo: `Hoàn tiền do Quản lý hủy phiếu đổi trả ${phieu.maDT || phieu._id}. Lý do: ${lyDoHuy}`,
        sessionUser
      });
    } else if (phieu.phieuChi && phieu.phieuChi.soTien > 0) {
      // Trước đó đã chi tiền hoàn cho khách -> Nay thu lại tiền qua Phiếu Thu
      phieuThuDaoNguoc = await ThanhToanService.taoPhieuThu({
        hoaDon: phieu.hoaDon,
        soTien: phieu.phieuChi.soTien,
        hinhThuc: phieu.hinhThuc || 'Tien mat',
        ghiChu: `Thu hồi tiền chi do Quản lý hủy phiếu đổi trả ${phieu.maDT || phieu._id}. Lý do: ${lyDoHuy}`,
        sessionUser
      });
    }

    // 5. Cập nhật trạng thái phiếu đổi trả -> 'Da huy'
    phieu.trangThai = 'Da huy';
    phieu.lyDoHuy = lyDoHuy;
    phieu.ngayHuy = new Date();
    phieu.nguoiHuy = sessionUser ? (sessionUser._id || sessionUser.id) : null;
    phieu.phieuThuDaoNguoc = phieuThuDaoNguoc ? phieuThuDaoNguoc._id : null;
    phieu.phieuChiDaoNguoc = phieuChiDaoNguoc ? phieuChiDaoNguoc._id : null;
    await phieu.save();

    return await this.getDoiTraDetail(phieu._id);
  }

  /**
   * Lấy danh sách phiếu đổi trả có bộ lọc, tìm kiếm và phân trang
   * @param {Object} query { soHD, imei, loaiDoiTra, trangThai, tuNgay, denNgay, page, limit, search }
   */
  async getDoiTraList(query = {}) {
    const filter = {};

    if (query.loaiDoiTra && query.loaiDoiTra !== 'All') {
      filter.loaiDoiTra = query.loaiDoiTra;
    }

    if (query.trangThai && query.trangThai !== 'All') {
      filter.trangThai = query.trangThai;
    }

    if (query.imei) {
      const cleanImei = query.imei.trim();
      filter.$or = [
        { imeiCu: cleanImei },
        { imeiMoi: cleanImei },
        { imei: cleanImei }
      ];
    }

    if (query.tuNgay || query.denNgay) {
      filter.ngayDoiTra = {};
      if (query.tuNgay) {
        const d = new Date(query.tuNgay);
        d.setHours(0, 0, 0, 0);
        filter.ngayDoiTra.$gte = d;
      }
      if (query.denNgay) {
        const d = new Date(query.denNgay);
        d.setHours(23, 59, 59, 999);
        filter.ngayDoiTra.$lte = d;
      }
    }

    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { maDT: { $regex: s, $options: 'i' } },
        { imeiCu: { $regex: s, $options: 'i' } },
        { imeiMoi: { $regex: s, $options: 'i' } },
        { lyDo: { $regex: s, $options: 'i' } },
        { ghiChu: { $regex: s, $options: 'i' } }
      ];
    }

    const { page, limit, skip } = this.getPaginationOptions(query);

    const [danhSach, total] = await Promise.all([
      PhieuDoiTra.find(filter)
        .populate('hoaDon')
        .populate('khachHang')
        .populate('nhanVien')
        .populate('phieuThu')
        .populate('phieuChi')
        .populate('phieuThuDaoNguoc')
        .populate('phieuChiDaoNguoc')
        .populate('danhSachPhuKien.phuKien')
        .sort({ ngayDoiTra: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PhieuDoiTra.countDocuments(filter)
    ]);

    return {
      danhSach,
      phieuDoiTras: danhSach,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Lấy chi tiết 1 phiếu đổi trả kèm thông tin hóa đơn, máy, phụ kiện và phiếu thu/chi
   * @param {String} id ID phiếu đổi trả
   */
  async getDoiTraDetail(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã phiếu đổi trả không hợp lệ', 400);
    }

    const phieu = await PhieuDoiTra.findById(id)
      .populate({
        path: 'hoaDon',
        populate: [{ path: 'khachHang' }, { path: 'nhanVien' }]
      })
      .populate('khachHang')
      .populate('nhanVien')
      .populate('nguoiHuy')
      .populate('phieuThu')
      .populate('phieuChi')
      .populate('phieuThuDaoNguoc')
      .populate('phieuChiDaoNguoc')
      .populate('danhSachPhuKien.phuKien');

    if (!phieu) {
      throw this.createError('Không tìm thấy phiếu đổi trả yêu cầu', 404);
    }

    // Populate thông tin máy cũ và máy mới
    const [mayCu, mayMoi] = await Promise.all([
      MayImei.findOne({ imei: phieu.imeiCu }).populate('sanPham'),
      phieu.imeiMoi ? MayImei.findOne({ imei: phieu.imeiMoi }).populate('sanPham') : null
    ]);

    return {
      phieuDoiTra: phieu,
      mayCu,
      mayMoi,
      hoaDon: phieu.hoaDon,
      phieuThu: phieu.phieuThu,
      phieuChi: phieu.phieuChi,
      phieuThuDaoNguoc: phieu.phieuThuDaoNguoc,
      phieuChiDaoNguoc: phieu.phieuChiDaoNguoc,
      danhSachPhuKien: phieu.danhSachPhuKien
    };
  }

  /**
   * Tra cứu toàn bộ lịch sử đổi trả của một số IMEI
   * @param {String} imei Số IMEI cần tra cứu
   */
  async getLichSuImei(imei) {
    if (!imei || !imei.trim()) {
      throw this.createError('Vui lòng cung cấp số IMEI cần tra cứu', 400);
    }

    const cleanImei = imei.trim();
    const history = await PhieuDoiTra.find({
      $or: [
        { imeiCu: cleanImei },
        { imeiMoi: cleanImei },
        { imei: cleanImei }
      ]
    })
      .populate('hoaDon')
      .populate('khachHang')
      .populate('nhanVien')
      .populate('phieuThu')
      .populate('phieuChi')
      .sort({ ngayDoiTra: -1 });

    const mayInfo = await MayImei.findOne({ imei: cleanImei }).populate('sanPham');

    return {
      imei: cleanImei,
      mayInfo,
      soLanDoiTra: history.length,
      lichSu: history
    };
  }
}

module.exports = new DoiTraService();
