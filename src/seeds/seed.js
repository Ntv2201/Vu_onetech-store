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
  CongNo,
  PhieuDoiTra,
  HopDongTraGop,
  BienBanKiemKe,
  DieuChinhKho
} = require('../models');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Đã kết nối tới MongoDB: ${mongoUri}`);

    // -------------------------------------------------------------
    // 0. RESET TOÀN BỘ CƠ SỞ DỮ LIỆU (26 Collections)
    // -------------------------------------------------------------
    console.log('[Seed] 🧹 Đang dọn dẹp và reset trắng 100% cơ sở dữ liệu...');
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
      CongNo.deleteMany({}),
      PhieuDoiTra.deleteMany({}),
      HopDongTraGop.deleteMany({}),
      BienBanKiemKe.deleteMany({}),
      DieuChinhKho.deleteMany({})
    ]);

    // -------------------------------------------------------------
    // 1. TÀI KHOẢN NHÂN VIÊN (6 VAI TRÒ CHUẨN RBAC + CCCD + EMAIL + ĐỊA CHỈ)
    // -------------------------------------------------------------
    console.log('[Seed] 1. Khởi tạo 6 Tài khoản Nhân viên đầy đủ CCCD & Email (RBAC chuẩn có dấu)...');
    const [nvAdmin, nvBanHang, nvThuKho, nvThuNgan, nvKeToan, nvKyThuat] = await Promise.all([
      NhanVien.create({
        hoTen: 'Nguyễn Quản Lý',
        sdt: '0901111222',
        cccd: '001090001122',
        email: 'admin@onetech.vn',
        diaChi: 'Tòa nhà OneTech, 128 Xuân Thủy, Cầu Giấy, Hà Nội',
        vaiTro: 'Quản lý',
        tenDangNhap: 'admin',
        matKhau: 'admin123',
        trangThai: 'Hoạt động'
      }),
      NhanVien.create({
        hoTen: 'Trần Bán Hàng',
        sdt: '0902222333',
        cccd: '001095002233',
        email: 'banhang@onetech.vn',
        diaChi: 'Số 45 Thái Hà, Đống Đa, Hà Nội',
        vaiTro: 'NV bán hàng',
        tenDangNhap: 'banhang',
        matKhau: '123456',
        trangThai: 'Hoạt động'
      }),
      NhanVien.create({
        hoTen: 'Lê Thủ Kho',
        sdt: '0903333444',
        cccd: '001092003344',
        email: 'thukho@onetech.vn',
        diaChi: 'Số 88 Cầu Giấy, Hà Nội',
        vaiTro: 'Thủ kho',
        tenDangNhap: 'thukho',
        matKhau: '123456',
        trangThai: 'Hoạt động'
      }),
      NhanVien.create({
        hoTen: 'Phạm Thu Ngân',
        sdt: '0904444555',
        cccd: '001096004455',
        email: 'thungan@onetech.vn',
        diaChi: 'Số 15 Kim Mã, Ba Đình, Hà Nội',
        vaiTro: 'Thu ngân',
        tenDangNhap: 'thungan',
        matKhau: '123456',
        trangThai: 'Hoạt động'
      }),
      NhanVien.create({
        hoTen: 'Hoàng Kế Toán',
        sdt: '0905555666',
        cccd: '001093005566',
        email: 'ketoan@onetech.vn',
        diaChi: 'Số 20 Láng Hạ, Đống Đa, Hà Nội',
        vaiTro: 'Kế toán',
        tenDangNhap: 'ketoan',
        matKhau: '123456',
        trangThai: 'Hoạt động'
      }),
      NhanVien.create({
        hoTen: 'Vũ Kỹ Thuật',
        sdt: '0906666777',
        cccd: '001094006677',
        email: 'kythuat@onetech.vn',
        diaChi: 'Số 56 Giải Phóng, Hai Bà Trưng, Hà Nội',
        vaiTro: 'Kỹ thuật',
        tenDangNhap: 'kythuat',
        matKhau: '123456',
        trangThai: 'Hoạt động'
      })
    ]);

    // -------------------------------------------------------------
    // 2. DANH MỤC SẢN PHẨM & PHÂN LOẠI (8 Danh mục chuẩn)
    // -------------------------------------------------------------
    console.log('[Seed] 2. Khởi tạo 8 Danh mục Hàng hóa chuẩn...');
    const [
      dmDienThoai,
      dmTablet,
      dmLaptop,
      dmSmartwatch,
      dmAmThanh,
      dmPhuKienSacCap,
      dmLinhKien,
      dmMayCuTradeIn
    ] = await DanhMuc.insertMany([
      { tenDanhMuc: 'Điện thoại thông minh (Smartphones)', moTa: 'Điện thoại iPhone, Samsung, Xiaomi quản lý theo từng IMEI vật lý', status: true },
      { tenDanhMuc: 'Máy tính bảng (iPad & Tablets)', moTa: 'iPad Pro, iPad Air, Galaxy Tab cao cấp quản lý theo số IMEI', status: true },
      { tenDanhMuc: 'Laptop & MacBook', moTa: 'MacBook M2, M3 và Laptop Ultrabook mỏng nhẹ quản lý theo Serial', status: true },
      { tenDanhMuc: 'Đồng hồ thông minh (Smartwatches)', moTa: 'Apple Watch Series 9, Ultra 2, Galaxy Watch 6 quản lý theo Serial', status: true },
      { tenDanhMuc: 'Thiết bị Âm thanh & Tai nghe', moTa: 'AirPods Pro, Galaxy Buds, Loa di động quản lý theo số lượng phụ kiện', status: true },
      { tenDanhMuc: 'Phụ kiện Cáp, Sạc & Ốp lưng', moTa: 'Củ sạc nhanh 20W/45W/67W, Cáp Type-C, Ốp lưng MagSafe, Kính cường lực', status: true },
      { tenDanhMuc: 'Linh kiện sửa chữa & Thay thế', moTa: 'Màn hình OLED, Pin dung lượng cao, Camera bóc máy trung tâm bảo hành', status: true },
      { tenDanhMuc: 'Máy cũ - Thu cũ đổi mới (Trade-in)', moTa: 'Điện thoại qua sử dụng, máy Likenew 99% tuyển chọn có bảo hành', status: true }
    ]);

    // -------------------------------------------------------------
    // 3. ĐỐI TÁC: NHÀ CUNG CẤP & KHÁCH HÀNG (15 Khách hàng thực tế)
    // -------------------------------------------------------------
    console.log('[Seed] 3. Khởi tạo Nhà cung cấp & 15 Khách hàng thực tế (đầy đủ CCCD, SĐT, Email, Hạng TV)...');
    const [nccApple, nccSamsung, nccFPT, nccDigiworld, nccVienSon] = await NhaCungCap.insertMany([
      {
        tenNCC: 'Apple Việt Nam Distribution',
        sdt: '02838221122',
        diaChi: 'Tầng 12, Bitexco Financial Tower, Quận 1, TP.HCM',
        ghiChu: 'Nguồn hàng chính hãng Apple VN/A ủy quyền',
        status: true
      },
      {
        tenNCC: 'Samsung Vina Electronics',
        sdt: '02838223344',
        diaChi: 'Số 2 Hải Triều, P. Bến Nghé, Quận 1, TP.HCM',
        ghiChu: 'Phân phối trực tiếp điện thoại, tablet & smartwatch Samsung',
        status: true
      },
      {
        tenNCC: 'FPT Synnex Distribution',
        sdt: '02473006666',
        diaChi: 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Cầu Giấy, Hà Nội',
        ghiChu: 'Đối tác phân phối tổng hợp linh kiện và máy tính',
        status: true
      },
      {
        tenNCC: 'Digiworld Corporation (DGW)',
        sdt: '02839290059',
        diaChi: '195 Điện Biên Phủ, P.15, Q. Bình Thạnh, TP.HCM',
        ghiChu: 'Nhà phân phối ủy quyền Xiaomi & Phụ kiện cao cấp',
        status: true
      },
      {
        tenNCC: 'Công ty CP Công Nghệ Viễn Sơn',
        sdt: '02838326085',
        diaChi: '162B Bùi Thị Xuân, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
        ghiChu: 'Phân phối linh kiện chính hãng & sạc cáp Anker, Marshall',
        status: true
      }
    ]);

    const [
      khAn, khMai, khLong, khTrang, khYen, khTung, khHoa, khDuc,
      khBao, khLinh, khHuy, khHaiYen, khTrong, khChi, khKiet
    ] = await KhachHang.insertMany([
      { hoTen: 'Nguyễn Văn An', sdt: '0988123456', cccd: '001092112233', email: 'an.nguyen@gmail.com', diaChi: '45 Xuân Thủy, Cầu Giấy, Hà Nội', hangThanhVien: 'Kim Cương', tongChiTieu: 95480000, status: true },
      { hoTen: 'Trần Thị Mai', sdt: '0977234567', cccd: '001195223344', email: 'mai.tran@gmail.com', diaChi: '12 Nguyễn Trãi, Thanh Xuân, Hà Nội', hangThanhVien: 'Vàng', tongChiTieu: 45000000, status: true },
      { hoTen: 'Lê Hoàng Long', sdt: '0912345678', cccd: '079093334455', email: 'long.le@yahoo.com', diaChi: '78 Hai Bà Trưng, Quận 1, TP.HCM', hangThanhVien: 'Bạc', tongChiTieu: 25490000, status: true },
      { hoTen: 'Phạm Minh Trang', sdt: '0933456789', cccd: '001198445566', email: 'trang.pham@outlook.com', diaChi: '15 Lê Duẩn, Hoàn Kiếm, Hà Nội', hangThanhVien: 'Đồng', tongChiTieu: 5490000, status: true },
      { hoTen: 'Đỗ Hoàng Yến', sdt: '0944567890', cccd: '079196556677', email: 'yen.do@gmail.com', diaChi: '88 Nguyễn Đình Chiểu, Quận 3, TP.HCM', hangThanhVien: 'Vàng', tongChiTieu: 52000000, status: true },
      { hoTen: 'Hoàng Thanh Tùng', sdt: '0966789012', cccd: '001094667788', email: 'tung.hoang@fpt.com.vn', diaChi: '102 Thái Hà, Đống Đa, Hà Nội', hangThanhVien: 'Kim Cương', tongChiTieu: 120000000, status: true },
      { hoTen: 'Vũ Thị Thanh Hoa', sdt: '0918889900', cccd: '079199778899', email: 'hoa.vu@gmail.com', diaChi: '240 Trần Hưng Đạo, Quận 5, TP.HCM', hangThanhVien: 'Bạc', tongChiTieu: 22190000, status: true },
      { hoTen: 'Đặng Minh Đức', sdt: '0982334455', cccd: '001097889900', email: 'duc.dang@viettel.com.vn', diaChi: '56 Hoàng Hoa Thám, Ba Đình, Hà Nội', hangThanhVien: 'Đồng', tongChiTieu: 16990000, status: true },
      { hoTen: 'Bùi Quốc Bảo', sdt: '0905123456', cccd: '048095123987', email: 'bao.bui@gmail.com', diaChi: '120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', hangThanhVien: 'Vàng', tongChiTieu: 36400000, status: true },
      { hoTen: 'Ngô Phương Linh', sdt: '0915678901', cccd: '001199654321', email: 'linh.ngo@gmail.com', diaChi: '89 Chùa Bộc, Đống Đa, Hà Nội', hangThanhVien: 'Bạc', tongChiTieu: 26990000, status: true },
      { hoTen: 'Trịnh Gia Huy', sdt: '0938112233', cccd: '079098741852', email: 'huy.trinh@techcombank.com.vn', diaChi: '15 Thảo Điền, TP. Thủ Đức, TP.HCM', hangThanhVien: 'Kim Cương', tongChiTieu: 88000000, status: true },
      { hoTen: 'Lý Hải Yến', sdt: '0949556677', cccd: '001194963852', email: 'yen.ly@hotmail.com', diaChi: '34 Phan Đình Phùng, Ba Đình, Hà Nội', hangThanhVien: 'Đồng', tongChiTieu: 8200000, status: true },
      { hoTen: 'Dương Đình Trọng', sdt: '0973445566', cccd: '001097159357', email: 'trong.duong@vng.com.vn', diaChi: '200 Quang Trung, Hà Đông, Hà Nội', hangThanhVien: 'Vàng', tongChiTieu: 41000000, status: true },
      { hoTen: 'Phan Thùy Chi', sdt: '0989223344', cccd: '079193753951', email: 'chi.phan@vov.vn', diaChi: '12 Bis Nguyễn Thị Minh Khai, Quận 1, TP.HCM', hangThanhVien: 'Bạc', tongChiTieu: 29990000, status: true },
      { hoTen: 'Nguyễn Tuấn Kiệt', sdt: '0962334455', cccd: '001099852147', email: 'kiet.nguyen@vinfast.vn', diaChi: '72 Nguyễn Chí Thanh, Đống Đa, Hà Nội', hangThanhVien: 'Đồng', tongChiTieu: 14990000, status: true }
    ]);

    // -------------------------------------------------------------
    // 4. KHO HÀNG
    // -------------------------------------------------------------
    console.log('[Seed] 4. Khởi tạo Hệ thống 3 Kho hàng...');
    const [khoCauGiay, khoThaiHa, khoSaiGon] = await Kho.insertMany([
      { tenKho: 'Kho Tổng Cầu Giấy', diaChi: 'Số 128 Xuân Thủy, Cầu Giấy, Hà Nội' },
      { tenKho: 'Kho Showroom Thái Hà', diaChi: 'Số 85 Thái Hà, Đống Đa, Hà Nội' },
      { tenKho: 'Kho Chi nhánh Quận 1', diaChi: 'Số 45 Lê Lợi, Bến Nghé, Quận 1, TP.HCM' }
    ]);

    // -------------------------------------------------------------
    // 5. MODEL SẢN PHẨM (22 Model trải rộng từ iPhone 16 đến Flagship)
    // -------------------------------------------------------------
    console.log('[Seed] 5. Khởi tạo 22 Model Sản phẩm đa phân khúc...');
    const [
      spIphone16PM,
      spIphone16Pro,
      spIphone16,
      spIphone15PM,
      spIphone15Pro,
      spIphone15Plus,
      spIphone14,
      spS24Ultra,
      spZFold5,
      spZFlip6,
      spS23,
      spXiaomi14U,
      spXiaomi14T,
      spOppoN3Flip,
      spIpadPro,
      spIpadAir,
      spMacBookAir,
      spMacBookPro,
      spAppleWatch9,
      spAppleWatchUltra,
      spGalaxyWatch6,
      spIphone13Old
    ] = await SanPham.insertMany([
      // Flagship Mới Nhất
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 16 Pro Max 256GB',
        hang: 'Apple',
        giaBan: 34990000,
        soThangBH: 12,
        moTa: 'Chip A18 Pro 3nm, Nút Camera Control cảm ứng lực, viền Titan siêu mỏng, Camera 48MP Fusion',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 16 Pro 128GB',
        hang: 'Apple',
        giaBan: 28990000,
        soThangBH: 12,
        moTa: 'Màn hình 6.3 inch 120Hz ProMotion, Nút Camera Control, Titan Sa Mạc sang trọng',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 16 128GB',
        hang: 'Apple',
        giaBan: 22990000,
        soThangBH: 12,
        moTa: 'Chip A18 siêu nhanh, Cụm Camera kép đặt dọc quay video không gian Spatial Video',
        status: true
      },
      // iPhone 15 & 14 Series
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 15 Pro Max 256GB',
        hang: 'Apple',
        giaBan: 29990000,
        soThangBH: 12,
        moTa: 'Chip A17 Pro 3nm, khung viền Titan, Camera tiềm vọng 5x, Action button',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 15 Pro 128GB',
        hang: 'Apple',
        giaBan: 25490000,
        soThangBH: 12,
        moTa: 'Thiết kế nhỏ gọn 6.1 inch, Titan chuẩn hàng không vũ trụ, cổng Type-C tốc độ cao',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 15 Plus 128GB',
        hang: 'Apple',
        giaBan: 22190000,
        soThangBH: 12,
        moTa: 'Màn hình lớn 6.7 inch, Dynamic Island, pin siêu khủng 2 ngày dùng',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 14 128GB',
        hang: 'Apple',
        giaBan: 16990000,
        soThangBH: 12,
        moTa: 'Màn hình Super Retina XDR, Camera kép nâng cấp Photonic Engine',
        status: true
      },
      // Samsung Galaxy Flagships
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Samsung Galaxy S24 Ultra 512GB',
        hang: 'Samsung',
        giaBan: 31990000,
        soThangBH: 12,
        moTa: 'Quyền năng Galaxy AI, Bút S-Pen tích hợp, khung viền Titan, Camera 200MP',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Samsung Galaxy Z Fold 5 256GB',
        hang: 'Samsung',
        giaBan: 33490000,
        soThangBH: 12,
        moTa: 'Màn hình gập Dynamic AMOLED 2X, bản lề Flex không khe hở',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Samsung Galaxy Z Flip 6 256GB',
        hang: 'Samsung',
        giaBan: 26990000,
        soThangBH: 12,
        moTa: 'Màn hình phụ FlexWindow 3.4 inch, Camera 50MP AI, tản nhiệt buồng hơi tân tiến',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Samsung Galaxy S23 128GB',
        hang: 'Samsung',
        giaBan: 14990000,
        soThangBH: 12,
        moTa: 'Thiết kế nhỏ gọn sang trọng, Snapdragon 8 Gen 2 for Galaxy',
        status: true
      },
      // Xiaomi & OPPO
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Xiaomi 14 Ultra 512GB',
        hang: 'Xiaomi',
        giaBan: 28990000,
        soThangBH: 18,
        moTa: 'Hợp tác Leica, 4 cảm biến 50MP, Chip Snapdragon 8 Gen 3',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Xiaomi 14T Pro 512GB',
        hang: 'Xiaomi',
        giaBan: 16990000,
        soThangBH: 18,
        moTa: 'Ống kính quang học Leica Summilux, Dimensity 9300+, sạc 120W HyperCharge',
        status: true
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'OPPO Find N3 Flip 256GB',
        hang: 'OPPO',
        giaBan: 21990000,
        soThangBH: 12,
        moTa: 'Bộ 3 Camera Hasselblad đỉnh cao, bản lề uốn tàng hình không nếp gấp',
        status: true
      },
      // Tablets
      {
        danhMuc: dmTablet._id,
        tenMay: 'iPad Pro M2 11 inch Wi-Fi 128GB',
        hang: 'Apple',
        giaBan: 20490000,
        soThangBH: 12,
        moTa: 'Chip Apple M2 cực mạnh, màn hình Liquid Retina 120Hz, hỗ trợ Apple Pencil Hover',
        status: true
      },
      {
        danhMuc: dmTablet._id,
        tenMay: 'iPad Air 5 M1 Wi-Fi 64GB',
        hang: 'Apple',
        giaBan: 14990000,
        soThangBH: 12,
        moTa: 'Chip M1 đột phá, Camera trước 12MP Ultra Wide với Center Stage',
        status: true
      },
      // Laptops & MacBook
      {
        danhMuc: dmLaptop._id,
        tenMay: 'MacBook Air M2 13.6 inch 256GB',
        hang: 'Apple',
        giaBan: 24890000,
        soThangBH: 12,
        moTa: 'Thiết kế mới siêu mỏng 11.3mm, sạc MagSafe 3, màn hình Liquid Retina rực rỡ',
        status: true
      },
      {
        danhMuc: dmLaptop._id,
        tenMay: 'MacBook Pro 14 inch M3 512GB',
        hang: 'Apple',
        giaBan: 39990000,
        soThangBH: 12,
        moTa: 'Chip M3 Pro kiến trúc 3nm, màn hình Liquid Retina XDR độ sáng 1600 nits đỉnh cao',
        status: true
      },
      // Smartwatches
      {
        danhMuc: dmSmartwatch._id,
        tenMay: 'Apple Watch Series 9 GPS 41mm',
        hang: 'Apple',
        giaBan: 9490000,
        soThangBH: 12,
        moTa: 'Chip S9 SiP mạnh mẽ, cử chỉ chạm đúp Double Tap độc đáo, màn hình sáng 2000 nits',
        status: true
      },
      {
        danhMuc: dmSmartwatch._id,
        tenMay: 'Apple Watch Ultra 2 GPS + Cellular 49mm',
        hang: 'Apple',
        giaBan: 20990000,
        soThangBH: 12,
        moTa: 'Vỏ Titan bền bỉ, GPS tần số kép chuẩn xác, pin đến 72 giờ ở chế độ nguồn điện thấp',
        status: true
      },
      {
        danhMuc: dmSmartwatch._id,
        tenMay: 'Samsung Galaxy Watch 6 Classic 43mm',
        hang: 'Samsung',
        giaBan: 7490000,
        soThangBH: 12,
        moTa: 'Vòng xoay bezel vật lý tinh tế, theo dõi giấc ngủ chuyên sâu, đo huyết áp & điện tâm đồ',
        status: true
      },
      // Máy cũ tuyển chọn
      {
        danhMuc: dmMayCuTradeIn._id,
        tenMay: 'iPhone 13 128GB (Cũ Likenew 99%)',
        hang: 'Apple',
        giaBan: 11990000,
        soThangBH: 6,
        moTa: 'Máy nguyên zin 100%, pin trên 90%, đã kiểm tra 32 bước tiêu chuẩn kỹ thuật',
        status: true
      }
    ]);

    // -------------------------------------------------------------
    // 6. PHỤ KIỆN & LINH KIỆN ĐA DẠNG
    // -------------------------------------------------------------
    console.log('[Seed] 6. Khởi tạo Phụ kiện & Linh kiện phong phú...');
    const [
      pkSac20w,
      pkCapC,
      pkOpLung15,
      pkSac45w,
      pkAirPods2,
      pkCuongLuc,
      pkSacDuPhong,
      pkAirPodsPro,
      pkBuds2Pro,
      pkMarshall,
      pkAnker67w,
      pkUagCase,
      pkPencilPro
    ] = await PhuKien.insertMany([
      { danhMuc: dmPhuKienSacCap._id, tenPK: 'Củ sạc Apple 20W Type-C Chính hãng', giaBan: 520000, soLuongTon: 60, status: true },
      { danhMuc: dmPhuKienSacCap._id, tenPK: 'Cáp sạc C to C Apple Braided 1m', giaBan: 490000, soLuongTon: 45, status: true },
      { danhMuc: dmPhuKienSacCap._id, tenPK: 'Ốp lưng MagSafe iPhone 15/16 Pro Max Clear Case', giaBan: 890000, soLuongTon: 35, status: true },
      { danhMuc: dmPhuKienSacCap._id, tenPK: 'Củ sạc Samsung 45W Type-C Super Fast', giaBan: 650000, soLuongTon: 30, status: true },
      { danhMuc: dmPhuKienSacCap._id, tenPK: 'Kính cường lực KingKong 9D chống nhìn trộm', giaBan: 180000, soLuongTon: 100, status: true },
      { danhMuc: dmPhuKienSacCap._id, tenPK: 'Sạc dự phòng Anker MagGo 10000mAh 15W', giaBan: 1290000, soLuongTon: 25, status: true },
      { danhMuc: dmAmThanh._id, tenPK: 'Tai nghe Apple AirPods 3 Lightning', giaBan: 3990000, soLuongTon: 15, status: true },
      { danhMuc: dmAmThanh._id, tenPK: 'Tai nghe Apple AirPods Pro 2 USB-C', giaBan: 5490000, soLuongTon: 20, status: true },
      { danhMuc: dmAmThanh._id, tenPK: 'Tai nghe Samsung Galaxy Buds 2 Pro', giaBan: 3290000, soLuongTon: 18, status: true },
      { danhMuc: dmAmThanh._id, tenPK: 'Loa Bluetooth Marshall Emberton II', giaBan: 3890000, soLuongTon: 12, status: true },
      { danhMuc: dmPhuKienSacCap._id, tenPK: 'Củ sạc Anker GaNPrime 67W 3 cổng', giaBan: 990000, soLuongTon: 40, status: true },
      { danhMuc: dmPhuKienSacCap._id, tenPK: 'Ốp lưng UAG Pathfinder chống sốc quân đội', giaBan: 1190000, soLuongTon: 25, status: true },
      { danhMuc: dmTablet._id, tenPK: 'Bút cảm ứng Apple Pencil Pro', giaBan: 3490000, soLuongTon: 15, status: true }
    ]);

    const [lkManHinh15, lkPin15, lkCamS24, lkChanSacC, lkManHinh14, lkPin14] = await LinhKien.insertMany([
      { tenLK: 'Màn hình OLED iPhone 15 Pro Max GX', donGia: 7500000, soLuongTon: 8 },
      { tenLK: 'Pin Li-ion iPhone 15 Pro Max Pisen', donGia: 1800000, soLuongTon: 15 },
      { tenLK: 'Cụm Camera sau Galaxy S24 Ultra Zin bóc máy', donGia: 3200000, soLuongTon: 6 },
      { tenLK: 'Cụm bo cáp sạc Type-C Galaxy S24 Ultra', donGia: 850000, soLuongTon: 10 },
      { tenLK: 'Màn hình Super Retina XDR iPhone 14 zin', donGia: 4200000, soLuongTon: 5 },
      { tenLK: 'Pin Li-ion iPhone 14 Pisen dung lượng cao', donGia: 1200000, soLuongTon: 12 }
    ]);

    // -------------------------------------------------------------
    // 7. MÁY THEO SỐ IMEI VẬT LÝ (76 MÁY ĐẦY ĐỦ 8 TRẠNG THÁI)
    // -------------------------------------------------------------
    console.log('[Seed] 7. Khởi tạo 76 Máy IMEI vật lý (sẵn sàng bán trên POS)...');
    await MayImei.insertMany([
      // iPhone 16 Pro Max (Con hang: 4, Da ban: 1)
      { imei: '356789012346001', sanPham: spIphone16PM._id, giaNhap: 31000000, trangThai: 'Con hang', mauSac: 'Titan Sa Mạc', dungLuong: '256GB', status: true },
      { imei: '356789012346002', sanPham: spIphone16PM._id, giaNhap: 31000000, trangThai: 'Con hang', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB', status: true },
      { imei: '356789012346003', sanPham: spIphone16PM._id, giaNhap: 31000000, trangThai: 'Con hang', mauSac: 'Titan Đen', dungLuong: '256GB', status: true },
      { imei: '356789012346004', sanPham: spIphone16PM._id, giaNhap: 31000000, trangThai: 'Con hang', mauSac: 'Titan Trắng', dungLuong: '256GB', status: true },
      { imei: '356789012346005', sanPham: spIphone16PM._id, giaNhap: 31000000, trangThai: 'Da ban', mauSac: 'Titan Sa Mạc', dungLuong: '256GB', status: true }, // Bán HD7

      // iPhone 16 Pro (Con hang: 3, Da ban: 1)
      { imei: '356789012346011', sanPham: spIphone16Pro._id, giaNhap: 25500000, trangThai: 'Con hang', mauSac: 'Titan Sa Mạc', dungLuong: '128GB', status: true },
      { imei: '356789012346012', sanPham: spIphone16Pro._id, giaNhap: 25500000, trangThai: 'Con hang', mauSac: 'Titan Đen', dungLuong: '128GB', status: true },
      { imei: '356789012346013', sanPham: spIphone16Pro._id, giaNhap: 25500000, trangThai: 'Con hang', mauSac: 'Titan Trắng', dungLuong: '128GB', status: true },
      { imei: '356789012346014', sanPham: spIphone16Pro._id, giaNhap: 25500000, trangThai: 'Da ban', mauSac: 'Titan Sa Mạc', dungLuong: '128GB', status: true }, // Bán HD9

      // iPhone 16 (Con hang: 3)
      { imei: '356789012346021', sanPham: spIphone16._id, giaNhap: 20000000, trangThai: 'Con hang', mauSac: 'Xanh Lưu Ly', dungLuong: '128GB', status: true },
      { imei: '356789012346022', sanPham: spIphone16._id, giaNhap: 20000000, trangThai: 'Con hang', mauSac: 'Hồng Pastel', dungLuong: '128GB', status: true },
      { imei: '356789012346023', sanPham: spIphone16._id, giaNhap: 20000000, trangThai: 'Con hang', mauSac: 'Đen Huyền Bí', dungLuong: '128GB', status: true },

      // iPhone 15 Pro Max (Con hang: 4, Da ban: 2, Bao hanh: 1)
      { imei: '356789012345001', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB', status: true },
      { imei: '356789012345002', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Xanh', dungLuong: '256GB', status: true },
      { imei: '356789012345003', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Đen', dungLuong: '256GB', status: true },
      { imei: '356789012345004', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Da ban', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB', status: true }, // Bán HD1 -> Đổi trả DT1
      { imei: '356789012345005', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Bao hanh', mauSac: 'Titan Trắng', dungLuong: '256GB', status: true }, // PBH1
      { imei: '356789012345006', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Da ban', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB', status: true }, // Máy mới đổi trong DT1
      { imei: '356789012345007', sanPham: spIphone15PM._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Trắng', dungLuong: '256GB', status: true },

      // iPhone 15 Pro (Con hang: 3, Da ban: 1)
      { imei: '356789012345011', sanPham: spIphone15Pro._id, giaNhap: 22000000, trangThai: 'Con hang', mauSac: 'Titan Tự Nhiên', dungLuong: '128GB', status: true },
      { imei: '356789012345012', sanPham: spIphone15Pro._id, giaNhap: 22000000, trangThai: 'Con hang', mauSac: 'Titan Đen', dungLuong: '128GB', status: true },
      { imei: '356789012345013', sanPham: spIphone15Pro._id, giaNhap: 22000000, trangThai: 'Da ban', mauSac: 'Titan Trắng', dungLuong: '128GB', status: true }, // Bán HD2 (Trả góp)
      { imei: '356789012345014', sanPham: spIphone15Pro._id, giaNhap: 22000000, trangThai: 'Con hang', mauSac: 'Titan Xanh', dungLuong: '128GB', status: true },

      // iPhone 15 Plus (Con hang: 2)
      { imei: '356789012345021', sanPham: spIphone15Plus._id, giaNhap: 19500000, trangThai: 'Con hang', mauSac: 'Hồng Pastel', dungLuong: '128GB', status: true },
      { imei: '356789012345022', sanPham: spIphone15Plus._id, giaNhap: 19500000, trangThai: 'Con hang', mauSac: 'Xanh Lá Pastel', dungLuong: '128GB', status: true },

      // iPhone 14 (Con hang: 2, Da ban: 1)
      { imei: '356789012345101', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Con hang', mauSac: 'Midnight', dungLuong: '128GB', status: true },
      { imei: '356789012345102', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Con hang', mauSac: 'Starlight', dungLuong: '128GB', status: true },
      { imei: '356789012345103', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Da ban', mauSac: 'Blue', dungLuong: '128GB', status: true }, // PBH2 (đã sửa & trả khách)

      // Samsung Galaxy S24 Ultra (Con hang: 2, Da ban: 2, Loi: 1, Tra NCC: 1)
      { imei: '356789012345201', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Con hang', mauSac: 'Xám Titan', dungLuong: '512GB', status: true }, // Gán Pre-order DDH2
      { imei: '356789012345202', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Con hang', mauSac: 'Đen Titan', dungLuong: '512GB', status: true },
      { imei: '356789012345203', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Loi', mauSac: 'Tím Titan', dungLuong: '512GB', status: true }, // Lỗi camera
      { imei: '356789012345204', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Da ban', mauSac: 'Vàng Titan', dungLuong: '512GB', status: true }, // Bán HD3 (Công nợ KH)
      { imei: '356789012345205', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Tra NCC', mauSac: 'Xám Titan', dungLuong: '512GB', status: false }, // Đã trả NCC Samsung
      { imei: '356789012345206', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Da ban', mauSac: 'Đen Titan', dungLuong: '512GB', status: true }, // Bán HD12

      // Samsung Galaxy Z Fold 5 (Con hang: 2)
      { imei: '356789012345211', sanPham: spZFold5._id, giaNhap: 28500000, trangThai: 'Con hang', mauSac: 'Xanh Icy', dungLuong: '256GB', status: true },
      { imei: '356789012345212', sanPham: spZFold5._id, giaNhap: 28500000, trangThai: 'Con hang', mauSac: 'Đen Phantom', dungLuong: '256GB', status: true },

      // Samsung Galaxy Z Flip 6 (Con hang: 2, Da ban: 1)
      { imei: '356789012345215', sanPham: spZFlip6._id, giaNhap: 23500000, trangThai: 'Con hang', mauSac: 'Xanh Maya', dungLuong: '256GB', status: true },
      { imei: '356789012345216', sanPham: spZFlip6._id, giaNhap: 23500000, trangThai: 'Con hang', mauSac: 'Vàng Mì', dungLuong: '256GB', status: true },
      { imei: '356789012345217', sanPham: spZFlip6._id, giaNhap: 23500000, trangThai: 'Da ban', mauSac: 'Xám Titan', dungLuong: '256GB', status: true }, // Bán HD8

      // Samsung Galaxy S23 (Con hang: 2)
      { imei: '356789012345221', sanPham: spS23._id, giaNhap: 12500000, trangThai: 'Con hang', mauSac: 'Kem Cotton', dungLuong: '128GB', status: true },
      { imei: '356789012345222', sanPham: spS23._id, giaNhap: 12500000, trangThai: 'Con hang', mauSac: 'Đen Phantom', dungLuong: '128GB', status: true },

      // Xiaomi 14 Ultra (Con hang: 2)
      { imei: '356789012345301', sanPham: spXiaomi14U._id, giaNhap: 24500000, trangThai: 'Con hang', mauSac: 'Đen Da Thuộc', dungLuong: '512GB', status: true },
      { imei: '356789012345302', sanPham: spXiaomi14U._id, giaNhap: 24500000, trangThai: 'Con hang', mauSac: 'Trắng Da Thuộc', dungLuong: '512GB', status: true },

      // Xiaomi 14T Pro (Con hang: 2, Da ban: 1)
      { imei: '356789012345311', sanPham: spXiaomi14T._id, giaNhap: 14500000, trangThai: 'Con hang', mauSac: 'Xám Titan', dungLuong: '512GB', status: true },
      { imei: '356789012345312', sanPham: spXiaomi14T._id, giaNhap: 14500000, trangThai: 'Con hang', mauSac: 'Xanh Titan', dungLuong: '512GB', status: true },
      { imei: '356789012345313', sanPham: spXiaomi14T._id, giaNhap: 14500000, trangThai: 'Da ban', mauSac: 'Đen Titan', dungLuong: '512GB', status: true }, // Bán HD10

      // OPPO Find N3 Flip (Con hang: 2)
      { imei: '356789012345321', sanPham: spOppoN3Flip._id, giaNhap: 18500000, trangThai: 'Con hang', mauSac: 'Vàng Ánh Kim', dungLuong: '256GB', status: true },
      { imei: '356789012345322', sanPham: spOppoN3Flip._id, giaNhap: 18500000, trangThai: 'Con hang', mauSac: 'Đen Huyền', dungLuong: '256GB', status: true },

      // iPad Pro M2 (Con hang: 2, Da ban: 1)
      { imei: '356789012345401', sanPham: spIpadPro._id, giaNhap: 17500000, trangThai: 'Con hang', mauSac: 'Space Gray', dungLuong: '128GB', status: true },
      { imei: '356789012345402', sanPham: spIpadPro._id, giaNhap: 17500000, trangThai: 'Con hang', mauSac: 'Silver', dungLuong: '128GB', status: true },
      { imei: '356789012345403', sanPham: spIpadPro._id, giaNhap: 17500000, trangThai: 'Da ban', mauSac: 'Space Gray', dungLuong: '128GB', status: true }, // Bán HD11

      // iPad Air 5 (Con hang: 1, Da ban: 1)
      { imei: '356789012345411', sanPham: spIpadAir._id, giaNhap: 12500000, trangThai: 'Con hang', mauSac: 'Blue', dungLuong: '64GB', status: true },
      { imei: '356789012345412', sanPham: spIpadAir._id, giaNhap: 12500000, trangThai: 'Da ban', mauSac: 'Purple', dungLuong: '64GB', status: true }, // Bán HD5

      // MacBook Air M2 (Con hang: 1, Da ban: 1)
      { imei: '356789012345501', sanPham: spMacBookAir._id, giaNhap: 21500000, trangThai: 'Con hang', mauSac: 'Midnight', dungLuong: '256GB', status: true },
      { imei: '356789012345502', sanPham: spMacBookAir._id, giaNhap: 21500000, trangThai: 'Da ban', mauSac: 'Starlight', dungLuong: '256GB', status: true }, // Bán HD4 (Pre-order DDH3)

      // MacBook Pro 14 M3 (Con hang: 1)
      { imei: '356789012345511', sanPham: spMacBookPro._id, giaNhap: 34500000, trangThai: 'Con hang', mauSac: 'Space Black', dungLuong: '512GB', status: true },

      // Apple Watch Series 9 (Con hang: 2)
      { imei: '356789012345601', sanPham: spAppleWatch9._id, giaNhap: 8200000, trangThai: 'Con hang', mauSac: 'Midnight', dungLuong: '41mm', status: true },
      { imei: '356789012345602', sanPham: spAppleWatch9._id, giaNhap: 8200000, trangThai: 'Con hang', mauSac: 'Starlight', dungLuong: '41mm', status: true },

      // Apple Watch Ultra 2 (Con hang: 1, Da ban: 1)
      { imei: '356789012345611', sanPham: spAppleWatchUltra._id, giaNhap: 17900000, trangThai: 'Con hang', mauSac: 'Titan Tự Nhiên', dungLuong: '49mm', status: true },
      { imei: '356789012345612', sanPham: spAppleWatchUltra._id, giaNhap: 17900000, trangThai: 'Da ban', mauSac: 'Titan Tự Nhiên', dungLuong: '49mm', status: true }, // Bán HD6

      // Galaxy Watch 6 (Con hang: 2)
      { imei: '356789012345621', sanPham: spGalaxyWatch6._id, giaNhap: 6400000, trangThai: 'Con hang', mauSac: 'Đen Classic', dungLuong: '43mm', status: true },
      { imei: '356789012345622', sanPham: spGalaxyWatch6._id, giaNhap: 6400000, trangThai: 'Con hang', mauSac: 'Bạc Classic', dungLuong: '43mm', status: true },

      // iPhone 13 Likenew (Con hang: 2)
      { imei: '356789012345701', sanPham: spIphone13Old._id, giaNhap: 9500000, trangThai: 'Con hang', mauSac: 'Midnight 99%', dungLuong: '128GB', status: true },
      { imei: '356789012345702', sanPham: spIphone13Old._id, giaNhap: 9500000, trangThai: 'Con hang', mauSac: 'Pink 99%', dungLuong: '128GB', status: true }
    ]);

    // -------------------------------------------------------------
    // 8. TỒN KHO KHỚP 100% VỚI MÁY CÒN HÀNG (TonKho)
    // -------------------------------------------------------------
    console.log('[Seed] 8. Khởi tạo Tồn kho (TonKho) khớp 100% số lượng máy Con hang...');
    await TonKho.insertMany([
      { kho: khoCauGiay._id, sanPham: spIphone16PM._id, soLuong: 2 },
      { kho: khoThaiHa._id, sanPham: spIphone16PM._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spIphone16Pro._id, soLuong: 2 },
      { kho: khoSaiGon._id, sanPham: spIphone16Pro._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spIphone16._id, soLuong: 2 },
      { kho: khoThaiHa._id, sanPham: spIphone16._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spIphone15PM._id, soLuong: 3 },
      { kho: khoThaiHa._id, sanPham: spIphone15PM._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spIphone15Pro._id, soLuong: 2 },
      { kho: khoThaiHa._id, sanPham: spIphone15Pro._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spIphone15Plus._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spIphone14._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spS24Ultra._id, soLuong: 1 },
      { kho: khoSaiGon._id, sanPham: spS24Ultra._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spZFold5._id, soLuong: 2 },
      { kho: khoThaiHa._id, sanPham: spZFlip6._id, soLuong: 2 },
      { kho: khoThaiHa._id, sanPham: spS23._id, soLuong: 2 },
      { kho: khoThaiHa._id, sanPham: spXiaomi14U._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spXiaomi14T._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spOppoN3Flip._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spIpadPro._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spIpadAir._id, soLuong: 1 },
      { kho: khoCauGiay._id, sanPham: spMacBookAir._id, soLuong: 1 },
      { kho: khoSaiGon._id, sanPham: spMacBookPro._id, soLuong: 1 },
      { kho: khoThaiHa._id, sanPham: spAppleWatch9._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spAppleWatchUltra._id, soLuong: 1 },
      { kho: khoThaiHa._id, sanPham: spGalaxyWatch6._id, soLuong: 2 },
      { kho: khoCauGiay._id, sanPham: spIphone13Old._id, soLuong: 2 }
    ]);

    // -------------------------------------------------------------
    // 9. PHIẾU NHẬP KHO LÔ HÀNG (Tuân)
    // -------------------------------------------------------------
    console.log('[Seed] 9. Khởi tạo Phiếu Nhập kho & Chi tiết nhập...');
    const pn1 = await PhieuNhap.create({
      maPN: 'PN20260801',
      nhaCungCap: nccApple._id,
      nhanVien: nvThuKho._id,
      ngayNhap: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
      tongTien: 185000000,
      ghiChu: 'Nhập lô iPhone 15 Series & MacBook Air đợt 1 từ Apple VN',
      status: true
    });

    await CT_PhieuNhap.insertMany([
      { phieuNhap: pn1._id, imei: '356789012345001', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345002', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345003', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345004', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345006', sanPham: spIphone15PM._id, donGiaNhap: 26500000 },
      { phieuNhap: pn1._id, imei: '356789012345501', sanPham: spMacBookAir._id, donGiaNhap: 21500000 },
      { phieuNhap: pn1._id, imei: '356789012345502', sanPham: spMacBookAir._id, donGiaNhap: 21500000 }
    ]);

    const pn2 = await PhieuNhap.create({
      maPN: 'PN20260802',
      nhaCungCap: nccSamsung._id,
      nhanVien: nvThuKho._id,
      ngayNhap: new Date(Date.now() - 62 * 24 * 60 * 60 * 1000),
      tongTien: 83400000,
      ghiChu: 'Nhập lô Galaxy S24 Ultra 512GB (Hình thức Ghi nợ gối đầu 30 ngày)',
      status: true
    });

    await CT_PhieuNhap.insertMany([
      { phieuNhap: pn2._id, imei: '356789012345201', sanPham: spS24Ultra._id, donGiaNhap: 27800000 },
      { phieuNhap: pn2._id, imei: '356789012345202', sanPham: spS24Ultra._id, donGiaNhap: 27800000 },
      { phieuNhap: pn2._id, imei: '356789012345204', sanPham: spS24Ultra._id, donGiaNhap: 27800000 }
    ]);

    const pn3 = await PhieuNhap.create({
      maPN: 'PN20260803',
      nhaCungCap: nccFPT._id,
      nhanVien: nvThuKho._id,
      ngayNhap: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
      tongTien: 45000000,
      ghiChu: 'Nhập củ sạc, cáp sạc, tai nghe và pin linh kiện',
      status: true
    });

    const pn4 = await PhieuNhap.create({
      maPN: 'PN20260804',
      nhaCungCap: nccDigiworld._id,
      nhanVien: nvThuKho._id,
      ngayNhap: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      tongTien: 41780000,
      ghiChu: 'Nhập đồng hồ Apple Watch Ultra 2 & tai nghe AirPods',
      status: true
    });

    await CT_PhieuNhap.insertMany([
      { phieuNhap: pn4._id, imei: '356789012345611', sanPham: spAppleWatchUltra._id, donGiaNhap: 17900000 },
      { phieuNhap: pn4._id, imei: '356789012345612', sanPham: spAppleWatchUltra._id, donGiaNhap: 17900000 }
    ]);

    const pn5 = await PhieuNhap.create({
      maPN: 'PN20260901',
      nhaCungCap: nccApple._id,
      nhanVien: nvThuKho._id,
      ngayNhap: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tongTien: 147500000,
      ghiChu: 'Lô iPhone 16 Series chính hãng Apple đợt đầu',
      status: true
    });

    await CT_PhieuNhap.insertMany([
      { phieuNhap: pn5._id, imei: '356789012346001', sanPham: spIphone16PM._id, donGiaNhap: 31000000 },
      { phieuNhap: pn5._id, imei: '356789012346002', sanPham: spIphone16PM._id, donGiaNhap: 31000000 },
      { phieuNhap: pn5._id, imei: '356789012346005', sanPham: spIphone16PM._id, donGiaNhap: 31000000 },
      { phieuNhap: pn5._id, imei: '356789012346011', sanPham: spIphone16Pro._id, donGiaNhap: 25500000 },
      { phieuNhap: pn5._id, imei: '356789012346021', sanPham: spIphone16._id, donGiaNhap: 20000000 }
    ]);

    // -------------------------------------------------------------
    // 10. HÓA ĐƠN BÁN HÀNG & PHIẾU XUẤT KHO (12 Hóa đơn phân bổ thời gian)
    // -------------------------------------------------------------
    console.log('[Seed] 10. Khởi tạo 12 Hóa đơn Bán hàng & Phiếu xuất kho (đầy đủ biểu đồ doanh thu)...');
    
    // HD1: Khách An mua iPhone 15 Pro Max + Củ sạc 20W
    const hd1 = await HoaDon.create({
      soHD: 'HD20260801',
      khachHang: khAn._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      tongTien: 30510000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách hàng mua thanh toán tiền mặt tại quầy',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd1._id, imei: '356789012345004', donGiaBan: 29990000 });
    await CT_HoaDon_PhuKien.create({ hoaDon: hd1._id, phuKien: pkSac20w._id, soLuong: 1, donGiaBan: 520000 });
    await PhieuXuatKho.create({ hoaDon: hd1._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd1.soHD}`, ngayXuat: hd1.ngayLap });

    // HD2: Khách Mai mua iPhone 15 Pro (Trả góp)
    const hd2 = await HoaDon.create({
      soHD: 'HD20260802',
      khachHang: khMai._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      tongTien: 25490000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách mua qua hợp đồng trả góp 6 tháng, trả trước 10tr',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd2._id, imei: '356789012345013', donGiaBan: 25490000 });
    await PhieuXuatKho.create({ hoaDon: hd2._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd2.soHD}`, ngayXuat: hd2.ngayLap });

    // HD3: Khách Long mua Galaxy S24 Ultra (Ghi nợ)
    const hd3 = await HoaDon.create({
      soHD: 'HD20260803',
      khachHang: khLong._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      tongTien: 31990000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách trả trước 10tr, còn ghi nợ 21.99tr',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd3._id, imei: '356789012345204', donGiaBan: 31990000 });
    await PhieuXuatKho.create({ hoaDon: hd3._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd3.soHD}`, ngayXuat: hd3.ngayLap });

    // HD4: Khách Trang nhận máy MacBook Air M2 sau khi cấn trừ cọc
    const hd4 = await HoaDon.create({
      soHD: 'HD20260804',
      khachHang: khTrang._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      tongTien: 24890000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Đơn đặt trước DAT20260803 nhận máy: Giá 24.89tr, cấn trừ cọc 3tr, thu 21.89tr',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd4._id, imei: '356789012345502', donGiaBan: 24890000 });
    await PhieuXuatKho.create({ hoaDon: hd4._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd4.soHD}`, ngayXuat: hd4.ngayLap });

    // HD5: Khách Hoa mua iPad Air 5 + Kính cường lực
    const hd5 = await HoaDon.create({
      soHD: 'HD20260805',
      khachHang: khHoa._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      tongTien: 15170000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách thanh toán chuyển khoản VietQR nhận máy tại chỗ',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd5._id, imei: '356789012345412', donGiaBan: 14990000 });
    await CT_HoaDon_PhuKien.create({ hoaDon: hd5._id, phuKien: pkCuongLuc._id, soLuong: 1, donGiaBan: 180000 });
    await PhieuXuatKho.create({ hoaDon: hd5._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd5.soHD}`, ngayXuat: hd5.ngayLap });

    // HD6: Khách Đức mua Apple Watch Ultra 2
    const hd6 = await HoaDon.create({
      soHD: 'HD20260806',
      khachHang: khDuc._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      tongTien: 20990000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách mua Apple Watch Ultra 2 Titan thanh toán qua Pos quẹt thẻ',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd6._id, imei: '356789012345612', donGiaBan: 20990000 });
    await PhieuXuatKho.create({ hoaDon: hd6._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd6.soHD}`, ngayXuat: hd6.ngayLap });

    // HD7: Khách Bảo mua iPhone 16 Pro Max 256GB + Củ sạc 20W + Ốp lưng
    const hd7 = await HoaDon.create({
      soHD: 'HD20260901',
      khachHang: khBao._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      tongTien: 36400000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách mua iPhone 16 Pro Max ngày mở bán, chuyển khoản ngân hàng',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd7._id, imei: '356789012346005', donGiaBan: 34990000 });
    await CT_HoaDon_PhuKien.create({ hoaDon: hd7._id, phuKien: pkSac20w._id, soLuong: 1, donGiaBan: 520000 });
    await CT_HoaDon_PhuKien.create({ hoaDon: hd7._id, phuKien: pkOpLung15._id, soLuong: 1, donGiaBan: 890000 });
    await PhieuXuatKho.create({ hoaDon: hd7._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd7.soHD}`, ngayXuat: hd7.ngayLap });

    // HD8: Khách Linh mua Samsung Galaxy Z Flip 6
    const hd8 = await HoaDon.create({
      soHD: 'HD20260902',
      khachHang: khLinh._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tongTien: 26990000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách thanh toán tiền mặt tại quầy',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd8._id, imei: '356789012345217', donGiaBan: 26990000 });
    await PhieuXuatKho.create({ hoaDon: hd8._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd8.soHD}`, ngayXuat: hd8.ngayLap });

    // HD9: Khách Huy mua iPhone 16 Pro 128GB + Cáp sạc C
    const hd9 = await HoaDon.create({
      soHD: 'HD20260903',
      khachHang: khHuy._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tongTien: 29480000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách VIP mua máy Titan Sa Mạc chuyển khoản Techcombank',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd9._id, imei: '356789012346014', donGiaBan: 28990000 });
    await CT_HoaDon_PhuKien.create({ hoaDon: hd9._id, phuKien: pkCapC._id, soLuong: 1, donGiaBan: 490000 });
    await PhieuXuatKho.create({ hoaDon: hd9._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd9.soHD}`, ngayXuat: hd9.ngayLap });

    // HD10: Khách Trọng mua Xiaomi 14T Pro 512GB
    const hd10 = await HoaDon.create({
      soHD: 'HD20260904',
      khachHang: khTrong._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      tongTien: 16990000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách quét mã VietQR thanh toán nhanh',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd10._id, imei: '356789012345313', donGiaBan: 16990000 });
    await PhieuXuatKho.create({ hoaDon: hd10._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd10.soHD}`, ngayXuat: hd10.ngayLap });

    // HD11: Khách Chi mua iPad Pro M2 (Ghi công nợ)
    const hd11 = await HoaDon.create({
      soHD: 'HD20260905',
      khachHang: khChi._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 18 * 60 * 60 * 1000),
      tongTien: 20490000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách doanh nghiệp mua cho dự án thiết kế, trả trước 5tr, ghi nợ 15.49tr',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd11._id, imei: '356789012345403', donGiaBan: 20490000 });
    await PhieuXuatKho.create({ hoaDon: hd11._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd11.soHD}`, ngayXuat: hd11.ngayLap });

    // HD12: Khách Kiệt mua Samsung Galaxy S24 Ultra
    const hd12 = await HoaDon.create({
      soHD: 'HD20260906',
      khachHang: khKiet._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 4 * 60 * 60 * 1000),
      tongTien: 31990000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách thanh toán chuyển khoản nhận máy ngay',
      status: true
    });
    await CT_HoaDon_May.create({ hoaDon: hd12._id, imei: '356789012345206', donGiaBan: 31990000 });
    await PhieuXuatKho.create({ hoaDon: hd12._id, lyDoXuat: `Xuat ban hang theo hoa don ${hd12.soHD}`, ngayXuat: hd12.ngayLap });

    // -------------------------------------------------------------
    // 11. ĐƠN ĐẶT HÀNG TRƯỚC (PRE-ORDER) (Việt)
    // -------------------------------------------------------------
    console.log('[Seed] 11. Khởi tạo Đơn đặt trước (Pre-order) 4 trạng thái...');
    const ddh1 = await DonDatHangTruoc.create({
      maDonDat: 'DAT20260801',
      khachHang: khAn._id,
      sanPham: spIphone16PM._id,
      soTienCoc: 5000000,
      ngayDat: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      trangThai: 'Da dat coc',
      ghiChu: 'Khách đặt cọc iPhone 16 Pro Max Titan Sa Mạc (Sẵn sàng cấn trừ cọc F7 trên POS)'
    });

    const ddh2 = await DonDatHangTruoc.create({
      maDonDat: 'DAT20260802',
      khachHang: khMai._id,
      sanPham: spS24Ultra._id,
      imei: '356789012345201',
      soTienCoc: 1500000,
      ngayDat: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      trangThai: 'Da co hang',
      ghiChu: 'Hàng đã về kho Cầu Giấy, đã gán IMEI, gọi khách qua nhận'
    });

    const ddh3 = await DonDatHangTruoc.create({
      maDonDat: 'DAT20260803',
      khachHang: khTrang._id,
      sanPham: spMacBookAir._id,
      imei: '356789012345502',
      soTienCoc: 3000000,
      ngayDat: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      trangThai: 'Da nhan may',
      ghiChu: 'Đã hoàn tất giao máy theo Hóa đơn HD20260804'
    });

    const ddh4 = await DonDatHangTruoc.create({
      maDonDat: 'DAT20260804',
      khachHang: khYen._id,
      sanPham: spZFold5._id,
      soTienCoc: 1000000,
      ngayDat: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      trangThai: 'Da huy',
      ghiChu: 'Khách đổi ý muốn lấy iPhone nên yêu cầu hủy'
    });

    // -------------------------------------------------------------
    // 12. PHIẾU BẢO HÀNH & SỬA CHỮA (Tuấn & Kỹ thuật)
    // -------------------------------------------------------------
    console.log('[Seed] 12. Khởi tạo Phiếu Bảo Hành & Sửa chữa...');
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
      linhKien: lkPin14._id,
      soLuong: 1,
      donGia: 0
    });

    // -------------------------------------------------------------
    // 13. PHIẾU ĐỔI TRẢ MÁY (Việt)
    // -------------------------------------------------------------
    console.log('[Seed] 13. Khởi tạo Phiếu Đổi trả mẫu...');
    await PhieuDoiTra.create({
      maDT: 'DT20260801',
      hoaDon: hd1._id,
      khachHang: khAn._id,
      nhanVien: nvBanHang._id,
      imeiCu: '356789012345004',
      imeiMoi: '356789012345006',
      loaiDoiTra: 'Doi may',
      giaMayCu: 29990000,
      giaMayMoi: 29990000,
      tienChenhLech: 0,
      hinhThuc: 'Tien mat',
      lyDo: 'Khách muốn đổi sang máy nguyên seal khác cùng model',
      ngayDoiTra: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      trangThai: 'Hoan tat',
      ghiChu: 'Đổi máy ngang giá theo chính sách 30 ngày'
    });

    // -------------------------------------------------------------
    // 14. HỒ SƠ CÔNG NỢ ĐA HÌNH (An)
    // -------------------------------------------------------------
    console.log('[Seed] 14. Khởi tạo Hồ sơ Công nợ Khách Hàng & NCC...');
    const cnKH = await CongNo.create({
      loaiDoiTuong: 'KhachHang',
      khachHang: khLong._id,
      hoaDon: hd3._id,
      soTienNo: 31990000,
      soTienDaTra: 10000000,
      trangThai: 'Con no',
      hanThanhToan: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      ghiChu: 'Nợ mua máy Galaxy S24 Ultra theo Hóa đơn HD20260803'
    });

    const cnKH2 = await CongNo.create({
      loaiDoiTuong: 'KhachHang',
      khachHang: khChi._id,
      hoaDon: hd11._id,
      soTienNo: 20490000,
      soTienDaTra: 5000000,
      trangThai: 'Con no',
      hanThanhToan: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      ghiChu: 'Nợ tiền mua iPad Pro theo Hóa đơn HD20260905'
    });

    const cnNCC = await CongNo.create({
      loaiDoiTuong: 'NhaCungCap',
      nhaCungCap: nccSamsung._id,
      phieuNhap: pn2._id,
      soTienNo: 83400000,
      soTienDaTra: 40000000,
      trangThai: 'Con no',
      hanThanhToan: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      ghiChu: 'Nợ tiền hàng lô Samsung PN20260802 gối đầu'
    });

    await CongNo.create({
      loaiDoiTuong: 'NhaCungCap',
      nhaCungCap: nccApple._id,
      phieuNhap: pn1._id,
      soTienNo: 185000000,
      soTienDaTra: 185000000,
      trangThai: 'Da tra het',
      hanThanhToan: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      ghiChu: 'Đã tất toán toàn bộ tiền nhập lô Apple PN20260801'
    });

    // -------------------------------------------------------------
    // 15. HỢP ĐỒNG TRẢ GÓP & LỊCH THU KỲ (An)
    // -------------------------------------------------------------
    console.log('[Seed] 15. Khởi tạo Hợp đồng Trả góp...');
    await HopDongTraGop.create({
      hoaDon: hd2._id,
      soTienTraTruoc: 10000000,
      soTienTraGop: 15490000,
      soKy: 6,
      soTienMoiKy: 2581666,
      soKyDaThu: 1,
      trangThaiDuyet: 'Da duyet',
      ghiChu: 'Hợp đồng trả góp 6 tháng lãi suất 0% cho khách Trần Thị Mai'
    });

    // -------------------------------------------------------------
    // 16. CHỨNG TỪ THU - CHI SỔ QUỸ (Vượng)
    // -------------------------------------------------------------
    console.log('[Seed] 16. Khởi tạo Chứng từ Thu - Chi & Sổ quỹ...');
    // Thu bán hàng các hóa đơn
    await PhieuThu.create({
      hoaDon: hd1._id,
      soTien: hd1.tongTien,
      hinhThuc: 'Tien mat',
      ngayThu: hd1.ngayLap,
      ghiChu: `Thu tiền mặt bán lẻ theo hóa đơn ${hd1.soHD}`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd2._id,
      soTien: 10000000,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd2.ngayLap,
      ghiChu: `Thu tiền trả trước hợp đồng trả góp hóa đơn ${hd2.soHD}`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd2._id,
      soTien: 2581666,
      hinhThuc: 'Chuyen khoan',
      ngayThu: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      ghiChu: `Thu trả góp kỳ 1/6 hóa đơn ${hd2.soHD}`,
      status: true
    });

    await PhieuThu.create({
      donDatHang: ddh1._id,
      soTien: ddh1.soTienCoc,
      hinhThuc: 'Chuyen khoan',
      ngayThu: ddh1.ngayDat,
      ghiChu: `Thu tiền cọc đơn đặt hàng ${ddh1.maDonDat} (iPhone 16 Pro Max)`,
      status: true
    });

    await PhieuThu.create({
      donDatHang: ddh2._id,
      soTien: ddh2.soTienCoc,
      hinhThuc: 'Quet the',
      ngayThu: ddh2.ngayDat,
      ghiChu: `Thu cọc quẹt thẻ POS đơn ${ddh2.maDonDat} (Galaxy S24 Ultra)`,
      status: true
    });

    await PhieuThu.create({
      donDatHang: ddh3._id,
      soTien: ddh3.soTienCoc,
      hinhThuc: 'Chuyen khoan',
      ngayThu: ddh3.ngayDat,
      ghiChu: `Thu tiền cọc đơn ${ddh3.maDonDat} (MacBook Air)`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd4._id,
      soTien: 21890000,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd4.ngayLap,
      ghiChu: `Thu phần còn lại của hóa đơn ${hd4.soHD} sau cấn trừ cọc 3tr`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd5._id,
      soTien: hd5.tongTien,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd5.ngayLap,
      ghiChu: `Thu chuyển khoản VietQR bán hàng theo hóa đơn ${hd5.soHD}`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd6._id,
      soTien: hd6.tongTien,
      hinhThuc: 'Quet the',
      ngayThu: hd6.ngayLap,
      ghiChu: `Thu quẹt thẻ POS theo hóa đơn ${hd6.soHD}`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd7._id,
      soTien: hd7.tongTien,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd7.ngayLap,
      ghiChu: `Thu chuyển khoản Techcombank theo hóa đơn ${hd7.soHD} (iPhone 16 Pro Max)`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd8._id,
      soTien: hd8.tongTien,
      hinhThuc: 'Tien mat',
      ngayThu: hd8.ngayLap,
      ghiChu: `Thu tiền mặt tại quầy theo hóa đơn ${hd8.soHD} (Galaxy Z Flip 6)`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd9._id,
      soTien: hd9.tongTien,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd9.ngayLap,
      ghiChu: `Thu chuyển khoản theo hóa đơn ${hd9.soHD} (iPhone 16 Pro)`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd10._id,
      soTien: hd10.tongTien,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd10.ngayLap,
      ghiChu: `Thu chuyển khoản VietQR theo hóa đơn ${hd10.soHD} (Xiaomi 14T Pro)`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd11._id,
      soTien: 5000000,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd11.ngayLap,
      ghiChu: `Thu tiền trả trước mua iPad Pro theo hóa đơn ${hd11.soHD}`,
      status: true
    });

    await PhieuThu.create({
      hoaDon: hd12._id,
      soTien: hd12.tongTien,
      hinhThuc: 'Chuyen khoan',
      ngayThu: hd12.ngayLap,
      ghiChu: `Thu chuyển khoản theo hóa đơn ${hd12.soHD} (Galaxy S24 Ultra)`,
      status: true
    });

    // Các phiếu chi thực tế
    await PhieuChi.create({
      phieuNhap: pn1._id,
      soTien: 185000000,
      hinhThuc: 'Chuyen khoan',
      ngayChi: pn1.ngayNhap,
      lyDo: `Thanh toan tien hang nhap lo Apple theo phieu ${pn1.maPN}`,
      status: true
    });

    await PhieuChi.create({
      phieuNhap: pn2._id,
      soTien: 40000000,
      hinhThuc: 'Chuyen khoan',
      ngayChi: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000),
      lyDo: `Thanh toan dot 1 cong no NCC Samsung theo phieu ${pn2.maPN}`,
      status: true
    });

    await PhieuChi.create({
      phieuNhap: pn3._id,
      soTien: 45000000,
      hinhThuc: 'Chuyen khoan',
      ngayChi: pn3.ngayNhap,
      lyDo: `Thanh toan tien nhap phu kien linh kien FPT Synnex ${pn3.maPN}`,
      status: true
    });

    await PhieuChi.create({
      phieuNhap: pn4._id,
      soTien: 41780000,
      hinhThuc: 'Chuyen khoan',
      ngayChi: pn4.ngayNhap,
      lyDo: `Thanh toan tien hang Apple Watch & AirPods Digiworld ${pn4.maPN}`,
      status: true
    });

    await PhieuChi.create({
      donDatHang: ddh4._id,
      soTien: ddh4.soTienCoc,
      hinhThuc: 'Chuyen khoan',
      ngayChi: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      lyDo: `Hoan tien coc don dat hang huy ${ddh4.maDonDat} cho khach Do Hoang Yen`,
      status: true
    });

    await PhieuChi.create({
      soTien: 15000000,
      hinhThuc: 'Chuyen khoan',
      ngayChi: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      lyDo: 'Thanh toan tien dien, nuoc va internet van phong showroom thang 08/2026',
      status: true
    });

    console.log('====================================================');
    console.log('🎉 RESET VÀ SEED CSDL MỚI ĐA DẠNG 100% THÀNH CÔNG!');
    console.log('====================================================');
    console.log('📊 Thống kê các thực thể dữ liệu sạch & liên kết chặt chẽ:');
    console.log(' - 6 Tài khoản nhân viên (đầy đủ CCCD 12 số, email @onetech.vn, 6 vai trò RBAC)');
    console.log(' - 8 Danh mục sản phẩm');
    console.log(' - 5 Nhà cung cấp đối tác uy tín');
    console.log(' - 15 Khách hàng thực tế (đầy đủ CCCD, email, số điện thoại, hạng thành viên)');
    console.log(' - 3 Kho hàng (Cầu Giấy, Thái Hà, Quận 1)');
    console.log(' - 22 Model máy & thiết bị (iPhone 16 Series, Galaxy S24, Z Flip 6, Xiaomi 14T, iPad, Mac, Watch)');
    console.log(' - 13 Phụ kiện & 6 Linh kiện sửa chữa chính hãng');
    console.log(' - 76 Máy IMEI (15 số vật lý sạch, liên kết đầy đủ trạng thái)');
    console.log(' - 28 Bản ghi Tồn kho (TonKho) khớp 100% số máy Còn hàng');
    console.log(' - 5 Phiếu nhập kho (Apple, Samsung, FPT, Digiworld)');
    console.log(' - 12 Hóa đơn bán hàng POS kèm Chi tiết máy, Phụ kiện & Phiếu xuất kho');
    console.log(' - 4 Đơn đặt trước Pre-order (Đã cọc, Đã có hàng, Đã nhận máy, Đã hủy)');
    console.log(' - 2 Phiếu bảo hành (Đang xử lý & Đã sửa xong)');
    console.log(' - 1 Phiếu đổi trả máy trong 30 ngày');
    console.log(' - 4 Hồ sơ công nợ đa hình (Khách hàng & Nhà cung cấp)');
    console.log(' - 1 Hợp đồng trả góp 6 tháng lãi suất 0%');
    console.log(' - 15 Phiếu thu & 6 Phiếu chi đồng bộ Sổ quỹ & Biểu đồ doanh thu');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedData();
