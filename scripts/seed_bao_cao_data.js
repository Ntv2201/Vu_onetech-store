/**
 * SEED SCRIPT - Tao du lieu lich su de phan Bao Cao Thong Ke hien day du
 * Chay: node scripts/seed_bao_cao_data.js
 *
 * Tao:
 * 1. Them 20 san pham (iPhone, Samsung, Xiaomi, OPPO, Realme, Vivo cu & moi)
 * 2. Tao IMEI cu (ngay nhap tu thang 1/2026) -> canh bao ton lau ngay
 * 3. Tao hoa don theo tung thang tu Jan -> Sep/2026 -> bieu do doanh thu
 * 4. Tao PhieuNhap/PhieuThu/PhieuChi tuong ung -> bao cao tai chinh
 */
require('dotenv').config();
const mongoose = require('mongoose');

const {
  DanhMuc, SanPham, MayImei, KhachHang, NhanVien, NhaCungCap,
  HoaDon, CT_HoaDon_May, PhieuNhap, PhieuThu, PhieuChi, Kho, TonKho
} = require('../src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';

function randomDate(year, month) {
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month - 1, day, Math.floor(Math.random() * 10) + 8, 0, 0);
}

const DANH_MUC_DATA = ['iPhone', 'Samsung', 'Xiaomi / Redmi', 'OPPO / Realme', 'Vivo', 'May Cu / Refurbished'];

// NCC phan chia theo hang may
const NCC_SEED = [
  { tenNCC: 'Apple Distribution Vietnam', sdt: '0901234001', diaChi: 'Ha Noi', hang: 'Apple' },
  { tenNCC: 'Samsung Electronics VN', sdt: '0901234002', diaChi: 'TP.HCM', hang: 'Samsung' },
  { tenNCC: 'Xiaomi Vietnam', sdt: '0901234003', diaChi: 'Ha Noi', hang: 'Xiaomi' },
  { tenNCC: 'OPPO Viet Nam', sdt: '0901234004', diaChi: 'TP.HCM', hang: 'OPPO' },
  { tenNCC: 'Vivo Vietnam', sdt: '0901234005', diaChi: 'Da Nang', hang: 'Vivo' },
  { tenNCC: 'Realme Vietnam', sdt: '0901234006', diaChi: 'TP.HCM', hang: 'Realme' },
  { tenNCC: 'May Cu Refurbished VN', sdt: '0901234007', diaChi: 'TP.HCM', hang: 'Refurbished' },
];

const SANPHAM_SEED = [
  { tenMay: 'iPhone 14 Pro Max', hang: 'Apple', giaBan: 27990000, giaGoc: 23000000, dungLuong: '256GB', soThangBH: 12, dm: 'iPhone' },
  { tenMay: 'iPhone 14', hang: 'Apple', giaBan: 18990000, giaGoc: 15000000, dungLuong: '128GB', soThangBH: 12, dm: 'iPhone' },
  { tenMay: 'iPhone 13 Pro', hang: 'Apple', giaBan: 22990000, giaGoc: 18000000, dungLuong: '256GB', soThangBH: 12, dm: 'iPhone' },
  { tenMay: 'iPhone 13', hang: 'Apple', giaBan: 16490000, giaGoc: 12500000, dungLuong: '128GB', soThangBH: 12, dm: 'iPhone' },
  { tenMay: 'iPhone 12', hang: 'Apple', giaBan: 12990000, giaGoc: 9800000, dungLuong: '64GB', soThangBH: 12, dm: 'iPhone' },
  { tenMay: 'Samsung Galaxy S24 Ultra', hang: 'Samsung', giaBan: 29990000, giaGoc: 24000000, dungLuong: '256GB', soThangBH: 12, dm: 'Samsung' },
  { tenMay: 'Samsung Galaxy S24+', hang: 'Samsung', giaBan: 24990000, giaGoc: 19500000, dungLuong: '256GB', soThangBH: 12, dm: 'Samsung' },
  { tenMay: 'Samsung Galaxy S23 FE', hang: 'Samsung', giaBan: 10990000, giaGoc: 8500000, dungLuong: '128GB', soThangBH: 12, dm: 'Samsung' },
  { tenMay: 'Samsung Galaxy A55', hang: 'Samsung', giaBan: 9490000, giaGoc: 7200000, dungLuong: '128GB', soThangBH: 12, dm: 'Samsung' },
  { tenMay: 'Samsung Galaxy A35', hang: 'Samsung', giaBan: 7490000, giaGoc: 5800000, dungLuong: '128GB', soThangBH: 12, dm: 'Samsung' },
  { tenMay: 'Xiaomi 14 Ultra', hang: 'Xiaomi', giaBan: 22990000, giaGoc: 17500000, dungLuong: '512GB', soThangBH: 12, dm: 'Xiaomi / Redmi' },
  { tenMay: 'Redmi Note 13 Pro+', hang: 'Xiaomi', giaBan: 8490000, giaGoc: 6200000, dungLuong: '256GB', soThangBH: 12, dm: 'Xiaomi / Redmi' },
  { tenMay: 'Redmi Note 12', hang: 'Xiaomi', giaBan: 5490000, giaGoc: 3900000, dungLuong: '128GB', soThangBH: 12, dm: 'Xiaomi / Redmi' },
  { tenMay: 'OPPO Reno 12 Pro', hang: 'OPPO', giaBan: 11990000, giaGoc: 9000000, dungLuong: '256GB', soThangBH: 12, dm: 'OPPO / Realme' },
  { tenMay: 'Realme GT 6', hang: 'Realme', giaBan: 9990000, giaGoc: 7500000, dungLuong: '256GB', soThangBH: 12, dm: 'OPPO / Realme' },
  { tenMay: 'Vivo V30 Pro', hang: 'Vivo', giaBan: 10490000, giaGoc: 7900000, dungLuong: '256GB', soThangBH: 12, dm: 'Vivo' },
  { tenMay: 'iPhone 11 Refurbished', hang: 'Apple', giaBan: 7990000, giaGoc: 5800000, dungLuong: '64GB', soThangBH: 3, dm: 'May Cu / Refurbished' },
  { tenMay: 'Samsung S21 Refurbished', hang: 'Samsung', giaBan: 8490000, giaGoc: 6200000, dungLuong: '128GB', soThangBH: 3, dm: 'May Cu / Refurbished' },
  { tenMay: 'Xiaomi Mi 11 Refurbished', hang: 'Xiaomi', giaBan: 5990000, giaGoc: 4100000, dungLuong: '128GB', soThangBH: 3, dm: 'May Cu / Refurbished' },
  { tenMay: 'OPPO Find X3 Refurbished', hang: 'OPPO', giaBan: 6490000, giaGoc: 4600000, dungLuong: '256GB', soThangBH: 3, dm: 'May Cu / Refurbished' },
];

// Lich su ban theo tung thang (index vao SANPHAM_SEED, so luong)
const LICH_SU_BAN = [
  { month: 1, items: [{ sp: 0, sl: 3 }, { sp: 5, sl: 2 }, { sp: 10, sl: 4 }, { sp: 13, sl: 2 }] },
  { month: 2, items: [{ sp: 0, sl: 4 }, { sp: 3, sl: 3 }, { sp: 6, sl: 3 }, { sp: 11, sl: 5 }] },
  { month: 3, items: [{ sp: 1, sl: 5 }, { sp: 5, sl: 4 }, { sp: 9, sl: 6 }, { sp: 12, sl: 4 }] },
  { month: 4, items: [{ sp: 0, sl: 6 }, { sp: 6, sl: 4 }, { sp: 14, sl: 3 }, { sp: 15, sl: 3 }] },
  { month: 5, items: [{ sp: 0, sl: 8 }, { sp: 5, sl: 5 }, { sp: 10, sl: 6 }, { sp: 11, sl: 4 }] },
  { month: 6, items: [{ sp: 2, sl: 4 }, { sp: 6, sl: 5 }, { sp: 9, sl: 7 }, { sp: 13, sl: 5 }] },
  { month: 7, items: [{ sp: 0, sl: 5 }, { sp: 5, sl: 6 }, { sp: 11, sl: 8 }, { sp: 15, sl: 4 }] },
  { month: 8, items: [{ sp: 1, sl: 6 }, { sp: 6, sl: 4 }, { sp: 10, sl: 5 }, { sp: 12, sl: 6 }] },
  { month: 9, items: [{ sp: 0, sl: 4 }, { sp: 5, sl: 3 }, { sp: 7, sl: 4 }, { sp: 14, sl: 3 }] },
];

const CHI_PHI_MONTHLY = [
  { thang: 1, soTien: 15000000, lyDo: 'Thue mat bang thang 1' },
  { thang: 2, soTien: 15000000, lyDo: 'Thue mat bang thang 2' },
  { thang: 3, soTien: 15000000, lyDo: 'Thue mat bang thang 3' },
  { thang: 4, soTien: 15000000, lyDo: 'Thue mat bang thang 4' },
  { thang: 5, soTien: 15000000, lyDo: 'Thue mat bang thang 5' },
  { thang: 6, soTien: 15000000, lyDo: 'Thue mat bang thang 6' },
  { thang: 7, soTien: 15000000, lyDo: 'Thue mat bang thang 7' },
  { thang: 8, soTien: 15000000, lyDo: 'Thue mat bang thang 8' },
  { thang: 9, soTien: 15000000, lyDo: 'Thue mat bang thang 9' },
  { thang: 1, soTien: 25000000, lyDo: 'Luong nhan vien thang 1' },
  { thang: 2, soTien: 25000000, lyDo: 'Luong nhan vien thang 2' },
  { thang: 3, soTien: 25000000, lyDo: 'Luong nhan vien thang 3' },
  { thang: 4, soTien: 25000000, lyDo: 'Luong nhan vien thang 4' },
  { thang: 5, soTien: 25000000, lyDo: 'Luong nhan vien thang 5' },
  { thang: 6, soTien: 25000000, lyDo: 'Luong nhan vien thang 6' },
  { thang: 7, soTien: 28000000, lyDo: 'Luong nhan vien thang 7' },
  { thang: 8, soTien: 28000000, lyDo: 'Luong nhan vien thang 8' },
  { thang: 9, soTien: 28000000, lyDo: 'Luong nhan vien thang 9' },
  { thang: 3, soTien: 8000000, lyDo: 'Marketing + quang cao Q1' },
  { thang: 6, soTien: 10000000, lyDo: 'Marketing + quang cao Q2' },
  { thang: 9, soTien: 12000000, lyDo: 'Marketing + quang cao Q3' },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const nv = await NhanVien.findOne({ tenDangNhap: 'banhang' });
  if (!nv) { console.error('ERROR: Khong tim thay NV banhang'); process.exit(1); }
  const kh = await KhachHang.findOne();
  if (!kh) { console.error('ERROR: Khong tim thay khach hang'); process.exit(1); }
  const kho = await Kho.findOne();
  if (!kho) { console.error('ERROR: Khong tim thay Kho'); process.exit(1); }

  // Tao NCC theo tung hang (neu chua co)
  console.log('\n[0] Tao nha cung cap theo hang...');
  const nccMap = {}; // hang -> NCC doc
  const nccDefault = await NhaCungCap.findOne(); // fallback
  for (const nccData of NCC_SEED) {
    let nccDoc = await NhaCungCap.findOne({ tenNCC: nccData.tenNCC });
    if (!nccDoc) {
      nccDoc = await NhaCungCap.create({ tenNCC: nccData.tenNCC, sdt: nccData.sdt, diaChi: nccData.diaChi, status: true });
      console.log('  + ' + nccData.tenNCC);
    } else {
      console.log('  = ' + nccData.tenNCC + ' (da co)');
    }
    nccMap[nccData.hang] = nccDoc;
  }

  // 1. Danh muc
  console.log('\n[1] Tao danh muc...');
  const dmMap = {};
  for (const tenDM of DANH_MUC_DATA) {
    let dm = await DanhMuc.findOne({ tenDanhMuc: tenDM });
    if (!dm) {
      dm = await DanhMuc.create({ tenDanhMuc: tenDM });
      console.log('  + ' + tenDM);
    }
    dmMap[tenDM] = dm._id;
  }

  // 2. San pham
  console.log('\n[2] Tao san pham...');
  const spList = [];
  for (const spData of SANPHAM_SEED) {
    let sp = await SanPham.findOne({ tenMay: spData.tenMay });
    if (!sp) {
      const dmId = dmMap[spData.dm] || Object.values(dmMap)[0];
      sp = await SanPham.create({
        danhMuc: dmId,
        tenMay: spData.tenMay,
        hang: spData.hang,
        giaBan: spData.giaBan,
        giaGoc: spData.giaGoc,
        dungLuong: spData.dungLuong,
        soThangBH: spData.soThangBH,
        status: true
      });
      console.log('  + ' + spData.tenMay);
    } else {
      console.log('  = ' + spData.tenMay + ' (da co)');
    }
    spList.push({ ...spData, _id: sp._id });
  }

  // 3. IMEI ton lau ngay
  console.log('\n[3] Tao IMEI ton lau ngay...');
  const TON_LAU = [
    { spIdx: 16, color: 'Den', slng: '64GB', ngayNhap: new Date('2026-01-05'), count: 3 },
    { spIdx: 17, color: 'Xanh', slng: '128GB', ngayNhap: new Date('2026-01-20'), count: 2 },
    { spIdx: 18, color: 'Trang', slng: '128GB', ngayNhap: new Date('2026-02-10'), count: 2 },
    { spIdx: 19, color: 'Den', slng: '256GB', ngayNhap: new Date('2026-02-28'), count: 2 },
    { spIdx: 12, color: 'Xanh Midnight', slng: '128GB', ngayNhap: new Date('2026-03-15'), count: 3 },
    { spIdx: 4, color: 'Tim', slng: '64GB', ngayNhap: new Date('2026-03-01'), count: 2 },
  ];
  let tonLauCount = 0;
  for (const cfg of TON_LAU) {
    const sp = spList[cfg.spIdx];
    for (let i = 0; i < cfg.count; i++) {
      await new Promise(r => setTimeout(r, 8));
      const imei = 'TON' + Date.now().toString().slice(-9) + i;
      const exists = await MayImei.findOne({ imei });
      if (!exists) {
        await MayImei.create({ imei, sanPham: sp._id, giaNhap: sp.giaGoc, mauSac: cfg.color, dungLuong: cfg.slng, ngayNhap: cfg.ngayNhap, trangThai: 'Con hang' });
        await TonKho.findOneAndUpdate({ kho: kho._id, sanPham: sp._id }, { $inc: { soLuong: 1 } }, { upsert: true });
        tonLauCount++;
      }
    }
    console.log('  + ' + sp.tenMay + ' x' + cfg.count + ' (nhap ' + cfg.ngayNhap.toLocaleDateString('vi-VN') + ')');
  }
  console.log('  => Tong: ' + tonLauCount + ' IMEI ton lau');

  // 4. Lich su ban hang
  console.log('\n[4] Tao lich su ban hang T1-T9/2026...');
  const YEAR = 2026;
  let totalHD = 0;
  let totalDT = 0;

  for (const thangData of LICH_SU_BAN) {
    const { month, items } = thangData;
    let thangDT = 0;
    for (const { sp: spIdx, sl } of items) {
      const sp = spList[spIdx];
      for (let i = 0; i < sl; i++) {
        await new Promise(r => setTimeout(r, 5));
        const ngayBan = randomDate(YEAR, month);
        const ngayNhapImei = new Date(ngayBan.getTime() - (Math.floor(Math.random() * 14) + 1) * 86400000);
        const suffix = Date.now().toString().slice(-7) + i;
        const imei = 'H' + YEAR + String(month).padStart(2,'0') + suffix;

        // IMEI
        const imeiExists = await MayImei.findOne({ imei });
        if (imeiExists) continue;
        await MayImei.create({ imei, sanPham: sp._id, giaNhap: sp.giaGoc, mauSac: ['Den','Trang','Xanh','Tim','Vang'][i%5], dungLuong: sp.dungLuong, ngayNhap: ngayNhapImei, trangThai: 'Da ban' });

        // PhieuNhap + PhieuChi - dung NCC theo hang may
        const hangSp = sp.hang || '';
        const nccForHang = nccMap[hangSp] ||
          (hangSp === 'Xiaomi' ? nccMap['Xiaomi'] : null) ||
          (hangSp === 'OPPO' ? nccMap['OPPO'] : null) ||
          (hangSp === 'Realme' ? nccMap['Realme'] : null) ||
          nccMap['Refurbished'] || nccDefault;
        const pn = await PhieuNhap.create({ nhaCungCap: nccForHang._id, nhanVien: nv._id, ngayNhap: ngayNhapImei, tongTien: sp.giaGoc, ghiChu: 'Nhap ' + sp.tenMay + ' tu ' + nccForHang.tenNCC });
        await PhieuChi.create({ phieuNhap: pn._id, soTien: sp.giaGoc, ngayChi: ngayNhapImei, nguoiNhan: nccForHang.tenNCC, hinhThuc: 'Chuyen khoan', lyDo: 'Thanh toan nhap ' + sp.tenMay });

        // HoaDon
        const soHD = 'HD' + YEAR + String(month).padStart(2,'0') + suffix;
        const existingHD = await HoaDon.findOne({ soHD });
        if (existingHD) continue;
        const hd = await HoaDon.create({ soHD, khachHang: kh._id, nhanVien: nv._id, ngayLap: ngayBan, tongTien: sp.giaBan, soTienThanhToan: sp.giaBan, soTienGiam: 0, trangThai: 'Da thanh toan', ghiChu: 'Lich su T' + month + '/' + YEAR });

        await CT_HoaDon_May.create({ hoaDon: hd._id, imei, donGiaBan: sp.giaBan });

        // PhieuThu
        await PhieuThu.create({ hoaDon: hd._id, soTien: sp.giaBan, ngayThu: ngayBan, nguoiNop: kh.hoTen || 'Khach hang', hinhThuc: ['Tien mat','Chuyen khoan','Quet the'][i%3], ghiChu: 'Thu ' + sp.tenMay });

        totalHD++;
        totalDT += sp.giaBan;
        thangDT += sp.giaBan;
      }
    }
    console.log('  T' + month + '/' + YEAR + ': ' + thangDT.toLocaleString('vi-VN') + ' d');
  }

  // 5. Update TonKho
  console.log('\n[5] Cap nhat TonKho...');
  for (const sp of spList) {
    const cnt = await MayImei.countDocuments({ sanPham: sp._id, trangThai: 'Con hang' });
    if (cnt > 0) await TonKho.findOneAndUpdate({ kho: kho._id, sanPham: sp._id }, { $set: { soLuong: cnt } }, { upsert: true });
  }

  // 6. Chi phi van hanh
  console.log('\n[6] Tao phieu chi van hanh...');
  for (const cf of CHI_PHI_MONTHLY) {
    await PhieuChi.create({ soTien: cf.soTien, ngayChi: randomDate(YEAR, cf.thang), nguoiNhan: 'Chi phi van hanh', hinhThuc: 'Chuyen khoan', lyDo: cf.lyDo });
  }

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('SEED HOAN TAT!');
  console.log('  San pham:      ' + spList.length + ' mau may');
  console.log('  IMEI ton lau:  ' + tonLauCount + ' may (nhap T1-T3/2026)');
  console.log('  Hoa don ban:   ' + totalHD + ' hoa don');
  console.log('  Tong DT:       ' + totalDT.toLocaleString('vi-VN') + ' d');
  console.log('  PhieuChi VH:   ' + CHI_PHI_MONTHLY.length + ' phieu');
  console.log('='.repeat(55));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('SEED ERROR:', err.message);
  process.exit(1);
});
