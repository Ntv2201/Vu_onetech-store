/**
 * TEST SUITE: PHÂN HỆ KIỂM KÊ KHO & ĐỐI SOÁT IMEI (ĐINH ĐỨC VƯỢNG - TUẦN 4)
 * Kiểm tra toàn diện các nghiệp vụ:
 * 1. Tra cứu danh sách IMEI lý thuyết theo kho
 * 2. Đối soát quét IMEI thực tế: Khớp 100%, Phát hiện Thiếu, Phát hiện Thừa, Phát hiện Bất thường
 * 3. Sinh mã Biên Bản Kiểm Kê (BBKK) & các dòng Điều Chỉnh Kho (DieuChinhKho)
 * 4. Truy vấn danh sách biên bản kiểm kê phân trang & chi tiết
 * 5. Áp dụng điều chỉnh kho (cập nhật tồn kho TonKho và trạng thái MayImei)
 * 6. Hủy biên bản kiểm kê & các ràng buộc toàn vẹn dữ liệu
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { KiemKeService, TonKhoService } = require('../src/services');
const {
  Kho,
  NhanVien,
  SanPham,
  MayImei,
  TonKho,
  BienBanKiemKe,
  DieuChinhKho
} = require('../src/models');

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

async function runKiemKeTests() {
  console.log('======================================================================');
  console.log('📦 BẮT ĐẦU KIỂM THỬ PHÂN HỆ KIỂM KÊ KHO & XỬ LÝ LỆCH IMEI (VƯỢNG - TUẦN 4)');
  console.log('======================================================================\n');

  await connectDB();

  try {
    const [nvAdmin, nvThuKho, kho, sp] = await Promise.all([
      NhanVien.findOne({ tenDangNhap: 'admin' }),
      NhanVien.findOne({ vaiTro: 'Thủ kho' }),
      Kho.findOne(),
      SanPham.findOne()
    ]);

    if (!kho || !sp) {
      throw new Error('Chưa có dữ liệu Kho hoặc Sản phẩm. Vui lòng chạy npm run seed trước!');
    }

    const testUser = nvThuKho || nvAdmin;
    console.log(`👤 Nhân viên thực hiện: ${testUser ? testUser.hoTen : 'Admin'} (${testUser ? testUser.vaiTro : 'Quản lý'})`);
    console.log(`🏢 Kho kiểm kê: ${kho.tenKho}`);
    console.log(`📱 Sản phẩm thử nghiệm: ${sp.tenMay}\n`);

    // ─────────────────────────────────────────────────────────────────
    // CHUẨN BỊ DỮ LIỆU TEST RIÊNG BIỆT ĐỂ KHÔNG ẢNH HƯỞNG DATA GỐC
    // ─────────────────────────────────────────────────────────────────
    const timestamp = Date.now();
    const imeiConHang1 = `IMEI_KK_CON1_${timestamp}`;
    const imeiConHang2 = `IMEI_KK_CON2_${timestamp}`;
    const imeiConHang3 = `IMEI_KK_CON3_${timestamp}`;
    const imeiDaBan = `IMEI_KK_DABAN_${timestamp}`;
    const imeiThuaNgoai = `IMEI_KK_THUA_${timestamp}`;

    // Tạo các bản ghi MayImei mồi
    await MayImei.create([
      { imei: imeiConHang1, sanPham: sp._id, giaNhap: 15000000, trangThai: 'Con hang' },
      { imei: imeiConHang2, sanPham: sp._id, giaNhap: 15000000, trangThai: 'Con hang' },
      { imei: imeiConHang3, sanPham: sp._id, giaNhap: 15000000, trangThai: 'Con hang' },
      { imei: imeiDaBan, sanPham: sp._id, giaNhap: 15000000, trangThai: 'Da ban' }
    ]);

    // Đồng bộ tồn kho TonKho
    await TonKhoService.capNhatTonKho(sp._id, kho._id, 3, { choPhepAm: true });

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Tra cứu danh sách IMEI lý thuyết tại kho
    // ─────────────────────────────────────────────────────────────────
    console.log('--- TEST 1: Tra cứu danh sách IMEI lý thuyết theo kho ---');
    const lyThuyetRes = await KiemKeService.layDanhSachImeiLyThuyet(kho._id);

    assert(lyThuyetRes && lyThuyetRes.kho, 'Lấy thông tin kho thành công');
    assert(lyThuyetRes.tongSoLuong >= 3, `Tổng IMEI lý thuyết trong DB hợp lệ (hiện có ${lyThuyetRes.tongSoLuong} máy)`);
    assert(Array.isArray(lyThuyetRes.danhSachImei), 'Danh sách IMEI trả về dạng mảng');
    const hasImei1 = lyThuyetRes.danhSachImei.some(m => m.imei === imeiConHang1);
    assert(hasImei1, `IMEI test ${imeiConHang1} có mặt trong danh sách lý thuyết`);

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Thực hiện kiểm kê đối soát phát hiện Khớp, Thiếu, Thừa, Bất thường
    // Kịch bản:
    // - Thực tế quét: imeiConHang1, imeiConHang2 (Khớp 2 máy)
    // - Quên quét: imeiConHang3 (Thiếu 1 máy)
    // - Quét nhầm máy đã bán: imeiDaBan (Bất thường 1 máy)
    // - Quét mã lạ chưa có trong DB: imeiThuaNgoai (Thừa 1 máy)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2: Đối soát kiểm kê quét thực tế (Phát hiện Khớp, Thiếu, Thừa, Bất thường) ---');
    
    // Lấy toàn bộ IMEI con hang khác hiện có để quét đầy đủ (chỉ bỏ imeiConHang3)
    const allConHangDb = await MayImei.find({ trangThai: 'Con hang' }).lean();
    const listImeiThucTeQuet = allConHangDb
      .map(m => m.imei)
      .filter(imei => imei !== imeiConHang3); // Cố tình bỏ imeiConHang3 để tạo TH Thiếu

    // Bổ sung thêm máy Bất thường và máy Thừa
    listImeiThucTeQuet.push(imeiDaBan);
    listImeiThucTeQuet.push(imeiThuaNgoai);

    const kiemKeRes = await KiemKeService.thucHienKiemKe({
      khoId: kho._id,
      danhSachImeiThucTe: listImeiThucTeQuet,
      ghiChu: 'Kiểm kê định kỳ mẫu test tuần 4',
      sessionUser: testUser
    });

    assert(kiemKeRes && kiemKeRes.bienBan, 'Lập Biên Bản Kiểm Kê thành công');
    assert(kiemKeRes.bienBan.maBienBan.startsWith('BBKK-'), `Mã biên bản tự sinh chuẩn format: ${kiemKeRes.bienBan.maBienBan}`);
    assert(kiemKeRes.bienBan.trangThai === 'Da kiem ke', 'Trạng thái ban đầu: "Da kiem ke"');

    const { tongKet, danhSachThieu, danhSachThua, danhSachBatThuong, chiTietDieuChinh } = kiemKeRes;

    assert(tongKet.tongThieu >= 1, `Phát hiện đúng số lượng IMEI thiếu (≥ 1): ${tongKet.tongThieu} máy`);
    const thieuItem = danhSachThieu.find(t => t.imei === imeiConHang3);
    assert(thieuItem && thieuItem.loaiLech === 'Thieu', `Phát hiện chính xác IMEI thiếu: ${imeiConHang3}`);

    assert(tongKet.tongThua >= 1, `Phát hiện đúng số lượng IMEI thừa ngoài hệ thống (≥ 1): ${tongKet.tongThua} máy`);
    const thuaItem = danhSachThua.find(t => t.imei === imeiThuaNgoai);
    assert(thuaItem && thuaItem.loaiLech === 'Thua', `Phát hiện chính xác IMEI thừa ngoài: ${imeiThuaNgoai}`);

    assert(tongKet.tongBatThuong >= 1, `Phát hiện đúng số lượng IMEI bất thường trạng thái khác (≥ 1): ${tongKet.tongBatThuong} máy`);
    const btItem = danhSachBatThuong.find(t => t.imei === imeiDaBan);
    assert(btItem && btItem.trangThaiMayDB === 'Da ban', `Phát hiện chính xác IMEI bất thường đang ở trạng thái 'Da ban': ${imeiDaBan}`);

    assert(chiTietDieuChinh.length >= 3, `Đã lưu các dòng DieuChinhKho vào CSDL (tổng ${chiTietDieuChinh.length} dòng lệch)`);

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Lấy danh sách và xem chi tiết Biên Bản Kiểm Kê
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 3: Truy vấn danh sách và chi tiết Biên Bản Kiểm Kê ---');
    const dsBienBan = await KiemKeService.layDanhSachBienBan({ kho: kho._id, limit: 10 });
    assert(dsBienBan.items.length > 0, `Lấy danh sách biên bản phân trang thành công (${dsBienBan.items.length} bản ghi)`);

    const chiTietRes = await KiemKeService.layChiTietBienBan(kiemKeRes.bienBan._id);
    assert(chiTietRes.bienBan && chiTietRes.bienBan._id, 'Lấy chi tiết biên bản kiểm kê thành công');
    assert(Array.isArray(chiTietRes.chiTiet) && chiTietRes.chiTiet.length >= 3, 'Các dòng chi tiết DieuChinhKho được nạp đầy đủ');

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Áp dụng điều chỉnh kho cho biên bản kiểm kê
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Áp dụng điều chỉnh tồn kho và cập nhật máy MayImei ---');
    const tonKhoTruocApDung = await TonKho.findOne({ sanPham: sp._id, kho: kho._id }).lean();
    const slTruoc = tonKhoTruocApDung ? tonKhoTruocApDung.soLuong : 0;

    const apDungRes = await KiemKeService.apDungDieuChinh(kiemKeRes.bienBan._id, testUser);
    assert(apDungRes && apDungRes.bienBan.trangThai === 'Da dieu chinh', 'Biên bản chuyển sang trạng thái "Da dieu chinh"');

    // Kiểm tra máy thiếu đã được cập nhật trạng thái
    const mayThieuDb = await MayImei.findOne({ imei: imeiConHang3 }).lean();
    assert(mayThieuDb.trangThai === 'Loi' || mayThieuDb.status === false, `Máy thiếu ${imeiConHang3} được đánh dấu xử lý trạng thái 'Loi'/status: false`);

    // Kiểm tra tồn kho sản phẩm bị giảm tương ứng
    const tonKhoSauApDung = await TonKho.findOne({ sanPham: sp._id, kho: kho._id }).lean();
    const slSau = tonKhoSauApDung ? tonKhoSauApDung.soLuong : 0;
    assert(slSau < slTruoc, `Tồn kho sản phẩm được cập nhật giảm sau khi điều chỉnh thiếu (${slTruoc} -> ${slSau})`);

    // Kiểm tra chặn áp dụng lần 2
    try {
      await KiemKeService.apDungDieuChinh(kiemKeRes.bienBan._id, testUser);
      assert(false, 'Lẽ ra phải chặn khi áp dụng điều chỉnh lần 2');
    } catch (err) {
      assert(err.statusCode === 400, `Chặn đúng khi áp dụng biên bản đã điều chỉnh: ${err.message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Hủy biên bản kiểm kê (Chỉ áp dụng khi chưa điều chỉnh)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 5: Hủy biên bản kiểm kê và các ràng buộc an toàn ---');
    
    // Tạo 1 biên bản mới chưa điều chỉnh để test hủy
    const bbMoi = await KiemKeService.thucHienKiemKe({
      khoId: kho._id,
      danhSachImeiThucTe: [imeiConHang1, imeiConHang2],
      ghiChu: 'Biên bản nháp chuẩn bị hủy',
      sessionUser: testUser
    });

    const huyRes = await KiemKeService.huyBienBan(bbMoi.bienBan._id, nvAdmin);
    assert(huyRes.bienBan.trangThai === 'Huy', 'Hủy biên bản kiểm kê nháp thành công (trangThai = "Huy")');

    // Chặn áp dụng điều chỉnh trên biên bản đã hủy
    try {
      await KiemKeService.apDungDieuChinh(bbMoi.bienBan._id, testUser);
      assert(false, 'Lẽ ra phải chặn áp dụng điều chỉnh trên biên bản đã hủy');
    } catch (err) {
      assert(err.statusCode === 400, `Chặn đúng áp dụng điều chỉnh cho biên bản đã hủy: ${err.message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // DỌN DẸP DỮ LIỆU TEST
    // ─────────────────────────────────────────────────────────────────
    await MayImei.deleteMany({ imei: { $in: [imeiConHang1, imeiConHang2, imeiConHang3, imeiDaBan, imeiThuaNgoai] } });
    await BienBanKiemKe.deleteMany({ _id: { $in: [kiemKeRes.bienBan._id, bbMoi.bienBan._id] } });
    await DieuChinhKho.deleteMany({ bienBan: { $in: [kiemKeRes.bienBan._id, bbMoi.bienBan._id] } });

  } catch (error) {
    console.error('\n❌ Lỗi Test không mong đợi:', error.message);
    failCount++;
  } finally {
    await mongoose.connection.close();
    console.log(`\n======================================================================`);
    console.log(`📊 KẾT QUẢ KIỂM THỬ KIỂM KÊ KHO: ${passCount} PASS | ${failCount} FAIL`);
    console.log(`======================================================================\n`);
    if (failCount > 0) process.exit(1);
  }
}

runKiemKeTests();
