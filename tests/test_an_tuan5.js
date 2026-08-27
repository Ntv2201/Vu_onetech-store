/**
 * Test tự động - Trương Thế An - Tuần 5 (Phân hệ Hợp đồng Trả góp & Lịch thu kỳ hạn)
 * Chạy: node tests/test_an_tuan5.js
 */
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

const { TraGopService, HoaDonService, ThanhToanService } = require('../src/services');
const { KhachHang, NhanVien, SanPham, MayImei, HoaDon, HopDongTraGop, PhieuThu } = require('../src/models');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE TRƯƠNG THẾ AN (TUẦN 5: TRẢ GÓP & LỊCH THU KỲ)');
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
    const [kh, nv, sp] = await Promise.all([
      KhachHang.findOne(),
      NhanVien.findOne({ tenDangNhap: 'banhang' }),
      SanPham.findOne()
    ]);

    if (!kh || !nv || !sp) {
      throw new Error('Cần seed đủ Khách hàng, Nhân viên bán hàng, Sản phẩm trước khi test!');
    }

    // Tạo 1 hóa đơn mẫu riêng để phục vụ test trả góp
    const testImeiStr = 'TG' + Date.now().toString().slice(-12);
    const mayTest = await MayImei.create({
      imei: testImeiStr,
      sanPham: sp._id,
      giaNhap: 20000000,
      mauSac: 'Titan Xám',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    const hdRes = await HoaDonService.taoHoaDonBanHang({
      khachHang: kh._id,
      nhanVien: nv._id,
      danhSachIMEI: [mayTest.imei],
      danhSachPhuKien: [],
      hinhThucThanhToan: 'Chuyen khoan',
      ghiChu: 'Hóa đơn mẫu lập hợp đồng trả góp'
    }, nv);

    const hoaDonTest = hdRes.hoaDon;
    console.log(`🧾 Hóa đơn test: ${hoaDonTest.soHD} - Tổng tiền: ${hoaDonTest.tongTien.toLocaleString('vi-VN')} đ\n`);

    // -------------------------------------------------------------
    // TEST 1: Lập Hợp đồng Trả góp (taoHopDongTraGop)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Lập Hợp đồng Trả góp (TraGopService.taoHopDongTraGop) ---');
    const soTienTraTruoc = 5000000;
    const soKy = 12; // 12 tháng

    const hopDong = await TraGopService.taoHopDongTraGop({
      hoaDonId: hoaDonTest._id,
      soTienTraTruoc,
      soKy,
      ghiChu: 'Hợp đồng trả góp 12 tháng'
    });

    assert(hopDong && hopDong._id, 'Lập hợp đồng trả góp thành công');
    assert(hopDong.soTienTraTruoc === soTienTraTruoc, `Ghi nhận trả trước: ${soTienTraTruoc.toLocaleString('vi-VN')} đ`);
    const expectedTraGop = hoaDonTest.tongTien - soTienTraTruoc;
    assert(hopDong.soTienTraGop === expectedTraGop, `Số tiền trả góp chính xác: ${expectedTraGop.toLocaleString('vi-VN')} đ`);
    assert(hopDong.soKy === 12, 'Số kỳ trả góp: 12 tháng');
    assert(hopDong.soTienMoiKy === Math.round(expectedTraGop / 12), `Số tiền mỗi kỳ: ${hopDong.soTienMoiKy.toLocaleString('vi-VN')} đ`);
    assert(hopDong.trangThaiDuyet === 'Da duyet', 'Trạng thái hợp đồng: "Da duyet"');

    // Chặn lập trùng hợp đồng cho cùng 1 hóa đơn
    let errTrung = null;
    try {
      await TraGopService.taoHopDongTraGop({ hoaDonId: hoaDonTest._id, soKy: 6 });
    } catch (err) {
      errTrung = err;
    }
    assert(errTrung !== null && errTrung.statusCode === 409, 'Chặn lập trùng hợp đồng trả góp cho cùng 1 hóa đơn (409 Conflict)');

    // -------------------------------------------------------------
    // TEST 2: Sinh Lịch thu Kỳ hạn (layLichThuKy)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Sinh Lịch thu Kỳ hạn định kỳ (layLichThuKy) ---');
    const resLichThu = await TraGopService.layLichThuKy(hopDong._id);
    assert(Array.isArray(resLichThu.lichThu), 'Lịch thu tiền dạng mảng');
    assert(resLichThu.lichThu.length === 12, 'Đủ 12 kỳ thu tương ứng 12 tháng');
    assert(resLichThu.lichThu[0].kyThu === 1, 'Kỳ đầu tiên là Kỳ 1');
    assert(resLichThu.lichThu[11].kyThu === 12, 'Kỳ cuối cùng là Kỳ 12');

    // -------------------------------------------------------------
    // TEST 3: Thu tiền 1 Kỳ & Tự động sinh Phiếu Thu Sổ quỹ (thuTienKy)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Thu tiền 1 Kỳ & Tự sinh Phiếu Thu Sổ quỹ ---');
    const resThuKy1 = await TraGopService.thuTienKy(hopDong._id, {
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Thu tiền trả góp kỳ 1'
    });

    assert(resThuKy1.hopDong.soKyDaThu === 1, 'Số kỳ đã thu tăng lên 1');
    assert(resThuKy1.phieuThu !== null, 'Tự động tạo Phiếu Thu trong Sổ quỹ');
    assert(resThuKy1.phieuThu.soTien === resThuKy1.soTienThu, 'Số tiền Phiếu Thu khớp 100% với số tiền kỳ 1');

    // Lịch thu cập nhật kỳ 1 -> 'Da thu'
    const resLichThuUpdated = await TraGopService.layLichThuKy(hopDong._id);
    assert(resLichThuUpdated.lichThu[0].daThu === true, 'Kỳ 1 đã đánh dấu daThu = true');
    assert(resLichThuUpdated.lichThu[0].trangThai === 'Da thu', 'Trạng thái Kỳ 1: "Da thu"');

    // -------------------------------------------------------------
    // TEST 4: Thu tất toán toàn bộ các kỳ còn lại -> Chuyển 'Hoan tat'
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Thu tất toán đủ 12 kỳ & Chuyển trạng thái "Hoan tat" ---');
    for (let k = 2; k <= 12; k++) {
      await TraGopService.thuTienKy(hopDong._id, { hinhThuc: 'Tien mat' });
    }

    const hopDongCuoi = await HopDongTraGop.findById(hopDong._id);
    assert(hopDongCuoi.soKyDaThu === 12, 'Số kỳ đã thu đạt đủ 12/12 kỳ');
    assert(hopDongCuoi.trangThaiDuyet === 'Hoan tat', 'Trạng thái hợp đồng đổi thành "Hoan tat"');

    // Chặn thu vượt số kỳ
    let errVuot = null;
    try {
      await TraGopService.thuTienKy(hopDong._id, { hinhThuc: 'Tien mat' });
    } catch (err) {
      errVuot = err;
    }
    assert(errVuot !== null && errVuot.statusCode === 400, 'Chặn thu tiền khi hợp đồng đã hoàn tất tất toán (400 Bad Request)');

    // -------------------------------------------------------------
    // TEST 5: HTTP Endpoints & Phân quyền RBAC (Tuần 5)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: HTTP Endpoints & Phân quyền RBAC (Tuần 5) ---');
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

    // Kế toán GET /api/tra-gop -> 200 OK
    const resGetList = await makeRequest('/api/tra-gop', 'GET', null, cookieKeToan);
    assert(resGetList.status === 200, 'HTTP GET /api/tra-gop trả về 200 OK cho Kế toán');
    assert(resGetList.data.success === true, 'Response JSON có success: true');

    // Kế toán GET /api/tra-gop/:id/lich-thu -> 200 OK
    const resGetLichThu = await makeRequest(`/api/tra-gop/${hopDong._id}/lich-thu`, 'GET', null, cookieKeToan);
    assert(resGetLichThu.status === 200, 'HTTP GET /api/tra-gop/:id/lich-thu trả về 200 OK cho Kế toán');

    // Đăng nhập Kỹ thuật (không có quyền xem trả góp)
    const loginKyThuat = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'kythuat',
      matKhau: '123456'
    });
    const cookieKyThuat = loginKyThuat.headers['set-cookie'] ? loginKyThuat.headers['set-cookie'][0] : '';

    // Kỹ thuật GET /api/tra-gop -> 403 Forbidden
    const resForbidden = await makeRequest('/api/tra-gop', 'GET', null, cookieKyThuat);
    assert(resForbidden.status === 403, 'RBAC chặn Kỹ thuật truy cập /api/tra-gop (403 Forbidden)');

    server.close();

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ TUẦN 5: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES TUẦN 5 CỦA TRƯƠNG THẾ AN ĐÃ VƯỢT QUA 100%!\n');
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
