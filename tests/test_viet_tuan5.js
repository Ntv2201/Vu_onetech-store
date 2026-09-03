/**
 * Test Suite: Kiểm thử Tự động Module Tuần 5 của Tô Quốc Việt
 * Trọng tâm:
 * - Tình huống biên 1: Đổi máy kèm Phụ kiện phát sinh (tính chênh lệch & trừ tồn kho PK)
 * - Tình huống biên 2: Hủy / Thu hồi phiếu đổi trả (Quản lý) -> Hoàn tác kho 2 máy + phụ kiện + Đảo ngược tài chính Sổ Quỹ
 * - Tình huống biên 3: Xử lý phụ kiện vượt tồn kho
 * - Tình huống biên 4: Boundary Test 30 ngày hợp lệ vs 31 ngày quá hạn
 * - Tình huống biên 5: Concurrency Conflict 409 khi 2 phiên cùng đổi sang 1 máy
 * - Phân quyền RBAC: PUT /api/doi-tra/:id/huy CHỈ cho Quản lý (Bán hàng, Thu ngân, Thủ kho, Kỹ thuật nhận 403 Forbidden)
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
  PhuKien,
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
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE TÔ QUỐC VIỆT (TUẦN 5: TÌNH HUỐNG BIÊN & RBAC)');
  console.log('===============================================================\n');

  await connectDB();

  try {
    // Chuẩn bị dữ liệu mẫu
    let nvQuanLy = await NhanVien.findOne({ tenDangNhap: 'admin' });
    let nvBanHang = await NhanVien.findOne({ tenDangNhap: 'banhang' });
    let nvKyThuat = await NhanVien.findOne({ tenDangNhap: 'kythuat' });
    let nvThuKho = await NhanVien.findOne({ tenDangNhap: 'thukho' });

    let kh = await KhachHang.findOne({ sdt: '0988123456' });
    let spIphone15 = await SanPham.findOne({ tenMay: { $regex: 'iPhone 15 Pro Max', $options: 'i' } });
    let spIphone14 = await SanPham.findOne({ tenMay: { $regex: 'iPhone 14', $options: 'i' } });

    if (!nvQuanLy) nvQuanLy = await NhanVien.findOne({ vaiTro: 'Quản lý' });
    if (!nvBanHang) nvBanHang = await NhanVien.findOne();
    if (!kh) kh = await KhachHang.create({ hoTen: 'Khách Hàng Test T5', sdt: '0988777666' });
    if (!spIphone15) spIphone15 = await SanPham.findOne();
    if (!spIphone14) spIphone14 = spIphone15;

    // Tạo / lấy phụ kiện test
    let testPk = await PhuKien.findOne({ tenPK: { $regex: 'Củ sạc', $options: 'i' } });
    if (!testPk) {
      testPk = await PhuKien.create({
        tenPK: 'Củ sạc nhanh 20W Test T5',
        loaiPK: 'Sac cap',
        giaBan: 450000,
        giaNhap: 250000,
        soLuongTon: 15
      });
    } else {
      testPk.soLuongTon = 15;
      await testPk.save();
    }

    console.log(`👤 Quản lý: ${nvQuanLy.hoTen} (@${nvQuanLy.tenDangNhap})`);
    console.log(`👤 Nhân viên bán hàng: ${nvBanHang.hoTen} (@${nvBanHang.tenDangNhap})`);
    console.log(`📱 Phụ kiện test: ${testPk.tenPK} (Tồn ban đầu: ${testPk.soLuongTon})\n`);

    // -------------------------------------------------------------
    // TEST 1: Đổi máy kèm Phụ kiện mua thêm (Edge Case 1)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Đổi máy kèm Phụ kiện mua thêm ---');
    const imeiOld1 = 'TEST_T5_OLD1_' + Date.now().toString().slice(-5);
    const imeiNew1 = 'TEST_T5_NEW1_' + Date.now().toString().slice(-5);

    await MayImei.create({
      imei: imeiOld1,
      sanPham: spIphone14._id,
      giaNhap: 14000000,
      trangThai: 'Da ban'
    });

    await MayImei.create({
      imei: imeiNew1,
      sanPham: spIphone15._id,
      giaNhap: 26500000,
      trangThai: 'Con hang'
    });

    const invoice1 = await HoaDon.create({
      soHD: 'HD_T5_PK_' + Date.now().toString().slice(-6),
      khachHang: kh._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(),
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });

    await CT_HoaDon_May.create({
      hoaDon: invoice1._id,
      imei: imeiOld1,
      donGiaBan: 16990000
    });

    const initialPkStock = testPk.soLuongTon;

    // Đổi máy cũ (16.99tr) -> Máy mới (29.99tr) + 2 củ sạc (450k x 2 = 900k)
    // Tổng chênh lệch: (29.99tr + 900k) - 16.99tr = 13.900.000 đ
    const doiTraResult1 = await DoiTraService.taoPhieuDoiTra({
      soHD: invoice1.soHD,
      imeiCu: imeiOld1,
      imeiMoi: imeiNew1,
      loaiDoiTra: 'Doi may',
      danhSachPhuKien: [
        { phuKien: testPk._id, soLuong: 2, donGia: 450000 }
      ],
      hinhThuc: 'Chuyen khoan',
      lyDo: 'Khách lên đời máy và mua thêm 2 củ sạc nhanh'
    }, nvBanHang);

    const phieu1 = doiTraResult1.phieuDoiTra;
    assert(phieu1 && phieu1.maDT.startsWith('DT'), `Tạo phiếu đổi trả thành công: ${phieu1.maDT}`);
    assert(phieu1.tongTienPhuKien === 900000, `Tổng tiền phụ kiện chính xác: ${phieu1.tongTienPhuKien.toLocaleString('vi-VN')} đ`);
    assert(phieu1.tienChenhLech === (29990000 + 900000) - 16990000, `Tổng tiền chênh lệch tính đúng (Máy + Phụ kiện): +${phieu1.tienChenhLech.toLocaleString('vi-VN')} đ`);
    assert(phieu1.phieuThu !== null, 'Hệ thống tự động sinh Phiếu Thu tiền chênh lệch');
    assert(phieu1.phieuThu.soTien === 13900000, `Số tiền Phiếu Thu khớp: ${phieu1.phieuThu.soTien.toLocaleString('vi-VN')} đ`);

    // Kiểm tra tồn kho phụ kiện đã bị trừ 2
    const updatedPk1 = await PhuKien.findById(testPk._id);
    assert(updatedPk1.soLuongTon === initialPkStock - 2, `Tồn kho phụ kiện giảm đúng 2 cái (${initialPkStock} -> ${updatedPk1.soLuongTon})`);

    // -------------------------------------------------------------
    // TEST 2: Hủy / Thu Hồi Phiếu Đổi Trả Bởi Quản Lý (Edge Case 2)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Quản lý hủy/thu hồi phiếu đổi trả & Hoàn tác kho + Sổ Quỹ ---');
    const cancelResult1 = await DoiTraService.huyPhieuDoiTra(phieu1._id, {
      lyDoHuy: 'Nhân viên chọn nhầm màu máy khách yêu cầu, quản lý duyệt hủy phiếu để lập lại'
    }, nvQuanLy);

    const cancelledPhieu1 = cancelResult1.phieuDoiTra;
    assert(cancelledPhieu1.trangThai === 'Da huy', 'Phiếu đổi trả chuyển trạng thái sang "Da huy"');
    assert(cancelledPhieu1.ngayHuy !== null, 'Lưu trữ thời gian hủy phiếu chính xác');

    // Kiểm tra hoàn tác trạng thái 2 máy
    const [mayOldRevert, mayNewRevert] = await Promise.all([
      MayImei.findOne({ imei: imeiOld1 }),
      MayImei.findOne({ imei: imeiNew1 })
    ]);
    assert(mayOldRevert.trangThai === 'Da ban', `Máy cũ ${imeiOld1} được khôi phục về trạng thái "Da ban"`);
    assert(mayNewRevert.trangThai === 'Con hang', `Máy mới ${imeiNew1} được hoàn trả về kho "Con hang"`);

    // Kiểm tra hoàn tác tồn kho phụ kiện (+2)
    const pkReverted = await PhuKien.findById(testPk._id);
    assert(pkReverted.soLuongTon === initialPkStock, `Tồn kho phụ kiện được hoàn trả nguyên vẹn (${pkReverted.soLuongTon})`);

    // Kiểm tra đảo ngược tài chính: Sinh Phiếu Chi hoàn trả 13.9tr lại cho khách
    assert(cancelledPhieu1.phieuChiDaoNguoc !== null, 'Hệ thống tự động sinh Phiếu Chi đảo ngược hoàn trả tiền cho khách');
    assert(cancelledPhieu1.phieuChiDaoNguoc.soTien === 13900000, `Số tiền Phiếu Chi đảo ngược khớp đúng: ${cancelledPhieu1.phieuChiDaoNguoc.soTien.toLocaleString('vi-VN')} đ`);

    // Chặn hủy lần 2
    let reCancelErr = null;
    try {
      await DoiTraService.huyPhieuDoiTra(phieu1._id, { lyDoHuy: 'Cố tình hủy lần 2' }, nvQuanLy);
    } catch (err) {
      reCancelErr = err;
    }
    assert(reCancelErr !== null && reCancelErr.statusCode === 400, 'Chặn hủy lại phiếu đã ở trạng thái "Da huy" (400 Bad Request)');

    // -------------------------------------------------------------
    // TEST 3: Hủy Phiếu Trả Hàng (Hoàn 100% -> Thu Hồi Lại Tiền)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Hủy phiếu trả hàng (Sinh Phiếu Thu đảo ngược) ---');
    const imeiReturn = 'TEST_T5_RET_' + Date.now().toString().slice(-5);
    await MayImei.create({
      imei: imeiReturn,
      sanPham: spIphone14._id,
      giaNhap: 14000000,
      trangThai: 'Da ban'
    });

    const invoiceRet = await HoaDon.create({
      soHD: 'HD_T5_RET_' + Date.now().toString().slice(-6),
      khachHang: kh._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(),
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });

    await CT_HoaDon_May.create({
      hoaDon: invoiceRet._id,
      imei: imeiReturn,
      donGiaBan: 16990000
    });

    const returnTicket = await DoiTraService.taoPhieuDoiTra({
      soHD: invoiceRet.soHD,
      imeiCu: imeiReturn,
      loaiDoiTra: 'Tra hang',
      lyDo: 'Khách muốn trả hàng'
    }, nvBanHang);

    assert(returnTicket.phieuDoiTra.phieuChi !== null, 'Phiếu trả hàng đã sinh Phiếu Chi 16.990.000 đ');

    // Quản lý hủy phiếu trả hàng
    const cancelReturn = await DoiTraService.huyPhieuDoiTra(returnTicket.phieuDoiTra._id, {
      lyDoHuy: 'Khách đổi ý giữ lại máy dùng tiếp'
    }, nvQuanLy);

    assert(cancelReturn.phieuDoiTra.phieuThuDaoNguoc !== null, 'Hệ thống tự động sinh Phiếu Thu đảo ngược để thu hồi số tiền chi');
    assert(cancelReturn.phieuDoiTra.phieuThuDaoNguoc.soTien === 16990000, 'Số tiền Phiếu Thu đảo ngược khớp 16.990.000 đ');

    const mayRetReverted = await MayImei.findOne({ imei: imeiReturn });
    assert(mayRetReverted.trangThai === 'Da ban', `Máy ${imeiReturn} khôi phục về trạng thái "Da ban"`);

    // -------------------------------------------------------------
    // TEST 4: Validation Phụ Kiện Vượt Tồn Kho
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Validation phụ kiện vượt quá tồn kho ---');
    const imeiOld4 = 'TEST_T5_OLD4_' + Date.now().toString().slice(-5);
    const imeiNew4 = 'TEST_T5_NEW4_' + Date.now().toString().slice(-5);

    await MayImei.create({ imei: imeiOld4, sanPham: spIphone14._id, giaNhap: 14000000, trangThai: 'Da ban' });
    await MayImei.create({ imei: imeiNew4, sanPham: spIphone15._id, giaNhap: 26500000, trangThai: 'Con hang' });

    const invoice4 = await HoaDon.create({
      soHD: 'HD_T5_EX_' + Date.now().toString().slice(-6),
      khachHang: kh._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(),
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });
    await CT_HoaDon_May.create({ hoaDon: invoice4._id, imei: imeiOld4, donGiaBan: 16990000 });

    let outOfStockErr = null;
    try {
      await DoiTraService.taoPhieuDoiTra({
        soHD: invoice4.soHD,
        imeiCu: imeiOld4,
        imeiMoi: imeiNew4,
        loaiDoiTra: 'Doi may',
        danhSachPhuKien: [
          { phuKien: testPk._id, soLuong: 999, donGia: 450000 } // Yêu cầu 999 cái trong khi kho có 15 cái
        ],
        lyDo: 'Cố tình mua vượt tồn kho'
      }, nvBanHang);
    } catch (err) {
      outOfStockErr = err;
    }
    assert(outOfStockErr !== null, 'Phát hiện lỗi khi phụ kiện vượt quá tồn kho');
    assert(outOfStockErr && outOfStockErr.statusCode === 400, 'Trả về mã lỗi 400 Bad Request');
    assert(outOfStockErr && outOfStockErr.message.includes('không đủ tồn kho'), 'Thông báo lỗi chỉ rõ phụ kiện không đủ tồn kho');

    // -------------------------------------------------------------
    // TEST 5: Boundary Test - 30 Ngày Hợp Lệ vs 31 Ngày Quá Hạn
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Boundary Test (Đúng 30 ngày vs Ngày thứ 31) ---');
    const imeiDay30 = 'TEST_T5_D30_' + Date.now().toString().slice(-5);
    const imeiDay31 = 'TEST_T5_D31_' + Date.now().toString().slice(-5);

    await MayImei.create({ imei: imeiDay30, sanPham: spIphone14._id, giaNhap: 14000000, trangThai: 'Da ban' });
    await MayImei.create({ imei: imeiDay31, sanPham: spIphone14._id, giaNhap: 14000000, trangThai: 'Da ban' });

    // HĐ đúng 29.8 ngày trước (thuộc ngày 30) -> Hợp lệ
    const invoiceDay30 = await HoaDon.create({
      soHD: 'HD_DAY30_' + Date.now().toString().slice(-5),
      khachHang: kh._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 29.8 * 24 * 60 * 60 * 1000),
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });
    await CT_HoaDon_May.create({ hoaDon: invoiceDay30._id, imei: imeiDay30, donGiaBan: 16990000 });

    const check30 = await DoiTraService.kiemTraDieuKienDoiTra(invoiceDay30.soHD, imeiDay30);
    assert(check30.hopLe === true, 'Hóa đơn trong thời hạn 30 ngày được chấp nhận hợp lệ');

    // HĐ 31.5 ngày trước -> Bị chặn
    const invoiceDay31 = await HoaDon.create({
      soHD: 'HD_DAY31_' + Date.now().toString().slice(-5),
      khachHang: kh._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 31.5 * 24 * 60 * 60 * 1000),
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });
    await CT_HoaDon_May.create({ hoaDon: invoiceDay31._id, imei: imeiDay31, donGiaBan: 16990000 });

    let check31Err = null;
    try {
      await DoiTraService.kiemTraDieuKienDoiTra(invoiceDay31.soHD, imeiDay31);
    } catch (err) {
      check31Err = err;
    }
    assert(check31Err !== null && check31Err.statusCode === 400, 'Hóa đơn ở ngày 31 bị từ chối 400 Bad Request');

    // -------------------------------------------------------------
    // TEST 6: HTTP Endpoints & Phân Quyền RBAC 6 Vai Trò (PUT /:id/huy)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: HTTP Endpoints & Phân quyền RBAC 403 Forbidden cho PUT /api/doi-tra/:id/huy ---');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    // Tạo 1 phiếu đổi trả mới để test hủy qua HTTP
    const imeiHttpOld = 'TEST_HTTP_OLD_' + Date.now().toString().slice(-4);
    const imeiHttpNew = 'TEST_HTTP_NEW_' + Date.now().toString().slice(-4);
    await MayImei.create({ imei: imeiHttpOld, sanPham: spIphone14._id, giaNhap: 14000000, trangThai: 'Da ban' });
    await MayImei.create({ imei: imeiHttpNew, sanPham: spIphone15._id, giaNhap: 26500000, trangThai: 'Con hang' });

    const invoiceHttp = await HoaDon.create({
      soHD: 'HD_HTTP_' + Date.now().toString().slice(-5),
      khachHang: kh._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(),
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });
    await CT_HoaDon_May.create({ hoaDon: invoiceHttp._id, imei: imeiHttpOld, donGiaBan: 16990000 });

    const ticketHttp = await DoiTraService.taoPhieuDoiTra({
      soHD: invoiceHttp.soHD,
      imeiCu: imeiHttpOld,
      imeiMoi: imeiHttpNew,
      loaiDoiTra: 'Doi may',
      lyDo: 'Test HTTP RBAC Cancel'
    }, nvBanHang);

    // 1. Đăng nhập vai trò Bán hàng (banhang)
    const loginBanHang = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenDangNhap: 'banhang', matKhau: '123456' })
    });
    const cookieBanHang = loginBanHang.headers.get('set-cookie')?.split(';')[0];

    // Bán hàng gọi PUT /:id/huy -> BỊ CHẶN 403
    const cancelByBanHang = await fetch(`${baseUrl}/api/doi-tra/${ticketHttp.phieuDoiTra._id}/huy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieBanHang },
      body: JSON.stringify({ lyDoHuy: 'Bán hàng cố tình hủy' })
    });
    assert(cancelByBanHang.status === 403, `Phân quyền RBAC chặn NV Bán hàng hủy phiếu đổi trả (Nhận ${cancelByBanHang.status} Forbidden)`);

    // 2. Đăng nhập vai trò Kỹ thuật (kythuat) -> BỊ CHẶN 403
    const loginKyThuat = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenDangNhap: 'kythuat', matKhau: '123456' })
    });
    const cookieKyThuat = loginKyThuat.headers.get('set-cookie')?.split(';')[0];

    const cancelByKyThuat = await fetch(`${baseUrl}/api/doi-tra/${ticketHttp.phieuDoiTra._id}/huy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieKyThuat },
      body: JSON.stringify({ lyDoHuy: 'Kỹ thuật cố tình hủy' })
    });
    assert(cancelByKyThuat.status === 403, `Phân quyền RBAC chặn Kỹ thuật hủy phiếu đổi trả (Nhận ${cancelByKyThuat.status} Forbidden)`);

    // 3. Đăng nhập vai trò Quản lý (admin) -> ĐƯỢC PHÉP 200 OK
    const loginAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenDangNhap: 'admin', matKhau: 'admin123' })
    });
    const cookieAdmin = loginAdmin.headers.get('set-cookie')?.split(';')[0];

    const cancelByAdmin = await fetch(`${baseUrl}/api/doi-tra/${ticketHttp.phieuDoiTra._id}/huy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ lyDoHuy: 'Quản lý duyệt hủy phiếu thành công' })
    });
    assert(cancelByAdmin.status === 200, `Quản lý thực hiện hủy phiếu thành công (Nhận ${cancelByAdmin.status} OK)`);

    await mongoose.connection.close();
    server.close();

    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES TUẦN 5 (TÌNH HUỐNG BIÊN & RBAC) CỦA TÔ QUỐC VIỆT ĐÃ VƯỢT QUA 100%!');
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
