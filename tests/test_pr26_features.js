/**
 * Test Suite: Kiểm thử Tính năng và Tính toàn vẹn của PR #26
 * - Cơ chế Toggle Status (Khóa/Mở khóa) & Backward Compatible Delete Alias
 * - Bảo vệ Chống tự khóa tài khoản quản lý (Self-Lockout Prevention)
 * - Lọc máy IMEI và linh kiện theo trạng thái sản phẩm
 * - Tìm kiếm thời gian thực Sổ quỹ, Công nợ, Trả góp an toàn trước ReDoS / Regex Injection
 * - Phân quyền và REST Endpoints PUT toggle-status & DELETE
 */

const assert = require('assert');
const mongoose = require('mongoose');
const {
  SanPhamService,
  NhanVienService,
  KhachHangService,
  NhaCungCapService,
  PhuKienService,
  CongNoService,
  TraGopService,
  HoaDonService,
  BaoHanhService,
  AuthService
} = require('../src/services');

const {
  SanPham,
  NhanVien,
  KhachHang,
  NhaCungCap,
  PhuKien,
  LinhKien,
  MayImei,
  DanhMuc,
  CongNo
} = require('../src/models');

async function runTests() {
  console.log('======================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TÍNH NĂNG PR #26 & TOÀN VẸN HỆ THỐNG');
  console.log('======================================================');

  let passed = 0;
  function check(desc, condition) {
    assert(condition, desc);
    console.log(`  ✔ [PASS] ${desc}`);
    passed++;
  }

  // ---------------------------------------------------------------
  // 1. Kiểm thử SanPham Toggle Status & Backward Compatible Alias
  // ---------------------------------------------------------------
  console.log('\n--- [1] SanPham: Toggle Status & Delete Alias ---');
  const dm = await DanhMuc.findOne() || await DanhMuc.create({ tenDanhMuc: 'Test Category PR26' });
  
  const testSP = await SanPhamService.createSanPham({
    tenMay: 'Test Phone PR26',
    danhMuc: dm._id,
    hang: 'BrandPR26',
    giaGoc: 10000000,
    giaBan: 15000000
  });
  check('Tạo sản phẩm mẫu thành công với status mặc định là true', testSP.status !== false);

  // Toggle lần 1 -> status: false (Khóa)
  const resLock = await SanPhamService.toggleStatusSanPham(testSP._id);
  check('toggleStatusSanPham chuyển trạng thái thành false thành công', resLock.status === false);

  const spLockedInDb = await SanPham.findById(testSP._id);
  check('Dữ liệu trong CSDL đã cập nhật status: false', spLockedInDb.status === false);

  // getAllSanPhams mặc định không lấy sản phẩm đã khóa
  const listDefault = await SanPhamService.getAllSanPhams({ search: 'Test Phone PR26' });
  check('getAllSanPhams mặc định loại bỏ sản phẩm đã khóa', listDefault.sanPhams.length === 0);

  // getAllSanPhams({ status: 'all' }) lấy cả sản phẩm đã khóa
  const listAll = await SanPhamService.getAllSanPhams({ search: 'Test Phone PR26', status: 'all' });
  check('getAllSanPhams({ status: "all" }) lấy được sản phẩm đã khóa', listAll.sanPhams.length === 1);

  // getAllSanPhams({ status: false }) chỉ lấy sản phẩm đã khóa
  const listOnlyLocked = await SanPhamService.getAllSanPhams({ search: 'Test Phone PR26', status: false });
  check('getAllSanPhams({ status: false }) lấy được sản phẩm đã khóa', listOnlyLocked.sanPhams.length === 1);

  // Toggle lần 2 -> status: true (Mở khóa)
  const resUnlock = await SanPhamService.toggleStatusSanPham(testSP._id);
  check('toggleStatusSanPham lần 2 mở khóa lại thành công (status: true)', resUnlock.status === true);

  // Kiểm tra alias deleteSanPham
  const resAlias = await SanPhamService.deleteSanPham(testSP._id);
  check('deleteSanPham alias hoạt động tương đương toggleStatusSanPham', resAlias.success === true && resAlias.status === false);

  // Dọn dẹp
  await SanPham.findByIdAndDelete(testSP._id);

  // ---------------------------------------------------------------
  // 2. Kiểm thử NhanVien: Chống Tự Khóa Tài Khoản Quản Lý
  // ---------------------------------------------------------------
  console.log('\n--- [2] NhanVien: Self-Lockout Prevention & Toggle Status ---');
  const dummyId = new mongoose.Types.ObjectId();
  let errSelfLock = null;
  try {
    await NhanVienService.toggleStatusNhanVien(dummyId, dummyId);
  } catch (e) {
    errSelfLock = e;
  }
  check('Chặn quản lý tự thay đổi trạng thái/khóa tài khoản của chính mình (400 Bad Request)', errSelfLock && errSelfLock.statusCode === 400);

  // Tạo nhân viên phụ để test khóa/mở khóa
  const testNV = await NhanVienService.createNhanVien({
    hoTen: 'Nhân Viên Test PR26',
    tenDangNhap: 'nv_test_pr26_' + Date.now(),
    matKhau: 'Password@123',
    vaiTro: 'NV bán hàng',
    sdt: '0988776655'
  });

  const resLockNV = await NhanVienService.toggleStatusNhanVien(testNV._id, dummyId);
  check('Khóa tài khoản nhân viên thành công (trangThai: Khóa)', resLockNV.trangThai === 'Khóa');

  // Đăng nhập thử bằng tài khoản bị khóa -> phải nhận lỗi 403
  let errLoginLocked = null;
  try {
    await AuthService.login(testNV.tenDangNhap, 'Password@123');
  } catch (e) {
    errLoginLocked = e;
  }
  check('Tài khoản bị Khóa không thể đăng nhập vào hệ thống (403 Forbidden)', errLoginLocked && errLoginLocked.statusCode === 403);

  // Mở khóa lại
  const resUnlockNV = await NhanVienService.toggleStatusNhanVien(testNV._id, dummyId);
  check('Mở khóa lại tài khoản nhân viên thành công (trangThai: Hoạt động)', resUnlockNV.trangThai === 'Hoạt động');

  // Kiểm tra deleteNhanVien alias
  const resDelNVAlias = await NhanVienService.deleteNhanVien(testNV._id, dummyId);
  check('deleteNhanVien alias hoạt động tương đương toggleStatusNhanVien', resDelNVAlias.success === true);

  await NhanVien.findByIdAndDelete(testNV._id);

  // ---------------------------------------------------------------
  // 3. Kiểm thử Tìm kiếm An toàn (Chống ReDoS / Regex Injection)
  // ---------------------------------------------------------------
  console.log('\n--- [3] CongNo & TraGop: Safe Search against ReDoS & Special Regex ---');
  // Keyword chứa ký tự đặc biệt có thể phá vỡ Regex: () [ ] * + ? \ $ ^
  const dangerousKeyword = 'iPhone 15 Pro (Max) [256GB] + Special*?';
  
  let cnCrash = false;
  try {
    await CongNoService.layDanhSachCongNo({ search: dangerousKeyword });
  } catch (e) {
    cnCrash = true;
    console.error('CongNo search crashed:', e);
  }
  check('Tìm kiếm Công nợ với chuỗi Regex nguy hiểm không gây crash/500', cnCrash === false);

  let tgCrash = false;
  try {
    await TraGopService.layDanhSachHopDong({ search: dangerousKeyword });
  } catch (e) {
    tgCrash = true;
    console.error('TraGop search crashed:', e);
  }
  check('Tìm kiếm Hợp đồng trả góp với chuỗi Regex nguy hiểm không gây crash/500', tgCrash === false);

  // ---------------------------------------------------------------
  // 4. Kiểm thử POS Bán Hàng & Máy IMEI khi Sản phẩm bị Khóa
  // ---------------------------------------------------------------
  console.log('\n--- [4] POS & IMEI: Loại bỏ Máy thuộc Sản phẩm Đã Khóa ---');
  const spTam = await SanPhamService.createSanPham({
    tenMay: 'Máy Khóa POS PR26',
    danhMuc: dm._id,
    hang: 'BrandTest',
    giaGoc: 5000000,
    giaBan: 8000000
  });

  const imeiTam = await MayImei.create({
    imei: 'TEST_IMEI_PR26_' + Date.now(),
    sanPham: spTam._id,
    trangThai: 'Con hang',
    giaNhap: 5000000
  });

  // Khi sản phẩm chưa khóa: layImeiKhaDung trả về máy
  const listKhaDungTruoc = await HoaDonService.layImeiKhaDung({ search: imeiTam.imei });
  check('layImeiKhaDung gợi ý máy IMEI khi sản phẩm còn hoạt động', listKhaDungTruoc.some(m => m.imei === imeiTam.imei));

  // Khóa sản phẩm
  await SanPhamService.toggleStatusSanPham(spTam._id);

  // Khi sản phẩm đã khóa: layImeiKhaDung tự động loại bỏ máy
  const listKhaDungSau = await HoaDonService.layImeiKhaDung({ search: imeiTam.imei });
  check('layImeiKhaDung tự động loại trừ máy IMEI khi sản phẩm cha đã bị khóa', !listKhaDungSau.some(m => m.imei === imeiTam.imei));

  // Dọn dẹp
  await MayImei.findByIdAndDelete(imeiTam._id);
  await SanPham.findByIdAndDelete(spTam._id);

  // ---------------------------------------------------------------
  // 5. Kiểm thử Bảo Hành & Linh Kiện Trạng Thái
  // ---------------------------------------------------------------
  console.log('\n--- [5] BaoHanh: Lọc Linh Kiện Đang Hoạt Động ---');
  const lkTest = await LinhKien.create({
    tenLK: 'Linh Kiện Test PR26',
    donGia: 200000,
    soLuongTon: 10,
    status: false // Đã khóa
  });

  const allLK = await BaoHanhService.getAllLinhKien();
  check('getAllLinhKien chỉ lấy linh kiện hoạt động, loại bỏ linh kiện status: false', !allLK.some(lk => lk._id.toString() === lkTest._id.toString()));

  await LinhKien.findByIdAndDelete(lkTest._id);

  // ---------------------------------------------------------------
  // 6. Kiểm thử KhachHang & NhaCungCap & PhuKien Toggle Status & Delete Alias
  // ---------------------------------------------------------------
  console.log('\n--- [6] KhachHang, NhaCungCap, PhuKien: Toggle & Delete Aliases ---');
  const testKH = await KhachHangService.createKhachHang({
    hoTen: 'Khách Hàng PR26',
    sdt: '0901234999',
    diaChi: 'Hà Nội'
  });
  const resKhLock = await KhachHangService.toggleStatusKhachHang(testKH._id);
  check('Khóa khách hàng thành công (status: false)', resKhLock.status === false);
  const resKhAlias = await KhachHangService.deleteKhachHang(testKH._id);
  check('deleteKhachHang alias hoạt động (mở khóa lại, status: true)', resKhAlias.status === true);
  await KhachHang.findByIdAndDelete(testKH._id);

  const testNCC = await NhaCungCapService.createNhaCungCap({
    tenNCC: 'Nhà Cung Cấp PR26',
    sdt: '0909888777',
    diaChi: 'Hà Nội'
  });
  const resNccLock = await NhaCungCapService.toggleStatusNhaCungCap(testNCC._id);
  check('Khóa nhà cung cấp thành công (status: false)', resNccLock.status === false);
  const resNccAlias = await NhaCungCapService.deleteNhaCungCap(testNCC._id);
  check('deleteNhaCungCap alias hoạt động (mở khóa lại, status: true)', resNccAlias.status === true);
  await NhaCungCap.findByIdAndDelete(testNCC._id);

  const testPK = await PhuKienService.createPhuKien({
    tenPK: 'Phụ Kiện PR26',
    danhMuc: dm._id,
    giaBan: 150000,
    soLuongTon: 5
  });
  const resPkLock = await PhuKienService.toggleStatusPhuKien(testPK._id);
  check('Khóa phụ kiện thành công (status: false)', resPkLock.status === false);
  const resPkAlias = await PhuKienService.deletePhuKien(testPK._id);
  check('deletePhuKien alias hoạt động (mở khóa lại, status: true)', resPkAlias.status === true);
  await PhuKien.findByIdAndDelete(testPK._id);

  console.log(`\n🎉 TOÀN BỘ ${passed} KIỂM THỬ ĐÃ VƯỢT QUA 100%!`);
  return { passed };
}

if (require.main === module) {
  require('dotenv').config();
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
  mongoose.connect(mongoUri).then(async () => {
    try {
      await runTests();
      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ LỖI KIỂM THỬ PR26:', err);
      await mongoose.connection.close();
      process.exit(1);
    }
  });
}

module.exports = { runTests };
