require('dotenv').config();
const mongoose = require('mongoose');
const {
  NhanVien,
  KhachHang,
  NhaCungCap,
  DanhMuc,
  SanPham,
  MayImei,
  PhuKien,
  LinhKien,
  Kho,
  TonKho,
  HoaDon,
  CT_HoaDon_May,
  CT_HoaDon_PhuKien,
  PhieuXuatKho,
  PhieuBaoHanh,
  CT_PBH_LinhKien,
  DonDatHangTruoc,
  PhieuThu,
  PhieuChi,
  PhieuNhap,
  CT_PhieuNhap,
  CongNo
} = require('../models');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Đã kết nối tới MongoDB: ${mongoUri}`);

    // Xóa dữ liệu cũ để tạo mới hoàn toàn sạch sẽ
    console.log('[Seed] Đang dọn dẹp dữ liệu cũ...');
    await Promise.all([
      NhanVien.deleteMany({}),
      KhachHang.deleteMany({}),
      NhaCungCap.deleteMany({}),
      DanhMuc.deleteMany({}),
      SanPham.deleteMany({}),
      MayImei.deleteMany({}),
      PhuKien.deleteMany({}),
      LinhKien.deleteMany({}),
      Kho.deleteMany({}),
      TonKho.deleteMany({}),
      HoaDon.deleteMany({}),
      CT_HoaDon_May.deleteMany({}),
      CT_HoaDon_PhuKien.deleteMany({}),
      PhieuXuatKho.deleteMany({}),
      PhieuBaoHanh.deleteMany({}),
      CT_PBH_LinhKien.deleteMany({}),
      DonDatHangTruoc.deleteMany({}),
      PhieuThu.deleteMany({}),
      PhieuChi.deleteMany({}),
      PhieuNhap.deleteMany({}),
      CT_PhieuNhap.deleteMany({}),
      CongNo.deleteMany({})
    ]);

    // -------------------------------------------------------------
    // 1. TÀI KHOẢN NHÂN VIÊN (6 VAI TRÒ CHUẨN)
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo danh sách 6 Tài khoản Nhân viên...');
    const [nvAdmin, nvBanHang, nvThuKho, nvThuNgan, nvKeToan, nvKyThuat] = await Promise.all([
      NhanVien.create({
        hoTen: 'Nguyễn Quản Lý',
        sdt: '0901111222',
        vaiTro: 'Quản lý',
        tenDangNhap: 'admin',
        matKhau: 'admin123'
      }),
      NhanVien.create({
        hoTen: 'Trần Bán Hàng',
        sdt: '0902222333',
        vaiTro: 'NV bán hàng',
        tenDangNhap: 'banhang',
        matKhau: '123456'
      }),
      NhanVien.create({
        hoTen: 'Lê Thủ Kho',
        sdt: '0903333444',
        vaiTro: 'Thủ kho',
        tenDangNhap: 'thukho',
        matKhau: '123456'
      }),
      NhanVien.create({
        hoTen: 'Phạm Thu Ngân',
        sdt: '0904444555',
        vaiTro: 'Thu ngân',
        tenDangNhap: 'thungan',
        matKhau: '123456'
      }),
      NhanVien.create({
        hoTen: 'Hoàng Kế Toán',
        sdt: '0905555666',
        vaiTro: 'Kế toán',
        tenDangNhap: 'ketoan',
        matKhau: '123456'
      }),
      NhanVien.create({
        hoTen: 'Vũ Kỹ Thuật',
        sdt: '0906666777',
        vaiTro: 'Kỹ thuật',
        tenDangNhap: 'kythuat',
        matKhau: '123456'
      })
    ]);

    // -------------------------------------------------------------
    // 2. DANH MỤC SẢN PHẨM & PHỤ KIỆN
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Danh mục Hàng hóa...');
    const [dmDienThoai, dmTablet, dmLaptop, dmPhuKien, dmLinhKien] = await DanhMuc.insertMany([
      { tenDanhMuc: 'Điện thoại thông minh (Smartphones)' },
      { tenDanhMuc: 'Máy tính bảng (iPad & Tablets)' },
      { tenDanhMuc: 'Laptop & MacBook cao cấp' },
      { tenDanhMuc: 'Phụ kiện chính hãng Apple & Samsung' },
      { tenDanhMuc: 'Linh kiện sửa chữa & Thay thế' }
    ]);

    // -------------------------------------------------------------
    // 3. ĐỐI TÁC: NHÀ CUNG CẤP & KHÁCH HÀNG
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Nhà cung cấp & Khách hàng...');
    const [nccApple, nccSamsung, nccFPT, nccDigiworld] = await NhaCungCap.insertMany([
      {
        tenNCC: 'Apple Việt Nam Distribution',
        sdt: '02838221122',
        diaChi: 'Tầng 12, Bitexco Financial Tower, Q.1, TP.HCM',
        ghiChu: 'Nguồn hàng chính hãng Apple VN/A'
      },
      {
        tenNCC: 'Samsung Vina Electronics',
        sdt: '02838223344',
        diaChi: 'Số 2 Hải Triều, P. Bến Nghé, Q.1, TP.HCM',
        ghiChu: 'Phân phối điện thoại & phụ kiện Samsung'
      },
      {
        tenNCC: 'FPT Synnex Distribution',
        sdt: '02473006666',
        diaChi: 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Hà Nội',
        ghiChu: 'Đối tác phân phối tổng hợp linh kiện và máy'
      },
      {
        tenNCC: 'Digiworld Corporation (DGW)',
        sdt: '02839290059',
        diaChi: '195 Điện Biên Phủ, P.15, Q. Bình Thạnh, TP.HCM',
        ghiChu: 'Nhà phân phối ủy quyền Xiaomi & Laptop'
      }
    ]);

    const [khAn, khMai, khLong, khTrang, khYen, khTung] = await KhachHang.insertMany([
      { hoTen: 'Nguyễn Văn An', sdt: '0988123456', diaChi: '45 Xuân Thủy, Cầu Giấy, Hà Nội' },
      { hoTen: 'Trần Thị Mai', sdt: '0977234567', diaChi: '12 Nguyễn Trãi, Thanh Xuân, Hà Nội' },
      { hoTen: 'Lê Hoàng Long', sdt: '0912345678', diaChi: '78 Hai Bà Trưng, Q.1, TP.HCM' },
      { hoTen: 'Phạm Minh Trang', sdt: '0933456789', diaChi: '15 Lê Duẩn, Hoàn Kiếm, Hà Nội' },
      { hoTen: 'Đỗ Hoàng Yến', sdt: '0944567890', diaChi: '88 Nguyễn Đình Chiểu, Q.3, TP.HCM' },
      { hoTen: 'Hoàng Thanh Tùng', sdt: '0966789012', diaChi: '102 Thái Hà, Đống Đa, Hà Nội' }
    ]);

    // -------------------------------------------------------------
    // 4. KHO HÀNG
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Hệ thống Kho hàng...');
    const [khoCauGiay, khoThaiHa, khoSaiGon] = await Kho.insertMany([
      { tenKho: 'Kho Tổng Cầu Giấy', diaChi: 'Số 128 Xuân Thủy, Cầu Giấy, Hà Nội' },
      { tenKho: 'Kho Showroom Thái Hà', diaChi: 'Số 85 Thái Hà, Đống Đa, Hà Nội' },
      { tenKho: 'Kho Chi nhánh Quận 1', diaChi: 'Số 45 Lê Lợi, Bến Nghé, Quận 1, TP.HCM' }
    ]);

    // -------------------------------------------------------------
    // 5. MODEL SẢN PHẨM
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Model Sản phẩm...');
    const [
      spIphone15PM,
      spIphone15Pro,
      spIphone15Plus,
      spIphone14,
      spS24Ultra,
      spZFold5,
      spXiaomi14U,
      spIpadPro,
      spMacBookAir
    ] = await SanPham.insertMany([
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 15 Pro Max 256GB',
        hang: 'Apple',
        giaBan: 29990000,
        soThangBH: 12,
        moTa: 'Chip A17 Pro 3nm, khung viền Titan, Camera tiềm vọng 5x, Action button'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 15 Pro 128GB',
        hang: 'Apple',
        giaBan: 25490000,
        soThangBH: 12,
        moTa: 'Thiết kế nhỏ gọn 6.1 inch, Titan chuẩn hàng không vũ trụ, cổng Type-C tốc độ cao'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 15 Plus 128GB',
        hang: 'Apple',
        giaBan: 22190000,
        soThangBH: 12,
        moTa: 'Màn hình lớn 6.7 inch, Dynamic Island, pin siêu khủng 2 ngày dùng'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 14 128GB',
        hang: 'Apple',
        giaBan: 16990000,
        soThangBH: 12,
        moTa: 'Màn hình Super Retina XDR, Camera kép nâng cấp Photonic Engine'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Samsung Galaxy S24 Ultra 512GB',
        hang: 'Samsung',
        giaBan: 31990000,
        soThangBH: 12,
        moTa: 'Quyền năng Galaxy AI, Bút S-Pen tích hợp, khung viền Titan, Camera 200MP'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Samsung Galaxy Z Fold 5 256GB',
        hang: 'Samsung',
        giaBan: 33490000,
        soThangBH: 12,
        moTa: 'Màn hình gập Dynamic AMOLED 2X, bản lề Flex không khe hở'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Xiaomi 14 Ultra 512GB',
        hang: 'Xiaomi',
        giaBan: 28990000,
        soThangBH: 18,
        moTa: 'Hợp tác Leica, 4 cảm biến 50MP, Chip Snapdragon 8 Gen 3'
      },
      {
        danhMuc: dmTablet._id,
        tenMay: 'iPad Pro M2 11 inch Wi-Fi 128GB',
        hang: 'Apple',
        giaBan: 20490000,
        soThangBH: 12,
        moTa: 'Chip Apple M2 cực mạnh, màn hình ProMotion 120Hz, hỗ trợ Apple Pencil 2'
      },
      {
        danhMuc: dmLaptop._id,
        tenMay: 'MacBook Air M2 13 inch 8GB/256GB',
        hang: 'Apple',
        giaBan: 24890000,
        soThangBH: 12,
        moTa: 'Thiết kế siêu mỏng nhẹ thời thượng, màn hình Liquid Retina sắc nét'
      }
    ]);

    // -------------------------------------------------------------
    // 6. PHỤ KIỆN & LINH KIỆN
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Phụ kiện & Linh kiện...');
    const [pkSac20w, pkCapC, pkOpLung15, pkSac45w, pkAirPods2, pkCuongLuc] = await PhuKien.insertMany([
      { danhMuc: dmPhuKien._id, tenPK: 'Củ sạc Apple 20W Type-C Chính hãng', giaBan: 520000, soLuongTon: 60 },
      { danhMuc: dmPhuKien._id, tenPK: 'Cáp sạc C to C Apple Braided 1m', giaBan: 490000, soLuongTon: 45 },
      { danhMuc: dmPhuKien._id, tenPK: 'Ốp lưng MagSafe iPhone 15 Pro Max Clear Case', giaBan: 890000, soLuongTon: 35 },
      { danhMuc: dmPhuKien._id, tenPK: 'Củ sạc Samsung 45W Type-C Super Fast', giaBan: 650000, soLuongTon: 30 },
      { danhMuc: dmPhuKien._id, tenPK: 'Tai nghe Apple AirPods Pro 2 USB-C', giaBan: 5490000, soLuongTon: 20 },
      { danhMuc: dmPhuKien._id, tenPK: 'Kính cường lực KingKong 9D chống nhìn trộm', giaBan: 180000, soLuongTon: 100 }
    ]);

    const [lkManHinh15, lkPin15, lkCamS24, lkChanSacC] = await LinhKien.insertMany([
      { tenLK: 'Màn hình OLED iPhone 15 Pro Max GX', donGia: 7500000, soLuongTon: 8 },
      { tenLK: 'Pin Li-ion iPhone 15 Pro Max Pisen', donGia: 1800000, soLuongTon: 15 },
      { tenLK: 'Cụm Camera sau Galaxy S24 Ultra Zin bóc máy', donGia: 3200000, soLuongTon: 6 },
      { tenLK: 'Cụm bo cáp sạc Type-C Galaxy S24 Ultra', donGia: 850000, soLuongTon: 10 }
    ]);

    // -------------------------------------------------------------
    // 7. MÁY THEO SỐ IMEI VẬT LÝ (26 Máy đầy đủ trạng thái)
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo danh sách Máy IMEI vật lý...');
    await MayImei.insertMany([
      // iPhone 15 Pro Max (Con hang: 4, Da ban: 2, Bao hanh: 1)
      { imei: '356789012345001', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB' },
      { imei: '356789012345002', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Xanh', dungLuong: '256GB' },
      { imei: '356789012345003', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Đen', dungLuong: '256GB' },
      { imei: '356789012345004', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Da ban', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB' }, // Bán HĐ 1
      { imei: '356789012345005', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Bao hanh', mauSac: 'Titan Trắng', dungLuong: '256GB' }, // PBH 1
      { imei: '356789012345006', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB' },

      // iPhone 15 Pro (Con hang: 3, Da ban: 1)
      { imei: '356789012345011', sanPham: spIphone15Pro._id, giaNhap: 22000000, trangThai: 'Con hang', mauSac: 'Titan Tự Nhiên', dungLuong: '128GB' },
      { imei: '356789012345012', sanPham: spIphone15Pro._id, giaNhap: 22000000, trangThai: 'Con hang', mauSac: 'Titan Đen', dungLuong: '128GB' },
      { imei: '356789012345013', sanPham: spIphone15Pro._id, giaNhap: 22000000, trangThai: 'Da ban', mauSac: 'Titan Trắng', dungLuong: '128GB' }, // Bán HĐ 2
      { imei: '356789012345014', sanPham: spIphone15Pro._id, giaNhap: 22000000, trangThai: 'Con hang', mauSac: 'Titan Xanh', dungLuong: '128GB' },

      // iPhone 15 Plus (Con hang: 2)
      { imei: '356789012345021', sanPham: spIphone15Plus._id, giaNhap: 19500000, trangThai: 'Con hang', mauSac: 'Hồng Pastel', dungLuong: '128GB' },
      { imei: '356789012345022', sanPham: spIphone15Plus._id, giaNhap: 19500000, trangThai: 'Con hang', mauSac: 'Xanh Lá Pastel', dungLuong: '128GB' },

      // iPhone 14 (Con hang: 2, Da ban: 1)
      { imei: '356789012345101', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Con hang', mauSac: 'Midnight', dungLuong: '128GB' },
      { imei: '356789012345102', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Con hang', mauSac: 'Starlight', dungLuong: '128GB' },
      { imei: '356789012345103', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Da ban', mauSac: 'Blue', dungLuong: '128GB' }, // PBH 2 (đã trả khách)

      // Samsung Galaxy S24 Ultra (Con hang: 3, Da ban: 1, Loi: 1)
      { imei: '356789012345201', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Con hang', mauSac: 'Xám Titan', dungLuong: '512GB' },
      { imei: '356789012345202', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Con hang', mauSac: 'Đen Titan', dungLuong: '512GB' },
      { imei: '356789012345203', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Loi', mauSac: 'Tím Titan', dungLuong: '512GB' },
      { imei: '356789012345204', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Da ban', mauSac: 'Vàng Titan', dungLuong: '512GB' }, // Bán HĐ 3

      // Samsung Galaxy Z Fold 5 (Con hang: 2)
      { imei: '356789012345211', sanPham: spZFold5._id, giaNhap: 28500000, trangThai: 'Con hang', mauSac: 'Xanh Icy', dungLuong: '256GB' },
      { imei: '356789012345212', sanPham: spZFold5._id, giaNhap: 28500000, trangThai: 'Con hang', mauSac: 'Đen Phantom', dungLuong: '256GB' },

      // Xiaomi 14 Ultra (Con hang: 2)
      { imei: '356789012345301', sanPham: spXiaomi14U._id, giaNhap: 24500000, trangThai: 'Con hang', mauSac: 'Đen Da Thuộc', dungLuong: '512GB' },
      { imei: '356789012345302', sanPham: spXiaomi14U._id, giaNhap: 24500000, trangThai: 'Con hang', mauSac: 'Trắng Da Thuộc', dungLuong: '512GB' },

      // iPad Pro M2 (Con hang: 2)
      { imei: '356789012345401', sanPham: spIpadPro._id, giaNhap: 17500000, trangThai: 'Con hang', mauSac: 'Space Gray', dungLuong: '128GB' },
      { imei: '356789012345402', sanPham: spIpadPro._id, giaNhap: 17500000, trangThai: 'Con hang', mauSac: 'Silver', dungLuong: '128GB' },

      // MacBook Air M2 (Con hang: 1, Da ban: 1)
      { imei: '356789012345501', sanPham: spMacBookAir._id, giaNhap: 21500000, trangThai: 'Con hang', mauSac: 'Midnight', dungLuong: '256GB' },
      { imei: '356789012345502', sanPham: spMacBookAir._id, giaNhap: 21500000, trangThai: 'Da ban', mauSac: 'Starlight', dungLuong: '256GB' } // Bán HĐ 4
    ]);

    // -------------------------------------------------------------
    // 8. TỒN KHO THEO TỪNG KHO & SẢN PHẨM
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Thống kê Tồn kho đa kho...');
    await TonKho.insertMany([
      { kho: khoCauGiay._id, sanPham: spIphone15PM._id, soLuong: 3 },
      { kho: khoThaiHa._id, sanPham: spIphone15PM._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spIphone15Pro._id, soLuong: 2 },
      { kho: khoThaiHa._id, sanPham: spIphone15Pro._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spIphone15Plus._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spIphone14._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spS24Ultra._id, soLuong: 2 },
      { kho: khoSaiGon._id, sanPham: spS24Ultra._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spZFold5._id, soLuong: 2 },
      { kho: khoThaiHa._id, sanPham: spXiaomi14U._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spIpadPro._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spMacBookAir._id, soLuong: 1 }
    ]);

    // -------------------------------------------------------------
    // 9. PHIẾU NHẬP KHO LÔ HÀNG (Tuân)
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Phiếu Nhập kho & Chi tiết nhập...');
    const pn1 = await PhieuNhap.create({
      maPN: 'PN20260801',
      nhaCungCap: nccApple._id,
      nhanVien: nvThuKho._id,
      ngayNhap: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      tongTien: 185000000, // 5 iPhone 15PM + 2 MacBook Air
      ghiChu: 'Nhập lô hàng Apple chính hãng đợt 1'
    });

    await CT_PhieuNhap.insertMany([
      { phieuNhap: pn1._id, imei: '356789012345001', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345002', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345003', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345004', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345501', sanPham: spMacBookAir._id, donGiaNhap: 21500000 }
    ]);

    const pn2 = await PhieuNhap.create({
      maPN: 'PN20260802',
      nhaCungCap: nccSamsung._id,
      nhanVien: nvThuKho._id,
      ngayNhap: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      tongTien: 83400000,
      ghiChu: 'Nhập lô Galaxy S24 Ultra & Phụ kiện (Ghi nợ gối đầu)'
    });

    await CT_PhieuNhap.insertMany([
      { phieuNhap: pn2._id, imei: '356789012345201', sanPham: spS24Ultra._id, donGiaNhap: 27800000 },
      { phieuNhap: pn2._id, imei: '356789012345202', sanPham: spS24Ultra._id, donGiaNhap: 27800000 },
      { phieuNhap: pn2._id, imei: '356789012345204', sanPham: spS24Ultra._id, donGiaNhap: 27800000 }
    ]);

    // -------------------------------------------------------------
    // 10. HÓA ĐƠN BÁN HÀNG & PHIẾU XUẤT KHO (Tuấn)
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Hóa đơn Bán hàng & Phiếu xuất kho...');
    // HD1: Khách An mua iPhone 15 Pro Max + Củ sạc 20W (Tiền mặt)
    const hd1 = await HoaDon.create({
      soHD: 'HD20260801',
      khachHang: khAn._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      tongTien: 30510000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách hàng mua thanh toán tiền mặt tại quầy'
    });
    await CT_HoaDon_May.create({ hoaDon: hd1._id, imei: '356789012345004', donGiaBan: 29990000 });
    await CT_HoaDon_PhuKien.create({ hoaDon: hd1._id, phuKien: pkSac20w._id, soLuong: 1, donGiaBan: 520000 });
    await PhieuXuatKho.create({ hoaDon: hd1._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd1.soHD}`, ngayXuat: hd1.ngayLap });

    // HD2: Khách Mai mua iPhone 15 Pro (Chuyển khoản)
    const hd2 = await HoaDon.create({
      soHD: 'HD20260802',
      khachHang: khMai._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      tongTien: 25490000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách thanh toán chuyển khoản QR VietQR'
    });
    await CT_HoaDon_May.create({ hoaDon: hd2._id, imei: '356789012345013', donGiaBan: 25490000 });
    await PhieuXuatKho.create({ hoaDon: hd2._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd2.soHD}`, ngayXuat: hd2.ngayLap });

    // HD3: Khách Long mua Galaxy S24 Ultra (Mua trả chậm / Công nợ KH)
    const hd3 = await HoaDon.create({
      soHD: 'HD20260803',
      khachHang: khLong._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      tongTien: 31990000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách trả trước 10tr, còn nợ 21.99tr'
    });
    await CT_HoaDon_May.create({ hoaDon: hd3._id, imei: '356789012345204', donGiaBan: 31990000 });
    await PhieuXuatKho.create({ hoaDon: hd3._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd3.soHD}`, ngayXuat: hd3.ngayLap });

    // -------------------------------------------------------------
    // 11. ĐƠN ĐẶT HÀNG TRƯỚC (PRE-ORDER) (Việt)
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Đơn đặt trước (Pre-order)...');
    // Đơn 1: Đã đặt cọc (chờ hàng)
    const ddh1 = await DonDatHangTruoc.create({
      maDonDat: 'DAT20260801',
      khachHang: khAn._id,
      sanPham: spIphone15PM._id,
      soTienCoc: 2000000,
      ngayDat: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      trangThai: 'Da dat coc',
      ghiChu: 'Khách đặt màu Titan Tự Nhiên 256GB'
    });

    // Đơn 2: Đã có hàng & gán IMEI
    const ddh2 = await DonDatHangTruoc.create({
      maDonDat: 'DAT20260802',
      khachHang: khMai._id,
      sanPham: spS24Ultra._id,
      soTienCoc: 1500000,
      imeiDaGan: '356789012345201',
      ngayDat: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      trangThai: 'Da co hang',
      ghiChu: 'Hàng đã về kho Cầu Giấy, đã nhắn khách qua nhận'
    });

    // Đơn 3: Khách Trang đặt cọc và ĐÃ NHẬN HÀNG cấn trừ cọc (HD4)
    const ddh3 = await DonDatHangTruoc.create({
      maDonDat: 'DAT20260803',
      khachHang: khTrang._id,
      sanPham: spMacBookAir._id,
      soTienCoc: 3000000,
      imeiDaGan: '356789012345502',
      ngayDat: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      trangThai: 'Da nhan hang',
      ghiChu: 'Đã nhận máy và xuất hóa đơn HD20260804'
    });

    // Hóa đơn HD4 cấn trừ cọc của Đơn 3
    const hd4 = await HoaDon.create({
      soHD: 'HD20260804',
      khachHang: khTrang._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tongTien: 24890000,
      donDatHang: ddh3._id,
      soTienGiam: 3000000, // Cấn trừ cọc
      trangThai: 'Da thanh toan',
      ghiChu: 'Cấn trừ 3.000.000 đ tiền cọc từ đơn DAT20260803'
    });
    await CT_HoaDon_May.create({ hoaDon: hd4._id, imei: '356789012345502', donGiaBan: 24890000 });
    await PhieuXuatKho.create({ hoaDon: hd4._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd4.soHD}`, ngayXuat: hd4.ngayLap });

    // Đơn 4: Khách Yến hủy đơn và đã hoàn tiền cọc
    const ddh4 = await DonDatHangTruoc.create({
      maDonDat: 'DAT20260804',
      khachHang: khYen._id,
      sanPham: spIphone15Pro._id,
      soTienCoc: 1000000,
      ngayDat: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      trangThai: 'Da huy',
      ghiChu: 'Khách đi công tác đột xuất, đã hoàn 100% tiền cọc'
    });

    // -------------------------------------------------------------
    // 12. PHIẾU BẢO HÀNH & SỬA CHỮA
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Phiếu Bảo Hành & Sửa chữa...');
    // PBH1: Tiếp nhận máy iPhone 15 Pro Max (Đang xử lý)
    const pbh1 = await PhieuBaoHanh.create({
      maPBH: 'PBH20260801',
      imei: '356789012345005',
      khachHang: khMai._id,
      nhanVien: nvKyThuat._id,
      moTaLoi: 'Màn hình bị sọc xanh dọc, cảm ứng chập chờn góc trên bên phải',
      ngayTiepNhan: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      trangThai: 'Dang xu ly',
      ghiChu: 'Bảo hành thay thế màn hình chính hãng'
    });
    await CT_PBH_LinhKien.create({
      phieuBaoHanh: pbh1._id,
      linhKien: lkManHinh15._id,
      soLuong: 1,
      donGia: 0
    });

    // PBH2: Đã sửa xong & trả khách
    const pbh2 = await PhieuBaoHanh.create({
      maPBH: 'PBH20260802',
      imei: '356789012345103',
      khachHang: khTung._id,
      nhanVien: nvKyThuat._id,
      moTaLoi: 'Pin chai nhanh sập nguồn',
      ngayTiepNhan: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      trangThai: 'Tra khach',
      ghiChu: 'Đã thay pin Pisen dung lượng cao, khách đã nhận lại máy'
    });
    await CT_PBH_LinhKien.create({
      phieuBaoHanh: pbh2._id,
      linhKien: lkPin15._id,
      soLuong: 1,
      donGia: 0
    });

    // -------------------------------------------------------------
    // 13. CÔNG NỢ ĐA HÌNH (An)
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Hồ sơ Công nợ Khách Hàng & NCC...');
    // Nợ Khách Hàng (Anh Long nợ HĐ3: Tổng 21.99tr, đã trả 10tr, còn nợ 11.99tr)
    const cnKH = await CongNo.create({
      loaiDoiTuong: 'KhachHang',
      khachHang: khLong._id,
      hoaDon: hd3._id,
      soTienNo: 21990000,
      soTienDaTra: 10000000,
      trangThai: 'Con no'
    });

    // Nợ NCC Samsung (Phiếu PN2: Tổng 83.4tr, đã trả 40tr, còn nợ 43.4tr)
    const cnNCC = await CongNo.create({
      loaiDoiTuong: 'NhaCungCap',
      nhaCungCap: nccSamsung._id,
      phieuNhap: pn2._id,
      soTienNo: 83400000,
      soTienDaTra: 40000000,
      trangThai: 'Con no'
    });

    // Nợ NCC Apple (Phiếu PN1: Đã thanh toán hết)
    await CongNo.create({
      loaiDoiTuong: 'NhaCungCap',
      nhaCungCap: nccApple._id,
      phieuNhap: pn1._id,
      soTienNo: 185000000,
      soTienDaTra: 185000000,
      trangThai: 'Da tra het'
    });

    // -------------------------------------------------------------
    // 14. PHIẾU THU & PHIẾU CHI SỔ QUỸ (Vượng)
    // -------------------------------------------------------------
    console.log('[Seed] Đang tạo Chứng từ Thu - Chi & Sổ quỹ...');
    // Thu bán hàng HD1 (30.510.000 đ Tiền mặt)
    await PhieuThu.create({
      hoaDon: hd1._id,
      soTien: hd1.tongTien,
      hinhThuc: 'Tien mat',
      ngayThu: hd1.ngayLap,
      ghiChu: `Thu tiền mặt bán lẻ theo hóa đơn ${hd1.soHD}`
    });

    // Thu bán hàng HD2 (25.490.000 đ Chuyển khoản)
    await PhieuThu.create({
      hoaDon: hd2._id,
      soTien: hd2.tongTien,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd2.ngayLap,
      ghiChu: `Thu chuyển khoản bán hàng theo hóa đơn ${hd2.soHD}`
    });

    // Thu cọc Đơn đặt trước 1 (2.000.000 đ Chuyển khoản)
    await PhieuThu.create({
      donDatHang: ddh1._id,
      soTien: ddh1.soTienCoc,
      hinhThuc: 'Chuyen khoan',
      ngayThu: ddh1.ngayDat,
      ghiChu: `Thu tiền cọc đơn đặt hàng ${ddh1.maDonDat} (iPhone 15 Pro Max)`
    });

    // Thu cọc Đơn đặt trước 2 (1.500.000 đ Quẹt thẻ)
    await PhieuThu.create({
      donDatHang: ddh2._id,
      soTien: ddh2.soTienCoc,
      hinhThuc: 'Quet the',
      ngayThu: ddh2.ngayDat,
      ghiChu: `Thu cọc quẹt thẻ POS đơn ${ddh2.maDonDat} (Galaxy S24 Ultra)`
    });

    // Thu cọc Đơn đặt trước 3 (3.000.000 đ Chuyển khoản)
    await PhieuThu.create({
      donDatHang: ddh3._id,
      soTien: ddh3.soTienCoc,
      hinhThuc: 'Chuyen khoan',
      ngayThu: ddh3.ngayDat,
      ghiChu: `Thu tiền cọc đơn ${ddh3.maDonDat} (MacBook Air)`
    });

    // Thu tiền bán hàng HD4 sau khi cấn trừ cọc (21.890.000 đ Chuyển khoản)
    await PhieuThu.create({
      hoaDon: hd4._id,
      soTien: 21890000,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd4.ngayLap,
      ghiChu: `Thu phần còn lại của hóa đơn ${hd4.soHD} sau cấn trừ cọc 3tr`
    });

    // Thu nợ khách hàng đợt 1 từ anh Long (10.000.000 đ Chuyển khoản)
    await PhieuThu.create({
      congNo: cnKH._id,
      soTien: 10000000,
      hinhThuc: 'Chuyen khoan',
      ngayThu: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      ghiChu: `Thu nợ trả chậm đợt 1 từ khách hàng ${khLong.hoTen}`
    });

    // Chi trả tiền nhập lô hàng Apple PN1 (185.000.000 đ Chuyển khoản)
    await PhieuChi.create({
      phieuNhap: pn1._id,
      maDT: nccApple._id.toString(),
      soTien: 185000000,
      hinhThuc: 'Chuyen khoan',
      ngayChi: pn1.ngayNhap,
      lyDo: `Thanh toán 100% tiền nhập hàng lô phiếu ${pn1.maPN} từ Apple VN`
    });

    // Chi trả nợ đợt 1 cho Samsung Vina (40.000.000 đ Chuyển khoản)
    await PhieuChi.create({
      phieuNhap: pn2._id,
      maDT: nccSamsung._id.toString(),
      soTien: 40000000,
      hinhThuc: 'Chuyen khoan',
      ngayChi: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lyDo: `Thanh toán trả nợ đợt 1 lô hàng phiếu ${pn2.maPN} cho Samsung Vina`
    });

    // Chi hoàn tiền cọc cho khách Đỗ Hoàng Yến đơn DAT20260804 (1.000.000 đ Tiền mặt)
    await PhieuChi.create({
      donDatHang: ddh4._id,
      maDT: khYen._id.toString(),
      soTien: 1000000,
      hinhThuc: 'Tien mat',
      ngayChi: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      lyDo: `Hoàn tiền cọc đơn đặt trước ${ddh4.maDonDat} cho khách ${khYen.hoTen}`
    });

    // Chi phí vận hành showroom (Tiền điện, nước, internet: 6.500.000 đ)
    await PhieuChi.create({
      maDT: 'CHI-PHI-VAN-HANH',
      soTien: 6500000,
      hinhThuc: 'Chuyen khoan',
      ngayChi: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      lyDo: 'Chi tiền điện, nước, internet showroom Thái Hà tháng này'
    });

    console.log('====================================================');
    console.log('🎉 SEED TOÀN BỘ DỮ LIỆU THỰC TẾ & LOGIC THÀNH CÔNG!');
    console.log('====================================================');
    console.log('📊 Thống kê dữ liệu mẫu đã tạo:');
    console.log(' - 6 Tài khoản nhân viên đầy đủ 6 vai trò');
    console.log(' - 5 Danh mục, 4 Nhà cung cấp, 6 Khách hàng');
    console.log(' - 9 Model sản phẩm cao cấp (iPhone, Galaxy, Xiaomi, iPad, Mac)');
    console.log(' - 6 Phụ kiện chính hãng & 4 Linh kiện sửa chữa');
    console.log(' - 3 Kho hàng (Cầu Giấy, Thái Hà, Sài Gòn) & Tồn kho đa kho');
    console.log(' - 26 Máy IMEI vật lý với các trạng thái logic chuẩn');
    console.log(' - 2 Phiếu nhập kho (Thanh toán ngay & Ghi nợ NCC)');
    console.log(' - 4 Hóa đơn bán hàng & Phiếu xuất kho liên kết');
    console.log(' - 4 Đơn đặt trước Pre-order (Đã cọc, Có hàng, Nhận máy, Đã hoàn cọc)');
    console.log(' - 2 Phiếu bảo hành (Đang xử lý, Đã sửa xong)');
    console.log(' - 3 Hồ sơ công nợ đa hình (Nợ KH & Nợ NCC)');
    console.log(' - 7 Phiếu thu & 4 Phiếu chi đầy đủ dòng tiền Sổ quỹ');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedData();
