/**
 * Test tự động - Trương Thế An - Tuần 4 (Đối soát Công nợ & Quản lý Quá hạn)
 * Chạy: node tests/test_an_tuan4.js
 */
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

const { CongNoService, ThanhToanService } = require('../src/services');
const { KhachHang, NhaCungCap, NhanVien, CongNo, PhieuThu, PhieuChi } = require('../src/models');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE TRƯƠNG THẾ AN (TUẦN 4: ĐỐI SOÁT & QUẢN LÝ QUÁ HẠN)');
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
    const [kh, ncc, nvKeToan, nvKyThuat] = await Promise.all([
      KhachHang.findOne(),
      NhaCungCap.findOne(),
      NhanVien.findOne({ tenDangNhap: 'ketoan' }),
      NhanVien.findOne({ tenDangNhap: 'kythuat' })
    ]);

    if (!kh || !ncc || !nvKeToan || !nvKyThuat) {
      throw new Error('Cần seed đủ Khách hàng, NCC, Kế toán, Kỹ thuật trước khi test!');
    }

    console.log(`👤 Khách hàng test: ${kh.hoTen}`);
    console.log(`🏢 Nhà cung cấp test: ${ncc.tenNCC}\n`);

    // -------------------------------------------------------------
    // TEST 1: Tạo Công nợ có Hạn thanh toán (hanThanhToan)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Tạo Công nợ có Hạn thanh toán (hanThanhToan) ---');
    const hanTuongLai = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 ngày sau
    const cnKH = await CongNoService.taoCongNo({
      loaiDoiTuong: 'KhachHang',
      khachHang: kh._id,
      soTienNo: 12000000,
      hanThanhToan: hanTuongLai
    });

    assert(cnKH && cnKH._id, 'Tạo công nợ Khách Hàng có hạn thanh toán thành công');
    assert(cnKH.soTienNo === 12000000, 'Số tiền nợ 12.000.000 đ');
    assert(cnKH.hanThanhToan !== undefined, 'Ghi nhận đúng hạn thanh toán');
    assert(cnKH.trangThai === 'Con no', 'Trạng thái ban đầu: "Con no"');

    // -------------------------------------------------------------
    // TEST 2: Tra cứu Chi tiết Công nợ kèm Lịch sử Thanh toán (layChiTietCongNo)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Lịch sử Thu/Chi liên quan trong LayChiTietCongNo ---');
    
    // Thanh toán đợt 1: 4.000.000 đ -> Sinh Phiếu Thu 1
    const tt1 = await CongNoService.thanhToanCongNo(cnKH._id, {
      soTien: 4000000,
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Trả nợ đợt 1'
    });
    assert(tt1.phieu && tt1.phieu.soTien === 4000000, 'Tự động tạo Phiếu Thu đợt 1');

    // Thanh toán đợt 2: 3.000.000 đ -> Sinh Phiếu Thu 2
    const tt2 = await CongNoService.thanhToanCongNo(cnKH._id, {
      soTien: 3000000,
      hinhThuc: 'Tien mat',
      ghiChu: 'Trả nợ đợt 2'
    });
    assert(tt2.phieu && tt2.phieu.soTien === 3000000, 'Tự động tạo Phiếu Thu đợt 2');

    // Lấy chi tiết hồ sơ nợ
    const chiTiet = await CongNoService.layChiTietCongNo(cnKH._id);
    assert(chiTiet && String(chiTiet._id) === String(cnKH._id), 'Lấy đúng hồ sơ công nợ');
    assert(chiTiet.soTienConLai === 5000000, `Số tiền còn nợ tính toán chuẩn: 5.000.000 đ (Tổng: 12tr, Đã trả: 7tr)`);
    assert(Array.isArray(chiTiet.lichSuThanhToan), 'Lịch sử thanh toán dạng mảng');
    assert(chiTiet.lichSuThanhToan.length >= 2, `Tìm thấy ${chiTiet.lichSuThanhToan.length} phiếu thu/chi liên quan`);

    // -------------------------------------------------------------
    // TEST 3: Quản lý & Cập nhật Công nợ quá hạn (kiemTraVaCapNhatQuaHan)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Quản lý & Tự động Cập nhật Công nợ Quá hạn ---');
    const hanQuáHạn = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 ngày trước
    const cnNCCQuaHan = await CongNoService.taoCongNo({
      loaiDoiTuong: 'NhaCungCap',
      nhaCungCap: ncc._id,
      soTienNo: 18000000,
      hanThanhToan: hanQuáHạn
    });
    assert(cnNCCQuaHan && cnNCCQuaHan.trangThai === 'Con no', 'Tạo công nợ NCC có hạn quá ngày hiện tại');

    // Chạy tự động quét quá hạn
    const resQuaHan = await CongNoService.kiemTraVaCapNhatQuaHan();
    assert(resQuaHan.updatedCount > 0, `Đã tự động chuyển ${resQuaHan.updatedCount} khoản công nợ sang "Qua han"`);

    const cnNCCUpdated = await CongNo.findById(cnNCCQuaHan._id);
    assert(cnNCCUpdated.trangThai === 'Qua han', 'Công nợ NCC quá hạn được đổi trạng thái thành "Qua han"');

    // Thanh toán hết công nợ quá hạn -> Chuyển sang 'Da tra het'
    const ttQuaHan = await CongNoService.thanhToanCongNo(cnNCCQuaHan._id, {
      soTien: 18000000,
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Thanh toán nợ quá hạn NCC'
    });
    assert(ttQuaHan.congNo.trangThai === 'Da tra het', 'Thanh toán xong nợ quá hạn đổi trạng thái thành "Da tra het"');

    // -------------------------------------------------------------
    // TEST 4: Báo cáo Thống kê Đối soát Công nợ (layThongKeDoiSoat)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Báo cáo Thống kê Đối soát Công nợ ---');
    const thongKe = await CongNoService.layThongKeDoiSoat();
    assert(thongKe.khachHang && typeof thongKe.khachHang.tongNo === 'number', 'Có thông tin tổng hợp công nợ Khách Hàng');
    assert(thongKe.nhaCungCap && typeof thongKe.nhaCungCap.tongNo === 'number', 'Có thông tin tổng hợp công nợ Nhà Cung Cấp');
    assert(thongKe.quaHan && typeof thongKe.quaHan.soKhoanQuaHan === 'number', 'Ghi nhận chính xác số khoản nợ quá hạn');
    assert(thongKe.tongCong && thongKe.tongCong.tongSoKhoan > 0, `Tổng hợp toàn bộ ${thongKe.tongCong.tongSoKhoan} khoản công nợ hệ thống`);

    // -------------------------------------------------------------
    // TEST 5: HTTP Endpoints & Phân quyền RBAC
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: HTTP Endpoints & Phân quyền RBAC (Tuần 4) ---');
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

    // Kế toán gọi GET /api/cong-no/doi-soat -> 200 OK
    const resDoiSoat = await makeRequest('/api/cong-no/doi-soat', 'GET', null, cookieKeToan);
    assert(resDoiSoat.status === 200, 'HTTP GET /api/cong-no/doi-soat trả về 200 OK cho Kế toán');
    assert(resDoiSoat.data.success === true, 'Response JSON có success: true');

    // Kế toán gọi POST /api/cong-no/kiem-tra-qua-han -> 200 OK
    const resCheckQuaHan = await makeRequest('/api/cong-no/kiem-tra-qua-han', 'POST', null, cookieKeToan);
    assert(resCheckQuaHan.status === 200, 'HTTP POST /api/cong-no/kiem-tra-qua-han trả về 200 OK cho Kế toán');

    // Kế toán xem chi tiết /api/cong-no/:id -> 200 OK kèm lichSuThanhToan
    const resHttpChiTiet = await makeRequest(`/api/cong-no/${cnKH._id}`, 'GET', null, cookieKeToan);
    assert(resHttpChiTiet.status === 200, 'HTTP GET /api/cong-no/:id trả về 200 OK cho Kế toán');
    assert(Array.isArray(resHttpChiTiet.data.data.lichSuThanhToan), 'Chi tiết trả về chứa mảng lichSuThanhToan');

    // Đăng nhập Kỹ thuật (không có quyền công nợ)
    const loginKyThuat = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'kythuat',
      matKhau: '123456'
    });
    const cookieKyThuat = loginKyThuat.headers['set-cookie'] ? loginKyThuat.headers['set-cookie'][0] : '';

    // Kỹ thuật truy cập /api/cong-no/doi-soat -> 403 Forbidden
    const resForbiddenDoiSoat = await makeRequest('/api/cong-no/doi-soat', 'GET', null, cookieKyThuat);
    assert(resForbiddenDoiSoat.status === 403, 'RBAC chặn Kỹ thuật truy cập /api/cong-no/doi-soat (403 Forbidden)');

    server.close();

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ TUẦN 4: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES TUẦN 4 CỦA TRƯƠNG THẾ AN ĐÃ VƯỢT QUA 100%!\n');
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
