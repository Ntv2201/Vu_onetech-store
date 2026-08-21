const mongoose = require('mongoose');
const BaseService = require('./BaseService');
const {
  HoaDon,
  CT_HoaDon_May,
  CT_HoaDon_PhuKien,
  MayImei,
  PhuKien,
  PhieuXuatKho,
  KhachHang,
  NhanVien,
  DonDatHangTruoc
} = require('../models');

class HoaDonService extends BaseService {
  constructor() {
    super(HoaDon);
  }

  /**
   * Lấy danh sách hóa đơn có bộ lọc ngày, khách hàng, trạng thái, tìm kiếm
   */
  async getHoaDonList(query = {}) {
    const { tuNgay, denNgay, maKH, trangThai, search } = query;
    const filter = {};

    // Lọc theo khoảng ngày lập
    if (tuNgay || denNgay) {
      filter.ngayLap = {};
      if (tuNgay) {
        filter.ngayLap.$gte = new Date(tuNgay + 'T00:00:00.000Z');
      }
      if (denNgay) {
        filter.ngayLap.$lte = new Date(denNgay + 'T23:59:59.999Z');
      }
    }

    // Lọc theo mã/id khách hàng
    if (maKH) {
      filter.khachHang = maKH;
    }

    // Lọc theo trạng thái hóa đơn
    if (trangThai) {
      filter.trangThai = trangThai;
    }

    // Tìm kiếm theo số hóa đơn
    if (search && search.trim()) {
      filter.soHD = { $regex: search.trim(), $options: 'i' };
    }

    const { page, limit, skip } = this.getPaginationOptions(query);

    const [hoaDons, total] = await Promise.all([
      HoaDon.find(filter)
        .populate('khachHang', 'hoTen sdt diaChi')
        .populate('nhanVien', 'hoTen vaiTro tenDangNhap')
        .populate('donDatHang', 'soTienCoc trangThai')
        .sort({ ngayLap: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      HoaDon.countDocuments(filter)
    ]);

    return {
      hoaDons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Tìm kiếm đơn đặt hàng trước còn hiệu lực (Cho xu ly, Da co hang) phục vụ bán hàng POS
   */
  async timKiemDonDatHang(search = '') {
    const filter = {
      trangThai: { $in: ['Cho xu ly', 'Da co hang'] }
    };

    let donDatHangs = await DonDatHangTruoc.find(filter)
      .populate('khachHang', 'hoTen sdt diaChi')
      .populate('sanPham', 'tenMay hang giaBan')
      .sort({ createdAt: -1 })
      .limit(20);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      donDatHangs = donDatHangs.filter(d => {
        const tenKH = d.khachHang ? d.khachHang.hoTen.toLowerCase() : '';
        const sdtKH = d.khachHang ? d.khachHang.sdt : '';
        const tenSP = d.sanPham ? d.sanPham.tenMay.toLowerCase() : '';
        const idStr = d._id.toString();
        return tenKH.includes(q) || sdtKH.includes(q) || tenSP.includes(q) || idStr.includes(q);
      });
    }

    return donDatHangs;
  }

  /**
   * Lấy chi tiết 1 hóa đơn đầy đủ (máy kèm IMEI, phụ kiện, phiếu xuất kho, đơn đặt trước)
   */
  async getHoaDonDetail(id) {
    let hoaDon;
    if (mongoose.Types.ObjectId.isValid(id)) {
      hoaDon = await HoaDon.findById(id)
        .populate('khachHang', 'hoTen sdt diaChi email')
        .populate('nhanVien', 'hoTen vaiTro tenDangNhap')
        .populate({
          path: 'donDatHang',
          populate: { path: 'sanPham', select: 'tenMay hang giaBan' }
        });
    } else {
      hoaDon = await HoaDon.findOne({ soHD: id })
        .populate('khachHang', 'hoTen sdt diaChi email')
        .populate('nhanVien', 'hoTen vaiTro tenDangNhap')
        .populate({
          path: 'donDatHang',
          populate: { path: 'sanPham', select: 'tenMay hang giaBan' }
        });
    }

    if (!hoaDon) {
      throw this.createError('Không tìm thấy hóa đơn', 404);
    }

    // 1. Lấy chi tiết máy bán kèm thông tin cấu hình và sản phẩm
    const ctMay = await CT_HoaDon_May.find({ hoaDon: hoaDon._id });
    const imeiList = ctMay.map(item => item.imei);
    const mayImeis = await MayImei.find({ imei: { $in: imeiList } })
      .populate({
        path: 'sanPham',
        populate: { path: 'danhMuc', select: 'tenDanhMuc' }
      });

    const mayMap = new Map(mayImeis.map(m => [m.imei, m]));

    const danhSachMay = ctMay.map(item => {
      const mayInfo = mayMap.get(item.imei);
      return {
        _id: item._id,
        imei: item.imei,
        donGiaBan: item.donGiaBan,
        sanPham: mayInfo ? mayInfo.sanPham : null,
        mauSac: mayInfo ? mayInfo.mauSac : '',
        dungLuong: mayInfo ? mayInfo.dungLuong : ''
      };
    });

    // 2. Lấy chi tiết phụ kiện
    const ctPhuKien = await CT_HoaDon_PhuKien.find({ hoaDon: hoaDon._id })
      .populate({
        path: 'phuKien',
        populate: { path: 'danhMuc', select: 'tenDanhMuc' }
      });

    // 3. Lấy phiếu xuất kho liên kết (nếu có)
    const phieuXuatKho = await PhieuXuatKho.findOne({ hoaDon: hoaDon._id });

    return {
      hoaDon,
      danhSachMay,
      danhSachPhuKien: ctPhuKien,
      phieuXuatKho
    };
  }

  /**
   * Tạo Hóa đơn bán hàng theo IMEI & Tích hợp Cấn trừ Cọc (Tuần 3 - Nguyễn Quang Tuấn)
   * 1. Validate đơn đặt trước (nếu có donDatHangId) & cấn trừ cọc
   * 2. Lock + Validate trạng thái 'Con hang' của danh sách IMEI (Xung đột Concurrency -> 409)
   * 3. Validate tồn kho phụ kiện
   * 4. Tính toán tổng tiền & tiền cọc cấn trừ
   * 5. Tạo HoaDon
   * 6. Tạo CT_HoaDon_May & CT_HoaDon_PhuKien
   * 7. Cập nhật MayImei -> 'Da ban'
   * 8. Trừ tồn kho phụ kiện
   * 9. Tự sinh PhieuXuatKho
   * 10. Đổi trạng thái DonDatHangTruoc -> 'Da nhan hang'
   */
  async taoHoaDonBanHang(payload = {}, sessionUser = null) {
    let {
      khachHang,
      nhanVien,
      danhSachIMEI = [],
      danhSachPhuKien = [],
      hinhThucThanhToan = 'Da thanh toan',
      ghiChu = '',
      donDatHangId,
      donDatHang,
      maDat
    } = payload;

    const targetDatHangId = donDatHangId || donDatHang || maDat;

    // Xác định nhân viên lập đơn
    const maNV = nhanVien || (sessionUser ? sessionUser._id : null);
    if (!maNV) {
      throw this.createError('Vui lòng cung cấp mã nhân viên lập hóa đơn', 400);
    }

    if ((!danhSachIMEI || danhSachIMEI.length === 0) && (!danhSachPhuKien || danhSachPhuKien.length === 0)) {
      throw this.createError('Hóa đơn phải có ít nhất 1 máy IMEI hoặc 1 phụ kiện', 400);
    }

    // 1. Kiểm tra đơn đặt hàng trước (nếu có yêu cầu cấn trừ cọc)
    let donDatHangDoc = null;
    let tienCocDaTru = 0;
    if (targetDatHangId) {
      if (mongoose.Types.ObjectId.isValid(targetDatHangId)) {
        donDatHangDoc = await DonDatHangTruoc.findById(targetDatHangId).populate('khachHang sanPham');
      } else {
        donDatHangDoc = await DonDatHangTruoc.findOne({ _id: targetDatHangId }).populate('khachHang sanPham');
      }

      if (!donDatHangDoc) {
        throw this.createError(`Không tìm thấy đơn đặt hàng trước với mã: ${targetDatHangId}`, 404);
      }

      if (donDatHangDoc.trangThai === 'Da huy') {
        throw this.createError('Đơn đặt hàng trước này đã bị hủy, không thể tiếp nhận bán máy', 400);
      }

      if (donDatHangDoc.trangThai === 'Da nhan hang') {
        throw this.createError('Đơn đặt hàng trước này đã được nhận máy và xuất hóa đơn trước đó', 400);
      }

      // Tự động gán khách hàng nếu chưa có
      if (!khachHang && donDatHangDoc.khachHang) {
        khachHang = donDatHangDoc.khachHang._id || donDatHangDoc.khachHang;
      }

      tienCocDaTru = donDatHangDoc.soTienCoc || 0;
    }

    // Chuẩn hóa danh sách IMEI dạng string
    const imeis = (Array.isArray(danhSachIMEI) ? danhSachIMEI : [danhSachIMEI])
      .map(i => (typeof i === 'string' ? i.trim() : (i && i.imei ? i.imei.trim() : '')))
      .filter(Boolean);

    // 2. Kiểm tra từng IMEI có tồn tại và trạng thái 'Con hang'
    let mayList = [];
    if (imeis.length > 0) {
      mayList = await MayImei.find({ imei: { $in: imeis } }).populate('sanPham');

      const foundImeis = new Set(mayList.map(m => m.imei));
      const missingImeis = imeis.filter(i => !foundImeis.has(i));

      if (missingImeis.length > 0) {
        throw this.createError(
          `Các IMEI sau không tồn tại trong hệ thống: ${missingImeis.join(', ')}`,
          404,
          { missingImeis }
        );
      }

      // Kiểm tra xem có IMEI nào không ở trạng thái 'Con hang' (Đã bán, Bảo hành, Lỗi)
      const invalidStatusMay = mayList.filter(m => m.trangThai !== 'Con hang');
      if (invalidStatusMay.length > 0) {
        const detailStr = invalidStatusMay
          .map(m => `${m.imei} (Trạng thái: ${m.trangThai})`)
          .join(', ');
        throw this.createError(
          `Không thể bán! Các IMEI sau không khả dụng hoặc đã bán: ${detailStr}`,
          409, // 409 Conflict chuẩn theo quy ước
          { invalidImeis: invalidStatusMay.map(m => m.imei) }
        );
      }
    }

    // 3. Kiểm tra phụ kiện và số lượng tồn
    const pkItems = [];
    for (const item of danhSachPhuKien) {
      const pkId = item.phuKien || item.maPK || item._id;
      const soLuong = parseInt(item.soLuong) || 1;
      if (!pkId) continue;

      const pk = await PhuKien.findById(pkId);
      if (!pk) {
        throw this.createError(`Phụ kiện với ID ${pkId} không tồn tại`, 404);
      }

      if (pk.soLuongTon < soLuong) {
        throw this.createError(
          `Phụ kiện "${pk.tenPK}" không đủ tồn kho (Còn ${pk.soLuongTon}, yêu cầu ${soLuong})`,
          400,
          { phuKienId: pk._id, tenPK: pk.tenPK, soLuongTon: pk.soLuongTon, soLuongYeuCau: soLuong }
        );
      }

      const donGiaBan = item.donGiaBan !== undefined ? Number(item.donGiaBan) : pk.giaBan;
      pkItems.push({
        phuKienDoc: pk,
        phuKienId: pk._id,
        soLuong,
        donGiaBan
      });
    }

    // 4. Tính toán tổng tiền
    let tongTienMay = 0;
    const ctMayDocs = [];
    for (const may of mayList) {
      const donGiaBan = (may.sanPham && may.sanPham.giaBan) ? may.sanPham.giaBan : (may.giaNhap * 1.15);
      tongTienMay += donGiaBan;
      ctMayDocs.push({
        imei: may.imei,
        donGiaBan
      });
    }

    let tongTienPhuKien = 0;
    for (const pkItem of pkItems) {
      tongTienPhuKien += pkItem.donGiaBan * pkItem.soLuong;
    }

    const tongTien = tongTienMay + tongTienPhuKien;

    // Giới hạn tiền cọc tối đa bằng tổng tiền hóa đơn
    const actualTienCocDaTru = Math.min(tienCocDaTru, tongTien);
    const soTienThanhToan = Math.max(0, tongTien - actualTienCocDaTru);

    // 5. Cập nhật MayImei -> 'Da ban' (Dùng atomic update với kiểm tra trangThai === 'Con hang' để chống race condition)
    if (imeis.length > 0) {
      const updateResult = await MayImei.updateMany(
        { imei: { $in: imeis }, trangThai: 'Con hang' },
        { $set: { trangThai: 'Da ban' } }
      );

      if (updateResult.modifiedCount !== imeis.length) {
        // Rollback nếu có IMEI vừa bị đổi ở luồng khác
        await MayImei.updateMany(
          { imei: { $in: imeis } },
          { $set: { trangThai: 'Con hang' } }
        );
        throw this.createError(
          'Phát hiện xung đột đồng thời khi bán máy! Một hoặc nhiều IMEI vừa được bán ở giao dịch khác.',
          409,
          { expected: imeis.length, actual: updateResult.modifiedCount }
        );
      }
    }

    // 6. Trừ số lượng tồn phụ kiện
    for (const pkItem of pkItems) {
      await PhuKien.findByIdAndUpdate(
        pkItem.phuKienId,
        { $inc: { soLuongTon: -pkItem.soLuong } }
      );
    }

    // 7. Tạo HoaDon
    const autoSoHD = 'HD' + Date.now().toString().slice(-8);
    let noteText = ghiChu || '';
    if (actualTienCocDaTru > 0) {
      noteText = (noteText ? noteText + ' | ' : '') + `Đã cấn trừ tiền cọc đơn đặt trước: ${actualTienCocDaTru.toLocaleString('vi-VN')} đ`;
    }

    const hoaDon = await HoaDon.create({
      soHD: autoSoHD,
      khachHang: khachHang || null,
      nhanVien: maNV,
      donDatHang: donDatHangDoc ? donDatHangDoc._id : null,
      tienCocDaTru: actualTienCocDaTru,
      soTienThanhToan,
      ngayLap: new Date(),
      tongTien,
      trangThai: ['Da thanh toan', 'Cong no', 'Tra gop'].includes(hinhThucThanhToan) ? hinhThucThanhToan : 'Da thanh toan',
      ghiChu: noteText
    });

    // 8. Tạo CT_HoaDon_May
    if (ctMayDocs.length > 0) {
      const ctMayWithHD = ctMayDocs.map(item => ({
        ...item,
        hoaDon: hoaDon._id
      }));
      await CT_HoaDon_May.insertMany(ctMayWithHD);
    }

    // 9. Tạo CT_HoaDon_PhuKien
    if (pkItems.length > 0) {
      const ctPKWithHD = pkItems.map(item => ({
        hoaDon: hoaDon._id,
        phuKien: item.phuKienId,
        soLuong: item.soLuong,
        donGiaBan: item.donGiaBan
      }));
      await CT_HoaDon_PhuKien.insertMany(ctPKWithHD);
    }

    // 10. Tự sinh PhieuXuatKho
    await PhieuXuatKho.create({
      hoaDon: hoaDon._id,
      lyDoXuat: `Xuat ban hang theo hoa don ${hoaDon.soHD}`,
      ngayXuat: new Date()
    });

    // 11. Cập nhật trạng thái DonDatHangTruoc -> 'Da nhan hang'
    if (donDatHangDoc) {
      donDatHangDoc.trangThai = 'Da nhan hang';
      if (imeis.length > 0 && !donDatHangDoc.imei) {
        donDatHangDoc.imei = imeis[0];
      }
      await donDatHangDoc.save();
    }

    // Trả về dữ liệu chi tiết hóa đơn vừa tạo
    return await this.getHoaDonDetail(hoaDon._id);
  }
}

module.exports = new HoaDonService();
