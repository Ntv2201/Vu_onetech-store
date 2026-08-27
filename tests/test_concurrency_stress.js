/**
 * TEST STRESS & CONCURRENCY ATOMIC LOCK (QA & OPTIMIZATION)
 * Mô phỏng 50 quầy thu ngân cùng lúc gửi request bán 1 số IMEI duy nhất
 * Mục tiêu: Đảm bảo DUY NHẤT 1 request thành công (200), 49 requests còn lại bị chặn an toàn với lỗi 409 Conflict.
 */

const mongoose = require('mongoose');
const { HoaDonService } = require('../src/services');
const { NhanVien, KhachHang, SanPham, MayImei, DanhMuc, HoaDon, CT_HoaDon_May } = require('../src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';

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

async function runStressTest() {
  console.log('===============================================================');
  console.log('⚡ BẮT ĐẦU STRESS TEST & CONCURRENCY ATOMIC LOCK (50 CONCURRENT)');
  console.log('===============================================================\n');

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    console.log('[MongoDB] Connected successfully to test database\n');

    // 1. Chuẩn bị dữ liệu
    const nvBanHang = await NhanVien.findOne({ tenDangNhap: 'banhang' }) ||
      await NhanVien.create({
        hoTen: 'NV Bán Hàng Concurrency',
        tenDangNhap: 'banhang_stress',
        matKhau: '123456',
        vaiTro: 'NV bán hàng',
        sdt: '0988123456'
      });

    const khachHang = await KhachHang.findOne() ||
      await KhachHang.create({
        hoTen: 'Khách Hàng Stress Test',
        sdt: '0919998888',
        diaChi: 'Hà Nội'
      });

    let danhMuc = await DanhMuc.findOne({ tenDanhMuc: 'Điện thoại' }) ||
      await DanhMuc.create({ tenDanhMuc: 'Điện thoại' });

    const spStress = await SanPham.create({
      tenMay: 'iPhone 16 Pro Max Concurrency',
      hang: 'Apple',
      giaBan: 34990000,
      soThangBH: 12,
      danhMuc: danhMuc._id
    });

    const targetImei = 'STRESS_LOCK_' + Date.now();
    await MayImei.create({
      imei: targetImei,
      sanPham: spStress._id,
      giaNhap: 28000000,
      trangThai: 'Con hang'
    });

    console.log(`[Setup] Đã tạo 1 máy duy nhất với IMEI: ${targetImei} (Trạng thái: Con hang)\n`);

    // 2. Bắn 50 requests đồng thời cùng lúc cố gắng bán số IMEI này
    const TOTAL_REQUESTS = 50;
    console.log(`[Execution] Đang kích hoạt ${TOTAL_REQUESTS} requests đồng thời cạnh tranh 1 IMEI...`);

    const promises = [];
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      promises.push(
        HoaDonService.taoHoaDonBanHang({
          khachHang: khachHang._id,
          danhSachIMEI: [targetImei],
          hinhThucThanhToan: 'Da thanh toan',
          ghiChu: `Request worker concurrency index #${i + 1}`
        }, nvBanHang)
          .then(res => ({ success: true, index: i + 1, data: res }))
          .catch(err => ({ success: false, index: i + 1, error: err }))
      );
    }

    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.success).length;
    const conflictCount = results.filter(r => !r.success && r.error && r.error.statusCode === 409).length;
    const otherErrorCount = results.filter(r => !r.success && (!r.error || r.error.statusCode !== 409)).length;

    console.log(`\n[Results] Hoàn tất ${TOTAL_REQUESTS} requests:`);
    console.log(`  - Thành công (200 OK): ${successCount}`);
    console.log(`  - Chặn xung đột (409 Conflict): ${conflictCount}`);
    console.log(`  - Lỗi khác: ${otherErrorCount}\n`);

    // 3. Kiểm tra tính toàn vẹn và bất biến trong CSDL
    assert(successCount === 1, `Chính xác duy nhất 1 giao dịch bán hàng thành công (Kết quả: ${successCount})`);
    assert(conflictCount === TOTAL_REQUESTS - 1, `Toàn bộ ${TOTAL_REQUESTS - 1} giao dịch còn lại bị chặn an toàn với lỗi 409 Conflict (Kết quả: ${conflictCount})`);
    assert(otherErrorCount === 0, `Không có bất kỳ lỗi không mong muốn hoặc crash database nào (Kết quả: ${otherErrorCount})`);

    const finalMayDoc = await MayImei.findOne({ imei: targetImei });
    assert(finalMayDoc.trangThai === 'Da ban', 'Trạng thái máy IMEI cuối cùng trong DB là "Da ban"');

    const ctHds = await CT_HoaDon_May.find({ imei: targetImei });
    assert(ctHds.length === 1, 'Chỉ có đúng 1 bản ghi chi tiết hóa đơn CT_HoaDon_May được tạo cho IMEI này');

    await mongoose.connection.close();

    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ STRESS TEST: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ HỆ THỐNG ĐÃ ĐẠT CHỨNG CHỈ AN TOÀN CONCURRENCY & ATOMIC LOCK 100%!\n');
      setTimeout(() => process.exit(0), 50);
    } else {
      console.error(`❌ CÓ ${failed} TEST CASES BỊ THẤT BẠI!\n`);
      setTimeout(() => process.exit(1), 50);
    }
  } catch (err) {
    console.error('❌ Lỗi ngoại lệ trong stress test:', err);
    process.exit(1);
  }
}

runStressTest();
