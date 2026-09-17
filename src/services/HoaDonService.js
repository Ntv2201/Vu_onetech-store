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
  DonDatHangTruoc,
  CongNo
} = require('../models');

const TonKhoService = require('./TonKhoService');
const ThanhToanService = require('./ThanhToanService');
const CongNoService = require('./CongNoService');
const KhuyenMaiService = require('./KhuyenMaiService');

class HoaDonService extends BaseService {
  constructor() {
    super(HoaDon);
  }

  // Tích hợp Transaction helper
  get runInTransaction() {
    return require('../utils/transaction').runInTransaction;
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
        .limit(limit)
        .lean(),
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
   * Tìm kiếm đơn đặt hàng trước còn hiệu lực (Cho xu ly, Da co hang, Da dat coc) phục vụ bán hàng POS
   */
  async timKiemDonDatHang(search = '') {
    const filter = {
      trangThai: { $in: ['Cho xu ly', 'Da co hang', 'Da dat coc'] }
    };

    let donDatHangs = await DonDatHangTruoc.find(filter)
      .populate('khachHang', 'hoTen sdt diaChi')
      .populate('sanPham', 'tenMay hang giaBan')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      donDatHangs = donDatHangs.filter(d => {
        const tenKH = d.khachHang ? d.khachHang.hoTen.toLowerCase() : '';
        const sdtKH = d.khachHang ? d.khachHang.sdt : '';
        const tenSP = d.sanPham ? d.sanPham.tenMay.toLowerCase() : '';
        const idStr = d._id.toString();
        const maDon = d.maDonDat ? d.maDonDat.toLowerCase() : '';
        return tenKH.includes(q) || sdtKH.includes(q) || tenSP.includes(q) || idStr.includes(q) || maDon.includes(q);
      });
    }

    return donDatHangs;
  }

  /**
   * Lấy danh sách máy IMEI khả dụng (Con hang) hỗ trợ tìm kiếm nhanh & quét barcode trên POS
   */
  async layImeiKhaDung(query = {}) {
    const filter = { trangThai: 'Con hang' };
    if (query.sanPham && mongoose.Types.ObjectId.isValid(query.sanPham)) {
      filter.sanPham = query.sanPham;
    }

    let imeis = await MayImei.find(filter)
      .populate('sanPham', 'tenMay hang giaBan soThangBH status')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      imeis = imeis.filter(m => {
        const imeiStr = m.imei.toLowerCase();
        const tenSP = m.sanPham ? m.sanPham.tenMay.toLowerCase() : '';
        const mauSac = m.mauSac ? m.mauSac.toLowerCase() : '';
        const dungLuong = m.dungLuong ? m.dungLuong.toLowerCase() : '';
        return imeiStr.includes(q) || tenSP.includes(q) || mauSac.includes(q) || dungLuong.includes(q);
      });
    }

    // Lọc bỏ những máy có sản phẩm đã bị khóa
    imeis = imeis.filter(m => m.sanPham && m.sanPham.status !== false);

    return imeis;
  }

  /**
   * Kiểm tra điều kiện đổi trả máy theo IMEI (Hỗ trợ phân hệ Đổi trả - Tô Quốc Việt)
   * Kiểm tra: Máy đã bán, thuộc hóa đơn nào, đã mua bao nhiêu ngày, còn trong hạn 30 ngày không
   */
  async kiemTraImeiDoiTra(imei) {
    if (!imei || !imei.trim()) {
      throw this.createError('Vui lòng cung cấp số IMEI cần kiểm tra đổi trả', 400);
    }
    const cleanImei = imei.trim();

    const may = await MayImei.findOne({ imei: cleanImei }).populate('sanPham');
    if (!may) {
      throw this.createError(`Không tìm thấy máy với IMEI: ${cleanImei}`, 404);
    }

    if (may.trangThai !== 'Da ban') {
      throw this.createError(`Máy IMEI ${cleanImei} đang ở trạng thái "${may.trangThai}", không hợp lệ để làm thủ tục đổi trả`, 400);
    }

    // Tìm chi tiết hóa đơn bán máy này
    const ctHoaDon = await CT_HoaDon_May.findOne({ imei: cleanImei }).sort({ createdAt: -1 });
    if (!ctHoaDon) {
      throw this.createError(`Không tìm thấy lịch sử hóa đơn bán của máy IMEI ${cleanImei}`, 404);
    }

    const hoaDon = await HoaDon.findById(ctHoaDon.hoaDon)
      .populate('khachHang', 'hoTen sdt diaChi')
      .populate('nhanVien', 'hoTen');

    const ngayBan = hoaDon ? (hoaDon.ngayLap || hoaDon.createdAt) : ctHoaDon.createdAt;
    const diffMs = Date.now() - new Date(ngayBan).getTime();
    const soNgayDaQua = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hanDoiTraNgay = 30; // Chính sách đổi trả 30 ngày
    const conHanDoiTra = soNgayDaQua <= hanDoiTraNgay;

    return {
      may,
      hoaDon,
      donGiaBan: ctHoaDon.donGiaBan,
      ngayBan,
      soNgayDaQua,
      hanDoiTraNgay,
      conHanDoiTra,
      thongDiep: conHanDoiTra
        ? `Máy đủ điều kiện đổi trả (Đã mua ${soNgayDaQua} ngày, hạn mức ${hanDoiTraNgay} ngày).`
        : `Máy đã quá hạn đổi trả (Đã mua ${soNgayDaQua} ngày, vượt quá quy định ${hanDoiTraNgay} ngày).`
    };
  }

  /**
   * Thống kê nhanh tình hình bán hàng trong ngày / kỳ
   */
  async getThongKeNhanh() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [hoaDonHomNay, tongMayDaBan, tongMayConHang] = await Promise.all([
      HoaDon.find({ ngayLap: { $gte: startOfDay } }).lean(),
      MayImei.countDocuments({ trangThai: 'Da ban' }),
      MayImei.countDocuments({ trangThai: 'Con hang' })
    ]);

    let doanhThuHomNay = 0;
    hoaDonHomNay.forEach(hd => {
      doanhThuHomNay += (hd.tongTien || 0);
    });

    return {
      soHoaDonHomNay: hoaDonHomNay.length,
      doanhThuHomNay,
      tongMayDaBan,
      tongMayConHang
    };
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
   * Tạo Hóa đơn bán hàng theo IMEI & Tích hợp liên Service (Tuần 3 & 4 - Nguyễn Quang Tuấn)
   * 1. Validate đơn đặt trước & cấn trừ cọc (Việt)
   * 2. Lock + Validate trạng thái 'Con hang' của danh sách IMEI (409 Conflict)
   * 3. Validate tồn kho phụ kiện
   * 4. Tính toán tổng tiền & tiền cọc cấn trừ
   * 5. Tạo HoaDon
   * 6. Tạo CT_HoaDon_May & CT_HoaDon_PhuKien
   * 7. Cập nhật MayImei -> 'Da ban'
   * 8. Trừ tồn kho phụ kiện & Cập nhật TonKhoService (An & Tuân)
   * 9. Tự sinh PhieuXuatKho
   * 10. Đổi trạng thái DonDatHangTruoc -> 'Da nhan hang'
   * 11. Xử lý tài chính: Sinh PhieuThu vào Sổ quỹ (Vượng) hoặc tạo CongNo Khách hàng (An)
   */
  async taoHoaDonBanHang(payload = {}, sessionUser = null) {
    return await this.runInTransaction(async (session) => {
      let {
        khachHang,
        nhanVien,
        danhSachIMEI = [],
        danhSachPhuKien = [],
        hinhThucThanhToan = 'Tien mat',
        ghiChu = '',
        maKM = null,
        soTienGiam: soTienGiamThuCong = 0, // Backward-compatible: chiết khấu thủ công từ NV
        donDatHangId,
        donDatHang,
        maDat,
        guestName,
        guestPhone,
        guestCccd
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
          donDatHangDoc = await DonDatHangTruoc.findById(targetDatHangId).populate('khachHang sanPham').session(session);
        } else {
          donDatHangDoc = await DonDatHangTruoc.findOne({ _id: targetDatHangId }).populate('khachHang sanPham').session(session);
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

      // 1.1 Xử lý tự động tạo Khách hàng vãng lai nếu chưa có
      if (!khachHang && guestName && guestPhone) {
        const sdtGuest = guestPhone.trim();
        if (!/^[0-9]{10}$/.test(sdtGuest)) {
          throw this.createError('Số điện thoại khách hàng không hợp lệ (yêu cầu 10 chữ số)', 400);
        }
        if (guestCccd && guestCccd.trim() && !/^[0-9]{12}$/.test(guestCccd.trim())) {
          throw this.createError('Căn cước công dân không hợp lệ (yêu cầu 12 chữ số)', 400);
        }
        let existingCustomer = await KhachHang.findOne({ sdt: sdtGuest }).session(session);
        if (existingCustomer) {
          khachHang = existingCustomer._id;
          // Cập nhật CCCD nếu có nhập mà trước đó chưa có
          if (guestCccd && !existingCustomer.cccd) {
            existingCustomer.cccd = guestCccd.trim();
            await existingCustomer.save({ session });
          }
        } else {
          const newCustomer = new KhachHang({
            hoTen: guestName.trim(),
            sdt: sdtGuest,
            cccd: guestCccd ? guestCccd.trim() : undefined,
            hangThanhVien: 'Đồng'
          });
          await newCustomer.save({ session });
          khachHang = newCustomer._id;
        }
      }

    // Chuẩn hóa danh sách IMEI dạng string
    const imeis = (Array.isArray(danhSachIMEI) ? danhSachIMEI : [danhSachIMEI])
      .map(i => (typeof i === 'string' ? i.trim() : (i && i.imei ? i.imei.trim() : '')))
      .filter(Boolean);

      // 2. Kiểm tra từng IMEI có tồn tại và trạng thái 'Con hang'
      let mayList = [];
      if (imeis.length > 0) {
        mayList = await MayImei.find({ imei: { $in: imeis } }).populate('sanPham').session(session);

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
          409,
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

        const pk = await PhuKien.findById(pkId).session(session);
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
        donGiaBan,
        sanPhamId: may.sanPham ? may.sanPham._id : null
      });
    }

    let tongTienPhuKien = 0;
    for (const pkItem of pkItems) {
      tongTienPhuKien += pkItem.donGiaBan * pkItem.soLuong;
    }

    const tongTien = tongTienMay + tongTienPhuKien;

    // Giới hạn tiền cọc tối đa bằng tổng tiền hóa đơn
    const actualTienCocDaTru = Math.min(tienCocDaTru, tongTien);

      // Áp dụng khuyến mãi (nếu có)
      const kmResult = await KhuyenMaiService.apDungKhuyenMai(maKM, tongTien, session);
      const kmDiscount = kmResult.soTienGiam;
      const khuyenMaiObj = kmResult.khuyenMai;

    // Tổng chiết khấu = KM hệ thống + chiết khấu thủ công (backward-compatible)
    const discount = Math.min(kmDiscount + Math.max(0, Number(soTienGiamThuCong) || 0), tongTien);

    const soTienThanhToan = Math.max(0, tongTien - actualTienCocDaTru - discount);

      // 5. Cập nhật MayImei -> 'Da ban' (Dùng atomic update với kiểm tra trangThai === 'Con hang' để chống race condition)
      if (imeis.length > 0) {
        const updatedImeis = [];
        for (const targetImei of imeis) {
          const updatedDoc = await MayImei.findOneAndUpdate(
            { imei: targetImei, trangThai: 'Con hang' },
            { $set: { trangThai: 'Da ban' } },
            { new: true, session }
          );

          if (!updatedDoc) {
            // Rollback chỉ những IMEI đã lỡ cập nhật trong mẻ này
            if (updatedImeis.length > 0) {
              await MayImei.updateMany(
                { imei: { $in: updatedImeis } },
                { $set: { trangThai: 'Con hang' } },
                { session }
              );
            }
          throw this.createError(
            `Phát hiện xung đột đồng thời khi bán máy! Máy IMEI "${targetImei}" không còn ở trạng thái khả dụng hoặc vừa được bán ở quầy khác.`,
            409,
            { failedImei: targetImei }
          );
        }
        updatedImeis.push(targetImei);
      }
    }

      // 6. Trừ số lượng tồn phụ kiện & Tồn kho Model qua TonKhoService
      for (const pkItem of pkItems) {
        await PhuKien.findByIdAndUpdate(
          pkItem.phuKienId,
          { $inc: { soLuongTon: -pkItem.soLuong } },
          { session }
        );
      }

      // Cập nhật giảm tồn kho model sản phẩm qua TonKhoService (An & Tuân)
      for (const mayDoc of ctMayDocs) {
        if (mayDoc.sanPhamId) {
          try {
            await TonKhoService.capNhatTonKho(mayDoc.sanPhamId, null, -1, { choPhepAm: true, session });
          } catch (e) {
            // Bỏ qua lỗi nếu chưa khởi tạo kho chi tiết
          }
        }
      }

      // 7. Tạo HoaDon
      const autoSoHD = 'HD' + Date.now().toString().slice(-8);
      let noteText = ghiChu || '';
      if (actualTienCocDaTru > 0) {
        noteText = (noteText ? noteText + ' | ' : '') + `Đã cấn trừ tiền cọc đơn đặt trước: ${actualTienCocDaTru.toLocaleString('vi-VN')} đ`;
      }
      if (discount > 0) {
        noteText = (noteText ? noteText + ' | ' : '') + `Chiết khấu giảm giá: ${discount.toLocaleString('vi-VN')} đ`;
      }

      const isDebt = hinhThucThanhToan === 'Cong no';
      const hoaDonTrangThai = isDebt ? 'Cong no' : 'Da thanh toan';

      const hoaDon = new HoaDon({
        soHD: autoSoHD,
        khachHang: khachHang || null,
        nhanVien: maNV,
        donDatHang: donDatHangDoc ? donDatHangDoc._id : null,
        tienCocDaTru: actualTienCocDaTru,
        khuyenMai: khuyenMaiObj ? khuyenMaiObj._id : null,
        khuyenMaiGiam: discount,
        soTienGiam: discount, // Quan trọng: Lưu vào soTienGiam để các module Báo Cáo và Giao Diện không bị lệch
        soTienThanhToan,
        ngayLap: new Date(),
        tongTien,
        trangThai: hoaDonTrangThai,
        ghiChu: noteText
      });
      await hoaDon.save({ session });

      // 8. Tạo CT_HoaDon_May
      if (ctMayDocs.length > 0) {
        const ctMayWithHD = ctMayDocs.map(item => ({
          imei: item.imei,
          donGiaBan: item.donGiaBan,
          hoaDon: hoaDon._id
        }));
        await CT_HoaDon_May.insertMany(ctMayWithHD, { session });
      }

      // 9. Tạo CT_HoaDon_PhuKien
      if (pkItems.length > 0) {
        const ctPKWithHD = pkItems.map(item => ({
          hoaDon: hoaDon._id,
          phuKien: item.phuKienId,
          soLuong: item.soLuong,
          donGiaBan: item.donGiaBan
        }));
        await CT_HoaDon_PhuKien.insertMany(ctPKWithHD, { session });
      }

      // 10. Tự sinh PhieuXuatKho
      const pxk = new PhieuXuatKho({
        hoaDon: hoaDon._id,
        lyDoXuat: `Xuat ban hang theo hoa don ${hoaDon.soHD}`,
        ngayXuat: new Date()
      });
      await pxk.save({ session });

      // 11. Cập nhật trạng thái DonDatHangTruoc -> 'Da nhan hang'
      if (donDatHangDoc) {
        donDatHangDoc.trangThai = 'Da nhan hang';
        if (imeis.length > 0 && !donDatHangDoc.imei) {
          donDatHangDoc.imei = imeis[0];
        }
        await donDatHangDoc.save({ session });
      }

      // 12. Xử lý tài chính liên Service (Sổ quỹ & Công nợ)
      if (isDebt && khachHang) {
      // Mua ghi nợ -> Tự sinh hồ sơ Công Nợ Khách Hàng (An)
        try {
          await CongNoService.taoCongNo({
            loaiDoiTuong: 'KhachHang',
            khachHang,
            hoaDon: hoaDon._id,
            soTienNo: soTienThanhToan,
            session
          });
        } catch (err) {
          console.warn('[HoaDonService] Không thể tự động tạo công nợ:', err.message);
          throw err;
        }
      } else if (soTienThanhToan > 0) {
        // Thanh toán ngay (Tiền mặt / Chuyển khoản / Quẹt thẻ) -> Sinh Phiếu Thu Sổ quỹ (Vượng)
        try {
          const paymentMethod = ['Tien mat', 'Chuyen khoan', 'Quet the', 'Vi dien tu'].includes(hinhThucThanhToan)
            ? hinhThucThanhToan
            : 'Tien mat';
          await ThanhToanService.taoPhieuThu({
            hoaDon: hoaDon._id,
            soTien: soTienThanhToan,
            hinhThuc: paymentMethod,
            ghiChu: `Thu tiền bán hàng theo hóa đơn ${hoaDon.soHD}`,
            session
          }, sessionUser);
        } catch (err) {
          console.warn('[HoaDonService] Không thể tự động tạo phiếu thu:', err.message);
          throw err;
        }
      }

      // Trả về dữ liệu chi tiết hóa đơn vừa tạo
      return await this.getHoaDonDetail(hoaDon._id);
    }); // End runInTransaction
  }

  /**
   * Thống kê KPI doanh số bán hàng theo từng Nhân Viên (Tuần 5-6 - Nguyễn Quang Tuấn)
   */
  async getDoanhSoNhanVien(query = {}) {
    const { tuNgay, denNgay } = query;
    const filter = { trangThai: { $ne: 'Da huy' } };

    if (tuNgay || denNgay) {
      filter.ngayLap = {};
      if (tuNgay) filter.ngayLap.$gte = new Date(tuNgay);
      if (denNgay) filter.ngayLap.$lte = new Date(denNgay);
    }

    const stats = await HoaDon.aggregate([
      { $match: filter },
      { $group: {
          _id: "$nhanVien",
          soHoaDon: { $sum: 1 },
          tongDoanhThu: { $sum: { $ifNull: ["$tongTien", 0] } },
          tongThucThu: { $sum: { $ifNull: ["$soTienThanhToan", 0] } }
      }}
    ]);
    const statsMap = new Map(stats.map(s => [s._id ? s._id.toString() : 'null', s]));

    const danhSachNhanVien = await NhanVien.find({
      trangThai: { $ne: 'Khóa' },
      vaiTro: { $in: ['NV bán hàng', 'Thu ngân', 'Quản lý'] }
    }).select('_id hoTen tenDangNhap vaiTro').lean();

    const nhanVienStats = danhSachNhanVien.map(nv => {
      const s = statsMap.get(nv._id.toString()) || {};
      const soHoaDon = s.soHoaDon || 0;
      const tongDoanhThu = s.tongDoanhThu || 0;
      const tongThucThu = s.tongThucThu || 0;
      const giaTriTrungBinh = soHoaDon > 0 ? Math.round(tongDoanhThu / soHoaDon) : 0;

      return {
        nhanVienId: nv._id,
        hoTen: nv.hoTen,
        tenDangNhap: nv.tenDangNhap,
        vaiTro: nv.vaiTro,
        soHoaDon,
        tongDoanhThu,
        tongThucThu,
        giaTriTrungBinh
      };
    });

    // Sắp xếp theo tổng doanh thu giảm dần
    nhanVienStats.sort((a, b) => b.tongDoanhThu - a.tongDoanhThu);

    return nhanVienStats;
  }

  /**
   * Thống kê Top Sản Phẩm bán chạy nhất (Tuần 5-6 - Nguyễn Quang Tuấn)
   */
  async getTopSanPham(query = {}) {
    const limit = parseInt(query.limit) || 10;
    
    const pipeline = [
      {
        $lookup: {
          from: 'HOADON',
          localField: 'hoaDon',
          foreignField: '_id',
          as: 'hoaDonDoc'
        }
      },
      { $unwind: '$hoaDonDoc' },
      { $match: { 'hoaDonDoc.trangThai': { $ne: 'Da huy' } } },
      {
        $lookup: {
          from: 'MAY_IMEI',
          localField: 'imei',
          foreignField: 'imei',
          as: 'mayImeiDoc'
        }
      },
      { $unwind: '$mayImeiDoc' },
      {
        $group: {
          _id: '$mayImeiDoc.sanPham',
          soLuongBan: { $sum: 1 },
          doanhThu: { $sum: { $ifNull: ['$donGiaBan', 0] } }
        }
      },
      { $sort: { soLuongBan: -1 } },
      { $limit: limit }
    ];

    const stats = await CT_HoaDon_May.aggregate(pipeline);
    await mongoose.model('SanPham').populate(stats, { path: '_id', select: 'tenMay hang giaBan' });

    return stats.map(s => ({
      sanPhamId: s._id ? s._id._id : null,
      tenMay: s._id ? s._id.tenMay : 'N/A',
      hang: s._id ? s._id.hang : 'N/A',
      giaBan: s._id ? s._id.giaBan : 0,
      soLuongBan: s.soLuongBan,
      doanhThu: s.doanhThu
    }));
  }
}

module.exports = new HoaDonService();
