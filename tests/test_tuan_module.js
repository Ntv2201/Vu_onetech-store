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
  CT_PBH_LinhKien
} = require('../src/models');

const { HoaDonService, BaoHanhService } = require('../src/services');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE NGUYỄN QUANG TUẤN (OOP & BÁN HÀNG - BẢO HÀNH)');
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
    // Tạo 1 IMEI mới riêng biệt cho luồng test bán hàng & bảo hành
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
    const mayChuaBan = await MayImei.findOne({ trangThai: 'Con hang' });
    let unsoldErr = null;
    if (mayChuaBan) {
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
    }

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
    const { DonDatHangTruoc } = require('../src/models');
    
    // Tạo 1 máy còn hàng để bán kèm cọc
    const testImei2 = 'TUAN_COC_' + Date.now().toString().slice(-6);
    const mayChoCoc = await MayImei.create({
      imei: testImei2,
      sanPham: spIphone._id,
      giaNhap: 26500000,
      mauSac: 'Titan Xanh',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });
    const giaMay = spIphone.giaBan || 29990000;
    const soTienCoc = 2000000;

    // Tạo đơn đặt trước mẫu
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
      hinhThucThanhToan: 'Da thanh toan',
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
      
      // Gửi 2 request bán hàng song song cùng 1 lúc
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

    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TẤT CẢ CÁC TEST CASES ĐÃ VƯỢT QUA 100%!');
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
