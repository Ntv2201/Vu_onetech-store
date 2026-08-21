const mongoose = require('mongoose');
const BaseService = require('./BaseService');
const {
  PhieuBaoHanh,
  CT_PBH_LinhKien,
  LinhKien,
  MayImei,
  SanPham,
  CT_HoaDon_May,
  HoaDon,
  KhachHang
} = require('../models');

class BaoHanhService extends BaseService {
  constructor() {
    super(PhieuBaoHanh);
  }

  /**
   * Định dạng ngày dd/mm/yyyy
   */
  formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Tính ngày hết hạn bảo hành dựa trên ngày bán và số tháng bảo hành
   */
  tinhHanBaoHanh(ngayBan, soThangBH = 12) {
    if (!ngayBan) return null;
    const han = new Date(ngayBan);
    han.setMonth(han.getMonth() + (Number(soThangBH) || 12));
    return han;
  }

  /**
   * Lấy danh sách phiếu bảo hành (hỗ trợ filter trạng thái, IMEI, ngày)
   */
  async getPhieuBaoHanhList(query = {}) {
    const { trangThai, imei, search, tuNgay, denNgay } = query;
    const filter = {};

    if (trangThai) {
      filter.trangThai = trangThai;
    }

    if (imei && imei.trim()) {
      filter.imei = { $regex: imei.trim(), $options: 'i' };
    } else if (search && search.trim()) {
      filter.$or = [
        { maPBH: { $regex: search.trim(), $options: 'i' } },
        { imei: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (tuNgay || denNgay) {
      filter.ngayTiepNhan = {};
      if (tuNgay) filter.ngayTiepNhan.$gte = new Date(tuNgay + 'T00:00:00.000Z');
      if (denNgay) filter.ngayTiepNhan.$lte = new Date(denNgay + 'T23:59:59.999Z');
    }

    const { page, limit, skip } = this.getPaginationOptions(query);

    const [phieuBaoHanhs, total] = await Promise.all([
      PhieuBaoHanh.find(filter)
        .populate('khachHang', 'hoTen sdt diaChi')
        .populate('nhanVien', 'hoTen vaiTro tenDangNhap')
        .sort({ ngayTiepNhan: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PhieuBaoHanh.countDocuments(filter)
    ]);

    return {
      phieuBaoHanhs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Lấy chi tiết 1 phiếu bảo hành và danh sách linh kiện đã thay thế
   */
  async getPhieuBaoHanhDetail(id) {
    let pbh;
    if (mongoose.Types.ObjectId.isValid(id)) {
      pbh = await PhieuBaoHanh.findById(id)
        .populate('khachHang', 'hoTen sdt diaChi email')
        .populate('nhanVien', 'hoTen vaiTro tenDangNhap');
    } else {
      pbh = await PhieuBaoHanh.findOne({ maPBH: id })
        .populate('khachHang', 'hoTen sdt diaChi email')
        .populate('nhanVien', 'hoTen vaiTro tenDangNhap');
    }

    if (!pbh) {
      throw this.createError('Không tìm thấy phiếu bảo hành', 404);
    }

    // Lấy thông tin máy IMEI
    const mayImei = await MayImei.findOne({ imei: pbh.imei }).populate('sanPham');

    // Lấy danh sách linh kiện đã xuất cho phiếu bảo hành này
    const danhSachLinhKien = await CT_PBH_LinhKien.find({ phieuBaoHanh: pbh._id })
      .populate('linhKien', 'tenLK donGia soLuongTon');

    return {
      phieuBaoHanh: pbh,
      mayImei,
      danhSachLinhKien
    };
  }

  /**
   * Tra cứu bảo hành chuyên sâu theo IMEI
   * Trả về: Ngày nhập, Ngày bán, Hạn BH, Còn hạn hay không, Lịch sử tất cả các lần bảo hành
   */
  async traCuuBaoHanh(imeiRaw) {
    if (!imeiRaw || !imeiRaw.trim()) {
      throw this.createError('Vui lòng nhập số IMEI cần tra cứu', 400);
    }

    const imei = imeiRaw.trim();

    // 1. Tìm máy IMEI
    const mayImei = await MayImei.findOne({ imei })
      .populate({
        path: 'sanPham',
        populate: { path: 'danhMuc', select: 'tenDanhMuc' }
      });

    if (!mayImei) {
      throw this.createError(`Không tìm thấy thông tin máy với số IMEI "${imei}"`, 404);
    }

    // 2. Tìm lịch sử bán hàng qua CT_HoaDon_May
    const ctHoaDon = await CT_HoaDon_May.findOne({ imei })
      .populate({
        path: 'hoaDon',
        populate: [
          { path: 'khachHang', select: 'hoTen sdt diaChi email' },
          { path: 'nhanVien', select: 'hoTen vaiTro' }
        ]
      });

    const hoaDon = ctHoaDon ? ctHoaDon.hoaDon : null;
    const ngayBan = hoaDon ? hoaDon.ngayLap : null;
    const khachHang = hoaDon ? hoaDon.khachHang : null;

    // 3. Tính toán hạn bảo hành
    const soThangBH = (mayImei.sanPham && mayImei.sanPham.soThangBH !== undefined)
      ? mayImei.sanPham.soThangBH
      : 12;

    let hanBaoHanh = null;
    let conHanBaoHanh = false;
    let soNgayConLai = 0;

    if (ngayBan) {
      hanBaoHanh = this.tinhHanBaoHanh(ngayBan, soThangBH);
      const now = new Date();
      const diffTime = hanBaoHanh.getTime() - now.getTime();
      soNgayConLai = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      conHanBaoHanh = soNgayConLai >= 0;
    }

    // 4. Lấy lịch sử tất cả các lần bảo hành của IMEI này
    const lichSuBaoHanh = await PhieuBaoHanh.find({ imei })
      .populate('nhanVien', 'hoTen vaiTro')
      .populate('khachHang', 'hoTen sdt')
      .sort({ ngayTiepNhan: -1 });

    // Lấy chi tiết linh kiện của từng phiếu bảo hành
    const pbhIds = lichSuBaoHanh.map(p => p._id);
    const allLinhKiens = await CT_PBH_LinhKien.find({ phieuBaoHanh: { $in: pbhIds } })
      .populate('linhKien', 'tenLK donGia');

    const linhKienMap = new Map();
    for (const lk of allLinhKiens) {
      const key = lk.phieuBaoHanh.toString();
      if (!linhKienMap.has(key)) linhKienMap.set(key, []);
      linhKienMap.get(key).push(lk);
    }

    const lichSuBaoHanhFull = lichSuBaoHanh.map(pbh => ({
      _id: pbh._id,
      maPBH: pbh.maPBH,
      ngayTiepNhan: pbh.ngayTiepNhan,
      moTaLoi: pbh.moTaLoi,
      trangThai: pbh.trangThai,
      ghiChu: pbh.ghiChu,
      nhanVien: pbh.nhanVien,
      linhKienThayThe: linhKienMap.get(pbh._id.toString()) || []
    }));

    return {
      imei: mayImei.imei,
      trangThaiHienTai: mayImei.trangThai,
      mauSac: mayImei.mauSac,
      dungLuong: mayImei.dungLuong,
      sanPham: mayImei.sanPham,
      ngayNhapKho: mayImei.ngayNhap || mayImei.createdAt,
      daBan: !!ngayBan,
      thongTinBanHang: hoaDon ? {
        soHD: hoaDon.soHD,
        ngayBan,
        donGiaBan: ctHoaDon.donGiaBan,
        khachHang,
        nhanVienBan: hoaDon.nhanVien
      } : null,
      baoHanh: {
        soThangBH,
        ngayBatDau: ngayBan,
        hanBaoHanh,
        hanBaoHanhStr: this.formatDate(hanBaoHanh),
        conHanBaoHanh,
        soNgayConLai: conHanBaoHanh ? soNgayConLai : 0,
        trangThaiBH: !ngayBan
          ? 'Máy chưa bán'
          : (conHanBaoHanh ? `Còn bảo hành (${soNgayConLai} ngày)` : 'Đã hết hạn bảo hành')
      },
      lichSuBaoHanh: lichSuBaoHanhFull
    };
  }

  /**
   * Tiếp nhận bảo hành máy (Nguyễn Quang Tuấn)
   * 1. Kiểm tra IMEI đã từng bán
   * 2. Kiểm tra hạn bảo hành (nếu hết hạn -> lỗi 400)
   * 3. Tạo PhieuBaoHanh
   * 4. Cập nhật MayImei.trangThai = 'Bao hanh'
   */
  async tiepNhanBaoHanh(payload = {}, sessionUser = null) {
    const { imei, moTaLoi, ghiChu, nhanVien } = payload;

    if (!imei || !imei.trim()) {
      throw this.createError('Vui lòng nhập số IMEI máy cần bảo hành', 400);
    }
    if (!moTaLoi || !moTaLoi.trim()) {
      throw this.createError('Vui lòng nhập mô tả lỗi bảo hành', 400);
    }

    const maNV = nhanVien || (sessionUser ? sessionUser._id : null);
    if (!maNV) {
      throw this.createError('Vui lòng cung cấp mã nhân viên tiếp nhận', 400);
    }

    // 1. Tìm máy trong CSDL
    const mayImei = await MayImei.findOne({ imei: imei.trim() }).populate('sanPham');
    if (!mayImei) {
      throw this.createError(`Không tìm thấy máy có IMEI "${imei}"`, 404);
    }

    // Kiểm tra máy đã từng bán hay chưa
    const ctHoaDon = await CT_HoaDon_May.findOne({ imei: imei.trim() }).populate('hoaDon');
    if (!ctHoaDon || !ctHoaDon.hoaDon) {
      throw this.createError(
        'Máy chưa bán, không thể tiếp nhận bảo hành! Vui lòng kiểm tra lại số IMEI hoặc lịch sử hóa đơn.',
        400
      );
    }

    if (mayImei.trangThai === 'Bao hanh') {
      throw this.createError('Máy hiện đang trong trạng thái bảo hành xử lý!', 400);
    }

    // 2. Tính hạn bảo hành
    const ngayBan = ctHoaDon.hoaDon.ngayLap;
    const soThangBH = (mayImei.sanPham && mayImei.sanPham.soThangBH !== undefined)
      ? mayImei.sanPham.soThangBH
      : 12;

    const hanBaoHanh = this.tinhHanBaoHanh(ngayBan, soThangBH);
    const now = new Date();

    if (now > hanBaoHanh) {
      throw this.createError(
        `Hết hạn bảo hành, ngày hết hạn: ${this.formatDate(hanBaoHanh)} (Bán ngày: ${this.formatDate(ngayBan)}, thời hạn: ${soThangBH} tháng).`,
        400,
        { ngayBan, hanBaoHanh, soThangBH }
      );
    }

    // 3. Tạo PhieuBaoHanh
    const autoMaPBH = 'PBH' + Date.now().toString().slice(-8);
    const phieuBaoHanh = await PhieuBaoHanh.create({
      maPBH: autoMaPBH,
      imei: imei.trim(),
      khachHang: ctHoaDon.hoaDon.khachHang || null,
      nhanVien: maNV,
      moTaLoi: moTaLoi.trim(),
      ngayTiepNhan: new Date(),
      trangThai: 'Dang xu ly',
      ghiChu: ghiChu ? ghiChu.trim() : ''
    });

    // 4. Update MayImei -> 'Bao hanh'
    await MayImei.findOneAndUpdate(
      { imei: imei.trim() },
      { $set: { trangThai: 'Bao hanh' } }
    );

    return await this.getPhieuBaoHanhDetail(phieuBaoHanh._id);
  }

  /**
   * Xuất linh kiện sửa chữa cho Phiếu Bảo Hành (Nguyễn Quang Tuấn)
   * 1. Thêm CT_PBH_LinhKien
   * 2. Trừ LinhKien.soLuongTon
   */
  async xuatLinhKienBaoHanh(pbhId, payload = {}) {
    const { linhKienId, soLuong = 1, donGia } = payload;

    if (!linhKienId) {
      throw this.createError('Vui lòng chọn linh kiện cần xuất', 400);
    }

    const qty = Math.max(1, parseInt(soLuong) || 1);

    const [pbh, linhKien] = await Promise.all([
      PhieuBaoHanh.findById(pbhId),
      LinhKien.findById(linhKienId)
    ]);

    if (!pbh) {
      throw this.createError('Không tìm thấy phiếu bảo hành', 404);
    }

    if (!linhKien) {
      throw this.createError('Không tìm thấy linh kiện', 404);
    }

    if (linhKien.soLuongTon < qty) {
      throw this.createError(
        `Linh kiện "${linhKien.tenLK}" không đủ tồn kho (Còn ${linhKien.soLuongTon}, yêu cầu ${qty})`,
        400
      );
    }

    const donGiaXuat = donGia !== undefined ? Number(donGia) : (linhKien.donGia || 0);

    // Tạo chi tiết linh kiện
    const ctLinhKien = await CT_PBH_LinhKien.create({
      phieuBaoHanh: pbh._id,
      linhKien: linhKien._id,
      soLuong: qty,
      donGia: donGiaXuat
    });

    // Trừ tồn kho linh kiện
    await LinhKien.findByIdAndUpdate(linhKien._id, {
      $inc: { soLuongTon: -qty }
    });

    return ctLinhKien;
  }

  /**
   * Hoàn tất quy trình bảo hành (Nguyễn Quang Tuấn)
   * 1. Đổi trạng thái PhieuBaoHanh -> 'Da sua xong' / 'Tra khach'
   * 2. Đổi MayImei.trangThai -> 'Da ban' (máy đã sửa xong trả về cho khách)
   */
  async hoanTatBaoHanh(pbhId, payload = {}) {
    const { ghiChu, trangThai = 'Da sua xong' } = payload;

    const pbh = await PhieuBaoHanh.findById(pbhId);
    if (!pbh) {
      throw this.createError('Không tìm thấy phiếu bảo hành', 404);
    }

    pbh.trangThai = ['Da sua xong', 'Tra khach', 'Tu choi bao hanh'].includes(trangThai)
      ? trangThai
      : 'Da sua xong';

    if (ghiChu) {
      pbh.ghiChu = (pbh.ghiChu ? pbh.ghiChu + ' | ' : '') + ghiChu.trim();
    }
    await pbh.save();

    // Nếu sửa xong hoặc trả khách, cập nhật trạng thái IMEI trở lại 'Da ban'
    if (pbh.trangThai === 'Da sua xong' || pbh.trangThai === 'Tra khach') {
      await MayImei.findOneAndUpdate(
        { imei: pbh.imei },
        { $set: { trangThai: 'Da ban' } }
      );
    }

    return await this.getPhieuBaoHanhDetail(pbh._id);
  }
}

module.exports = new BaoHanhService();
