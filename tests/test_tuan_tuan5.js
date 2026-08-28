/**
 * TEST SUITE: Trả Hàng Nhà Cung Cấp & Cấn Trừ Công Nợ (Tuân - Tuần 5)
 * Kiểm tra nghiệp vụ: traHangNhaCungCap()
 * - IMEI chuyển trạng thái -> 'Tra NCC'
 * - Tồn kho giảm đúng số lượng máy trả
 * - Công nợ NCC được cấn trừ chính xác
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { PhieuNhapService } = require('../src/services');
const { NhaCungCap, MayImei, CongNo, TonKho, SanPham, NhanVien } = require('../src/models');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

async function testTraHangNCC() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store');
    console.log('✅ Đã kết nối DB');

    // Lấy dữ liệu mẫu
    const ncc = await NhaCungCap.findOne().lean();
    const nv = await NhanVien.findOne().lean();
    const sp = await SanPham.findOne().lean();

    if (!ncc || !nv || !sp) {
      console.log('❌ Lỗi: Database chưa có đủ dữ liệu mẫu. Hãy chạy "npm run seed" trước.');
      process.exit(1);
    }

    // ─────────────────────────────────────────────────
    // BƯỚC 1: Nhập 2 máy mới để tạo dữ liệu thử nghiệm
    // ─────────────────────────────────────────────────
    const imeiTest1 = 'IMEI_TRAHANG_1_' + Date.now();
    const imeiTest2 = 'IMEI_TRAHANG_2_' + Date.now();
    const imeiListForTest = [imeiTest1, imeiTest2];
    const donGiaNhap = 10000000; // 10 triệu / máy

    console.log('\n--- 🚀 BƯỚC 1: Nhập 2 máy mồi (hình thức Ghi nợ) ---');
    const congNoTruoc = await CongNo.findOne({ loaiDoiTuong: 'NhaCungCap', nhaCungCap: ncc._id }).lean();
    const duNoTruoc = congNoTruoc ? Math.max(0, (congNoTruoc.soTienNo || 0) - (congNoTruoc.soTienDaTra || 0)) : 0;

    await PhieuNhapService.taoPhieuNhap({
      maNCC: ncc._id,
      maNV: nv._id,
      danhSachMay: [
        { maSP: sp._id, imei: imeiTest1, giaNhap: donGiaNhap, mauSac: 'Đen', dungLuong: '256GB' },
        { maSP: sp._id, imei: imeiTest2, giaNhap: donGiaNhap, mauSac: 'Trắng', dungLuong: '256GB' }
      ],
      danhSachPhuKien: [],
      hinhThucThanhToan: 'Ghi no',
      ghiChu: 'Phiếu nhập mồi cho test trả hàng'
    });

    const congNoSauNhap = await CongNo.findOne({ loaiDoiTuong: 'NhaCungCap', nhaCungCap: ncc._id }).lean();
    const duNoSauNhap = congNoSauNhap ? Math.max(0, (congNoSauNhap.soTienNo || 0) - (congNoSauNhap.soTienDaTra || 0)) : 0;
    assert(duNoSauNhap > duNoTruoc, `Dư nợ tăng sau khi nhập hàng (${duNoTruoc} -> ${duNoSauNhap})`);

    const tonKhoTruoc = await TonKho.findOne({ sanPham: sp._id }).lean();

    // ─────────────────────────────────────────────────
    // BƯỚC 2: Gọi traHangNhaCungCap
    // ─────────────────────────────────────────────────
    console.log('\n--- 🚀 BƯỚC 2: Gọi API Trả hàng 2 máy vừa nhập ---');
    const res = await PhieuNhapService.traHangNhaCungCap({
      maNCC: ncc._id,
      imeiList: imeiListForTest,
      lyDo: 'Máy bị móp viền - kiểm tra chất lượng không đạt'
    });

    assert(res.success === true, 'API trả về success = true');
    assert(res.soLuongTra === 2, `Số lượng trả đúng: ${res.soLuongTra}`);
    assert(res.tongTienTra === donGiaNhap * 2, `Tổng tiền trả đúng: ${res.tongTienTra} VNĐ`);

    // ─────────────────────────────────────────────────
    // BƯỚC 3: Đối soát Database
    // ─────────────────────────────────────────────────
    console.log('\n--- 🚀 BƯỚC 3: Đối soát Database sau khi trả hàng ---');

    // Kiểm tra trạng thái IMEI
    const imeiSauKhiTra = await MayImei.find({ imei: { $in: imeiListForTest } }).lean();
    assert(
      imeiSauKhiTra.every(m => m.trangThai === 'Tra NCC'),
      `Tất cả IMEI được cập nhật trạng thái thành 'Tra NCC'`
    );

    // Kiểm tra tồn kho giảm
    if (tonKhoTruoc) {
      const tonKhoSau = await TonKho.findOne({ sanPham: sp._id }).lean();
      const soLuongGiam = tonKhoTruoc.soLuong - (tonKhoSau ? tonKhoSau.soLuong : 0);
      assert(soLuongGiam === 2, `Tồn kho giảm đúng 2 máy (từ ${tonKhoTruoc.soLuong} -> ${tonKhoSau ? tonKhoSau.soLuong : 'null'})`);
    } else {
      console.log('  ⚠️  [SKIP] Không có bản ghi TonKho cho sản phẩm này');
    }

    // Kiểm tra công nợ giảm
    const congNoSauTra = await CongNo.findOne({ loaiDoiTuong: 'NhaCungCap', nhaCungCap: ncc._id }).lean();
    const duNoSauTra = congNoSauTra ? Math.max(0, (congNoSauTra.soTienNo || 0) - (congNoSauTra.soTienDaTra || 0)) : 0;
    const soTienCanTru = Math.min(res.tongTienTra, duNoSauNhap);
    assert(
      duNoSauNhap - duNoSauTra >= soTienCanTru,
      `Công nợ được cấn trừ đúng ≥ ${soTienCanTru} VNĐ (dư nợ ${duNoSauNhap} -> ${duNoSauTra})`
    );

    // ─────────────────────────────────────────────────
    // BƯỚC 4: Kiểm tra bảo vệ — thử trả lại IMEI đã trả
    // ─────────────────────────────────────────────────
    console.log('\n--- 🚀 BƯỚC 4: Kiểm tra guard — trả lại IMEI đã ở trạng thái Tra NCC ---');
    try {
      await PhieuNhapService.traHangNhaCungCap({
        maNCC: ncc._id,
        imeiList: imeiListForTest,
        lyDo: 'Thử trả lần 2 (phải bị chặn)'
      });
      assert(false, 'Lẽ ra phải chặn việc trả IMEI đã ở trạng thái Tra NCC');
    } catch (err) {
      assert(err.statusCode === 400 || err.message.includes('Tra NCC'), `Chặn đúng khi trả IMEI đã ở trạng thái 'Tra NCC': ${err.message}`);
    }

  } catch (error) {
    console.error('\n❌ Lỗi Test không mong đợi:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
    console.log(`\n📊 Kết quả: ${passCount} PASS | ${failCount} FAIL`);
    if (failCount > 0) process.exit(1);
  }
}

testTraHangNCC();
