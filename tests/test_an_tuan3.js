/**
 * Test tự động - Trương Thế An - Tuần 3 (Tồn kho & Công nợ đa hình)
 * Chạy: node tests/test_an_tuan3.js
 */
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

const { TonKhoService, CongNoService, ThanhToanService } = require('../src/services');
const { Kho, SanPham, KhachHang, NhaCungCap, NhanVien, CongNo, PhieuThu, PhieuChi } = require('../src/models');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE TRƯƠNG THẾ AN (TUẦN 3: TỒN KHO & CÔNG NỢ)');
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
    const [kho, sp, kh, ncc, nvKeToan, nvThuNgan, nvKyThuat] = await Promise.all([
      Kho.findOne(),
      SanPham.findOne(),
      KhachHang.findOne(),
      NhaCungCap.findOne(),
      NhanVien.findOne({ tenDangNhap: 'ketoan' }),
      NhanVien.findOne({ tenDangNhap: 'thungan' }),
      NhanVien.findOne({ tenDangNhap: 'kythuat' })
    ]);

    if (!kho || !sp || !kh || !ncc) {
      throw new Error('Cần seed đủ Kho, Sản phẩm, Khách hàng, NCC trước khi test!');
    }

    console.log(`🏢 Kho test: ${kho.tenKho}`);
    console.log(`📱 Sản phẩm test: ${sp.tenMay}`);
    console.log(`👤 Khách hàng test: ${kh.hoTen}`);
    console.log(`🏢 Nhà cung cấp test: ${ncc.tenNCC}\n`);

    // -------------------------------------------------------------
    // TEST 1: Tồn kho - Nhập, Xuất & Chặn xuất âm (TonKhoService)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Cập nhật Tồn kho (TonKhoService.capNhatTonKho) ---');
    const tonBanDauList = await TonKhoService.layThongKeTonKho({ maKho: kho._id });
    const tonBanDau = tonBanDauList.find(t => String(t.sanPham._id) === String(sp._id))?.soLuong || 0;

    // Nhập thêm 10
    await TonKhoService.capNhatTonKho(sp._id, kho._id, 10);
    let tonHienTai = await TonKhoService.layThongKeTonKho({ maKho: kho._id });
    let dongSP = tonHienTai.find(t => String(t.sanPham._id) === String(sp._id));
    assert(dongSP.soLuong === tonBanDau + 10, `Nhập +10 tăng tồn từ ${tonBanDau} -> ${dongSP.soLuong}`);

    // Xuất 3
    await TonKhoService.capNhatTonKho(sp._id, kho._id, -3);
    tonHienTai = await TonKhoService.layThongKeTonKho({ maKho: kho._id });
    dongSP = tonHienTai.find(t => String(t.sanPham._id) === String(sp._id));
    assert(dongSP.soLuong === tonBanDau + 7, `Xuất -3 tồn còn ${dongSP.soLuong}`);

    // Chặn xuất vượt tồn (409 Conflict)
    let bChan = false;
    try {
      await TonKhoService.capNhatTonKho(sp._id, kho._id, -100000);
    } catch (err) {
      bChan = err.statusCode === 409;
    }
    assert(bChan, 'Chặn xuất vượt tồn kho ném mã lỗi 409 Conflict');

    // Dọn dẹp trả lại số lượng ban đầu
    await TonKhoService.capNhatTonKho(sp._id, kho._id, -7);

    // -------------------------------------------------------------
    // TEST 2: Thống kê Tồn kho & Danh sách Phiếu xuất
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Thống kê Tồn kho & Danh sách Phiếu xuất ---');
    const tkAll = await TonKhoService.layThongKeTonKho();
    assert(Array.isArray(tkAll), 'layThongKeTonKho() không tham số trả về mảng gộp theo sản phẩm');
    assert(tkAll.length > 0, `Đã gộp tồn kho cho ${tkAll.length} model sản phẩm`);

    const pxList = await TonKhoService.layDanhSachPhieuXuat({ limit: 5 });
    assert(Array.isArray(pxList.items), 'layDanhSachPhieuXuat() trả về danh sách phiếu xuất dạng mảng');
    assert(pxList.page === 1, 'Phân trang phiếu xuất hoạt động chuẩn');

    // -------------------------------------------------------------
    // TEST 3: Validate Đa hình Công nợ (CongNoService.validateDoiTuongCongNo)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Validate Đa hình Công nợ ---');
    let loi1 = false;
    try {
      await CongNoService.validateDoiTuongCongNo({ loaiDoiTuong: 'KhachHang', khachHang: null, nhaCungCap: null });
    } catch (err) {
      loi1 = err.statusCode === 400;
    }
    assert(loi1, 'Chặn thiếu khachHang khi loaiDoiTuong=KhachHang (400 Bad Request)');

    let loi2 = false;
    try {
      await CongNoService.validateDoiTuongCongNo({
        loaiDoiTuong: 'KhachHang', khachHang: kh._id, nhaCungCap: ncc._id
      });
    } catch (err) {
      loi2 = err.statusCode === 400;
    }
    assert(loi2, 'Chặn truyền lẫn cả khachHang và nhaCungCap (400 Bad Request)');

    let loi3 = false;
    try {
      await CongNoService.validateDoiTuongCongNo({ loaiDoiTuong: 'NhaCungCap', nhaCungCap: null });
    } catch (err) {
      loi3 = err.statusCode === 400;
    }
    assert(loi3, 'Chặn thiếu nhaCungCap khi loaiDoiTuong=NhaCungCap (400 Bad Request)');

    // -------------------------------------------------------------
    // TEST 4: Tạo & Quản lý Công nợ Khách Hàng
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Tạo & Thanh toán Công nợ Khách Hàng ---');
    const cnKH = await CongNoService.taoCongNo({
      loaiDoiTuong: 'KhachHang',
      khachHang: kh._id,
      soTienNo: 15000000
    });
    assert(cnKH && cnKH._id, 'Tạo công nợ Khách Hàng thành công');
    assert(cnKH.soTienNo === 15000000, 'Số tiền nợ 15.000.000 đ');
    assert(cnKH.trangThai === 'Con no', 'Trạng thái: "Con no"');

    // Thu nợ 1 phần (5.000.000 đ) -> sinh Phiếu Thu
    const tt1 = await CongNoService.thanhToanCongNo(cnKH._id, {
      soTien: 5000000,
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Khách trả nợ đợt 1'
    });
    assert(tt1.congNo.soTienDaTra === 5000000, 'Ghi nhận số tiền đã trả 5.000.000 đ');
    assert(tt1.congNo.trangThai === 'Con no', 'Vẫn còn nợ 10.000.000 đ');
    assert(tt1.phieu && tt1.phieu.soTien === 5000000, 'Tự động sinh Phiếu Thu 5.000.000 đ');

    // Thu nợ phần còn lại (10.000.000 đ) -> đổi trạng thái sang 'Da tra het'
    const tt2 = await CongNoService.thanhToanCongNo(cnKH._id, {
      soTien: 10000000,
      hinhThuc: 'Tien mat',
      ghiChu: 'Khách thanh toán hết'
    });
    assert(tt2.congNo.soTienDaTra === 15000000, 'Số tiền đã trả đạt 15.000.000 đ');
    assert(tt2.congNo.trangThai === 'Da tra het', 'Trạng thái tự động đổi thành "Da tra het"');

    // Chặn thanh toán vượt số còn nợ
    let bOverpay = false;
    try {
      await CongNoService.thanhToanCongNo(cnKH._id, { soTien: 1000 });
    } catch (err) {
      bOverpay = err.statusCode === 400;
    }
    assert(bOverpay, 'Chặn thanh toán khi công nợ đã trả hết (400 Bad Request)');

    // -------------------------------------------------------------
    // TEST 5: Tạo & Quản lý Công nợ Nhà Cung Cấp
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Tạo & Thanh toán Công nợ Nhà Cung Cấp ---');
    const cnNCC = await CongNoService.taoCongNo({
      loaiDoiTuong: 'NhaCungCap',
      nhaCungCap: ncc._id,
      soTienNo: 20000000
    });
    assert(cnNCC && cnNCC._id, 'Tạo công nợ Nhà Cung Cấp thành công');

    // Trả nợ NCC -> sinh Phiếu Chi
    const ttNCC = await CongNoService.thanhToanCongNo(cnNCC._id, {
      soTien: 20000000,
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Thanh toán tiền hàng nợ NCC'
    });
    assert(ttNCC.congNo.trangThai === 'Da tra het', 'Công nợ NCC đổi thành "Da tra het"');
    assert(ttNCC.phieu && ttNCC.phieu.soTien === 20000000, 'Tự động sinh Phiếu Chi 20.000.000 đ cho NCC');

    // -------------------------------------------------------------
    // TEST 6: Tra cứu Danh sách & Chi tiết Công nợ
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Tra cứu danh sách & Chi tiết Công nợ ---');
    const dsCN = await CongNoService.layDanhSachCongNo({ loaiDoiTuong: 'KhachHang' });
    assert(Array.isArray(dsCN.items), 'layDanhSachCongNo() trả về danh sách dạng mảng');
    assert(dsCN.items.length > 0, `Tìm thấy ${dsCN.items.length} khoản công nợ`);

    const ctCN = await CongNoService.layChiTietCongNo(cnKH._id);
    assert(ctCN && String(ctCN._id) === String(cnKH._id), 'layChiTietCongNo() lấy đúng bản ghi');

    // -------------------------------------------------------------
    // TEST 7: HTTP REST API Endpoints & RBAC (403 Forbidden)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Kiểm thử HTTP API Endpoints & Phân quyền RBAC ---');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    async function makeRequest(path, method = 'GET', body = null, cookie = '') {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(cookie ? { 'Cookie': cookie } : {})
          }
        }, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
            } catch (e) {
              resolve({ status: res.statusCode, data, headers: res.headers });
            }
          });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    }

    // Đăng nhập Kế toán
    const loginKeToan = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'ketoan',
      matKhau: '123456'
    });
    const cookieKeToan = loginKeToan.headers['set-cookie'] ? loginKeToan.headers['set-cookie'][0] : '';

    // Kế toán xem công nợ -> 200 OK
    const resHttpCN = await makeRequest('/api/cong-no', 'GET', null, cookieKeToan);
    assert(resHttpCN.status === 200, 'HTTP GET /api/cong-no trả về 200 OK cho Kế toán');

    // Kế toán xem tồn kho -> 200 OK
    const resHttpTonKho = await makeRequest('/api/kho/ton-kho', 'GET', null, cookieKeToan);
    assert(resHttpTonKho.status === 200, 'HTTP GET /api/kho/ton-kho trả về 200 OK');

    // Đăng nhập Kỹ thuật (không có quyền công nợ)
    const loginKyThuat = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'kythuat',
      matKhau: '123456'
    });
    const cookieKyThuat = loginKyThuat.headers['set-cookie'] ? loginKyThuat.headers['set-cookie'][0] : '';

    // Kỹ thuật truy cập /api/cong-no -> 403 Forbidden
    const resHttpForbidden = await makeRequest('/api/cong-no', 'GET', null, cookieKyThuat);
    assert(resHttpForbidden.status === 403, 'Phân quyền RBAC chặn Kỹ thuật truy cập Công nợ (Nhận 403 Forbidden)');

    server.close();

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES CỦA TRƯƠNG THẾ AN ĐÃ VƯỢT QUA 100%!\n');
      process.exit(0);
    } else {
      console.error(`❌ CÓ ${failed} TEST CASES BỊ THẤT BẠI!\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Lỗi ngoại lệ trong quá trình chạy test:', error);
    process.exit(1);
  }
}

runTests();