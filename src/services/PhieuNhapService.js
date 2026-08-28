const mongoose = require('mongoose');
const BaseService = require('./BaseService');
const { PhieuNhap, CT_PhieuNhap, MayImei, PhuKien, CongNo } = require('../models');
const TonKhoService = require('./TonKhoService');
const ThanhToanService = require('./ThanhToanService');

class PhieuNhapService extends BaseService {
  constructor() {
    super(PhieuNhap);
  }

  /**
   * Tạo phiếu nhập kho và xử lý nghiệp vụ liên quan
   * @param {Object} payload 
   */
  async taoPhieuNhap(payload = {}) {
    const { 
      maNCC, 
      maNV, 
      danhSachMay = [], 
      danhSachPhuKien = [], 
      hinhThucThanhToan = 'Tien mat', 
      ghiChu = '' 
    } = payload;

    if (!maNCC || !maNV) {
      throw this.createError('Thiếu thông tin Nhà Cung Cấp hoặc Nhân Viên lập phiếu', 400);
    }
    if (danhSachMay.length === 0 && danhSachPhuKien.length === 0) {
      throw this.createError('Phiếu nhập phải có ít nhất 1 máy hoặc 1 phụ kiện', 400);
    }

    // 1. Kiểm tra trùng lặp IMEI
    const listImeis = danhSachMay.map(item => (item.imei || '').trim()).filter(Boolean);
    if (listImeis.length > 0) {
      // Kiểm tra trùng IMEI ngay trong payload
      const uniqueImeis = new Set(listImeis);
      if (uniqueImeis.size !== listImeis.length) {
        throw this.createError('Phát hiện IMEI trùng lặp trong danh sách nhập', 400);
      }

      const existingImeis = await MayImei.find({ imei: { $in: listImeis } }).select('imei');
      if (existingImeis.length > 0) {
        const duplicateList = existingImeis.map(m => m.imei);
        throw this.createError('Phát hiện IMEI đã tồn tại trong hệ thống', 409, { existingImeis: duplicateList });
      }
    }

    // 2. Tính tổng tiền phiếu nhập
    let tongTien = 0;
    danhSachMay.forEach(item => { tongTien += Number(item.giaNhap) || 0; });
    danhSachPhuKien.forEach(item => { tongTien += (Number(item.giaNhap) * Number(item.soLuong)) || 0; });

    // 3. Tạo phiếu nhập
    const phieuNhap = await PhieuNhap.create({
      nhaCungCap: maNCC,
      nhanVien: maNV,
      tongTien,
      ghiChu
    });

    // 4. Xử lý danhSachMay (Tạo máy IMEI & CT_PhieuNhap)
    if (danhSachMay.length > 0) {
      const newImeis = danhSachMay.map(item => ({
        imei: item.imei.trim(),
        sanPham: item.maSP,
        giaNhap: Number(item.giaNhap),
        mauSac: item.mauSac || '',
        dungLuong: item.dungLuong || '',
        trangThai: 'Con hang'
      }));
      
      // Bulk insert MayImei
      await MayImei.insertMany(newImeis);

      const newCTPhieuNhaps = danhSachMay.map(item => ({
        phieuNhap: phieuNhap._id,
        imei: item.imei.trim(),
        sanPham: item.maSP,
        donGiaNhap: Number(item.giaNhap)
      }));

      // Bulk insert CT_PhieuNhap
      await CT_PhieuNhap.insertMany(newCTPhieuNhaps);

      // Cập nhật tồn kho qua TonKhoService (An's task)
      for (const item of danhSachMay) {
        await TonKhoService.capNhatTonKho(item.maSP, null, 1); 
      }
    }

    // 5. Xử lý danhSachPhuKien
    if (danhSachPhuKien.length > 0) {
      for (const item of danhSachPhuKien) {
        const pk = await PhuKien.findById(item.maPK);
        if (!pk) {
          throw this.createError(`Không tìm thấy phụ kiện với mã ${item.maPK}`, 404);
        }
        pk.soLuongTon += Number(item.soLuong);
        await pk.save();
      }
    }

    // 6. Xử lý thanh toán
    if (hinhThucThanhToan === 'Ghi no') {
      // Tìm công nợ NCC hiện tại hoặc tạo mới
      let congNo = await CongNo.findOne({ loaiDoiTuong: 'NhaCungCap', nhaCungCap: maNCC, trangThai: { $in: ['Con no', 'Qua han'] } });
      if (!congNo) {
        congNo = new CongNo({
          loaiDoiTuong: 'NhaCungCap',
          nhaCungCap: maNCC,
          phieuNhap: phieuNhap._id,
          soTienNo: tongTien,
          soTienDaTra: 0,
          trangThai: 'Con no'
        });
      } else {
        congNo.soTienNo += tongTien;
        congNo.trangThai = 'Con no';
      }
      await congNo.save();
    } else {
      // Trả ngay (Tien mat, Chuyen khoan, Quet the) -> Gọi ThanhToanService tạo Phiếu Chi
      await ThanhToanService.taoPhieuChi({
        phieuNhap: phieuNhap._id,
        maDT: maNCC.toString(),
        soTien: tongTien,
        hinhThuc: hinhThucThanhToan,
        lyDo: 'Thanh toán tiền nhập hàng phiếu ' + (phieuNhap.maPN || phieuNhap._id)
      });
    }

    return phieuNhap;
  }

  /**
   * Lấy danh sách phiếu nhập
   */
  async getDanhSachPhieuNhap(query = {}) {
    const filter = {};
    if (query.nhaCungCap) filter.nhaCungCap = query.nhaCungCap;
    if (query.nhanVien) filter.nhanVien = query.nhanVien;

    if (query.tuNgay || query.denNgay) {
      filter.ngayNhap = {};
      if (query.tuNgay) {
        const d = new Date(query.tuNgay);
        d.setHours(0, 0, 0, 0);
        filter.ngayNhap.$gte = d;
      }
      if (query.denNgay) {
        const d = new Date(query.denNgay);
        d.setHours(23, 59, 59, 999);
        filter.ngayNhap.$lte = d;
      }
    }

    const { page, limit, skip } = this.getPaginationOptions(query);
    const [list, total] = await Promise.all([
      PhieuNhap.find(filter)
        .populate('nhaCungCap', 'tenNCC sdt diaChi')
        .populate('nhanVien', 'hoTen tenDangNhap vaiTro')
        .sort({ ngayNhap: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PhieuNhap.countDocuments(filter)
    ]);

    return { list, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Lấy chi tiết phiếu nhập
   */
  async getChiTietPhieuNhap(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('Mã phiếu nhập không hợp lệ', 400);
    }

    const phieuNhap = await PhieuNhap.findById(id)
      .populate('nhaCungCap', 'tenNCC dienThoai diaChi')
      .populate('nhanVien', 'hoTen tenDangNhap vaiTro');
      
    if (!phieuNhap) {
      throw this.createError('Không tìm thấy phiếu nhập', 404);
    }

    const chiTiet = await CT_PhieuNhap.find({ phieuNhap: id }).populate('sanPham', 'tenMay hang giaBan');

    return { phieuNhap, chiTiet };
  }

  /**
   * Nhập hàng loạt nhiều IMEI từ chuỗi văn bản
   */
  async importHangLoat(payload = {}) {
    const { 
      maNCC, 
      maNV, 
      maSP, 
      imeiListText = '', 
      giaNhap,
      mauSac = '',
      dungLuong = '',
      hinhThucThanhToan = 'Tien mat', 
      ghiChu = ''
    } = payload;

    if (!imeiListText || typeof imeiListText !== 'string') {
      throw this.createError('Vui lòng cung cấp danh sách IMEI', 400);
    }

    // Parse IMEI list (hỗ trợ dấu phẩy, khoảng trắng, xuống dòng)
    const parsedImeis = imeiListText
      .split(/[,\s\n]+/)
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (parsedImeis.length === 0) {
      throw this.createError('Không tìm thấy IMEI nào hợp lệ trong danh sách', 400);
    }

    // Map to danhSachMay
    const danhSachMay = parsedImeis.map(imei => ({
      maSP,
      imei,
      giaNhap: Number(giaNhap),
      mauSac,
      dungLuong
    }));

    // Tái sử dụng nghiệp vụ taoPhieuNhap
    const phieuNhapPayload = {
      maNCC,
      maNV,
      danhSachMay,
      danhSachPhuKien: [],
      hinhThucThanhToan,
      ghiChu: ghiChu || `Nhập kho hàng loạt ${parsedImeis.length} máy`
    };

    return await this.taoPhieuNhap(phieuNhapPayload);
  }

  /**
   * Trả hàng cho Nhà Cung Cấp (Tình huống biên)
   * Điều kiện: IMEI phải ở trạng thái 'Con hang' hoặc 'Loi'
   * Kết quả: IMEI -> 'Tra NCC', trừ tồn kho, cấn trừ/hoàn tất công nợ
   */
  async traHangNhaCungCap(payload = {}) {
    const { imeiList = [], maNCC, lyDo = '' } = payload;

    if (!maNCC) throw this.createError('Thiếu mã Nhà cung cấp', 400);
    if (!imeiList || imeiList.length === 0) throw this.createError('Danh sách IMEI trả hàng không được trống', 400);

    // 1. Tìm các bản ghi máy theo IMEI
    const imeis = await MayImei.find({ imei: { $in: imeiList } }).lean();
    if (imeis.length !== imeiList.length) {
      throw this.createError('Một số IMEI không tồn tại trong hệ thống', 404);
    }

    // 2. Kiểm tra trạng thái — chỉ cho phép trả máy 'Con hang' hoặc 'Loi'
    for (const m of imeis) {
      if (m.trangThai !== 'Con hang' && m.trangThai !== 'Loi') {
        throw this.createError(`IMEI ${m.imei} đang ở trạng thái '${m.trangThai}', không thể trả hàng`, 400);
      }
    }

    // 3. Kiểm tra NCC và lấy giá nhập gốc từ CT_PhieuNhap
    const ctPhieuNhaps = await CT_PhieuNhap.find({ imei: { $in: imeiList } })
      .populate('phieuNhap', 'nhaCungCap')
      .lean();

    if (ctPhieuNhaps.length !== imeiList.length) {
      throw this.createError('Không tìm thấy thông tin nhập kho gốc của một số IMEI', 404);
    }

    let tongTienTra = 0;
    for (const ct of ctPhieuNhaps) {
      if (!ct.phieuNhap || ct.phieuNhap.nhaCungCap.toString() !== maNCC.toString()) {
        throw this.createError(`IMEI ${ct.imei} không thuộc Nhà cung cấp này`, 400);
      }
      tongTienTra += (ct.donGiaNhap || 0);
    }

    // 4. Atomic update: đổi trạng thái IMEI sang 'Tra NCC'
    await MayImei.updateMany(
      { imei: { $in: imeiList }, trangThai: { $in: ['Con hang', 'Loi'] } },
      { $set: { trangThai: 'Tra NCC' } }
    );

    // 5. Trừ tồn kho cho từng máy
    for (const m of imeis) {
      await TonKhoService.capNhatTonKho(m.sanPham, null, -1);
    }

    // 6. Xử lý tài chính: cấn trừ công nợ hoặc lập phiếu thu hoàn tiền
    const danhSachCongNo = await CongNo.find({ loaiDoiTuong: 'NhaCungCap', nhaCungCap: maNCC });
    let tongDuNo = danhSachCongNo.reduce((sum, cn) => sum + Math.max(0, (cn.soTienNo || 0) - (cn.soTienDaTra || 0)), 0);

    if (tongDuNo > 0) {
      let conLaiCan = tongTienTra;
      // Cấn trừ lần lượt qua từng khoản công nợ
      for (const congNo of danhSachCongNo) {
        if (conLaiCan <= 0) break;
        const duNoKhoan = Math.max(0, (congNo.soTienNo || 0) - (congNo.soTienDaTra || 0));
        if (duNoKhoan <= 0) continue;

        const canTru = Math.min(conLaiCan, duNoKhoan);
        congNo.soTienDaTra = (congNo.soTienDaTra || 0) + canTru;
        if (congNo.soTienDaTra >= congNo.soTienNo) {
          congNo.trangThai = 'Da tra het';
        }
        await congNo.save();
        conLaiCan -= canTru;
      }

      // Nếu còn dư sau khi cấn trừ hết nợ, lập phiếu thu hoàn tiền
      if (conLaiCan > 0) {
        await ThanhToanService.taoPhieuThu({
          soTien: conLaiCan,
          hinhThuc: 'Tien mat',
          ghiChu: lyDo || `Nhận hoàn tiền trả hàng NCC (phần dư sau cấn trừ nợ)`
        });
      }
    } else {
      // NCC không có nợ, hoàn tiền thẳng
      await ThanhToanService.taoPhieuThu({
        soTien: tongTienTra,
        hinhThuc: 'Tien mat',
        ghiChu: lyDo || `Nhận hoàn tiền trả hàng NCC`
      });
    }

    return { success: true, tongTienTra, soLuongTra: imeiList.length };
  }
}

module.exports = new PhieuNhapService();

