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
  CT_PBH_LinhKien
} = require('../models');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Đã kết nối tới MongoDB: ${mongoUri}`);

    // Xóa dữ liệu cũ để tránh trùng lặp
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
      CT_PBH_LinhKien.deleteMany({})
    ]);

    // 1. Tạo Tài khoản Nhân viên (Đủ 6 vai trò)
    console.log('[Seed] Đang tạo danh sách Nhân viên...');
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

    // 2. Tạo Danh mục
    console.log('[Seed] Đang tạo Danh mục...');
    const [dmDienThoai, dmMayTinhBang, dmPhuKien, dmLinhKien] = await DanhMuc.insertMany([
      { tenDanhMuc: 'Điện thoại thông minh' },
      { tenDanhMuc: 'Máy tính bảng (iPad/Tablet)' },
      { tenDanhMuc: 'Phụ kiện chính hãng' },
      { tenDanhMuc: 'Linh kiện sửa chữa' }
    ]);

    // 3. Tạo Nhà cung cấp & Khách hàng
    console.log('[Seed] Đang tạo Nhà cung cấp & Khách hàng...');
    const [nccApple, nccSamsung, nccFPT] = await NhaCungCap.insertMany([
      { tenNCC: 'Apple Việt Nam Distribution', sdt: '02838221122', diaChi: 'Tầng 12, Bitexco, Q.1, TP.HCM' },
      { tenNCC: 'Samsung Vina Electronics', sdt: '02838223344', diaChi: 'Quận 7, TP.HCM' },
      { tenNCC: 'FPT Synnex Distribution', sdt: '02473006666', diaChi: 'Cầu Giấy, Hà Nội' }
    ]);

    const [khAn, khMai, khLong] = await KhachHang.insertMany([
      { hoTen: 'Nguyễn Văn An', sdt: '0988123456', diaChi: '45 Xuân Thủy, Cầu Giấy, Hà Nội' },
      { hoTen: 'Trần Thị Mai', sdt: '0977234567', diaChi: '12 Nguyễn Trãi, Thanh Xuân, Hà Nội' },
      { hoTen: 'Lê Hoàng Long', sdt: '0912345678', diaChi: '78 Hai Bà Trưng, Q.1, TP.HCM' }
    ]);

    // 4. Tạo Sản phẩm (kèm soThangBH)
    console.log('[Seed] Đang tạo Model Sản phẩm...');
    const [spIphone15, spIphone14, spS24Ultra, spXiaomi14] = await SanPham.insertMany([
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 15 Pro Max 256GB',
        hang: 'Apple',
        giaBan: 29990000,
        soThangBH: 12,
        moTa: 'Chip A17 Pro, Khung viền Titan, Camera tiềm vọng 5x'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'iPhone 14 128GB',
        hang: 'Apple',
        giaBan: 16990000,
        soThangBH: 12,
        moTa: 'Màn hình Super Retina XDR, Camera kép nâng cấp'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Samsung Galaxy S24 Ultra 512GB',
        hang: 'Samsung',
        giaBan: 31990000,
        soThangBH: 12,
        moTa: 'Galaxy AI, Bút S-Pen tích hợp, Khung viền Titan'
      },
      {
        danhMuc: dmDienThoai._id,
        tenMay: 'Xiaomi 14 Ultra 512GB',
        hang: 'Xiaomi',
        giaBan: 28990000,
        soThangBH: 18,
        moTa: 'Hợp tác Leica, 4 camera 50MP, Chip Snapdragon 8 Gen 3'
      }
    ]);

    // 5. Tạo Máy IMEI (Quản lý theo từng máy vật lý)
    console.log('[Seed] Đang tạo danh sách Máy IMEI...');
    await MayImei.insertMany([
      // iPhone 15 Pro Max
      { imei: '356789012345001', sanPham: spIphone15._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB' },
      { imei: '356789012345002', sanPham: spIphone15._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Xanh', dungLuong: '256GB' },
      { imei: '356789012345003', sanPham: spIphone15._id, giaNhap: 26500000, trangThai: 'Con hang', mauSac: 'Titan Đen', dungLuong: '256GB' },
      { imei: '356789012345004', sanPham: spIphone15._id, giaNhap: 26500000, trangThai: 'Da ban', mauSac: 'Titan Tự Nhiên', dungLuong: '256GB' },
      { imei: '356789012345005', sanPham: spIphone15._id, giaNhap: 26500000, trangThai: 'Bao hanh', mauSac: 'Titan Trắng', dungLuong: '256GB' },

      // iPhone 14
      { imei: '356789012345101', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Con hang', mauSac: 'Midnight', dungLuong: '128GB' },
      { imei: '356789012345102', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Con hang', mauSac: 'Starlight', dungLuong: '128GB' },
      { imei: '356789012345103', sanPham: spIphone14._id, giaNhap: 14500000, trangThai: 'Da ban', mauSac: 'Blue', dungLuong: '128GB' },

      // Samsung S24 Ultra
      { imei: '356789012345201', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Con hang', mauSac: 'Xám Titan', dungLuong: '512GB' },
      { imei: '356789012345202', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Con hang', mauSac: 'Đen Titan', dungLuong: '512GB' },
      { imei: '356789012345203', sanPham: spS24Ultra._id, giaNhap: 27800000, trangThai: 'Loi', mauSac: 'Tím Titan', dungLuong: '512GB' },

      // Xiaomi 14 Ultra
      { imei: '356789012345301', sanPham: spXiaomi14._id, giaNhap: 24500000, trangThai: 'Con hang', mauSac: 'Đen Da Thuộc', dungLuong: '512GB' },
      { imei: '356789012345302', sanPham: spXiaomi14._id, giaNhap: 24500000, trangThai: 'Con hang', mauSac: 'Trắng Da Thuộc', dungLuong: '512GB' }
    ]);

    // 6. Tạo Phụ kiện & Linh kiện
    console.log('[Seed] Đang tạo Phụ kiện & Linh kiện...');
    const [pkSac20w, pkCapC, pkOpLung, pkSac45w] = await PhuKien.insertMany([
      { danhMuc: dmPhuKien._id, tenPK: 'Củ sạc Apple 20W Type-C Chính hãng', giaBan: 520000, soLuongTon: 45 },
      { danhMuc: dmPhuKien._id, tenPK: 'Cáp sạc C to C Apple Braided 1m', giaBan: 490000, soLuongTon: 30 },
      { danhMuc: dmPhuKien._id, tenPK: 'Ốp lưng MagSafe iPhone 15 Pro Max', giaBan: 890000, soLuongTon: 25 },
      { danhMuc: dmPhuKien._id, tenPK: 'Củ sạc Samsung 45W Type-C Super Fast', giaBan: 650000, soLuongTon: 20 }
    ]);

    const [lkManHinh, lkPin, lkCam] = await LinhKien.insertMany([
      { tenLK: 'Màn hình OLED iPhone 15 Pro Max', donGia: 7500000, soLuongTon: 5 },
      { tenLK: 'Pin Li-ion iPhone 15 Pro Max', donGia: 1800000, soLuongTon: 12 },
      { tenLK: 'Cụm Camera sau Galaxy S24 Ultra', donGia: 3200000, soLuongTon: 4 }
    ]);

    // 7. Tạo Kho & Tồn kho
    console.log('[Seed] Đang tạo Kho...');
    const [khoChinh] = await Kho.insertMany([
      { tenKho: 'Kho Tổng Cầu Giấy', diaChi: 'Hà Nội' },
      { tenKho: 'Kho Chi nhánh Q.1', diaChi: 'TP. Hồ Chí Minh' }
    ]);

    await TonKho.insertMany([
      { kho: khoChinh._id, sanPham: spIphone15._id, soLuong: 5 },
      { kho: khoChinh._id, sanPham: spIphone14._id, soLuong: 3 },
      { kho: khoChinh._id, sanPham: spS24Ultra._id, soLuong: 3 },
      { kho: khoChinh._id, sanPham: spXiaomi14._id, soLuong: 2 }
    ]);

    // 8. Tạo Hóa đơn mẫu & Lịch sử bán hàng (cho các máy đã bán: 356789012345004, 356789012345005, 356789012345103)
    console.log('[Seed] Đang tạo Hóa đơn mẫu & Phiếu xuất kho...');
    const hd1 = await HoaDon.create({
      soHD: 'HD20260801',
      khachHang: khAn._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Bán 30 ngày trước
      tongTien: 30510000, // 29990000 + 520000
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách hàng mua trả tiền mặt'
    });

    await CT_HoaDon_May.create({
      hoaDon: hd1._id,
      imei: '356789012345004',
      donGiaBan: 29990000
    });

    await CT_HoaDon_PhuKien.create({
      hoaDon: hd1._id,
      phuKien: pkSac20w._id,
      soLuong: 1,
      donGiaBan: 520000
    });

    await PhieuXuatKho.create({
      hoaDon: hd1._id,
      lyDoXuat: `Xuat ban hang theo hoa don ${hd1.soHD}`,
      ngayXuat: hd1.ngayLap
    });

    const hd2 = await HoaDon.create({
      soHD: 'HD20260802',
      khachHang: khMai._id,
      nhanVien: nvBanHang._id,
      ngayLap: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Bán 15 ngày trước
      tongTien: 29990000,
      trangThai: 'Da thanh toan',
      ghiChu: 'Khách mua chuyển khoản'
    });

    await CT_HoaDon_May.create({
      hoaDon: hd2._id,
      imei: '356789012345005',
      donGiaBan: 29990000
    });

    await PhieuXuatKho.create({
      hoaDon: hd2._id,
      lyDoXuat: `Xuat ban hang theo hoa don ${hd2.soHD}`,
      ngayXuat: hd2.ngayLap
    });

    // 9. Tạo Phiếu Bảo Hành mẫu cho máy 356789012345005 (trạng thái 'Dang xu ly')
    console.log('[Seed] Đang tạo Phiếu Bảo Hành mẫu...');
    const pbh1 = await PhieuBaoHanh.create({
      maPBH: 'PBH20260801',
      imei: '356789012345005',
      khachHang: khMai._id,
      nhanVien: nvKyThuat._id,
      moTaLoi: 'Màn hình bị sọc xanh dọc, cảm ứng chập chờn',
      ngayTiepNhan: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      trangThai: 'Dang xu ly',
      ghiChu: 'Khách yêu cầu kiểm tra thay màn hình chính hãng'
    });

    await CT_PBH_LinhKien.create({
      phieuBaoHanh: pbh1._id,
      linhKien: lkManHinh._id,
      soLuong: 1,
      donGia: 0 // Bảo hành miễn phí theo chính sách
    });

    console.log('====================================================');
    console.log('✅ SEED DỮ LIỆU MẪU THÀNH CÔNG!');
    console.log('----------------------------------------------------');
    console.log('Danh sách tài khoản demo:');
    console.log(' 1. Quản lý:    admin    / admin123');
    console.log(' 2. Bán hàng:   banhang  / 123456');
    console.log(' 3. Thủ kho:    thukho   / 123456');
    console.log(' 4. Thu ngân:   thungan  / 123456');
    console.log(' 5. Kế toán:    ketoan   / 123456');
    console.log(' 6. Kỹ thuật:   kythuat  / 123456');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedData();
