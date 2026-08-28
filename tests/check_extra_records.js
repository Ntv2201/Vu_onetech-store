require('dotenv').config();
const mongoose = require('mongoose');
const { MayImei, HoaDon, DanhMuc, SanPham, PhieuThu } = require('../src/models');

async function checkExtra() {
  await mongoose.connect('mongodb://127.0.0.1:27017/onetech_store');

  const seedIMEIs = [
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
  const extraIMEIs = await MayImei.find({ imei: { $nin: seedIMEIs } }).select('imei trangThai sanPham');
  console.log(`\n🔍 IMEI ngoài seed gốc: ${extraIMEIs.length} máy`);
  extraIMEIs.slice(0, 15).forEach(m => console.log(`  - ${m.imei} | ${m.trangThai}`));

  const seedSoHDs = ['HD20260801','HD20260802','HD20260803','HD20260804'];
  const extraHDs = await HoaDon.find({ soHD: { $nin: seedSoHDs } }).select('soHD tongTien ghiChu');
  console.log(`\n🔍 Hóa đơn ngoài seed gốc: ${extraHDs.length}`);
  extraHDs.slice(0, 10).forEach(h => console.log(`  - ${h.soHD} | ${(h.tongTien||0).toLocaleString('vi-VN')}đ | ${(h.ghiChu||'').substring(0,40)}`));

  const seedDMs = ['Điện thoại thông minh (Smartphones)','Máy tính bảng (iPad & Tablets)','Laptop & MacBook cao cấp','Phụ kiện chính hãng Apple & Samsung','Linh kiện sửa chữa & Thay thế'];
  const extraDMs = await DanhMuc.find({ tenDanhMuc: { $nin: seedDMs } }).select('tenDanhMuc');
  console.log(`\n🔍 Danh mục ngoài seed gốc: ${extraDMs.length}`);
  extraDMs.forEach(d => console.log(`  - "${d.tenDanhMuc}"`));

  const seedSPNames = ['iPhone 15 Pro Max 256GB','iPhone 15 Pro 128GB','iPhone 15 Plus 128GB','iPhone 14 128GB','Samsung Galaxy S24 Ultra 512GB','Samsung Galaxy Z Fold 5 256GB','Xiaomi 14 Ultra 512GB','iPad Pro M2 11 inch Wi-Fi 128GB','iPad Air 5 M1 10.9 inch 64GB','MacBook Air M2 13 inch 8GB/256GB'];
  const extraSPs = await SanPham.find({ tenMay: { $nin: seedSPNames } }).select('tenMay hang');
  console.log(`\n🔍 Sản phẩm ngoài seed gốc: ${extraSPs.length}`);
  extraSPs.forEach(s => console.log(`  - "${s.tenMay}" (${s.hang})`));

  const ptCount = await PhieuThu.countDocuments();
  console.log(`\n🔍 Tổng Phiếu thu: ${ptCount} (seed gốc: 7)`);

  process.exit(0);
}

checkExtra();
