require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const { PhieuNhapService, NhaCungCapService } = require('../src/services');
const { NhaCungCap, NhanVien, SanPham, MayImei, PhieuNhap, CongNo } = require('../src/models');

async function testTuanTuan4() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE PHẠM ĐĂNG TUÂN (TUẦN 4: BULK IMPORT & LỊCH SỬ NCC)');
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
    // 1. Lấy dữ liệu mock từ Seed
    const [ncc, nvThuKho, nvBanHang, sp] = await Promise.all([
      NhaCungCap.findOne(),
      NhanVien.findOne({ tenDangNhap: 'thukho' }),
      NhanVien.findOne({ tenDangNhap: 'banhang' }),
      SanPham.findOne()
    ]);

    if (!ncc || !nvThuKho || !sp) {
      throw new Error('Chưa có dữ liệu mẫu NCC, Nhân viên hoặc Sản phẩm. Hãy chạy npm run seed trước!');
    }

    console.log(`🏢 Nhà cung cấp test: ${ncc.tenNCC}`);
    console.log(`👤 Nhân viên thủ kho: ${nvThuKho.hoTen}`);
    console.log(`📱 Sản phẩm test: ${sp.tenMay}\n`);

    // -------------------------------------------------------------
    // TEST 1: Import hàng loạt 5 IMEI từ chuỗi phân cách hỗn hợp
    // -------------------------------------------------------------
    console.log('--- TEST 1: Import hàng loạt máy IMEI (PhieuNhapService.importHangLoat) ---');
    const testImeis = [
      'BULK_IMEI_1_' + Date.now().toString().slice(-6),
      'BULK_IMEI_2_' + Date.now().toString().slice(-6),
      'BULK_IMEI_3_' + Date.now().toString().slice(-6),
      'BULK_IMEI_4_' + Date.now().toString().slice(-6),
      'BULK_IMEI_5_' + Date.now().toString().slice(-6)
    ];

    // Giả lập copy-paste từ Excel có dấu phẩy, khoảng trắng, xuống dòng
    const imeiListText = `${testImeis[0]}, ${testImeis[1]} \n ${testImeis[2]} ,  ${testImeis[3]}\n\n${testImeis[4]}  `;

    const payloadBulk = {
      maNCC: ncc._id,
      maNV: nvThuKho._id,
      maSP: sp._id,
      imeiListText,
      giaNhap: 12000000,
      mauSac: 'Vàng Titan',
      dungLuong: '512GB',
      hinhThucThanhToan: 'Ghi no',
      ghiChu: 'Test import hàng loạt tuần 4'
    };

    const phieuNhap = await PhieuNhapService.importHangLoat(payloadBulk);
    assert(phieuNhap && phieuNhap._id, 'Import hàng loạt 5 máy IMEI thành công');
    assert(phieuNhap.tongTien === 12000000 * 5, 'Tổng tiền phiếu nhập khớp: 60.000.000 đ');

    // Kiểm tra tất cả 5 IMEI đã được lưu vào MayImei
    const savedImeis = await MayImei.find({ imei: { $in: testImeis } });
    assert(savedImeis.length === 5, 'Đã lưu đủ 5 bản ghi MayImei với trạng thái "Con hang"');

    // -------------------------------------------------------------
    // TEST 2: Chặn trùng lặp IMEI (409 Conflict)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Chặn trùng lặp IMEI khi Import hàng loạt (409 Conflict) ---');
    let is409Caught = false;
    try {
      await PhieuNhapService.importHangLoat(payloadBulk);
    } catch (error) {
      if (error.statusCode === 409) is409Caught = true;
    }
    assert(is409Caught, 'Hệ thống chặn thành công khi phát hiện IMEI đã tồn tại trong kho (409 Conflict)');

    // -------------------------------------------------------------
    // TEST 3: Chặn chuỗi IMEI rỗng hoặc không hợp lệ (400 Bad Request)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Validate dữ liệu đầu vào chuỗi IMEI ---');
    let is400EmptyCaught = false;
    try {
      await PhieuNhapService.importHangLoat({
        ...payloadBulk,
        imeiListText: '   , , \n\n   '
      });
    } catch (error) {
      if (error.statusCode === 400) is400EmptyCaught = true;
    }
    assert(is400EmptyCaught, 'Bắt lỗi 400 khi chuỗi IMEI chỉ toàn khoảng trắng / dấu phẩy');

    // -------------------------------------------------------------
    // TEST 4: Lấy lịch sử nhập hàng & Tổng dư nợ của Nhà Cung Cấp
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Lịch sử nhập hàng & Dư nợ cộng dồn của NCC ---');
    const lichSu = await NhaCungCapService.getLichSuNhap(ncc._id);
    assert(lichSu && lichSu.nhaCungCap && lichSu.nhaCungCap.tenNCC === ncc.tenNCC, 'Lấy đúng thông tin Nhà Cung Cấp');
    assert(typeof lichSu.duNo === 'number' && lichSu.duNo >= 60000000, `Tổng dư nợ NCC được tính toán chính xác (${lichSu.duNo.toLocaleString('vi-VN')} đ)`);
    assert(Array.isArray(lichSu.lichSuNhap.list), 'Trả về danh sách phiếu nhập phân trang dạng mảng');

    const phieuVuaTao = lichSu.lichSuNhap.list.find(pn => pn._id.toString() === phieuNhap._id.toString());
    assert(phieuVuaTao !== undefined, 'Phiếu nhập vừa tạo xuất hiện trong lịch sử nhập của NCC');
    if (phieuVuaTao && phieuVuaTao.nhanVien) {
      assert(phieuVuaTao.nhanVien.tenDangNhap !== undefined, 'Thông tin nhân viên lập phiếu được populate đúng tên đăng nhập (tenDangNhap)');
    }

    // -------------------------------------------------------------
    // TEST 5: HTTP REST API Endpoints & Phân quyền RBAC
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Kiểm thử HTTP API Endpoints & RBAC ---');
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

    // Đăng nhập Thủ kho
    const loginThuKho = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'thukho',
      matKhau: '123456'
    });
    const cookieThuKho = loginThuKho.headers['set-cookie'] ? loginThuKho.headers['set-cookie'][0] : '';

    // Thủ kho gọi POST /api/phieu-nhap/import-hang-loat -> 201 Created
    const httpImeis = `HTTP_BULK_1_${Date.now()}, HTTP_BULK_2_${Date.now()}`;
    const resHttpBulk = await makeRequest('/api/phieu-nhap/import-hang-loat', 'POST', {
      maNCC: ncc._id,
      maSP: sp._id,
      imeiListText: httpImeis,
      giaNhap: 15000000,
      hinhThucThanhToan: 'Tien mat'
    }, cookieThuKho);
    assert(resHttpBulk.status === 201, 'HTTP POST /api/phieu-nhap/import-hang-loat trả về 201 Created');

    // Thủ kho gọi GET /api/nha-cung-cap/:id/lich-su-nhap -> 200 OK
    const resHttpLichSu = await makeRequest(`/api/nha-cung-cap/${ncc._id}/lich-su-nhap`, 'GET', null, cookieThuKho);
    assert(resHttpLichSu.status === 200, 'HTTP GET /api/nha-cung-cap/:id/lich-su-nhap trả về 200 OK');

    // Đăng nhập Nhân viên Bán hàng (không có quyền xem lịch sử nhập hay import hàng loạt)
    const loginBanHang = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'banhang',
      matKhau: '123456'
    });
    const cookieBanHang = loginBanHang.headers['set-cookie'] ? loginBanHang.headers['set-cookie'][0] : '';

    // Bán hàng cố import hàng loạt -> 403 Forbidden
    const resHttpForbidden = await makeRequest('/api/phieu-nhap/import-hang-loat', 'POST', {
      maNCC: ncc._id,
      maSP: sp._id,
      imeiListText: 'FAIL_IMEI_1'
    }, cookieBanHang);
    assert(resHttpForbidden.status === 403, 'RBAC chặn NV bán hàng gọi import hàng loạt (403 Forbidden)');

    server.close();

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES TUẦN 4 CỦA PHẠM ĐĂNG TUÂN ĐÃ VƯỢT QUA 100%!\n');
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

testTuanTuan4();
