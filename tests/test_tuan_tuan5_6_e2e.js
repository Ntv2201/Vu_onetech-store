/**
 * TEST SUITE E2E & TÍCH HỢP TOÀN DIỆN TUẦN 5 - 6 (NGUYỄN QUANG TUẤN)
 * Phân hệ Bán hàng POS theo IMEI, Cấn trừ cọc, Bảo hành dòng đời, Phân tích KPI & RBAC
 */

const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');
const {
  HoaDonService,
  BaoHanhService,
  DatTruocService,
  DoiTraService,
  ThanhToanService,
  TonKhoService
} = require('../src/services');

const {
  NhanVien,
  KhachHang,
  DanhMuc,
  SanPham,
  MayImei,
  PhuKien,
  LinhKien,
  HoaDon,
  PhieuBaoHanh,
  PhieuThu,
  PhieuChi,
  DonDatHangTruoc,
  Kho,
  TonKho
} = require('../src/models');

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

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ E2E TOÀN TRÌNH BÁN HÀNG POS & BẢO HÀNH (TUẦN 5-6)');
  console.log('===============================================================\n');

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    console.log('[MongoDB] Connected successfully to test database\n');

    // -------------------------------------------------------------
    // CHUẨN BỊ DỮ LIỆU CƠ SỞ CHO TOÀN BỘ KỊCH BẢN E2E
    // -------------------------------------------------------------
    const nvBanHang = await NhanVien.findOne({ tenDangNhap: 'banhang' }) ||
      await NhanVien.create({
        hoTen: 'Nguyễn Bán Hàng E2E',
        tenDangNhap: 'banhang',
        matKhau: '123456',
        vaiTro: 'NV bán hàng',
        sdt: '0988111222'
      });

    const nvKyThuat = await NhanVien.findOne({ tenDangNhap: 'kythuat' }) ||
      await NhanVien.create({
        hoTen: 'Trần Kỹ Thuật E2E',
        tenDangNhap: 'kythuat',
        matKhau: '123456',
        vaiTro: 'Kỹ thuật',
        sdt: '0988333444'
      });

    const nvQuanLy = await NhanVien.findOne({ tenDangNhap: 'admin' }) ||
      await NhanVien.create({
        hoTen: 'Lê Quản Lý E2E',
        tenDangNhap: 'admin',
        matKhau: 'admin123',
        vaiTro: 'Quản lý',
        sdt: '0988555666'
      });

    const khachHang = await KhachHang.findOne({ sdt: '0912345678' }) ||
      await KhachHang.create({
        hoTen: 'Vũ Khách Hàng E2E',
        sdt: '0912345678',
        diaChi: '456 Phố Huế, Hai Bà Trưng, Hà Nội'
      });

    let danhMuc = await DanhMuc.findOne({ tenDanhMuc: 'Điện thoại' }) ||
      await DanhMuc.create({ tenDanhMuc: 'Điện thoại' });

    let khoChinh = await Kho.findOne() ||
      await Kho.create({ tenKho: 'Kho Tổng Cầu Giấy', diaChi: '123 Cầu Giấy, Hà Nội' });

    // Tạo SP 1: iPhone 15 Pro Max 256GB (GiaBan: 29.990.000 đ)
    const spIp15 = await SanPham.create({
      tenMay: 'iPhone 15 Pro Max E2E',
      hang: 'Apple',
      giaBan: 29990000,
      soThangBH: 12,
      danhMuc: danhMuc._id,
      moTa: 'Flagship Apple'
    });

    // Tạo SP 2: Samsung Galaxy S24 Ultra (GiaBan: 26.990.000 đ)
    const spS24 = await SanPham.create({
      tenMay: 'Galaxy S24 Ultra E2E',
      hang: 'Samsung',
      giaBan: 26990000,
      soThangBH: 12,
      danhMuc: danhMuc._id,
      moTa: 'Flagship Samsung'
    });

    // Khởi tạo Tồn kho ban đầu
    await TonKho.create({ kho: khoChinh._id, sanPham: spIp15._id, soLuong: 10 });
    await TonKho.create({ kho: khoChinh._id, sanPham: spS24._id, soLuong: 10 });

    // Tạo Phụ kiện: Củ sạc nhanh 30W (Gia: 450.000 đ, Ton: 20)
    const pkSac = await PhuKien.create({
      tenPK: 'Củ sạc OneTech 30W E2E',
      danhMuc: danhMuc._id,
      giaBan: 450000,
      soLuongTon: 20
    });

    // Tạo Linh kiện BH: Màn hình OLED (Gia: 3.500.000 đ, Ton: 10)
    const lkManHinh = await LinhKien.create({
      tenLK: 'Màn hình OLED iPhone 15 E2E',
      donGia: 3500000,
      soLuongTon: 10
    });

    // -------------------------------------------------------------
    // KỊCH BẢN 1: LUỒNG BÁN HÀNG POS LIÊN KẾT CỌC, PHỤ KIỆN & CHIẾT KHẤU
    // -------------------------------------------------------------
    console.log('--- KỊCH BẢN 1: Luồng Bán hàng POS cấn trừ cọc + Phụ kiện + Chiết khấu ---');

    const imei1 = 'TUAN_E2E_IP15_' + Date.now().toString().slice(-4);
    const imei2 = 'TUAN_E2E_S24U_' + Date.now().toString().slice(-4);

    await MayImei.create({ imei: imei1, sanPham: spIp15._id, giaNhap: 24000000, mauSac: 'Titan Tự Nhiên', dungLuong: '256GB', trangThai: 'Con hang' });
    await MayImei.create({ imei: imei2, sanPham: spS24._id, giaNhap: 21000000, mauSac: 'Xám Titan', dungLuong: '256GB', trangThai: 'Con hang' });

    // 1.1 Khách đặt cọc trước 5.000.000 đ cho iPhone 15
    const donCoc = await DatTruocService.createDatTruoc({
      khachHang: khachHang._id,
      sanPham: spIp15._id,
      soTienCoc: 5000000,
      hanLay: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ghiChu: 'Khách đặt cọc trước iPhone 15 Pro Max'
    }, nvBanHang);

    assert(donCoc && donCoc.donDatHang, 'Bước 1.1: Tiếp nhận Đơn đặt hàng trước thành công');
    assert(donCoc.phieuThu && donCoc.phieuThu.soTien === 5000000, 'Bước 1.1: Tự động sinh Phiếu Thu tiền cọc 5.000.000 đ trong Sổ quỹ');

    // 1.2 Bán hàng POS: Bán 2 máy (iPhone 15 + S24 Ultra) + 2 Củ sạc (900k) + Giảm giá 500k + Cấn trừ cọc 5tr
    // Tổng gốc: 29.990.000 + 26.990.000 + (450.000 * 2) = 57.880.000 đ
    // Sau giảm giá và cấn trừ: 57.880.000 - 500.000 - 5.000.000 = 52.380.000 đ
    const saleResult = await HoaDonService.taoHoaDonBanHang({
      khachHang: khachHang._id,
      danhSachIMEI: [imei1, imei2],
      danhSachPhuKien: [
        { phuKien: pkSac._id, soLuong: 2, donGiaBan: 450000 }
      ],
      hinhThucThanhToan: 'Chuyen khoan',
      soTienGiam: 500000,
      donDatHangId: donCoc.donDatHang._id,
      ghiChu: 'Xuất bán combo 2 flagship kèm phụ kiện tại POS'
    }, nvBanHang);

    const hoaDon = saleResult.hoaDon;
    assert(hoaDon && hoaDon.soHD.startsWith('HD'), `Bước 1.2: Lập Hóa đơn POS thành công: ${hoaDon.soHD}`);
    assert(hoaDon.tongTien === 57880000, `Bước 1.2: Tổng giá trị đơn hàng chính xác: ${hoaDon.tongTien.toLocaleString('vi-VN')} đ`);
    assert(hoaDon.tienCocDaTru === 5000000, 'Bước 1.2: Ghi nhận chính xác số tiền cọc đã trừ 5.000.000 đ');
    assert(hoaDon.soTienGiam === 500000, 'Bước 1.2: Ghi nhận chính xác chiết khấu giảm giá 500.000 đ');
    assert(hoaDon.soTienThanhToan === 52380000, `Bước 1.2: Tổng tiền thực thu chuẩn xác: ${hoaDon.soTienThanhToan.toLocaleString('vi-VN')} đ`);

    // 1.3 Kiểm tra cập nhật trạng thái các thực thể liên quan
    const [may1, may2, pkUpdated, tonKhoIp, tonKhoS24, donCocUpdated, phieuThuSale] = await Promise.all([
      MayImei.findOne({ imei: imei1 }),
      MayImei.findOne({ imei: imei2 }),
      PhuKien.findById(pkSac._id),
      TonKho.findOne({ sanPham: spIp15._id }),
      TonKho.findOne({ sanPham: spS24._id }),
      DonDatHangTruoc.findById(donCoc.donDatHang._id),
      PhieuThu.findOne({ hoaDon: hoaDon._id })
    ]);

    assert(may1.trangThai === 'Da ban' && may2.trangThai === 'Da ban', 'Bước 1.3: Cả 2 máy IMEI chuyển trạng thái sang "Da ban"');
    assert(pkUpdated.soLuongTon === 18, 'Bước 1.3: Tồn kho phụ kiện giảm chính xác từ 20 -> 18 cái');
    assert(tonKhoIp.soLuong === 9 && tonKhoS24.soLuong === 9, 'Bước 1.3: Tồn kho 2 model sản phẩm giảm chính xác qua TonKhoService');
    assert(donCocUpdated.trangThai === 'Da nhan hang', 'Bước 1.3: Đơn đặt trước chuyển trạng thái sang "Da nhan hang"');
    assert(phieuThuSale && phieuThuSale.soTien === 52380000, 'Bước 1.3: Tự động sinh Phiếu Thu trong Sổ quỹ khớp đúng 52.380.000 đ');

    // -------------------------------------------------------------
    // KỊCH BẢN 2: TIẾP NHẬN BẢO HÀNH, XUẤT LINH KIỆN & HOÀN TẤT TRẢ KHÁCH
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 2: Dòng đời Bảo hành máy theo IMEI & Thay thế linh kiện ---');

    // 2.1 Tra cứu dòng đời IMEI trước khi tiếp nhận
    const lookupBefore = await BaoHanhService.traCuuBaoHanh(imei1);
    assert(lookupBefore && lookupBefore.daBan === true, 'Bước 2.1: Tra cứu xác nhận máy đã bán');
    assert(lookupBefore.baoHanh && lookupBefore.baoHanh.conHanBaoHanh === true, `Bước 2.1: Máy còn trong thời hạn bảo hành (${lookupBefore.baoHanh.soNgayConLai} ngày)`);

    // 2.2 Tiếp nhận bảo hành
    const pbhRes = await BaoHanhService.tiepNhanBaoHanh({
      imei: imei1,
      khachHang: khachHang._id,
      moTaLoi: 'Màn hình bị sọc sáng khi hiển thị nền đen',
      ghiChu: 'Tiếp nhận máy nguyên vẹn không trầy xước'
    }, nvKyThuat);

    const pbh = pbhRes.phieuBaoHanh;
    assert(pbh && pbh.maPBH.startsWith('PBH'), `Bước 2.2: Lập phiếu bảo hành thành công: ${pbh.maPBH}`);
    const mayBaoHanh = await MayImei.findOne({ imei: imei1 });
    assert(mayBaoHanh.trangThai === 'Bao hanh', 'Bước 2.2: Máy IMEI chuyển trạng thái sang "Bao hanh"');

    // 2.3 Xuất linh kiện thay thế
    const initialLkQty = lkManHinh.soLuongTon;
    await BaoHanhService.xuatLinhKienBaoHanh(pbh._id, {
      linhKienId: lkManHinh._id,
      soLuong: 1,
      donGia: 3500000
    });

    const lkAfter = await LinhKien.findById(lkManHinh._id);
    assert(lkAfter.soLuongTon === initialLkQty - 1, 'Bước 2.3: Tồn kho linh kiện giảm đúng 1 chiếc');

    // 2.4 Hoàn tất bảo hành & bàn giao lại cho khách
    const completeRes = await BaoHanhService.hoanTatBaoHanh(pbh._id, {
      ghiChu: 'Đã test panel mới 24h hoạt động hoàn hảo'
    });

    assert(completeRes.phieuBaoHanh.trangThai === 'Da sua xong', 'Bước 2.4: Phiếu bảo hành đổi sang "Da sua xong"');
    const mayReturned = await MayImei.findOne({ imei: imei1 });
    assert(mayReturned.trangThai === 'Da ban', 'Bước 2.4: Máy IMEI được khôi phục về trạng thái "Da ban"');

    // 2.5 Tra cứu lại dòng đời IMEI xác nhận ghi nhận lịch sử sửa chữa
    const lookupAfter = await BaoHanhService.traCuuBaoHanh(imei1);
    assert(lookupAfter.lichSuBaoHanh.length === 1, 'Bước 2.5: Lịch sử bảo hành có đúng 1 bản ghi');
    assert(lookupAfter.lichSuBaoHanh[0].linhKienThayThe.length === 1, 'Bước 2.5: Lịch sử ghi nhận đúng linh kiện Màn hình OLED đã thay');

    // -------------------------------------------------------------
    // KỊCH BẢN 3: KIỂM TRA ĐIỀU KIỆN ĐỔI TRẢ 30 NGÀY CHO MÁY ĐÃ BÁN
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 3: Kiểm tra điều kiện đổi trả theo số IMEI trong 30 ngày ---');

    const checkExchangeValid = await HoaDonService.kiemTraImeiDoiTra(imei2);
    assert(checkExchangeValid.conHanDoiTra === true, 'Bước 3.1: Máy IMEI 2 vừa bán đủ điều kiện đổi trả trong 30 ngày');
    assert(checkExchangeValid.soNgayDaQua === 0, 'Bước 3.1: Tính đúng số ngày đã mua = 0 ngày');
    assert(checkExchangeValid.hoaDon && checkExchangeValid.hoaDon.soHD === hoaDon.soHD, 'Bước 3.1: Truy vết chính xác số hóa đơn gốc');

    // Kiểm tra máy chưa từng bán
    const imeiUnsold = 'TUAN_E2E_UNSOLD_' + Date.now().toString().slice(-4);
    await MayImei.create({ imei: imeiUnsold, sanPham: spIp15._id, giaNhap: 24000000, trangThai: 'Con hang' });

    let checkUnsoldErr = null;
    try {
      await HoaDonService.kiemTraImeiDoiTra(imeiUnsold);
    } catch (err) {
      checkUnsoldErr = err;
    }
    assert(checkUnsoldErr !== null && checkUnsoldErr.statusCode === 400, 'Bước 3.2: Chặn đổi trả máy chưa từng bán ra (400 Bad Request)');

    // -------------------------------------------------------------
    // KỊCH BẢN 4: BÁO CÁO THỐNG KÊ DOANH SỐ NHÂN VIÊN & TOP SẢN PHẨM
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 4: Báo cáo Doanh số KPI Nhân viên & Top Sản phẩm POS ---');

    const staffKpi = await HoaDonService.getDoanhSoNhanVien();
    assert(Array.isArray(staffKpi) && staffKpi.length > 0, 'Bước 4.1: Báo cáo KPI nhân viên trả về mảng danh sách');
    const tuanKpi = staffKpi.find(s => s.tenDangNhap === nvBanHang.tenDangNhap);
    assert(tuanKpi && tuanKpi.tongDoanhThu >= 52380000, `Bước 4.1: Ghi nhận doanh thu nhân viên bán hàng: ${tuanKpi.tongDoanhThu.toLocaleString('vi-VN')} đ`);

    const topProducts = await HoaDonService.getTopSanPham({ limit: 100 });
    assert(Array.isArray(topProducts) && topProducts.length > 0, 'Bước 4.2: Báo cáo Top sản phẩm bán chạy trả về mảng danh sách');
    const topIp = topProducts.find(p => p.tenMay === spIp15.tenMay);
    assert(topIp && topIp.soLuongBan >= 1, 'Bước 4.2: Top sản phẩm ghi nhận đúng số lượng máy đã xuất bán');

    const fastStats = await HoaDonService.getThongKeNhanh();
    assert(fastStats && fastStats.doanhThuHomNay >= 52380000, `Bước 4.3: Thống kê nhanh POS hôm nay: ${fastStats.doanhThuHomNay.toLocaleString('vi-VN')} đ`);

    // -------------------------------------------------------------
    // KỊCH BẢN 5: HTTP ENDPOINTS & PHÂN QUYỀN RBAC CHO CÁC ROUTES BÁN HÀNG
    // -------------------------------------------------------------
    console.log('\n--- KỊCH BẢN 5: HTTP Endpoints & Phân quyền RBAC 6 Vai trò ---');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function loginAs(tenDangNhap, matKhau) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenDangNhap, matKhau })
      });
      return res.headers.get('set-cookie')?.split(';')[0] || '';
    }

    const cookieBanHang = await loginAs('banhang', '123456');
    const cookieKyThuat = await loginAs('kythuat', '123456');

    // 5.1 Nhân viên Bán hàng gọi GET /api/hoa-don -> 200 OK
    const resListBanHang = await fetch(`${baseUrl}/api/hoa-don`, {
      headers: { Cookie: cookieBanHang }
    });
    assert(resListBanHang.status === 200, 'Bước 5.1: NV Bán hàng truy cập GET /api/hoa-don thành công (200 OK)');

    // 5.2 Nhân viên Bán hàng gọi GET /api/hoa-don/imei-kha-dung -> 200 OK
    const resImeiKhaDung = await fetch(`${baseUrl}/api/hoa-don/imei-kha-dung`, {
      headers: { Cookie: cookieBanHang }
    });
    assert(resImeiKhaDung.status === 200, 'Bước 5.2: NV Bán hàng tra cứu máy IMEI khả dụng cho POS thành công (200 OK)');

    // 5.3 Kỹ thuật gọi POST /api/hoa-don (Cố tình tạo hóa đơn bán hàng) -> BỊ CHẶN 403 Forbidden
    const resPostByKyThuat = await fetch(`${baseUrl}/api/hoa-don`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieKyThuat },
      body: JSON.stringify({
        danhSachIMEI: [imeiUnsold],
        hinhThucThanhToan: 'Da thanh toan'
      })
    });
    assert(resPostByKyThuat.status === 403, 'Bước 5.3: RBAC chặn Kỹ thuật tạo hóa đơn bán hàng (Nhận 403 Forbidden)');

    // Dọn dẹp dữ liệu test E2E để tránh để lại dữ liệu rác trong database
    await Promise.all([
      PhuKien.deleteMany({ _id: pkSac._id }),
      LinhKien.deleteMany({ _id: lkManHinh._id }),
      SanPham.deleteMany({ _id: { $in: [spIp15._id, spS24._id] } }),
      TonKho.deleteMany({ sanPham: { $in: [spIp15._id, spS24._id] } }),
      MayImei.deleteMany({ imei: { $regex: 'TEST|E2E', $options: 'i' } })
    ]);

    server.close();
    await mongoose.connection.close();

    // -------------------------------------------------------------
    // TỔNG KẾT BỘ KIỂM THỬ TUẦN 5-6
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ E2E TUẦN 5-6: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES E2E TUẦN 5-6 CỦA NGUYỄN QUANG TUẤN ĐÃ VƯỢT QUA 100%!\n');
      setTimeout(() => process.exit(0), 50);
    } else {
      console.error(`❌ CÓ ${failed} TEST CASES BỊ THẤT BẠI!\n`);
      setTimeout(() => process.exit(1), 50);
    }

  } catch (error) {
    console.error('❌ Lỗi ngoại lệ trong quá trình chạy test E2E:', error);
    process.exit(1);
  }
}

runTests();
