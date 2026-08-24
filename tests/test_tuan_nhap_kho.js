require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const {
  NhanVien,
  NhaCungCap,
  SanPham,
  MayImei,
  PhuKien,
  TonKho,
  PhieuNhap,
  CT_PhieuNhap,
  PhieuChi,
  CongNo
} = require('../src/models');

const { PhieuNhapService, TonKhoService, ThanhToanService } = require('../src/services');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE PHẠM ĐĂNG TUÂN (TUẦN 3: NHẬP KHO & TỒN KHO)');
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
    const [nvThuKho, nvAdmin, nvKyThuat, ncc, sp, pk] = await Promise.all([
      NhanVien.findOne({ tenDangNhap: 'thukho' }),
      NhanVien.findOne({ tenDangNhap: 'admin' }),
      NhanVien.findOne({ tenDangNhap: 'kythuat' }),
      NhaCungCap.findOne(),
      SanPham.findOne(),
      PhuKien.findOne()
    ]);

    if (!ncc || !sp || !pk) {
      throw new Error('Chưa có dữ liệu mẫu NCC, Sản phẩm hoặc Phụ kiện. Hãy chạy npm run seed trước!');
    }

    console.log(`👤 Nhân viên thủ kho: ${nvThuKho ? nvThuKho.hoTen : 'N/A'}`);
    console.log(`🏢 Nhà cung cấp test: ${ncc.tenNCC}`);
    console.log(`📱 Sản phẩm test: ${sp.tenMay}`);
    console.log(`🎧 Phụ kiện test: ${pk.tenPK || pk.tenPhuKien} (Tồn trước: ${pk.soLuongTon})\n`);

    // -------------------------------------------------------------
    // TEST 1: Nhập kho máy IMEI & Tăng tồn kho
    // -------------------------------------------------------------
    console.log('--- TEST 1: Nhập kho Máy theo IMEI (taoPhieuNhap) ---');
    const testImei1 = 'IMEI_TUAN_' + Date.now().toString().slice(-6) + '1';
    const testImei2 = 'IMEI_TUAN_' + Date.now().toString().slice(-6) + '2';

    const pnMay = await PhieuNhapService.taoPhieuNhap({
      maNCC: ncc._id,
      maNV: nvThuKho._id,
      hinhThucThanhToan: 'Chuyen khoan',
      ghiChu: 'Nhập lô máy iPhone thử nghiệm',
      danhSachMay: [
        { imei: testImei1, maSP: sp._id, giaNhap: 25000000, mauSac: 'Titan', dungLuong: '256GB' },
        { imei: testImei2, maSP: sp._id, giaNhap: 25000000, mauSac: 'Titan', dungLuong: '256GB' }
      ]
    });

    assert(pnMay && pnMay._id, 'Tạo phiếu nhập máy thành công');
    assert(pnMay.tongTien === 50000000, 'Tổng tiền phiếu nhập khớp: 50.000.000 đ');

    // Kiểm tra MayImei tạo mới
    const dbImei1 = await MayImei.findOne({ imei: testImei1 });
    assert(dbImei1 !== null, `Máy IMEI ${testImei1} đã được ghi nhận vào CSDL`);
    assert(dbImei1.trangThai === 'Con hang', 'Trạng thái máy là "Con hang"');
    assert(dbImei1.giaNhap === 25000000, 'Giá nhập máy chính xác');

    // Kiểm tra CT_PhieuNhap
    const ctList = await CT_PhieuNhap.find({ phieuNhap: pnMay._id });
    assert(ctList.length === 2, 'Tạo đủ 2 dòng chi tiết phiếu nhập CT_PhieuNhap');

    // Kiểm tra tự động sinh Phiếu Chi trong Sổ quỹ
    const phieuChi = await PhieuChi.findOne({ phieuNhap: pnMay._id });
    assert(phieuChi !== null, 'Hệ thống tự động sinh Phiếu Chi trả tiền cho NCC');
    assert(phieuChi.soTien === 50000000, 'Số tiền phiếu chi khớp 50.000.000 đ');

    // -------------------------------------------------------------
    // TEST 2: Nhập kho Phụ kiện & Tăng số lượng tồn
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Nhập kho Phụ kiện & Tăng tồn kho (PhuKien.soLuongTon) ---');
    const oldTonPK = pk.soLuongTon;
    const pnPK = await PhieuNhapService.taoPhieuNhap({
      maNCC: ncc._id,
      maNV: nvThuKho._id,
      hinhThucThanhToan: 'Tien mat',
      ghiChu: 'Nhập phụ kiện bổ sung',
      danhSachPhuKien: [
        { maPK: pk._id, giaNhap: 300000, soLuong: 10 }
      ]
    });

    assert(pnPK && pnPK._id, 'Tạo phiếu nhập phụ kiện thành công');
    assert(pnPK.tongTien === 3000000, 'Tổng tiền phụ kiện khớp: 3.000.000 đ');

    const updatedPK = await PhuKien.findById(pk._id);
    assert(updatedPK.soLuongTon === oldTonPK + 10, `Số lượng tồn phụ kiện tăng từ ${oldTonPK} -> ${updatedPK.soLuongTon}`);

    // -------------------------------------------------------------
    // TEST 3: Nhập hàng Ghi nợ NCC (Tạo Công Nợ)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Nhập kho Ghi nợ NCC (Tự sinh Công Nợ) ---');
    const testImeiNo = 'IMEI_NO_' + Date.now().toString().slice(-6);
    const pnNo = await PhieuNhapService.taoPhieuNhap({
      maNCC: ncc._id,
      maNV: nvThuKho._id,
      hinhThucThanhToan: 'Ghi no',
      ghiChu: 'Nhập hàng nợ gối đầu',
      danhSachMay: [
        { imei: testImeiNo, maSP: sp._id, giaNhap: 20000000 }
      ]
    });

    assert(pnNo && pnNo._id, 'Tạo phiếu nhập ghi nợ thành công');
    const congNo = await CongNo.findOne({ loaiDoiTuong: 'NhaCungCap', nhaCungCap: ncc._id, trangThai: 'Con no' });
    assert(congNo !== null, 'Tự động tạo bản ghi Công Nợ cho Nhà Cung Cấp');
    assert(congNo.soTienNo >= 20000000, 'Số tiền công nợ được cập nhật chính xác');
    assert(congNo.trangThai === 'Con no', 'Trạng thái công nợ: "Con no"');

    // -------------------------------------------------------------
    // TEST 4: Chặn trùng IMEI (409 Conflict)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Chặn trùng lặp IMEI (409 Conflict) ---');
    let errorDuplicateIMEI = false;
    try {
      await PhieuNhapService.taoPhieuNhap({
        maNCC: ncc._id,
        maNV: nvThuKho._id,
        danhSachMay: [
          { imei: testImei1, maSP: sp._id, giaNhap: 25000000 } // IMEI đã có trong DB
        ]
      });
    } catch (err) {
      if (err.statusCode === 409) errorDuplicateIMEI = true;
    }
    assert(errorDuplicateIMEI, 'Chặn nhập IMEI đã tồn tại trong CSDL (409 Conflict)');

    // Chặn trùng IMEI ngay trong danh sách gửi lên
    let errorDuplicatePayload = false;
    const sameImei = 'SAME_IMEI_' + Date.now();
    try {
      await PhieuNhapService.taoPhieuNhap({
        maNCC: ncc._id,
        maNV: nvThuKho._id,
        danhSachMay: [
          { imei: sameImei, maSP: sp._id, giaNhap: 25000000 },
          { imei: sameImei, maSP: sp._id, giaNhap: 25000000 }
        ]
      });
    } catch (err) {
      if (err.statusCode === 400) errorDuplicatePayload = true;
    }
    assert(errorDuplicatePayload, 'Chặn danh sách có 2 IMEI trùng nhau trong 1 phiếu (400 Bad Request)');

    // -------------------------------------------------------------
    // TEST 5: Tra cứu & Chi tiết Phiếu Nhập
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Tra cứu danh sách & Chi tiết Phiếu Nhập ---');
    const resList = await PhieuNhapService.getDanhSachPhieuNhap({ limit: 5 });
    assert(Array.isArray(resList.list), 'Trả về danh sách phiếu nhập dạng mảng');
    assert(resList.list.length > 0, `Tìm thấy ${resList.list.length} phiếu nhập`);

    const detail = await PhieuNhapService.getChiTietPhieuNhap(pnMay._id);
    assert(detail && detail.phieuNhap, 'Lấy chi tiết phiếu nhập thành công');
    assert(detail.chiTiet.length === 2, 'Lấy đầy đủ danh sách máy IMEI kèm thông tin sản phẩm');

    // -------------------------------------------------------------
    // TEST 6: Cập nhật tồn kho (TonKhoService.capNhatTonKho)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Kiểm thử TonKhoService ---');
    const tonKhoResult = await TonKhoService.capNhatTonKho(sp._id, null, 2);
    assert(tonKhoResult && tonKhoResult.soLuong > 0, 'Cập nhật tăng tồn kho sản phẩm thành công');

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

    // Login vai trò Thủ kho
    const loginThuKho = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'thukho',
      matKhau: '123456'
    });
    const cookieThuKho = loginThuKho.headers['set-cookie'] ? loginThuKho.headers['set-cookie'][0] : '';

    // Thủ kho lấy danh sách phiếu nhập -> 200 OK
    const resHttpList = await makeRequest('/api/phieu-nhap', 'GET', null, cookieThuKho);
    assert(resHttpList.status === 200, 'HTTP GET /api/phieu-nhap trả về 200 OK cho Thủ kho');

    // Thủ kho tạo phiếu nhập mới qua HTTP -> 201 Created
    const httpImei = 'HTTP_IMEI_' + Date.now().toString().slice(-6);
    const resHttpCreate = await makeRequest('/api/phieu-nhap', 'POST', {
      maNCC: ncc._id,
      hinhThucThanhToan: 'Tien mat',
      ghiChu: 'Nhập qua API Test',
      danhSachMay: [
        { imei: httpImei, maSP: sp._id, giaNhap: 18000000 }
      ]
    }, cookieThuKho);
    assert(resHttpCreate.status === 201, 'HTTP POST /api/phieu-nhap trả về 201 Created cho Thủ kho');

    // Login vai trò Kỹ thuật (không có quyền tạo phiếu nhập)
    const loginKyThuat = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'kythuat',
      matKhau: '123456'
    });
    const cookieKyThuat = loginKyThuat.headers['set-cookie'] ? loginKyThuat.headers['set-cookie'][0] : '';

    // Kỹ thuật cố tạo phiếu nhập -> 403 Forbidden
    const resHttpForbidden = await makeRequest('/api/phieu-nhap', 'POST', {
      maNCC: ncc._id,
      danhSachMay: [{ imei: 'IMEI_FAIL', maSP: sp._id, giaNhap: 10000000 }]
    }, cookieKyThuat);
    assert(resHttpForbidden.status === 403, 'Phân quyền RBAC chặn vai trò Kỹ thuật tạo phiếu nhập (Nhận 403 Forbidden)');

    server.close();

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES CỦA PHẠM ĐĂNG TUÂN ĐÃ VƯỢT QUA 100%!\n');
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
