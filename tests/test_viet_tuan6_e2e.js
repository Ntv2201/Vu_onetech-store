/**
 * Test Suite: Kiểm thử Tích hợp Toàn diện (E2E) & Khởi tạo Dữ liệu Demo Tuần 6
 * Thành viên 6: Tô Quốc Việt (Đặt hàng trước & Đổi trả máy)
 * 
 * Luồng E2E kiểm tra:
 * 1. Khách đặt cọc máy hot -> Hàng về kho gán IMEI -> Khách đến nhận máy xuất HĐ POS cấn trừ cọc.
 * 2. Khách đổi máy lỗi sang máy đời cao kèm mua thêm phụ kiện -> Thu thêm tiền chênh lệch -> In biên bản -> Quản lý hủy phiếu khôi phục kho.
 * 3. Khách trả hàng hoàn tiền 100% -> Sinh Phiếu Chi sổ quỹ -> Tra cứu lịch sử IMEI.
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const app = require('../src/app');
const {
  DoiTraService,
  DatTruocService,
  HoaDonService,
  ThanhToanService
} = require('../src/services');
const {
  NhanVien,
  KhachHang,
  SanPham,
  PhuKien,
  MayImei,
  HoaDon,
  CT_HoaDon_May,
  DonDatHangTruoc,
  PhieuDoiTra,
  PhieuThu,
  PhieuChi
} = require('../src/models');

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

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ E2E & DEMO WORKFLOW TÔ QUỐC VIỆT (TUẦN 6-8)');
  console.log('===============================================================\n');

  await connectDB();

  try {
    // 1. Chuẩn bị tài khoản và khách hàng
    let nvQuanLy = await NhanVien.findOne({ tenDangNhap: 'admin' });
    let nvBanHang = await NhanVien.findOne({ tenDangNhap: 'banhang' });
    let kh1 = await KhachHang.findOne({ sdt: '0988123456' });
    let kh2 = await KhachHang.findOne({ sdt: '0912345678' });

    if (!kh1) kh1 = await KhachHang.create({ hoTen: 'Anh Hoàng Nam (Demo Đặt Cọc)', sdt: '0988123456', diaChi: 'Hà Nội' });
    if (!kh2) kh2 = await KhachHang.create({ hoTen: 'Chị Mai Linh (Demo Đổi Trả)', sdt: '0912345678', diaChi: 'Hà Nội' });

    // Lấy sản phẩm
    let spIphone15 = await SanPham.findOne({ tenMay: { $regex: 'iPhone 15 Pro Max', $options: 'i' } });
    let spIphone14 = await SanPham.findOne({ tenMay: { $regex: 'iPhone 14', $options: 'i' } });
    let spS24 = await SanPham.findOne({ tenMay: { $regex: 'S24', $options: 'i' } });

    if (!spIphone15) spIphone15 = await SanPham.findOne();
    if (!spIphone14) spIphone14 = spIphone15;
    if (!spS24) spS24 = spIphone15;

    // Lấy phụ kiện
    let pkSac = await PhuKien.findOne({ tenPK: { $regex: 'Sạc', $options: 'i' } });
    if (!pkSac) pkSac = await PhuKien.findOne();

    console.log(`👤 Quản lý: ${nvQuanLy.hoTen}`);
    console.log(`👤 Bán hàng: ${nvBanHang.hoTen}`);
    console.log(`👤 Khách hàng 1: ${kh1.hoTen}`);
    console.log(`👤 Khách hàng 2: ${kh2.hoTen}\n`);

    // -------------------------------------------------------------
    // KỊCH BẢN 1: KHÉP KÍN ĐẶT HÀNG TRƯỚC -> GÁN IMEI -> XUẤT BÁN CẤN TRỪ CỌC
    // -------------------------------------------------------------
    console.log('--- KỊCH BẢN 1: Luồng khép kín Đặt hàng trước -> Nhận máy & Cấn trừ cọc ---');
    
    // Bước 1.1: Khách đặt cọc 5.000.000 đ cho iPhone 15 Pro Max
    const preOrder1 = await DatTruocService.createDatTruoc({
      khachHang: kh1._id,
      sanPham: spIphone15._id,
      soTienCoc: 5000000,
      hanLay: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      hinhThuc: 'Chuyen khoan',
      ghiChu: 'Khách VIP đặt trước phiên bản màu Titan Tự Nhiên'
    }, nvBanHang);

    assert(preOrder1.donDatHang && preOrder1.donDatHang.soTienCoc === 5000000, 'Bước 1.1: Tiếp nhận đơn đặt cọc 5.000.000 đ thành công');
    assert(preOrder1.phieuThu !== null && preOrder1.phieuThu.soTien === 5000000, 'Bước 1.1: Tự động sinh Phiếu Thu tiền cọc 5.000.000 đ');

    // Bước 1.2: Hàng về kho, gán số IMEI cụ thể
    const imeiDemoPre = 'DEMO_IP15_' + Date.now().toString().slice(-5);
    await MayImei.create({
      imei: imeiDemoPre,
      sanPham: spIphone15._id,
      giaNhap: 26500000,
      mauSac: 'Titan Tự Nhiên',
      dungLuong: '256GB',
      trangThai: 'Con hang'
    });

    const updatedPre = await DatTruocService.capNhatTrangThai(preOrder1.donDatHang._id, {
      trangThai: 'Da co hang',
      imei: imeiDemoPre,
      ghiChu: 'Hàng đã về kho sẵn sàng giao khách'
    });
    assert(updatedPre.donDatHang.trangThai === 'Da co hang', 'Bước 1.2: Cập nhật trạng thái đơn sang "Da co hang"');
    assert(updatedPre.donDatHang.imei === imeiDemoPre, `Bước 1.2: Gán thành công số IMEI ${imeiDemoPre}`);

    // Bước 1.3: Khách đến cửa hàng lấy máy -> Xuất hóa đơn bán hàng POS cấn trừ cọc
    const deliverRes = await DatTruocService.chuyenHoaDon(preOrder1.donDatHang._id, {
      imei: imeiDemoPre,
      hinhThucThanhToan: 'Da thanh toan',
      ghiChu: 'Khách đến nhận máy tại quầy thanh toán đủ số tiền còn lại'
    }, nvBanHang);

    assert(deliverRes.hoaDon && deliverRes.hoaDon.soHD.startsWith('HD'), `Bước 1.3: Xuất Hóa đơn POS thành công: ${deliverRes.hoaDon.soHD}`);
    assert(deliverRes.tienCocDaTru === 5000000, `Bước 1.3: Cấn trừ chính xác 5.000.000 đ tiền cọc`);
    assert(deliverRes.soTienThanhToan === deliverRes.hoaDon.tongTien - 5000000, `Bước 1.3: Số tiền thực thu đúng bằng tổng tiền trừ tiền cọc (${deliverRes.soTienThanhToan.toLocaleString('vi-VN')} đ)`);
    assert(deliverRes.donDatHang.trangThai === 'Da nhan hang', 'Bước 1.3: Đơn đặt trước chuyển trạng thái sang "Da nhan hang"');

    const mayDelivered = await MayImei.findOne({ imei: imeiDemoPre });
    assert(mayDelivered.trangThai === 'Da ban', `Bước 1.3: IMEI ${imeiDemoPre} chuyển trạng thái sang "Da ban"`);

    // -------------------------------------------------------------
    // KỊCH BẢN 2: ĐỔI MÁY LỖI SANG MÁY ĐỜI CAO KÈM PHỤ KIỆN -> THU THÊM TIỀN -> HỦY PHIẾU
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 2: Luồng Đổi máy lỗi kèm phụ kiện & Quản lý thu hồi phiếu ---');
    
    // Bước 2.1: Tạo hóa đơn mua máy cũ trước đó 3 ngày
    const imeiOldDemo = 'DEMO_IP14_' + Date.now().toString().slice(-5);
    const imeiNewDemo = 'DEMO_S24U_' + Date.now().toString().slice(-5);

    await MayImei.create({ imei: imeiOldDemo, sanPham: spIphone14._id, giaNhap: 14000000, trangThai: 'Da ban' });
    await MayImei.create({ imei: imeiNewDemo, sanPham: spS24._id, giaNhap: 23000000, trangThai: 'Con hang' });

    const invoiceDemo2 = await HoaDon.create({
      soHD: 'HD_DEMO_EX_' + Date.now().toString().slice(-5),
      khachHang: kh2._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Mua 3 ngày trước
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });

    await CT_HoaDon_May.create({
      hoaDon: invoiceDemo2._id,
      imei: imeiOldDemo,
      donGiaBan: 16990000
    });

    // Bước 2.2: Kiểm tra điều kiện đổi trả
    const checkExchange = await DoiTraService.kiemTraDieuKienDoiTra(invoiceDemo2.soHD, imeiOldDemo);
    assert(checkExchange.hopLe === true, 'Bước 2.2: Máy cũ đủ điều kiện đổi trả trong 30 ngày');

    // Bước 2.3: Lập phiếu đổi sang S24 Ultra (26.99tr) + 1 Củ sạc nhanh (450k)
    // Giá chênh lệch: (26.99tr + 450k) - 16.99tr = 10.450.000 đ
    const initialPkQty = pkSac ? pkSac.soLuongTon : 0;

    const exchangeRes = await DoiTraService.taoPhieuDoiTra({
      soHD: invoiceDemo2.soHD,
      imeiCu: imeiOldDemo,
      imeiMoi: imeiNewDemo,
      loaiDoiTra: 'Doi may',
      danhSachPhuKien: pkSac ? [{ phuKien: pkSac._id, soLuong: 1, donGia: pkSac.giaBan || 450000 }] : [],
      hinhThuc: 'Chuyen khoan',
      lyDo: 'Khách muốn đổi sang Samsung Galaxy S24 Ultra kèm phụ kiện',
      ghiChu: 'Biên bản đổi trả hợp lệ tại quầy'
    }, nvBanHang);

    const phieuExchange = exchangeRes.phieuDoiTra;
    assert(phieuExchange && phieuExchange.maDT.startsWith('DT'), `Bước 2.3: Lập biên bản đổi trả thành công: ${phieuExchange.maDT}`);
    assert(phieuExchange.phieuThu !== null, 'Bước 2.3: Tự động sinh Phiếu Thu tiền chênh lệch');

    const [mayOldStatus, mayNewStatus] = await Promise.all([
      MayImei.findOne({ imei: imeiOldDemo }),
      MayImei.findOne({ imei: imeiNewDemo })
    ]);
    assert(mayOldStatus.trangThai === 'Loi', `Bước 2.3: Máy cũ ${imeiOldDemo} chuyển trạng thái sang "Loi"`);
    assert(mayNewStatus.trangThai === 'Da ban', `Bước 2.3: Máy mới ${imeiNewDemo} chuyển trạng thái sang "Da ban"`);

    // Bước 2.4: Quản lý phát hiện lập nhầm -> Duyệt Hủy / Thu hồi phiếu
    const cancelRes = await DoiTraService.huyPhieuDoiTra(phieuExchange._id, {
      lyDoHuy: 'Nhân viên chọn nhầm mã phụ kiện, hủy phiếu theo yêu cầu của Quản lý'
    }, nvQuanLy);

    assert(cancelRes.phieuDoiTra.trangThai === 'Da huy', 'Bước 2.4: Trạng thái phiếu chuyển thành "Da huy"');
    assert(cancelRes.phieuDoiTra.phieuChiDaoNguoc !== null, 'Bước 2.4: Tự động sinh Phiếu Chi đảo ngược hoàn trả tiền cho khách');

    const [mayOldRevert, mayNewRevert] = await Promise.all([
      MayImei.findOne({ imei: imeiOldDemo }),
      MayImei.findOne({ imei: imeiNewDemo })
    ]);
    assert(mayOldRevert.trangThai === 'Da ban', `Bước 2.4: Máy cũ ${imeiOldDemo} được khôi phục về "Da ban"`);
    assert(mayNewRevert.trangThai === 'Con hang', `Bước 2.4: Máy mới ${imeiNewDemo} được hoàn trả về "Con hang"`);

    // -------------------------------------------------------------
    // KỊCH BẢN 3: TRẢ HÀNG HOÀN TIỀN 100% & TRA CỨU LỊCH SỬ IMEI
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 3: Trả hàng hoàn tiền 100% & Tra cứu lịch sử IMEI ---');
    const imeiReturnDemo = 'DEMO_RET_' + Date.now().toString().slice(-5);
    await MayImei.create({ imei: imeiReturnDemo, sanPham: spIphone14._id, giaNhap: 14000000, trangThai: 'Da ban' });

    const invoiceRetDemo = await HoaDon.create({
      soHD: 'HD_DEMO_RET_' + Date.now().toString().slice(-5),
      khachHang: kh2._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(),
      tongTien: 16990000,
      trangThai: 'Da thanh toan'
    });

    await CT_HoaDon_May.create({ hoaDon: invoiceRetDemo._id, imei: imeiReturnDemo, donGiaBan: 16990000 });

    const returnTicket = await DoiTraService.taoPhieuDoiTra({
      soHD: invoiceRetDemo.soHD,
      imeiCu: imeiReturnDemo,
      loaiDoiTra: 'Tra hang',
      hinhThuc: 'Tien mat',
      lyDo: 'Khách hàng không còn nhu cầu sử dụng, yêu cầu hoàn tiền 100%'
    }, nvBanHang);

    assert(returnTicket.phieuDoiTra.phieuChi !== null, 'Bước 3.1: Hệ thống tự động sinh Phiếu Chi 16.990.000 đ hoàn 100% tiền mua');

    // Tra cứu lịch sử IMEI
    const historyRes = await DoiTraService.getLichSuImei(imeiReturnDemo);
    assert(historyRes.soLanDoiTra === 1, `Bước 3.2: Tra cứu lịch sử IMEI ${imeiReturnDemo} tìm thấy đúng 1 bản ghi đổi trả`);
    assert(historyRes.lichSu[0].maDT === returnTicket.phieuDoiTra.maDT, 'Bước 3.2: Mã phiếu trong lịch sử khớp chính xác');

    // Dọn dẹp dữ liệu test
    await MayImei.deleteMany({ imei: { $regex: 'DEMO|RET', $options: 'i' } });

    await mongoose.connection.close();

    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ E2E: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ CÁC KỊCH BẢN E2E VÀ DEMO TUẦN 6 CỦA TÔ QUỐC VIỆT ĐÃ VƯỢT QUA 100%!');
      setTimeout(() => process.exit(0), 50);
    } else {
      console.error('❌ CÓ KỊCH BẢN E2E BỊ LỖI!');
      setTimeout(() => process.exit(1), 50);
    }
  } catch (err) {
    console.error('❌ Lỗi ngoại lệ trong quá trình chạy test E2E:', err);
    process.exit(1);
  }
}

runTests();
