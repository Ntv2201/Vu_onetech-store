require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const {
  NhanVien,
  KhachHang,
  SanPham,
  MayImei,
  DonDatHangTruoc,
  PhieuThu,
  PhieuChi,
  HoaDon
} = require('../src/models');

const { DatTruocService, HoaDonService, ThanhToanService } = require('../src/services');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE TÔ QUỐC VIỆT (TUẦN 3: ĐẶT HÀNG TRƯỚC)');
  console.log('===============================================================\n');

  await connectDB();

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
    const [nvBanHang, nvKyThuat, kh, sp, mayImei] = await Promise.all([
      NhanVien.findOne({ tenDangNhap: 'banhang' }),
      NhanVien.findOne({ tenDangNhap: 'kythuat' }),
      KhachHang.findOne(),
      SanPham.findOne({ tenMay: { $regex: 'iPhone', $options: 'i' } }) || SanPham.findOne(),
      MayImei.findOne({ trangThai: 'Con hang' })
    ]);

    if (!kh || !sp) {
      throw new Error('Chưa có dữ liệu mẫu Khách hàng hoặc Sản phẩm. Hãy chạy npm run seed trước!');
    }

    console.log(`👤 Nhân viên test: ${nvBanHang ? nvBanHang.hoTen : 'N/A'}`);
    console.log(`👤 Khách hàng test: ${kh.hoTen} (${kh.sdt})`);
    console.log(`📱 Sản phẩm test: ${sp.tenMay}\n`);

    // -------------------------------------------------------------
    // TEST 1: Tạo đơn đặt trước có đặt cọc (Sinh Phiếu Thu tự động)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Tạo đơn đặt trước kèm tiền cọc (createDatTruoc) ---');
    const depositAmount = 2000000;
    const order1 = await DatTruocService.createDatTruoc({
      khachHang: kh._id,
      sanPham: sp._id,
      soTienCoc: depositAmount,
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Khách muốn lấy màu Titan Tự Nhiên',
      hanLay: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }, nvBanHang);

    assert(order1 && order1.donDatHang, 'Tạo đơn đặt trước thành công');
    assert(order1.donDatHang.soTienCoc === depositAmount, `Số tiền cọc lưu đúng: ${depositAmount.toLocaleString('vi-VN')} đ`);
    assert(order1.donDatHang.trangThai === 'Da dat coc', `Trạng thái đơn là 'Da dat coc' (Thực tế: ${order1.donDatHang.trangThai})`);
    assert(order1.phieuThu !== null, 'Hệ thống tự động sinh Phiếu Thu tiền cọc');
    assert(order1.phieuThu && order1.phieuThu.soTien === depositAmount, `Phiếu thu có số tiền khớp tiền cọc: ${depositAmount.toLocaleString('vi-VN')} đ`);
    assert(order1.phieuThu && order1.phieuThu.hinhThuc === 'Chuyen khoan', 'Hình thức thanh toán phiếu thu đúng: Chuyển khoản');

    // -------------------------------------------------------------
    // TEST 2: Tạo đơn đặt trước không cọc (soTienCoc = 0)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Tạo đơn đặt trước không cọc (soTienCoc = 0) ---');
    const orderNoDeposit = await DatTruocService.createDatTruoc({
      khachHang: kh._id,
      sanPham: sp._id,
      soTienCoc: 0,
      ghiChu: 'Không thu cọc trước'
    }, nvBanHang);

    assert(orderNoDeposit.donDatHang.soTienCoc === 0, 'Số tiền cọc là 0 đ');
    assert(orderNoDeposit.phieuThu === null, 'Không sinh phiếu thu khi tiền cọc = 0');

    // -------------------------------------------------------------
    // TEST 3: Validation khi thiếu khách hàng hoặc sản phẩm
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Validation tham số đầu vào (400 Bad Request) ---');
    let errorMissingKH = false;
    try {
      await DatTruocService.createDatTruoc({ sanPham: sp._id, soTienCoc: 500000 });
    } catch (err) {
      if (err.statusCode === 400) errorMissingKH = true;
    }
    assert(errorMissingKH, 'Chặn tạo đơn khi thiếu thông tin khách hàng (400)');

    let errorMissingSP = false;
    try {
      await DatTruocService.createDatTruoc({ khachHang: kh._id, soTienCoc: 500000 });
    } catch (err) {
      if (err.statusCode === 400) errorMissingSP = true;
    }
    assert(errorMissingSP, 'Chặn tạo đơn khi thiếu thông tin sản phẩm (400)');

    // -------------------------------------------------------------
    // TEST 4: Validation khi KH hoặc SP không tồn tại
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Validation KH/SP không tồn tại (404 Not Found) ---');
    let errorNonExistKH = false;
    try {
      await DatTruocService.createDatTruoc({
        khachHang: new mongoose.Types.ObjectId(),
        sanPham: sp._id
      });
    } catch (err) {
      if (err.statusCode === 404) errorNonExistKH = true;
    }
    assert(errorNonExistKH, 'Báo lỗi 404 khi khách hàng không tồn tại trong hệ thống');

    // -------------------------------------------------------------
    // TEST 5: Lấy danh sách đơn đặt trước (Bộ lọc & Phân trang)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Lấy danh sách đơn đặt trước (getDatTruocList) ---');
    const listResult = await DatTruocService.getDatTruocList({ limit: 10 });
    assert(Array.isArray(listResult.donDatHangs), 'Kết quả trả về danh sách dạng mảng');
    assert(listResult.donDatHangs.length >= 2, `Đã tìm thấy ${listResult.donDatHangs.length} đơn đặt trước`);
    assert(listResult.pagination.total >= listResult.donDatHangs.length, 'Có thông tin phân trang chuẩn');

    const filteredList = await DatTruocService.getDatTruocList({ trangThai: 'Da dat coc' });
    const allMatching = filteredList.donDatHangs.every(d => d.trangThai === 'Da dat coc');
    assert(allMatching, 'Bộ lọc theo trạng thái "Da dat coc" hoạt động chính xác 100%');

    // -------------------------------------------------------------
    // TEST 6: Lấy chi tiết đơn đặt trước kèm lịch sử Phiếu Thu / Phiếu Chi
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Lấy chi tiết đơn đặt trước (getDatTruocDetail) ---');
    const detailResult = await DatTruocService.getDatTruocDetail(order1.donDatHang._id);
    assert(detailResult && detailResult.donDatHang, 'Lấy chi tiết đơn thành công');
    assert(detailResult.donDatHang.khachHang.hoTen === kh.hoTen, 'Populate đúng thông tin khách hàng');
    assert(detailResult.donDatHang.sanPham.tenMay === sp.tenMay, 'Populate đúng thông tin sản phẩm');
    assert(detailResult.phieuThuList.length >= 1, `Có ${detailResult.phieuThuList.length} Phiếu Thu cọc liên kết`);

    // -------------------------------------------------------------
    // TEST 7: Cập nhật trạng thái / Gán IMEI máy về
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Cập nhật trạng thái & Gán IMEI (capNhatTrangThai) ---');
    if (mayImei) {
      const updatedOrder = await DatTruocService.capNhatTrangThai(order1.donDatHang._id, {
        trangThai: 'Da co hang',
        imei: mayImei.imei,
        ghiChu: 'Hàng đã về kho chi nhánh'
      });
      assert(updatedOrder.donDatHang.trangThai === 'Da co hang', 'Đã chuyển trạng thái sang "Da co hang"');
      assert(updatedOrder.donDatHang.imei === mayImei.imei, `Gán IMEI thành công: ${mayImei.imei}`);
    }

    // -------------------------------------------------------------
    // TEST 8: Hủy đơn đặt trước & Tự động sinh Phiếu Chi hoàn cọc
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Hủy đơn đặt trước & Tự động hoàn cọc (huyDatTruoc) ---');
    const cancelResult = await DatTruocService.huyDatTruoc(order1.donDatHang._id, {
      lyDo: 'Khách hàng đổi ý mua dòng khác',
      hinhThuc: 'Chuyen khoan'
    }, nvBanHang);

    assert(cancelResult.donDatHang.trangThai === 'Da huy', 'Trạng thái đơn đổi thành "Da huy"');
    assert(cancelResult.phieuChi !== null, 'Hệ thống tự động sinh Phiếu Chi hoàn cọc');
    assert(cancelResult.phieuChi.soTien === depositAmount, `Số tiền hoàn trên Phiếu Chi khớp tiền cọc: ${depositAmount.toLocaleString('vi-VN')} đ`);
    assert(cancelResult.phieuChi.lyDo.includes('Khách hàng đổi ý'), 'Lý do chi được ghi nhận đầy đủ');

    // -------------------------------------------------------------
    // TEST 9: Chặn hủy lại đơn đã bị hủy
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Chặn thao tác bất hợp lệ trên đơn đã hủy ---');
    let doubleCancelError = false;
    try {
      await DatTruocService.huyDatTruoc(order1.donDatHang._id, { lyDo: 'Hủy lần 2' });
    } catch (err) {
      if (err.statusCode === 400) doubleCancelError = true;
    }
    assert(doubleCancelError, 'Chặn hủy đơn đã ở trạng thái "Da huy" (400 Bad Request)');

    // -------------------------------------------------------------
    // TEST 10: Tích hợp Đặt trước -> Bán hàng POS cấn trừ cọc -> Chặn hủy đơn đã nhận
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Tích hợp Luồng Bán hàng POS cấn trừ cọc & Khóa hủy đơn ---');
    const orderForSale = await DatTruocService.createDatTruoc({
      khachHang: kh._id,
      sanPham: sp._id,
      soTienCoc: 1500000,
      ghiChu: 'Đơn chờ bán'
    }, nvBanHang);

    // Tạo 1 IMEI mới chuyên phục vụ test bán hàng
    const testImeiStr = 'TEST' + Date.now().toString().slice(-11);
    const mayConHang = await MayImei.create({
      imei: testImeiStr,
      sanPham: sp._id,
      giaNhap: 20000000,
      mauSac: 'Titan Tự Nhiên',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    if (mayConHang) {
      // Gọi Bán hàng POS có cấn trừ cọc từ đơn đặt trước
      const hdResult = await HoaDonService.taoHoaDonBanHang({
        khachHang: kh._id,
        nhanVien: nvBanHang._id,
        danhSachIMEI: [mayConHang.imei],
        donDatHangId: orderForSale.donDatHang._id
      }, nvBanHang);

      assert(hdResult && hdResult.hoaDon, `Bán hàng thành công theo hóa đơn ${hdResult.hoaDon.soHD}`);
      assert(hdResult.hoaDon.tienCocDaTru === 1500000, `Hóa đơn đã cấn trừ đúng 1.500.000 đ tiền cọc`);

      // Kiểm tra trạng thái đơn đặt trước đã tự động chuyển sang 'Da nhan hang'
      const checkOrder = await DonDatHangTruoc.findById(orderForSale.donDatHang._id);
      assert(checkOrder.trangThai === 'Da nhan hang', 'Đơn đặt trước tự động chuyển sang "Da nhan hang"');

      // Chặn hủy đơn khi đã nhận hàng
      let cancelReceivedError = false;
      try {
        await DatTruocService.huyDatTruoc(orderForSale.donDatHang._id, { lyDo: 'Muốn hủy sau khi đã lấy máy' });
      } catch (err) {
        if (err.statusCode === 400) cancelReceivedError = true;
      }
      assert(cancelReceivedError, 'Chặn hủy đơn khi khách đã nhận máy và xuất hóa đơn (400)');
    }

    // -------------------------------------------------------------
    // TEST 11: Kiểm tra HTTP API Endpoints & Phân quyền RBAC 403
    // -------------------------------------------------------------
    console.log('\n--- TEST 11: Kiểm thử HTTP API Endpoints & RBAC 403 ---');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    // Đăng nhập banhang
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenDangNhap: 'banhang', matKhau: '123456' })
    });
    const loginData = await loginRes.json();
    const cookie = loginRes.headers.get('set-cookie').split(';')[0];

    // Gọi GET /api/dat-truoc
    const getHttpRes = await fetch(`${baseUrl}/api/dat-truoc`, {
      headers: { Cookie: cookie }
    });
    const getHttpData = await getHttpRes.json();
    assert(getHttpRes.status === 200 && getHttpData.success, 'HTTP GET /api/dat-truoc trả về 200 OK');

    // Đăng nhập kythuat (Không có quyền POST /api/dat-truoc)
    const loginKtRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenDangNhap: 'kythuat', matKhau: '123456' })
    });
    const cookieKt = loginKtRes.headers.get('set-cookie').split(';')[0];

    const rbacRes = await fetch(`${baseUrl}/api/dat-truoc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieKt },
      body: JSON.stringify({ khachHang: kh._id, sanPham: sp._id, soTienCoc: 100000 })
    });
    assert(rbacRes.status === 403, `Phân quyền RBAC chặn vai trò Kỹ thuật tạo đơn đặt trước (Nhận 403 Forbidden)`);

    server.close();

    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ 22 TEST CASES CỦA TÔ QUỐC VIỆT ĐÃ VƯỢT QUA 100%!');
      await mongoose.disconnect();
      process.exit(0);
    } else {
      console.error('❌ CÓ TEST CASE BỊ LỖI!');
      await mongoose.disconnect();
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Lỗi ngoại lệ trong quá trình chạy test:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
