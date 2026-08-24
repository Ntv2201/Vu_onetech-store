/**
 * Test Suite: Kiểm thử Tự động Module Tuần 4 của Tô Quốc Việt
 * Trọng tâm:
 * - PUT /api/dat-truoc/:id/chuyen-hoa-don (Cấn trừ cọc -> Xuất HĐ)
 * - POST /api/doi-tra (Đổi máy đắt hơn / rẻ hơn / bằng giá / trả hàng hoàn tiền)
 * - Validation 30 ngày & IMEI hóa đơn
 * - Phân quyền RBAC 403 Forbidden
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const app = require('../src/app');
const {
  DoiTraService,
  DatTruocService,
  HoaDonService,
  ThanhToanService
} = require('../src/services');
const {
  NhanVien,
  KhachHang,
  SanPham,
  MayImei,
  HoaDon,
  CT_HoaDon_May,
  DonDatHangTruoc,
  PhieuDoiTra,
  PhieuThu,
  PhieuChi
} = require('../src/models');

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

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE TÔ QUỐC VIỆT (TUẦN 4: ĐỔI TRẢ MÁY & CẤN TRỪ CỌC)');
  console.log('===============================================================\n');

  await connectDB();

  try {
    // Chuẩn bị dữ liệu mẫu
    let nv = await NhanVien.findOne({ tenDangNhap: 'banhang' });
    let kh = await KhachHang.findOne({ sdt: '0988123456' });
    let spIphone15 = await SanPham.findOne({ tenMay: { $regex: 'iPhone 15 Pro Max', $options: 'i' } });
    let spIphone14 = await SanPham.findOne({ tenMay: { $regex: 'iPhone 14', $options: 'i' } });
    let spS24 = await SanPham.findOne({ tenMay: { $regex: 'S24 Ultra', $options: 'i' } });

    if (!nv) nv = await NhanVien.findOne();
    if (!kh) kh = await KhachHang.create({ hoTen: 'Khách Hàng Test T4', sdt: '0988999888' });
    if (!spIphone15) spIphone15 = await SanPham.findOne();
    if (!spIphone14) spIphone14 = spIphone15;
    if (!spS24) spS24 = spIphone15;

    console.log(`👤 Nhân viên test: ${nv.hoTen} (@${nv.tenDangNhap})`);
    console.log(`👤 Khách hàng test: ${kh.hoTen} (${kh.sdt})`);
    console.log(`📱 Sản phẩm test: ${spIphone15.tenMay}\n`);

    // -------------------------------------------------------------
    // TEST 1: Chuyển Đơn Đặt Trước sang Hóa Đơn POS & Cấn Trừ Cọc
    // -------------------------------------------------------------
    console.log('--- TEST 1: Chuyển đơn đặt trước sang Hóa đơn POS & Cấn trừ cọc ---');
    const testImeiPreorder = 'TEST_PRE_' + Date.now().toString().slice(-7);
    await MayImei.create({
      imei: testImeiPreorder,
      sanPham: spIphone15._id,
      giaNhap: 26500000,
      mauSac: 'Titan Tự Nhiên',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    const preOrder = await DonDatHangTruoc.create({
      khachHang: kh._id,
      sanPham: spIphone15._id,
      imei: testImeiPreorder,
      soTienCoc: 3000000,
      trangThai: 'Da co hang',
      ghiChu: 'Khách hẹn lấy máy'
    });

    const deliverResult = await DatTruocService.chuyenHoaDon(preOrder._id, {
      imei: testImeiPreorder,
      hinhThucThanhToan: 'Da thanh toan',
      ghiChu: 'Khách đến nhận máy tại quầy'
    }, nv);

    assert(deliverResult.hoaDon && deliverResult.hoaDon.soHD.startsWith('HD'), `Tạo HĐ bán hàng thành công: ${deliverResult.hoaDon.soHD}`);
    assert(deliverResult.tienCocDaTru === 3000000, `Đã cấn trừ đúng tiền cọc: ${deliverResult.tienCocDaTru.toLocaleString('vi-VN')} đ`);
    assert(deliverResult.soTienThanhToan === deliverResult.hoaDon.tongTien - 3000000, `Số tiền thực thu chính xác: ${deliverResult.soTienThanhToan.toLocaleString('vi-VN')} đ`);
    assert(deliverResult.donDatHang.trangThai === 'Da nhan hang', 'Đơn đặt trước tự động chuyển trạng thái sang "Da nhan hang"');

    const mayDelivered = await MayImei.findOne({ imei: testImeiPreorder });
    assert(mayDelivered.trangThai === 'Da ban', `IMEI ${testImeiPreorder} đã chuyển trạng thái sang "Da ban"`);

    // -------------------------------------------------------------
    // TEST 2: Validation Điều Kiện Đổi Trả - Chặn IMEI không thuộc Hóa đơn
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Validation - Chặn IMEI không thuộc Hóa đơn ---');
    let wrongImeiErr = null;
    try {
      await DoiTraService.kiemTraDieuKienDoiTra(deliverResult.hoaDon.soHD, '999999999999999');
    } catch (err) {
      wrongImeiErr = err;
    }
    assert(wrongImeiErr !== null, 'Phát hiện lỗi khi IMEI không thuộc hóa đơn');
    assert(wrongImeiErr && wrongImeiErr.statusCode === 400, 'Trả về mã lỗi 400 Bad Request');
    assert(wrongImeiErr && wrongImeiErr.message.includes('không thuộc danh sách'), 'Thông báo lỗi chỉ rõ IMEI không thuộc HĐ');

    // -------------------------------------------------------------
    // TEST 3: Validation Điều Kiện Đổi Trả - Chặn Hóa đơn quá hạn 30 ngày
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Validation - Chặn Hóa đơn quá thời hạn 30 ngày ---');
    const oldImei = 'TEST_OLD_' + Date.now().toString().slice(-7);
    await MayImei.create({
      imei: oldImei,
      sanPham: spIphone14._id,
      giaNhap: 14000000,
      trangThai: 'Da ban'
    });

    const oldInvoice = await HoaDon.create({
      soHD: 'HD_EXPIRED_' + Date.now().toString().slice(-6),
      khachHang: kh._id,
      nhanVien: nv._id,
      ngayLap: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // Đã mua 35 ngày trước
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });

    await CT_HoaDon_May.create({
      hoaDon: oldInvoice._id,
      imei: oldImei,
      donGiaBan: 16990000
    });

    let expiredErr = null;
    try {
      await DoiTraService.kiemTraDieuKienDoiTra(oldInvoice.soHD, oldImei);
    } catch (err) {
      expiredErr = err;
    }
    assert(expiredErr !== null, 'Phát hiện lỗi khi HĐ quá hạn 30 ngày');
    assert(expiredErr && expiredErr.statusCode === 400, 'Trả về mã lỗi 400 Bad Request');
    assert(expiredErr && expiredErr.message.includes('quá thời hạn đổi trả'), 'Thông báo lỗi chỉ rõ quy định tối đa 30 ngày');

    // -------------------------------------------------------------
    // TẠO HÓA ĐƠN MẪU HỢP LỆ CHO CÁC TEST ĐỔI TRẢ TIẾP THEO
    // -------------------------------------------------------------
    const imeiSold1 = 'TEST_SOLD1_' + Date.now().toString().slice(-6);
    const imeiSold2 = 'TEST_SOLD2_' + Date.now().toString().slice(-6);
    const imeiSold3 = 'TEST_SOLD3_' + Date.now().toString().slice(-6);

    await Promise.all([
      MayImei.create({ imei: imeiSold1, sanPham: spIphone14._id, giaNhap: 14000000, trangThai: 'Da ban' }),
      MayImei.create({ imei: imeiSold2, sanPham: spIphone15._id, giaNhap: 26500000, trangThai: 'Da ban' }),
      MayImei.create({ imei: imeiSold3, sanPham: spIphone14._id, giaNhap: 14000000, trangThai: 'Da ban' })
    ]);

    const validInvoice = await HoaDon.create({
      soHD: 'HD_VALID_' + Date.now().toString().slice(-6),
      khachHang: kh._id,
      nhanVien: nv._id,
      ngayLap: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Mua 5 ngày trước
      tongTien: 63970000,
      trangThai: 'Da thanh toan'
    });

    await Promise.all([
      CT_HoaDon_May.create({ hoaDon: validInvoice._id, imei: imeiSold1, donGiaBan: 16990000 }),
      CT_HoaDon_May.create({ hoaDon: validInvoice._id, imei: imeiSold2, donGiaBan: 29990000 }),
      CT_HoaDon_May.create({ hoaDon: validInvoice._id, imei: imeiSold3, donGiaBan: 16990000 })
    ]);

    // -------------------------------------------------------------
    // TEST 4: Đổi Máy Mới Giá Cao Hơn -> Thu Thêm Tiền Chênh Lệch
    // (Đổi iPhone 14 16.99tr -> iPhone 15 Pro Max 29.99tr -> Thu thêm 13tr)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Đổi máy giá cao hơn (Thu thêm tiền chênh lệch) ---');
    const newImeiUp = 'TEST_NEW_UP_' + Date.now().toString().slice(-5);
    await MayImei.create({
      imei: newImeiUp,
      sanPham: spIphone15._id,
      giaNhap: 26500000,
      trangThai: 'Con hang'
    });

    const doiUpResult = await DoiTraService.taoPhieuDoiTra({
      soHD: validInvoice.soHD,
      imeiCu: imeiSold1,
      imeiMoi: newImeiUp,
      loaiDoiTra: 'Doi may',
      hinhThuc: 'Chuyen khoan',
      lyDo: 'Khách muốn nâng cấp lên đời iPhone 15 Pro Max',
      ghiChu: 'Đổi máy trong 7 ngày'
    }, nv);

    const phieuUp = doiUpResult.phieuDoiTra;
    assert(phieuUp && phieuUp.maDT.startsWith('DT'), `Tạo phiếu đổi trả thành công: ${phieuUp.maDT}`);
    assert(phieuUp.tienChenhLech === 29990000 - 16990000, `Tính đúng chênh lệch giá: +${phieuUp.tienChenhLech.toLocaleString('vi-VN')} đ`);
    assert(phieuUp.phieuThu !== null, 'Hệ thống tự động sinh Phiếu Thu tiền chênh lệch');
    assert(phieuUp.phieuThu.soTien === 13000000, `Số tiền trên Phiếu Thu đúng: ${phieuUp.phieuThu.soTien.toLocaleString('vi-VN')} đ`);
    assert(phieuUp.phieuThu.hinhThuc === 'Chuyen khoan', 'Hình thức thanh toán phiếu thu đúng: Chuyển khoản');

    // Kiểm tra trạng thái 2 máy
    const [mayCuUp, mayMoiUp] = await Promise.all([
      MayImei.findOne({ imei: imeiSold1 }),
      MayImei.findOne({ imei: newImeiUp })
    ]);
    assert(mayCuUp.trangThai === 'Loi', `Máy cũ ${imeiSold1} chuyển sang trạng thái "Loi"`);
    assert(mayMoiUp.trangThai === 'Da ban', `Máy mới ${newImeiUp} chuyển sang trạng thái "Da ban"`);

    // -------------------------------------------------------------
    // TEST 5: Đổi Máy Mới Giá Thấp Hơn -> Hoàn Tiền Chênh Lệch Cho Khách
    // (Đổi iPhone 15 Pro Max 29.99tr -> iPhone 14 16.99tr -> Hoàn lại 13tr)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Đổi máy giá thấp hơn (Hoàn tiền chênh lệch) ---');
    const newImeiDown = 'TEST_NEW_DOWN_' + Date.now().toString().slice(-4);
    await MayImei.create({
      imei: newImeiDown,
      sanPham: spIphone14._id,
      giaNhap: 14000000,
      trangThai: 'Con hang'
    });

    const doiDownResult = await DoiTraService.taoPhieuDoiTra({
      soHD: validInvoice.soHD,
      imeiCu: imeiSold2,
      imeiMoi: newImeiDown,
      loaiDoiTra: 'Doi may',
      hinhThuc: 'Tien mat',
      lyDo: 'Khách muốn đổi sang máy nhỏ gọn hơn'
    }, nv);

    const phieuDown = doiDownResult.phieuDoiTra;
    assert(phieuDown.tienChenhLech === -(29990000 - 16990000), `Tính đúng chênh lệch âm: ${phieuDown.tienChenhLech.toLocaleString('vi-VN')} đ`);
    assert(phieuDown.phieuChi !== null, 'Hệ thống tự động sinh Phiếu Chi hoàn tiền thừa');
    assert(phieuDown.phieuChi.soTien === 13000000, `Số tiền trên Phiếu Chi khớp tiền thừa: ${phieuDown.phieuChi.soTien.toLocaleString('vi-VN')} đ`);

    // -------------------------------------------------------------
    // TEST 6: Đổi Máy Ngang Giá -> Không Sinh Phiếu Thu / Chi
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Đổi máy ngang giá (0đ chênh lệch) ---');
    const newImeiEqual = 'TEST_NEW_EQ_' + Date.now().toString().slice(-5);
    await MayImei.create({
      imei: newImeiEqual,
      sanPham: spIphone14._id,
      giaNhap: 14000000,
      trangThai: 'Con hang'
    });

    const doiEqualResult = await DoiTraService.taoPhieuDoiTra({
      soHD: validInvoice.soHD,
      imeiCu: imeiSold3,
      imeiMoi: newImeiEqual,
      loaiDoiTra: 'Doi may',
      lyDo: 'Khách đổi màu Midnight sang Starlight cùng giá'
    }, nv);

    const phieuEqual = doiEqualResult.phieuDoiTra;
    assert(phieuEqual.tienChenhLech === 0, 'Chênh lệch tiền chính xác = 0 đ');
    assert(phieuEqual.phieuThu === null && phieuEqual.phieuChi === null, 'Không sinh phiếu thu/chi khi đổi ngang giá');

    // -------------------------------------------------------------
    // TEST 7: Trả Hàng Hoàn Tiền 100%
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Trả hàng hoàn tiền 100% ---');
    const imeiReturn = 'TEST_RETURN_' + Date.now().toString().slice(-5);
    await MayImei.create({
      imei: imeiReturn,
      sanPham: spIphone14._id,
      giaNhap: 14000000,
      trangThai: 'Da ban'
    });

    const invoiceReturn = await HoaDon.create({
      soHD: 'HD_RET_' + Date.now().toString().slice(-6),
      khachHang: kh._id,
      nhanVien: nv._id,
      ngayLap: new Date(),
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });

    await CT_HoaDon_May.create({
      hoaDon: invoiceReturn._id,
      imei: imeiReturn,
      donGiaBan: 16990000
    });

    const returnResult = await DoiTraService.taoPhieuDoiTra({
      soHD: invoiceReturn.soHD,
      imeiCu: imeiReturn,
      loaiDoiTra: 'Tra hang',
      hinhThuc: 'Chuyen khoan',
      lyDo: 'Khách hàng trả máy do không còn nhu cầu sử dụng'
    }, nv);

    const phieuRet = returnResult.phieuDoiTra;
    assert(phieuRet.loaiDoiTra === 'Tra hang', 'Hình thức đúng: "Tra hang"');
    assert(phieuRet.phieuChi !== null, 'Hệ thống tự sinh Phiếu Chi hoàn 100% tiền mua');
    assert(phieuRet.phieuChi.soTien === 16990000, `Số tiền hoàn chính xác: ${phieuRet.phieuChi.soTien.toLocaleString('vi-VN')} đ`);

    const mayReturned = await MayImei.findOne({ imei: imeiReturn });
    assert(mayReturned.trangThai === 'Loi', `Máy trả lại ${imeiReturn} đã được chuyển trạng thái sang "Loi"`);

    // -------------------------------------------------------------
    // TEST 8: Chặn Đổi Lại Máy Đã Từng Đổi Trả
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Chặn đổi trùng máy đã đổi trả ---');
    let duplicateErr = null;
    try {
      await DoiTraService.taoPhieuDoiTra({
        soHD: invoiceReturn.soHD,
        imeiCu: imeiReturn,
        loaiDoiTra: 'Tra hang',
        lyDo: 'Cố tình trả lại lần 2'
      }, nv);
    } catch (err) {
      duplicateErr = err;
    }
    assert(duplicateErr !== null && duplicateErr.statusCode === 400, 'Chặn đổi lại máy đã đổi trả thành công (400)');

    // -------------------------------------------------------------
    // TEST 9: Lấy Danh Sách & Chi Tiết Phiếu Đổi Trả
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Lấy danh sách & Chi tiết phiếu đổi trả ---');
    const listResult = await DoiTraService.getDoiTraList({ limit: 10 });
    assert(Array.isArray(listResult.danhSach), 'Trả về danh sách phiếu đổi trả dạng mảng');
    assert(listResult.danhSach.length >= 4, `Tìm thấy ${listResult.danhSach.length} phiếu đổi trả`);
    assert(listResult.pagination.total >= 4, 'Thông tin phân trang đầy đủ');

    const detailResult = await DoiTraService.getDoiTraDetail(phieuUp._id);
    assert(detailResult.phieuDoiTra.maDT === phieuUp.maDT, 'Lấy chi tiết phiếu đổi trả thành công');
    assert(detailResult.mayCu !== null && detailResult.mayMoi !== null, 'Populate đầy đủ thông tin máy cũ và máy mới');
    assert(detailResult.phieuThu !== null, 'Liên kết thành công với Phiếu Thu');

    // -------------------------------------------------------------
    // TEST 10: Tra Cứu Lịch Sử Theo Số IMEI
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Tra cứu lịch sử đổi trả theo số IMEI ---');
    const historyResult = await DoiTraService.getLichSuImei(imeiSold1);
    assert(historyResult.imei === imeiSold1, `Tra cứu đúng IMEI: ${historyResult.imei}`);
    assert(historyResult.soLanDoiTra >= 1, `Đã ghi nhận ${historyResult.soLanDoiTra} lần đổi trả`);
    assert(historyResult.lichSu[0].maDT === phieuUp.maDT, 'Lịch sử khớp đúng mã phiếu đổi trả');

    // -------------------------------------------------------------
    // TEST 11: HTTP Endpoints & Phân Quyền RBAC 403 Forbidden
    // -------------------------------------------------------------
    console.log('\n--- TEST 11: HTTP Endpoints & Phân quyền RBAC 403 ---');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    // 1. Login vai trò Kỹ thuật
    const loginKyThuat = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenDangNhap: 'kythuat', matKhau: '123456' })
    });
    const cookieKyThuat = loginKyThuat.headers.get('set-cookie')?.split(';')[0];

    // 2. Kỹ thuật được xem danh sách GET /api/doi-tra (200 OK)
    const getRes = await fetch(`${baseUrl}/api/doi-tra`, {
      headers: { Cookie: cookieKyThuat }
    });
    assert(getRes.status === 200, 'HTTP GET /api/doi-tra trả về 200 OK cho vai trò Kỹ thuật');

    // 3. Kỹ thuật BỊ CHẶN khi tạo phiếu POST /api/doi-tra (403 Forbidden)
    const postRes = await fetch(`${baseUrl}/api/doi-tra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieKyThuat },
      body: JSON.stringify({
        soHD: validInvoice.soHD,
        imeiCu: imeiSold1,
        lyDo: 'Kỹ thuật cố tạo phiếu'
      })
    });
    assert(postRes.status === 403, `Phân quyền RBAC chặn Kỹ thuật tạo phiếu đổi trả (Nhận ${postRes.status} Forbidden)`);

    await mongoose.connection.close();
    server.close();

    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ CÁC TEST CASES TUẦN 4 CỦA TÔ QUỐC VIỆT ĐÃ VƯỢT QUA 100%!');
      setTimeout(() => process.exit(0), 50);
    } else {
      console.error('❌ CÓ TEST CASE BỊ LỖI!');
      setTimeout(() => process.exit(1), 50);
    }
  } catch (err) {
    console.error('❌ Lỗi ngoại lệ trong quá trình chạy test:', err);
    process.exit(1);
  }
}

runTests();
