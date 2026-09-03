require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const {
  NhanVien,
  KhachHang,
  SanPham,
  HoaDon,
  DonDatHangTruoc,
  PhieuThu,
  PhieuChi
} = require('../src/models');

const { ThanhToanService, DatTruocService } = require('../src/services');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE ĐINH ĐỨC VƯỢNG (TUẦN 3: THU - CHI & SỔ QUỸ)');
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
    const [nvAdmin, nvKeToan, nvThuNgan, nvKyThuat, kh, sp, hd] = await Promise.all([
      NhanVien.findOne({ tenDangNhap: 'admin' }),
      NhanVien.findOne({ tenDangNhap: 'ketoan' }),
      NhanVien.findOne({ tenDangNhap: 'thungan' }),
      NhanVien.findOne({ tenDangNhap: 'kythuat' }),
      KhachHang.findOne(),
      SanPham.findOne(),
      HoaDon.findOne()
    ]);

    if (!kh || !sp) {
      throw new Error('Chưa có dữ liệu mẫu Khách hàng hoặc Sản phẩm. Hãy chạy npm run seed trước!');
    }

    console.log(`👤 Nhân viên kế toán: ${nvKeToan ? nvKeToan.hoTen : 'N/A'}`);
    console.log(`👤 Khách hàng test: ${kh.hoTen}`);
    console.log(`📱 Hóa đơn test: ${hd ? hd.soHD : 'N/A'}\n`);

    // -------------------------------------------------------------
    // TEST 1: Tạo Phiếu Thu hợp lệ (Tiền mặt, Chuyển khoản, Quẹt thẻ)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Tạo Phiếu Thu hợp lệ (taoPhieuThu) ---');
    const ptTienMat = await ThanhToanService.taoPhieuThu({
      soTien: 1500000,
      hinhThuc: 'Tien mat',
      ghiChu: 'Thu tiền bảo hành dịch vụ trực tiếp'
    });

    assert(ptTienMat && ptTienMat._id, 'Tạo Phiếu Thu tiền mặt thành công');
    assert(ptTienMat.soTien === 1500000, 'Số tiền thu lưu chính xác: 1.500.000 đ');
    assert(ptTienMat.hinhThuc === 'Tien mat', 'Hình thức: Tiền mặt');

    const ptChuyenKhoan = await ThanhToanService.taoPhieuThu({
      hoaDon: hd ? hd._id : null,
      soTien: 5000000,
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Khách thanh toán chuyển khoản'
    });

    assert(ptChuyenKhoan.hinhThuc === 'Chuyen khoan', 'Hình thức: Chuyển khoản');
    if (hd) {
      assert(ptChuyenKhoan.hoaDon.toString() === hd._id.toString(), 'Liên kết đúng mã Hóa đơn');
    }

    // -------------------------------------------------------------
    // TEST 2: Tạo Phiếu Chi hợp lệ (Nhà cung cấp, Hoàn tiền, Tiền mặt)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Tạo Phiếu Chi hợp lệ (taoPhieuChi) ---');
    const pcChiPhi = await ThanhToanService.taoPhieuChi({
      soTien: 350000,
      hinhThuc: 'Tien mat',
      lyDo: 'Chi tiền điện nước và vệ sinh cửa hàng'
    });

    assert(pcChiPhi && pcChiPhi._id, 'Tạo Phiếu Chi tiền mặt thành công');
    assert(pcChiPhi.soTien === 350000, 'Số tiền chi lưu chính xác: 350.000 đ');
    assert(pcChiPhi.lyDo.includes('Chi tiền điện'), 'Lý do chi được lưu trữ đầy đủ');

    const pcNhaCungCap = await ThanhToanService.taoPhieuChi({
      maDT: 'NCC-SAMSUNG-VN',
      soTien: 12000000,
      hinhThuc: 'Chuyen khoan',
      lyDo: 'Thanh toán đợt 1 tiền hàng phụ kiện'
    });

    assert(pcNhaCungCap.maDT === 'NCC-SAMSUNG-VN', 'Lưu đúng mã đối tượng nhận: NCC-SAMSUNG-VN');
    assert(pcNhaCungCap.soTien === 12000000, 'Số tiền chi chuyển khoản: 12.000.000 đ');

    // -------------------------------------------------------------
    // TEST 3: Validation đầu vào (Số tiền <= 0 -> 400 Bad Request)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Validation tham số đầu vào (400 Bad Request) ---');
    let errorZeroThu = false;
    try {
      await ThanhToanService.taoPhieuThu({ soTien: 0 });
    } catch (err) {
      if (err.statusCode === 400) errorZeroThu = true;
    }
    assert(errorZeroThu, 'Chặn tạo phiếu thu khi số tiền <= 0 (400)');

    let errorZeroChi = false;
    try {
      await ThanhToanService.taoPhieuChi({ soTien: -50000 });
    } catch (err) {
      if (err.statusCode === 400) errorZeroChi = true;
    }
    assert(errorZeroChi, 'Chặn tạo phiếu chi khi số tiền âm (400)');

    // Fallback hình thức thanh toán không hợp lệ
    const ptFallback = await ThanhToanService.taoPhieuThu({
      soTien: 100000,
      hinhThuc: 'HinhThucKhongTonTai'
    });
    assert(ptFallback.hinhThuc === 'Tien mat', 'Hình thức không hợp lệ tự động fallback về "Tien mat"');

    // -------------------------------------------------------------
    // TEST 4: Lấy danh sách & Phân trang Phiếu Thu
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Lấy danh sách Phiếu Thu (getPhieuThuList) ---');
    const resThuList = await ThanhToanService.getPhieuThuList({ limit: 5 });
    assert(Array.isArray(resThuList.list), 'Trả về danh sách phiếu thu dạng mảng');
    assert(resThuList.list.length > 0, `Đã tìm thấy ${resThuList.list.length} phiếu thu`);
    assert(resThuList.pagination && resThuList.pagination.total >= resThuList.list.length, 'Có thông tin phân trang chuẩn');

    // Lọc theo hình thức
    const resThuCK = await ThanhToanService.getPhieuThuList({ hinhThuc: 'Chuyen khoan' });
    const allCK = resThuCK.list.every(item => item.hinhThuc === 'Chuyen khoan');
    assert(allCK, 'Bộ lọc theo hình thức "Chuyen khoan" hoạt động chính xác 100%');

    // -------------------------------------------------------------
    // TEST 5: Lấy danh sách & Phân trang Phiếu Chi
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Lấy danh sách Phiếu Chi (getPhieuChiList) ---');
    const resChiList = await ThanhToanService.getPhieuChiList({ limit: 5 });
    assert(Array.isArray(resChiList.list), 'Trả về danh sách phiếu chi dạng mảng');
    assert(resChiList.list.length > 0, `Đã tìm thấy ${resChiList.list.length} phiếu chi`);
    assert(resChiList.pagination && resChiList.pagination.total >= resChiList.list.length, 'Có thông tin phân trang chuẩn');

    // -------------------------------------------------------------
    // TEST 6: Lấy chi tiết Phiếu Thu & Phiếu Chi
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Lấy chi tiết Phiếu Thu & Phiếu Chi ---');
    const detailThu = await ThanhToanService.getPhieuThuDetail(ptTienMat._id);
    assert(detailThu && detailThu._id.toString() === ptTienMat._id.toString(), 'Lấy chi tiết Phiếu Thu thành công');

    const detailChi = await ThanhToanService.getPhieuChiDetail(pcChiPhi._id);
    assert(detailChi && detailChi._id.toString() === pcChiPhi._id.toString(), 'Lấy chi tiết Phiếu Chi thành công');

    let errorNotFound = false;
    try {
      await ThanhToanService.getPhieuThuDetail('507f1f77bcf86cd799439011');
    } catch (err) {
      if (err.statusCode === 404) errorNotFound = true;
    }
    assert(errorNotFound, 'Báo lỗi 404 khi không tìm thấy phiếu thu');

    // -------------------------------------------------------------
    // TEST 7: Báo cáo Sổ Quỹ (getSoQuy) tính toán chính xác
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Tính toán Sổ Quỹ (getSoQuy) ---');
    const soQuy = await ThanhToanService.getSoQuy();
    assert(typeof soQuy.tongThu === 'number' && soQuy.tongThu > 0, `Tổng thu ghi nhận: ${soQuy.tongThu.toLocaleString('vi-VN')} đ`);
    assert(typeof soQuy.tongChi === 'number' && soQuy.tongChi > 0, `Tổng chi ghi nhận: ${soQuy.tongChi.toLocaleString('vi-VN')} đ`);
    assert(soQuy.tonQuy === soQuy.tongThu - soQuy.tongChi, `Tồn quỹ khớp hoàn toàn (Tổng thu - Tổng chi = ${soQuy.tonQuy.toLocaleString('vi-VN')} đ)`);
    assert(soQuy.theoHinhThuc && soQuy.theoHinhThuc['Tien mat'], 'Có phân tích số dư theo Tiền mặt');
    assert(soQuy.theoHinhThuc && soQuy.theoHinhThuc['Chuyen khoan'], 'Có phân tích số dư theo Chuyển khoản');
    assert(Array.isArray(soQuy.giaoDichGanDay), 'Có danh sách biến động dòng tiền gần đây');

    // -------------------------------------------------------------
    // TEST 8: Tích hợp Đặt hàng trước -> Tự sinh Phiếu Thu & Hoàn cọc sinh Phiếu Chi
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Tích hợp liên Service (Đơn đặt trước <-> Sổ quỹ) ---');
    const datTruocTest = await DatTruocService.createDatTruoc({
      khachHang: kh._id,
      sanPham: sp._id,
      soTienCoc: 1800000,
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Khách cọc máy đặt trước'
    }, nvAdmin);

    assert(datTruocTest.phieuThu !== null, 'Tạo đơn đặt trước tự động sinh Phiếu Thu');
    assert(datTruocTest.phieuThu.soTien === 1800000, 'Số tiền trên Phiếu Thu cọc khớp 1.800.000 đ');

    // Khách hủy đơn -> Tự sinh Phiếu Chi hoàn cọc
    const huyTest = await DatTruocService.huyDatTruoc(datTruocTest.donDatHang._id, {
      lyDo: 'Khách đổi ý không muốn lấy máy nữa'
    }, nvAdmin);

    assert(huyTest.phieuChi !== null, 'Hủy đơn đặt trước tự động sinh Phiếu Chi hoàn tiền');
    assert(huyTest.phieuChi.soTien === 1800000, 'Số tiền trên Phiếu Chi hoàn cọc khớp 1.800.000 đ');

    // -------------------------------------------------------------
    // TEST 9: HTTP REST API Endpoints & RBAC (403 Forbidden)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Kiểm thử HTTP API Endpoints & RBAC 403 ---');
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

    // Login vai trò Kế toán
    const loginKeToan = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'ketoan',
      matKhau: '123456'
    });
    const cookieKeToan = loginKeToan.headers['set-cookie'] ? loginKeToan.headers['set-cookie'][0] : '';

    // Kế toán truy cập Sổ quỹ -> 200 OK
    const resHttpSoQuy = await makeRequest('/api/thanh-toan/so-quy', 'GET', null, cookieKeToan);
    assert(resHttpSoQuy.status === 200, 'HTTP GET /api/thanh-toan/so-quy trả về 200 OK cho Kế toán');
    assert(resHttpSoQuy.data.success === true, 'Response JSON có success: true');

    // Kế toán tạo Phiếu Thu qua API -> 201 Created
    const resHttpCreateThu = await makeRequest('/api/thanh-toan/thu', 'POST', {
      soTien: 800000,
      hinhThuc: 'Vi dien tu',
      ghiChu: 'Thu tiền phụ kiện qua MoMo'
    }, cookieKeToan);
    assert(resHttpCreateThu.status === 201, 'HTTP POST /api/thanh-toan/thu trả về 201 Created');

    // Login vai trò Kỹ thuật (không có quyền xem sổ quỹ)
    const loginKyThuat = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'kythuat',
      matKhau: '123456'
    });
    const cookieKyThuat = loginKyThuat.headers['set-cookie'] ? loginKyThuat.headers['set-cookie'][0] : '';

    // Kỹ thuật cố truy cập Sổ quỹ -> 403 Forbidden
    const resHttpForbidden = await makeRequest('/api/thanh-toan/so-quy', 'GET', null, cookieKyThuat);
    assert(resHttpForbidden.status === 403, 'Phân quyền RBAC chặn vai trò Kỹ thuật truy cập Sổ quỹ (Nhận 403 Forbidden)');

    server.close();

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES CỦA ĐINH ĐỨC VƯỢNG ĐÃ VƯỢT QUA 100%!\n');
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
