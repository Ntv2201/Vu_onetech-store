require('dotenv').config();
const mongoose = require('mongoose');
const {
  NhanVien,
  KhachHang,
  SanPham,
  MayImei,
  PhuKien,
  LinhKien,
  HoaDon,
  CT_HoaDon_May,
  CT_HoaDon_PhuKien,
  PhieuXuatKho,
  PhieuBaoHanh,
  CT_PBH_LinhKien,
  DonDatHangTruoc,
  PhieuThu,
  CongNo
} = require('../src/models');

const { HoaDonService, BaoHanhService, ThanhToanService, CongNoService, TonKhoService, KhachHangService } = require('../src/services');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE NGUYỄN QUANG TUẤN (OOP & BÁN HÀNG - BẢO HÀNH - TUẦN 4)');
  console.log('===============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
  await mongoose.connect(mongoUri);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Lấy nhân viên và khách hàng để test
    const [nv, kh, spIphone, pkSac, lkManHinh] = await Promise.all([
      NhanVien.findOne({ tenDangNhap: 'banhang' }),
      KhachHang.findOne(),
      SanPham.findOne({ tenMay: { $regex: 'iPhone 15', $options: 'i' } }),
      PhuKien.findOne({ tenPK: { $regex: '20W', $options: 'i' } }),
      LinhKien.findOne({ tenLK: { $regex: 'Màn hình', $options: 'i' } })
    ]);

    if (lkManHinh && lkManHinh.soLuongTon < 5) {
      lkManHinh.soLuongTon = 50;
      await lkManHinh.save();
    }
    if (pkSac && pkSac.soLuongTon < 5) {
      pkSac.soLuongTon = 50;
      await pkSac.save();
    }

    // -------------------------------------------------------------
    // TEST 1: Lấy danh sách Hóa đơn
    // -------------------------------------------------------------
    console.log('--- TEST 1: Lấy danh sách hóa đơn (getHoaDonList) ---');
    const listResult = await HoaDonService.getHoaDonList({ limit: 10 });
    assert(Array.isArray(listResult.hoaDons), 'Trả về danh sách hóa đơn dạng mảng');
    assert(listResult.hoaDons.length > 0, `Đã tìm thấy ${listResult.hoaDons.length} hóa đơn trong DB`);
    assert(listResult.pagination.total >= listResult.hoaDons.length, 'Thông tin phân trang đầy đủ');

    // -------------------------------------------------------------
    // TEST 2: Lấy chi tiết Hóa đơn kèm máy, phụ kiện, phiếu xuất kho
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Lấy chi tiết hóa đơn (getHoaDonDetail) ---');
    const firstHd = listResult.hoaDons[0];
    const detailResult = await HoaDonService.getHoaDonDetail(firstHd._id);
    assert(detailResult.hoaDon.soHD === firstHd.soHD, `Đúng số HĐ: ${detailResult.hoaDon.soHD}`);
    assert(Array.isArray(detailResult.danhSachMay), 'Có danh sách máy IMEI vật lý');
    assert(detailResult.phieuXuatKho !== undefined, 'Liên kết thành công với phiếu xuất kho');

    // -------------------------------------------------------------
    // TEST 3: Bán hàng theo IMEI & Phụ kiện (taoHoaDonBanHang)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Bán hàng theo IMEI & Tự sinh Phiếu xuất kho ---');
    const testImei1 = 'TUAN' + Date.now().toString().slice(-11);
    const mayConHang = await MayImei.create({
      imei: testImei1,
      sanPham: spIphone._id,
      giaNhap: 26500000,
      mauSac: 'Titan Tự Nhiên',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });
    const imeiToSell = mayConHang.imei;
    const initialPkStock = pkSac.soLuongTon;

    const orderPayload = {
      khachHang: kh._id,
      nhanVien: nv._id,
      danhSachIMEI: [imeiToSell],
      danhSachPhuKien: [{ phuKien: pkSac._id, soLuong: 1 }],
      hinhThucThanhToan: 'Da thanh toan',
      ghiChu: 'Test bán hàng tự động'
    };

    const newOrder = await HoaDonService.taoHoaDonBanHang(orderPayload, nv);
    assert(newOrder.hoaDon.soHD.startsWith('HD'), `Tạo HĐ thành công: ${newOrder.hoaDon.soHD}`);
    assert(newOrder.danhSachMay.some(m => m.imei === imeiToSell), 'Hóa đơn chứa đúng số IMEI bán');
    assert(newOrder.phieuXuatKho && newOrder.phieuXuatKho.lyDoXuat.includes(newOrder.hoaDon.soHD), 'Tự động sinh phiếu xuất kho theo HĐ');

    // Kiểm tra trạng thái máy đã chuyển sang 'Da ban'
    const updatedMay = await MayImei.findOne({ imei: imeiToSell });
    assert(updatedMay.trangThai === 'Da ban', `IMEI ${imeiToSell} đã chuyển trạng thái sang "Da ban"`);

    // Kiểm tra tồn kho phụ kiện đã giảm
    const updatedPk = await PhuKien.findById(pkSac._id);
    assert(updatedPk.soLuongTon === initialPkStock - 1, `Tồn kho phụ kiện đã giảm từ ${initialPkStock} -> ${updatedPk.soLuongTon}`);

    // -------------------------------------------------------------
    // TEST 4: Bán trùng IMEI vừa bán -> Chặn và trả về HTTP 409 Conflict
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Chặn bán trùng IMEI đã bán (Trả về 409 Conflict) ---');
    let conflictError = null;
    try {
      await HoaDonService.taoHoaDonBanHang({
        khachHang: kh._id,
        nhanVien: nv._id,
        danhSachIMEI: [imeiToSell], // IMEI này vừa bán ở Test 3
        danhSachPhuKien: []
      }, nv);
    } catch (err) {
      conflictError = err;
    }

    assert(conflictError !== null, 'Phát hiện lỗi khi bán máy đã bán');
    assert(conflictError && conflictError.statusCode === 409, `Mã lỗi HTTP đúng chuẩn 409 Conflict (Nhận: ${conflictError ? conflictError.statusCode : 'N/A'})`);
    assert(conflictError && conflictError.message.includes(imeiToSell), 'Thông báo lỗi chỉ rõ IMEI bị xung đột');

    // -------------------------------------------------------------
    // TEST 5: Tra cứu thông tin bảo hành máy (traCuuBaoHanh)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Tra cứu bảo hành máy theo IMEI (traCuuBaoHanh) ---');
    const lookupResult = await BaoHanhService.traCuuBaoHanh(imeiToSell);
    assert(lookupResult.imei === imeiToSell, `Tra cứu đúng IMEI: ${lookupResult.imei}`);
    assert(lookupResult.daBan === true, 'Xác nhận máy đã bán');
    assert(lookupResult.thongTinBanHang !== null, 'Lấy được thông tin hóa đơn và khách hàng mua');
    assert(lookupResult.baoHanh.conHanBaoHanh === true, `Máy còn trong thời hạn bảo hành (${lookupResult.baoHanh.soNgayConLai} ngày)`);

    // -------------------------------------------------------------
    // TEST 6: Tiếp nhận Bảo hành cho máy chưa bán -> Bị chặn
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Chặn tiếp nhận bảo hành cho máy chưa bán ---');
    const testImeiUnsold = 'TUAN_UNSOLD_' + Date.now().toString().slice(-6);
    const mayChuaBan = await MayImei.create({
      imei: testImeiUnsold,
      sanPham: spIphone._id,
      giaNhap: 26500000,
      mauSac: 'Titan Trắng',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    let unsoldErr = null;
    try {
      await BaoHanhService.tiepNhanBaoHanh({
        imei: mayChuaBan.imei,
        moTaLoi: 'Máy lỗi chưa bán',
        nhanVien: nv._id
      }, nv);
    } catch (err) {
      unsoldErr = err;
    }
    assert(unsoldErr !== null && unsoldErr.message.includes('chưa bán'), 'Chặn tiếp nhận bảo hành thành công với thông báo rõ ràng');

    // -------------------------------------------------------------
    // TEST 7: Tiếp nhận Bảo hành hợp lệ cho máy đã bán (tiepNhanBaoHanh)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Tiếp nhận bảo hành hợp lệ & Chuyển trạng thái IMEI ---');
    const pbhResult = await BaoHanhService.tiepNhanBaoHanh({
      imei: imeiToSell,
      moTaLoi: 'Loa trong bị rè khi nghe gọi',
      ghiChu: 'Khách yêu cầu kiểm tra kỹ',
      nhanVien: nv._id
    }, nv);

    assert(pbhResult.phieuBaoHanh.maPBH.startsWith('PBH'), `Tạo phiếu BH thành công: ${pbhResult.phieuBaoHanh.maPBH}`);
    assert(pbhResult.phieuBaoHanh.trangThai === 'Dang xu ly', 'Trạng thái phiếu BH: "Dang xu ly"');

    const mayAfterBH = await MayImei.findOne({ imei: imeiToSell });
    assert(mayAfterBH.trangThai === 'Bao hanh', `IMEI ${imeiToSell} đã chuyển trạng thái sang "Bao hanh"`);

    // -------------------------------------------------------------
    // TEST 8: Xuất linh kiện sửa chữa cho Phiếu Bảo Hành (xuatLinhKienBaoHanh)
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Xuất linh kiện thay thế & Trừ tồn kho linh kiện ---');
    const initialLkStock = lkManHinh.soLuongTon;
    const pbhId = pbhResult.phieuBaoHanh._id;

    const ctLk = await BaoHanhService.xuatLinhKienBaoHanh(pbhId, {
      linhKienId: lkManHinh._id,
      soLuong: 1,
      donGia: 0
    });

    assert(ctLk !== null && ctLk.linhKien.toString() === lkManHinh._id.toString(), 'Tạo dòng chi tiết linh kiện PBH thành công');

    const updatedLk = await LinhKien.findById(lkManHinh._id);
    assert(updatedLk.soLuongTon === initialLkStock - 1, `Tồn kho linh kiện giảm từ ${initialLkStock} -> ${updatedLk.soLuongTon}`);

    // -------------------------------------------------------------
    // TEST 9: Hoàn tất bảo hành & Trả trạng thái IMEI về 'Da ban' (hoanTatBaoHanh)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Hoàn tất bảo hành & Khôi phục trạng thái IMEI ---');
    const completedPbh = await BaoHanhService.hoanTatBaoHanh(pbhId, {
      ghiChu: 'Đã thay linh kiện, test ok trả khách',
      trangThai: 'Da sua xong'
    });

    assert(completedPbh.phieuBaoHanh.trangThai === 'Da sua xong', 'Phiếu BH chuyển sang "Da sua xong"');

    const restoredMay = await MayImei.findOne({ imei: imeiToSell });
    assert(restoredMay.trangThai === 'Da ban', `IMEI ${imeiToSell} đã được khôi phục về trạng thái "Da ban" (đã trả khách)`);

    // -------------------------------------------------------------
    // TEST 10 (Tuần 3): Bán hàng cấn trừ tiền cọc từ Đơn đặt trước
    // -------------------------------------------------------------
    console.log('\n--- TEST 10 (Tuần 3): Bán hàng cấn trừ tiền cọc Đơn đặt trước ---');
    const testImei2 = 'TUAN_COC_' + Date.now().toString().slice(-6);
    const mayChoCoc = await MayImei.create({
      imei: testImei2,
      sanPham: spIphone._id,
      giaNhap: 26500000,
      mauSac: 'Titan Xanh',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });
    const soTienCoc = 2000000;

    const donDatMoi = await DonDatHangTruoc.create({
      khachHang: kh._id,
      sanPham: spIphone._id,
      soTienCoc: soTienCoc,
      hanLay: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trangThai: 'Cho xu ly',
      ghiChu: 'Khách cọc trước 2 triệu'
    });

    const orderWithPreOrder = await HoaDonService.taoHoaDonBanHang({
      khachHang: kh._id,
      nhanVien: nv._id,
      danhSachIMEI: [mayChoCoc.imei],
      danhSachPhuKien: [],
      donDatHangId: donDatMoi._id,
      hinhThucThanhToan: 'Chuyen khoan',
      ghiChu: 'Xuất máy cho khách đã cọc'
    }, nv);

    assert(orderWithPreOrder.hoaDon.donDatHang !== null, 'Hóa đơn đã liên kết với đơn đặt trước');
    assert(orderWithPreOrder.hoaDon.tienCocDaTru === soTienCoc, `Đã cấn trừ đúng tiền cọc: ${orderWithPreOrder.hoaDon.tienCocDaTru} đ`);
    assert(orderWithPreOrder.hoaDon.soTienThanhToan === orderWithPreOrder.hoaDon.tongTien - soTienCoc, `Số tiền thực thu chính xác: ${orderWithPreOrder.hoaDon.soTienThanhToan} đ`);

    const updatedDonDat = await DonDatHangTruoc.findById(donDatMoi._id);
    assert(updatedDonDat.trangThai === 'Da nhan hang', 'Đơn đặt trước đã chuyển sang trạng thái "Da nhan hang"');

    // -------------------------------------------------------------
    // TEST 11 (Tuần 3): Concurrency Lock - Chặn bán đúp đồng thời cùng 1 IMEI
    // -------------------------------------------------------------
    console.log('\n--- TEST 11 (Tuần 3): Concurrency Lock - Chặn bán đúp đồng thời ---');
    const testImei3 = 'TUAN_LOCK_' + Date.now().toString().slice(-5);
    const mayConcurrent = await MayImei.create({
      imei: testImei3,
      sanPham: spIphone._id,
      giaNhap: 26500000,
      mauSac: 'Titan Đen',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    if (mayConcurrent) {
      const imeiConcurrent = mayConcurrent.imei;
      
      const [req1, req2] = await Promise.allSettled([
        HoaDonService.taoHoaDonBanHang({
          khachHang: kh._id,
          nhanVien: nv._id,
          danhSachIMEI: [imeiConcurrent],
          danhSachPhuKien: []
        }, nv),
        HoaDonService.taoHoaDonBanHang({
          khachHang: kh._id,
          nhanVien: nv._id,
          danhSachIMEI: [imeiConcurrent],
          danhSachPhuKien: []
        }, nv)
      ]);

      const successCount = [req1, req2].filter(r => r.status === 'fulfilled').length;
      const conflictCount = [req1, req2].filter(r => r.status === 'rejected' && r.reason.statusCode === 409).length;

      assert(successCount === 1, `Chỉ có duy nhất 1 giao dịch bán thành công (Kết quả: ${successCount})`);
      assert(conflictCount === 1, `Giao dịch thứ 2 bị chặn với mã lỗi 409 Conflict (Kết quả: ${conflictCount})`);
    }

    // -------------------------------------------------------------
    // TEST 12 (Tuần 4): Bán hàng tự động sinh Phiếu Thu Sổ Quỹ (Vượng)
    // -------------------------------------------------------------
    console.log('\n--- TEST 12 (Tuần 4): Tích hợp Bán hàng -> Tự sinh Phiếu Thu Sổ Quỹ ---');
    const testImeiThu = 'TUAN_THU_' + Date.now().toString().slice(-5);
    const mayThu = await MayImei.create({
      imei: testImeiThu,
      sanPham: spIphone._id,
      giaNhap: 26500000,
      mauSac: 'Titan Tự Nhiên',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    const orderThu = await HoaDonService.taoHoaDonBanHang({
      khachHang: kh._id,
      nhanVien: nv._id,
      danhSachIMEI: [mayThu.imei],
      hinhThucThanhToan: 'Chuyen khoan',
      ghiChu: 'Bán hàng thu tiền qua chuyển khoản'
    }, nv);

    const phieuThuLienKet = await PhieuThu.findOne({ hoaDon: orderThu.hoaDon._id });
    assert(phieuThuLienKet !== null, 'Hệ thống tự động sinh Phiếu Thu trong Sổ quỹ');
    assert(phieuThuLienKet && phieuThuLienKet.soTien === orderThu.hoaDon.soTienThanhToan, 'Số tiền trên Phiếu Thu khớp 100% với số tiền thanh toán của Hóa đơn');

    // -------------------------------------------------------------
    // TEST 13 (Tuần 4): Bán hàng Ghi nợ -> Tự sinh Công Nợ Khách Hàng (An)
    // -------------------------------------------------------------
    console.log('\n--- TEST 13 (Tuần 4): Tích hợp Bán hàng Ghi nợ -> Tự sinh Công Nợ KH ---');
    const testImeiNo = 'TUAN_NO_' + Date.now().toString().slice(-5);
    const mayNo = await MayImei.create({
      imei: testImeiNo,
      sanPham: spIphone._id,
      giaNhap: 26500000,
      mauSac: 'Titan Tự Nhiên',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    const orderNo = await HoaDonService.taoHoaDonBanHang({
      khachHang: kh._id,
      nhanVien: nv._id,
      danhSachIMEI: [mayNo.imei],
      hinhThucThanhToan: 'Cong no',
      ghiChu: 'Khách mua trả chậm ghi nợ'
    }, nv);

    const congNoLienKet = await CongNo.findOne({ hoaDon: orderNo.hoaDon._id });
    assert(congNoLienKet !== null, 'Tự động tạo hồ sơ Công Nợ cho Khách Hàng');
    assert(congNoLienKet && congNoLienKet.loaiDoiTuong === 'KhachHang', 'Loại đối tượng công nợ: "KhachHang"');
    assert(congNoLienKet && congNoLienKet.soTienNo === orderNo.hoaDon.soTienThanhToan, 'Số tiền công nợ khớp với hóa đơn');

    // -------------------------------------------------------------
    // TEST 14 (Tuần 4): Tra cứu danh sách IMEI khả dụng cho POS
    // -------------------------------------------------------------
    console.log('\n--- TEST 14 (Tuần 4): Tra cứu IMEI khả dụng cho POS bán hàng ---');
    const imeiListKhaDung = await HoaDonService.layImeiKhaDung({ search: 'Titan' });
    assert(Array.isArray(imeiListKhaDung), 'layImeiKhaDung trả về danh sách dạng mảng');
    assert(imeiListKhaDung.every(m => m.trangThai === 'Con hang'), 'Tất cả máy trả về đều có trạng thái "Con hang"');

    // -------------------------------------------------------------
    // TEST 15 (Tuần 4): Kiểm tra điều kiện đổi trả theo IMEI (Hỗ trợ Việt)
    // -------------------------------------------------------------
    console.log('\n--- TEST 15 (Tuần 4): Kiểm tra điều kiện đổi trả theo IMEI (Hỗ trợ Việt) ---');
    const checkDoiTra = await HoaDonService.kiemTraImeiDoiTra(imeiToSell);
    assert(checkDoiTra.conHanDoiTra === true, 'Máy vừa bán còn trong thời hạn 30 ngày đổi trả');
    assert(checkDoiTra.hoaDon !== null, 'Lấy được thông tin hóa đơn gốc đã mua máy');
    assert(checkDoiTra.donGiaBan > 0, 'Lấy được đơn giá bán ban đầu để tính bù/hoàn tiền chênh lệch');

    // -------------------------------------------------------------
    // TEST 16 (Tuần 4): Thống kê bán hàng nhanh trong ngày
    // -------------------------------------------------------------
    console.log('\n--- TEST 16 (Tuần 4): Thống kê bán hàng nhanh ---');
    const thongKe = await HoaDonService.getThongKeNhanh();
    assert(thongKe.soHoaDonHomNay > 0, `Đã ghi nhận ${thongKe.soHoaDonHomNay} hóa đơn bán hôm nay`);
    assert(thongKe.doanhThuHomNay > 0, `Doanh thu hôm nay: ${thongKe.doanhThuHomNay.toLocaleString('vi-VN')} đ`);

    // -------------------------------------------------------------
    // TEST 17 (Tuần 5-6): Bán hàng kèm Chiết khấu / Giảm giá (soTienGiam)
    // -------------------------------------------------------------
    console.log('\n--- TEST 17 (Tuần 5-6): Bán hàng kèm Giảm giá / Chiết khấu ---');
    const testImeiGiam = 'TUAN_DISC_' + Date.now().toString().slice(-6);
    const mayGiam = await MayImei.create({
      imei: testImeiGiam,
      sanPham: spIphone._id,
      giaNhap: 26500000,
      mauSac: 'Titan Tự Nhiên',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    const discountAmount = 500000;
    const orderDiscount = await HoaDonService.taoHoaDonBanHang({
      khachHang: kh._id,
      nhanVien: nv._id,
      danhSachIMEI: [mayGiam.imei],
      soTienGiam: discountAmount,
      hinhThucThanhToan: 'Tien mat',
      ghiChu: 'Áp dụng voucher giảm giá khai trương'
    }, nv);

    assert(orderDiscount.hoaDon.soTienGiam === discountAmount, `Ghi nhận chính xác số tiền giảm: ${orderDiscount.hoaDon.soTienGiam} đ`);
    assert(orderDiscount.hoaDon.soTienThanhToan === orderDiscount.hoaDon.tongTien - discountAmount, `Thực thu trừ đúng giảm giá: ${orderDiscount.hoaDon.soTienThanhToan} đ`);

    // -------------------------------------------------------------
    // TEST 18 (Tuần 5-6): Thống kê KPI Doanh số theo Nhân viên
    // -------------------------------------------------------------
    console.log('\n--- TEST 18 (Tuần 5-6): Thống kê KPI Doanh số theo Nhân viên ---');
    const kpiStats = await HoaDonService.getDoanhSoNhanVien();
    assert(Array.isArray(kpiStats), 'getDoanhSoNhanVien trả về danh sách dạng mảng');
    assert(kpiStats.length > 0, `Tìm thấy ${kpiStats.length} nhân viên trong báo cáo KPI`);
    const myStats = kpiStats.find(s => s.nhanVienId.toString() === nv._id.toString());
    assert(myStats !== undefined, 'Tìm thấy nhân viên bán hàng trong danh sách KPI');
    assert(myStats && myStats.tongDoanhThu > 0, `Nhân viên ${nv.hoTen} có tổng doanh số: ${myStats?.tongDoanhThu?.toLocaleString('vi-VN')} đ`);

    // -------------------------------------------------------------
    // TEST 19 (Tuần 5-6): Thống kê Top Sản phẩm bán chạy nhất
    // -------------------------------------------------------------
    console.log('\n--- TEST 19 (Tuần 5-6): Thống kê Top Sản phẩm bán chạy ---');
    const topProducts = await HoaDonService.getTopSanPham({ limit: 5 });
    // -------------------------------------------------------------
    // TEST 20: Kiểm thử Danh mục & Phụ kiện & Sản phẩm & IMEI data contract
    // -------------------------------------------------------------
    console.log('\n--- TEST 20: Kiểm thử Danh mục, Phụ kiện, Sản phẩm, IMEI Data Contract ---');
    const { DanhMucService, PhuKienService, SanPhamService, MayImeiService } = require('../src/services');
    
    // 1. Danh mục
    const allDMs = await DanhMucService.getAllDanhMucs();
    assert(Array.isArray(allDMs), 'getAllDanhMucs trả về danh sách dạng mảng');
    assert(allDMs.length > 0, `Tìm thấy ${allDMs.length} danh mục trong hệ thống`);
    const hasCounts = allDMs.some(dm => dm.countSP > 0 || dm.countPK > 0);
    assert(hasCounts, 'DanhMucService tính đúng số lượng countSP / countPK cho danh mục');

    // 2. Phụ kiện
    const pkRes = await PhuKienService.getAllPhuKiens();
    assert(Array.isArray(pkRes.phuKiens), 'PhuKienService.getAllPhuKiens trả về mảng phuKiens');
    assert(pkRes.phuKiens.length > 0, `Tìm thấy ${pkRes.phuKiens.length} phụ kiện trong kho`);

    // 3. Sản phẩm
    const spRes = await SanPhamService.getAllSanPhams();
    assert(Array.isArray(spRes.sanPhams), 'SanPhamService.getAllSanPhams trả về mảng sanPhams');
    assert(spRes.sanPhams.length > 0, `Tìm thấy ${spRes.sanPhams.length} model sản phẩm`);
    assert(spRes.sanPhams[0].soLuongTon !== undefined, 'Sản phẩm có thuộc tính soLuongTon');

    // Test Soft Delete & ObjectId validation (PR #18)
    let errIdInvalid = null;
    try {
      await SanPhamService.deleteSanPham('invalid_id_123');
    } catch (e) {
      errIdInvalid = e;
    }
    assert(errIdInvalid !== null && errIdInvalid.statusCode === 400, 'Chặn xóa sản phẩm với ID không hợp lệ (400 Bad Request)');

    const dmFirst = (await DanhMucService.getAllDanhMucs())[0];
    const spTestXoa = await SanPhamService.createSanPham({
      tenMay: 'Test Soft Delete PR18',
      danhMuc: dmFirst._id,
      hang: 'TestBrand',
      giaBan: 15000000
    });
    const delRes = await SanPhamService.deleteSanPham(spTestXoa._id);
    assert(delRes.success === true, 'Xóa mềm (Soft delete) sản phẩm thành công');

    const spSauXoa = await SanPham.findById(spTestXoa._id);
    assert(spSauXoa.status === false, 'Trạng thái sản phẩm được cập nhật thành status: false');

    const spListSauXoa = await SanPhamService.getAllSanPhams({ search: 'Test Soft Delete PR18' });
    assert(spListSauXoa.sanPhams.length === 0, 'Sản phẩm đã ẩn không xuất hiện trong getAllSanPhams');

    // Dọn dẹp bản ghi test
    await SanPham.findByIdAndDelete(spTestXoa._id);

    // Test Ràng buộc Giá Gốc & Dung Lượng (PR #19)
    console.log('\n--- TEST BỔ SUNG PR #19: Ràng buộc Giá Gốc & Giá Bán ---');
    let errGiaBanBeHonGiaGoc = null;
    try {
      await SanPhamService.createSanPham({
        tenMay: 'Test Invalid Gia PR19',
        danhMuc: dmFirst._id,
        hang: 'Apple',
        giaGoc: 30000000,
        giaBan: 25000000 // Giá bán < Giá gốc -> Chặn
      });
    } catch (e) {
      errGiaBanBeHonGiaGoc = e;
    }
    assert(errGiaBanBeHonGiaGoc !== null && errGiaBanBeHonGiaGoc.statusCode === 400, 'Chặn tạo sản phẩm khi Giá bán <= Giá gốc (400 Bad Request)');
    assert(errGiaBanBeHonGiaGoc && errGiaBanBeHonGiaGoc.message.includes('Giá bán niêm yết phải lớn hơn Giá gốc'), 'Thông báo lỗi chuẩn xác ràng buộc giá');

    const spHopLePR19 = await SanPhamService.createSanPham({
      tenMay: 'Test Hop Le PR19',
      danhMuc: dmFirst._id,
      hang: 'Apple',
      giaGoc: 20000000,
      giaBan: 28000000,
      dungLuong: '256GB'
    });
    assert(spHopLePR19.giaGoc === 20000000, 'Lưu đúng trường giaGoc trong database');
    assert(spHopLePR19.dungLuong === '256GB', 'Lưu đúng trường dungLuong trong database');

    let errUpdateGia = null;
    try {
      await SanPhamService.updateSanPham(spHopLePR19._id, { giaBan: 19000000 }); // nhỏ hơn giaGoc hiện tại (20tr)
    } catch (e) {
      errUpdateGia = e;
    }
    assert(errUpdateGia !== null && errUpdateGia.statusCode === 400, 'Chặn cập nhật sản phẩm khi giá bán mới <= giá gốc');

    await SanPham.findByIdAndDelete(spHopLePR19._id);

    // -------------------------------------------------------------
    // TEST BỔ SUNG PR #20 & #21: Chống trùng lặp SĐT/Email/CCCD & POS Guest Checkout
    // -------------------------------------------------------------
    console.log('\n--- TEST BỔ SUNG PR #20 & #21: Chống trùng lặp & Bán hàng Khách mới ---');
    
    // 1. Chống trùng SĐT Khách hàng
    const testPhone = '0988776655';
    const khFirst = await KhachHangService.createKhachHang({
      hoTen: 'Khach Hang Test Unique',
      sdt: testPhone,
      email: 'unique1@test.com',
      cccd: '001099000111'
    });

    let errDupPhone = null;
    try {
      await KhachHangService.createKhachHang({
        hoTen: 'Khach Hang Duplicate Phone',
        sdt: testPhone, // SĐT đã tồn tại
        email: 'unique2@test.com'
      });
    } catch (e) {
      errDupPhone = e;
    }
    assert(errDupPhone !== null && errDupPhone.statusCode === 409, 'Chặn tạo khách hàng trùng SĐT (409 Conflict)');

    // 2. Chống trùng Email Khách hàng
    let errDupEmail = null;
    try {
      await KhachHangService.createKhachHang({
        hoTen: 'Khach Hang Duplicate Email',
        sdt: '0911223344',
        email: 'unique1@test.com' // Email đã tồn tại
      });
    } catch (e) {
      errDupEmail = e;
    }
    assert(errDupEmail !== null && errDupEmail.statusCode === 409, 'Chặn tạo khách hàng trùng Email (409 Conflict)');

    // 3. Chống trùng CCCD Khách hàng
    let errDupCccd = null;
    try {
      await KhachHangService.createKhachHang({
        hoTen: 'Khach Hang Duplicate CCCD',
        sdt: '0922334455',
        cccd: '001099000111' // CCCD đã tồn tại
      });
    } catch (e) {
      errDupCccd = e;
    }
    assert(errDupCccd !== null && errDupCccd.statusCode === 409, 'Chặn tạo khách hàng trùng CCCD (409 Conflict)');

    // 4. POS Bán Hàng trực tiếp cho Khách mới (Guest Checkout)
    const guestPhone = '0977889911';
    const guestImei = 'TUAN_GUEST_' + Date.now().toString().slice(-6);
    await MayImei.create({
      imei: guestImei,
      sanPham: spIphone._id,
      giaNhap: 26000000,
      trangThai: 'Con hang'
    });

    const guestOrderRes = await HoaDonService.taoHoaDonBanHang({
      guestName: 'Nguyễn Văn Khách Mới',
      guestPhone: guestPhone,
      guestCccd: '036099887766',
      danhSachIMEI: [guestImei],
      danhSachPhuKien: []
    }, nv);

    assert(guestOrderRes.hoaDon !== undefined, 'Tạo hóa đơn POS khách mới thành công');
    const createdGuest = await KhachHang.findOne({ sdt: guestPhone }).lean();
    assert(createdGuest !== null, 'Hệ thống tự động sinh tài khoản Khách Hàng mới cho khách vãng lai');
    assert(createdGuest && createdGuest.cccd === '036099887766', 'Lưu chính xác CCCD khách mới');

    // Dọn dẹp bản ghi test
    await KhachHang.findByIdAndDelete(khFirst._id);
    await KhachHang.findByIdAndDelete(createdGuest._id);

    // 4. Máy IMEI
    const imeiRes = await MayImeiService.getAllImeis();
    assert(Array.isArray(imeiRes.imeis), 'MayImeiService.getAllImeis trả về mảng imeis');
    assert(imeiRes.imeis.length > 0, `Tìm thấy ${imeiRes.imeis.length} máy IMEI`);

    // -------------------------------------------------------------
    // TEST 21: Kiểm thử biên (Edge Cases) - Phụ kiện vượt tồn, Quá hạn BH, XSS
    // -------------------------------------------------------------
    console.log('\n--- TEST 21: Kiểm thử biên (Edge Cases) - Phụ kiện vượt tồn, Quá hạn BH, XSS ---');
    
    // 1. Lỗi khi bán phụ kiện số lượng vượt tồn kho
    let errVotTonKho = null;
    try {
      await HoaDonService.taoHoaDonBanHang({
        khachHang: kh._id,
        nhanVien: nv._id,
        danhSachIMEI: [],
        danhSachPhuKien: [{ phuKien: pkSac._id, soLuong: 999999 }], // Chắc chắn vượt tồn kho
        hinhThucThanhToan: 'Tien mat'
      }, nv);
    } catch (e) {
      errVotTonKho = e;
    }
    assert(errVotTonKho !== null && errVotTonKho.statusCode === 400, 'Chặn tạo hóa đơn khi bán phụ kiện vượt số lượng tồn kho (400 Bad Request)');
    assert(errVotTonKho && errVotTonKho.message.includes('không đủ tồn kho'), 'Thông báo lỗi chỉ rõ sản phẩm không đủ số lượng');

    // 2. Chặn tiếp nhận bảo hành máy đã hết hạn
    const expiredImei = 'TUAN_EXP_' + Date.now().toString().slice(-5);
    const mayExpired = await MayImei.create({
      imei: expiredImei,
      sanPham: spIphone._id,
      giaNhap: 26000000,
      trangThai: 'Con hang'
    });
    
    // Bán máy 
    const orderExpired = await HoaDonService.taoHoaDonBanHang({
      khachHang: kh._id,
      nhanVien: nv._id,
      danhSachIMEI: [mayExpired.imei],
      danhSachPhuKien: [],
      hinhThucThanhToan: 'Tien mat'
    }, nv);
    
    // Ghi đè ngày lập hóa đơn để giả lập quá hạn bảo hành (lùi về 5 năm trước)
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 5);
    await HoaDon.findByIdAndUpdate(orderExpired.hoaDon._id, { ngayLap: pastDate });
    
    let errExpired = null;
    try {
      await BaoHanhService.tiepNhanBaoHanh({
        imei: mayExpired.imei,
        moTaLoi: 'Lỗi phần cứng sau 5 năm',
        nhanVien: nv._id
      }, nv);
    } catch (e) {
      errExpired = e;
    }
    assert(errExpired !== null && errExpired.statusCode === 400, 'Chặn tiếp nhận bảo hành khi máy đã hết hạn (400 Bad Request)');
    assert(errExpired && errExpired.message.toLowerCase().includes('hết hạn bảo hành'), 'Thông báo báo lỗi từ chối vì đã hết thời gian BH');

    // 3. Test XSS trên trường Ghi chú hóa đơn (Theo rule 4.4, Backend lưu nguyên gốc)
    const xssImei = 'TUAN_XSS_' + Date.now().toString().slice(-5);
    await MayImei.create({
      imei: xssImei,
      sanPham: spIphone._id,
      giaNhap: 26000000,
      trangThai: 'Con hang'
    });
    const orderXSS = await HoaDonService.taoHoaDonBanHang({
      khachHang: kh._id,
      nhanVien: nv._id,
      danhSachIMEI: [xssImei],
      danhSachPhuKien: [],
      hinhThucThanhToan: 'Tien mat',
      ghiChu: '<script>alert("Hacked POS")</script> XSS Test payload'
    }, nv);
    assert(orderXSS.hoaDon.ghiChu === '<script>alert("Hacked POS")</script> XSS Test payload', 'Dữ liệu XSS được DB lưu giữ, phó thác việc escape cho Frontend xử lý (Quy tắc 4.4)');

    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TẤT CẢ CÁC TEST CASES NÂNG CAO CỦA NGUYỄN QUANG TUẤN ĐÃ VƯỢT QUA 100%!');
      process.exit(0);
    } else {
      console.error('❌ CÓ TEST CASE BỊ LỖI!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Lỗi ngoại lệ trong quá trình chạy test:', error);
    process.exit(1);
  }
}

runTests();
