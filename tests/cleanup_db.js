require('dotenv').config();
const mongoose = require('mongoose');
const {
  PhuKien, LinhKien, SanPham, MayImei, HoaDon,
  CT_HoaDon_May, CT_HoaDon_PhuKien, KhachHang,
  DonDatHangTruoc, PhieuDoiTra, PhieuThu, PhieuChi,
  PhieuBaoHanh, CT_PBH_LinhKien, CongNo, HopDongTraGop,
  PhieuNhap, CT_PhieuNhap, DanhMuc, PhieuXuatKho
} = require('../src/models');

// DANH SÁCH SEED GỐC - Chỉ giữ lại các bản ghi này
const SEED_IMEIS = [
  '356789012345001','356789012345002','356789012345003','356789012345004','356789012345005','356789012345006',
  '356789012345011','356789012345012','356789012345013','356789012345014',
  '356789012345021','356789012345022',
  '356789012345101','356789012345102','356789012345103',
  '356789012345201','356789012345202','356789012345203','356789012345204',
  '356789012345211','356789012345212',
  '356789012345301','356789012345302',
  '356789012345401','356789012345402',
  '356789012345411','356789012345412',
  '356789012345501','356789012345502'
];

const SEED_SOHO_DS = ['HD20260801','HD20260802','HD20260803','HD20260804'];
const SEED_DANH_MUC = [
  'Điện thoại thông minh (Smartphones)',
  'Máy tính bảng (iPad & Tablets)',
  'Laptop & MacBook cao cấp',
  'Phụ kiện chính hãng Apple & Samsung',
  'Linh kiện sửa chữa & Thay thế'
];
const SEED_SAN_PHAM = [
  'iPhone 15 Pro Max 256GB','iPhone 15 Pro 128GB','iPhone 15 Plus 128GB','iPhone 14 128GB',
  'Samsung Galaxy S24 Ultra 512GB','Samsung Galaxy Z Fold 5 256GB','Xiaomi 14 Ultra 512GB',
  'iPad Pro M2 11 inch Wi-Fi 128GB','iPad Air 5 M1 10.9 inch 64GB','MacBook Air M2 13 inch 8GB/256GB'
];
const SEED_PHU_KIEN = [
  'Củ sạc Apple 20W Type-C Chính hãng','Cáp sạc C to C Apple Braided 1m',
  'Ốp lưng MagSafe iPhone 15 Pro Max Clear Case','Củ sạc Samsung 45W Type-C Super Fast',
  'Tai nghe Apple AirPods Pro 2 USB-C','Kính cường lực KingKong 9D chống nhìn trộm'
];
const SEED_LINH_KIEN = [
  'Màn hình OLED iPhone 15 Pro Max GX','Pin Li-ion iPhone 15 Pro Max Pisen',
  'Cụm Camera sau Galaxy S24 Ultra Zin bóc máy','Cụm bo cáp sạc Type-C Galaxy S24 Ultra'
];
const SEED_MA_PN = ['PN20260801','PN20260802'];
const SEED_MA_DDH = ['DAT20260801','DAT20260802','DAT20260803','DAT20260804'];

async function clean() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
  await mongoose.connect(mongoUri);
  console.log('--- Dọn dẹp dữ liệu test rác: So sánh với danh sách seed gốc ---');

  // 1. Tìm IMEI test và Hóa đơn test
  const extraIMEIs = await MayImei.find({ imei: { $nin: SEED_IMEIS } }).select('_id imei');
  const extraHDs = await HoaDon.find({ soHD: { $nin: SEED_SOHO_DS } }).select('_id soHD');
  const extraHDIds = extraHDs.map(h => h._id);

  // 2. Xóa chi tiết hóa đơn test
  const delCTMay = await CT_HoaDon_May.deleteMany({
    $or: [
      { hoaDon: { $in: extraHDIds } },
      { imei: { $nin: SEED_IMEIS } }
    ]
  });
  const delCTPK = await CT_HoaDon_PhuKien.deleteMany({ hoaDon: { $in: extraHDIds } });
  const delXuatKho = await PhieuXuatKho.deleteMany({ hoaDon: { $in: extraHDIds } });

  // 3. Xóa hóa đơn test
  const delHD = await HoaDon.deleteMany({ soHD: { $nin: SEED_SOHO_DS } });

  // 4. Xóa CT_HoaDon_May mồ côi
  const allHDs = await HoaDon.find().select('_id');
  const validHDIds = allHDs.map(h => h._id);
  await CT_HoaDon_May.deleteMany({ hoaDon: { $nin: validHDIds } });
  await CT_HoaDon_PhuKien.deleteMany({ hoaDon: { $nin: validHDIds } });

  // 5. Xóa IMEI test
  const delIMEI = await MayImei.deleteMany({ imei: { $nin: SEED_IMEIS } });

  // 6. Xóa Danh mục, Sản phẩm test
  await DanhMuc.deleteMany({ tenDanhMuc: { $nin: SEED_DANH_MUC } });
  await SanPham.deleteMany({ tenMay: { $nin: SEED_SAN_PHAM } });
  await PhuKien.deleteMany({ tenPK: { $nin: SEED_PHU_KIEN } });
  await LinhKien.deleteMany({ tenLK: { $nin: SEED_LINH_KIEN } });

  // 7. Xóa Phiếu nhập test
  const extraPNs = await PhieuNhap.find({ maPN: { $nin: SEED_MA_PN } }).select('_id');
  const extraPNIds = extraPNs.map(p => p._id);
  await CT_PhieuNhap.deleteMany({ phieuNhap: { $in: extraPNIds } });
  await PhieuNhap.deleteMany({ maPN: { $nin: SEED_MA_PN } });

  // 8. Xóa Đơn đặt hàng test
  const extraDDHs = await DonDatHangTruoc.find({ maDonDat: { $nin: SEED_MA_DDH } }).select('_id');
  const extraDDHIds = extraDDHs.map(d => d._id);
  await DonDatHangTruoc.deleteMany({ maDonDat: { $nin: SEED_MA_DDH } });

  // 9. Xóa Phiếu Thu / Chi test (chỉ giữ lại 7 phiếu thu và 4 phiếu chi của seed)
  // Xóa phiếu thu liên kết với hóa đơn test hoặc đơn đặt hàng test
  await PhieuThu.deleteMany({
    $or: [
      { hoaDon: { $in: [] } }, // placeholder
      { donDatHang: { $in: extraDDHIds } }
    ]
  });
  // Xóa phiếu thu liên kết với hóa đơn không thuộc seed gốc
  const seedHDs = await HoaDon.find({ soHD: { $in: SEED_SOHO_DS } }).select('_id');
  const seedHDIds = seedHDs.map(h => h._id);
  const seedDDHs = await DonDatHangTruoc.find({ maDonDat: { $in: SEED_MA_DDH } }).select('_id');
  const seedDDHIds = seedDDHs.map(d => d._id);
  const seedCNs = await require('../src/models').CongNo.find().select('_id');
  const seedCNIds = seedCNs.map(c => c._id);

  await PhieuThu.deleteMany({
    hoaDon: { $exists: true, $nin: [...seedHDIds, null] }
  });
  await PhieuThu.deleteMany({
    donDatHang: { $exists: true, $nin: [...seedDDHIds, null] }
  });
  await PhieuThu.deleteMany({
    hoaDon: { $exists: false },
    donDatHang: { $exists: false },
    congNo: { $exists: false }
  });

  // Xóa Phiếu chi test tương tự
  await PhieuChi.deleteMany({
    phieuNhap: { $exists: true, $nin: [] }
  });
  const seedPNs = await PhieuNhap.find({ maPN: { $in: SEED_MA_PN } }).select('_id');
  const seedPNIds = seedPNs.map(p => p._id);
  await PhieuChi.deleteMany({
    phieuNhap: { $exists: true, $nin: seedPNIds }
  });

  // 10. Xóa Phiếu đổi trả & Bảo hành test (giữ nguyên DT20260801, PBH20260801, PBH20260802)
  await PhieuDoiTra.deleteMany({ maDT: { $nin: ['DT20260801'] } });
  await PhieuBaoHanh.deleteMany({ maPBH: { $nin: ['PBH20260801','PBH20260802'] } });

  // 11. Xóa Công nợ test (chỉ giữ 3 bản ghi seed)
  const cnCount = await require('../src/models').CongNo.countDocuments();
  if (cnCount > 3) {
    // Lấy 3 bản ghi cũ nhất (theo seed)
    const oldCNs = await require('../src/models').CongNo.find().sort({ createdAt: 1 }).limit(3).select('_id');
    const oldCNIds = oldCNs.map(c => c._id);
    await require('../src/models').CongNo.deleteMany({ _id: { $nin: oldCNIds } });
  }

  // 12. Xóa Hợp đồng trả góp test (giữ 1)
  const hdtgCount = await HopDongTraGop.countDocuments();
  if (hdtgCount > 1) {
    const oldHDTG = await HopDongTraGop.find().sort({ createdAt: 1 }).limit(1).select('_id');
    await HopDongTraGop.deleteMany({ _id: { $nin: oldHDTG.map(h => h._id) } });
  }

  // Thống kê kết quả
  const finalCounts = {
    MayImei: await MayImei.countDocuments(),
    HoaDon: await HoaDon.countDocuments(),
    DanhMuc: await DanhMuc.countDocuments(),
    SanPham: await SanPham.countDocuments(),
    PhieuThu: await PhieuThu.countDocuments(),
    PhieuChi: await PhieuChi.countDocuments(),
    CongNo: await require('../src/models').CongNo.countDocuments(),
    HopDongTraGop: await HopDongTraGop.countDocuments()
  };

  console.log('\n📊 Sau khi dọn dẹp:');
  console.table(finalCounts);
  console.log('✅ Hoàn tất dọn dẹp dữ liệu test rác!');
  process.exit(0);
}

clean();
