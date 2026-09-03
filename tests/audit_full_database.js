require('dotenv').config();
const mongoose = require('mongoose');
const models = require('../src/models');
const {
  NhanVien,
  KhachHang,
  NhaCungCap,
  DanhMuc,
  SanPham,
  MayImei,
  PhuKien,
  LinhKien,
  TonKho,
  HoaDon,
  CT_HoaDon_May,
  CT_HoaDon_PhuKien,
  PhieuNhap,
  CT_PhieuNhap,
  PhieuXuatKho,
  DonDatHangTruoc,
  PhieuDoiTra,
  PhieuBaoHanh,
  CT_PBH_LinhKien,
  PhieuThu,
  PhieuChi,
  CongNo,
  HopDongTraGop
} = models;

async function auditDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
  await mongoose.connect(mongoUri);
  console.log('======================================================================');
  console.log('🔍 TOÀN DIỆN AUDIT CƠ SỞ DỮ LIỆU & RÀ SOÁT TÍNH TOÀN VẸN (ONETECH STORE)');
  console.log('======================================================================\n');

  const issues = [];

  // 1. Thống kê tổng quan số lượng từng collection
  const counts = {
    NhanVien: await NhanVien.countDocuments(),
    KhachHang: await KhachHang.countDocuments(),
    NhaCungCap: await NhaCungCap.countDocuments(),
    DanhMuc: await DanhMuc.countDocuments(),
    SanPham: await SanPham.countDocuments(),
    MayImei: await MayImei.countDocuments(),
    PhuKien: await PhuKien.countDocuments(),
    LinhKien: await LinhKien.countDocuments(),
    TonKho: await TonKho.countDocuments(),
    HoaDon: await HoaDon.countDocuments(),
    CT_HoaDon_May: await CT_HoaDon_May.countDocuments(),
    CT_HoaDon_PhuKien: await CT_HoaDon_PhuKien.countDocuments(),
    PhieuNhap: await PhieuNhap.countDocuments(),
    CT_PhieuNhap: await CT_PhieuNhap.countDocuments(),
    PhieuXuatKho: await PhieuXuatKho.countDocuments(),
    DonDatHangTruoc: await DonDatHangTruoc.countDocuments(),
    PhieuDoiTra: await PhieuDoiTra.countDocuments(),
    PhieuBaoHanh: await PhieuBaoHanh.countDocuments(),
    CT_PBH_LinhKien: await CT_PBH_LinhKien.countDocuments(),
    PhieuThu: await PhieuThu.countDocuments(),
    PhieuChi: await PhieuChi.countDocuments(),
    CongNo: await CongNo.countDocuments(),
    HopDongTraGop: await HopDongTraGop.countDocuments()
  };

  console.log('📊 SỐ LƯỢNG BẢN GHI TRONG CSDL:');
  console.table(counts);

  // 2. Kiểm tra Danh mục & Sản phẩm
  console.log('\n--- 1. Kiểm tra Danh Mục & Sản Phẩm ---');
  const dms = await DanhMuc.find();
  const dmIds = new Set(dms.map(d => d._id.toString()));
  console.log('Danh sách danh mục:', dms.map(d => `${d.tenDanhMuc} (${d._id})`));

  const sps = await SanPham.find();
  let spOrphanDM = 0;
  let spNoName = 0;
  let spNoPrice = 0;
  sps.forEach(sp => {
    if (!sp.danhMuc || !dmIds.has(sp.danhMuc.toString())) {
      spOrphanDM++;
      issues.push(`SanPham "${sp.tenMay}" (${sp._id}) liên kết danhMuc không tồn tại: ${sp.danhMuc}`);
    }
    if (!sp.tenMay) spNoName++;
    if (!sp.giaBan || sp.giaBan <= 0) spNoPrice++;
  });
  console.log(`- Sản phẩm mồ côi danh mục: ${spOrphanDM}`);
  console.log(`- Sản phẩm thiếu tên: ${spNoName}, thiếu giá: ${spNoPrice}`);

  // 3. Kiểm tra MayImei
  console.log('\n--- 2. Kiểm tra Máy IMEI ---');
  const spIds = new Set(sps.map(s => s._id.toString()));
  const imeis = await MayImei.find();
  let imeiOrphanSP = 0;
  let imeiInvalidStatus = 0;
  const validImeiStatus = ['Con hang', 'Da ban', 'Bao hanh', 'Loi'];
  const imeiMap = {};
  let imeiDuplicates = 0;

  imeis.forEach(m => {
    if (!m.sanPham || !spIds.has(m.sanPham.toString())) {
      imeiOrphanSP++;
      issues.push(`MayImei "${m.imei}" liên kết sanPham không tồn tại: ${m.sanPham}`);
    }
    if (!validImeiStatus.includes(m.trangThai)) {
      imeiInvalidStatus++;
      issues.push(`MayImei "${m.imei}" có trangThai không hợp lệ: "${m.trangThai}"`);
    }
    if (imeiMap[m.imei]) {
      imeiDuplicates++;
      issues.push(`Trùng lặp số IMEI: "${m.imei}"`);
    }
    imeiMap[m.imei] = true;
  });
  console.log(`- IMEI mồ côi sản phẩm: ${imeiOrphanSP}`);
  console.log(`- IMEI trạng thái không hợp lệ: ${imeiInvalidStatus}`);
  console.log(`- IMEI bị trùng lặp: ${imeiDuplicates}`);

  // 4. Kiểm tra Phụ Kiện
  console.log('\n--- 3. Kiểm tra Phụ Kiện ---');
  const pks = await PhuKien.find();
  let pkOrphanDM = 0;
  pks.forEach(pk => {
    if (pk.danhMuc && !dmIds.has(pk.danhMuc.toString())) {
      pkOrphanDM++;
      issues.push(`PhuKien "${pk.tenPK}" liên kết danhMuc không tồn tại: ${pk.danhMuc}`);
    }
  });
  console.log(`- Phụ kiện mồ côi danh mục: ${pkOrphanDM}`);

  // 5. Kiểm tra Hóa Đơn & Chi Tiết
  console.log('\n--- 4. Kiểm tra Hóa Đơn & Chi Tiết Hóa Đơn ---');
  const hds = await HoaDon.find();
  const hdIds = new Set(hds.map(h => h._id.toString()));
  const ctMays = await CT_HoaDon_May.find();
  let ctMayOrphanHD = 0;
  let ctMayOrphanIMEI = 0;

  ctMays.forEach(ct => {
    if (!ct.hoaDon || !hdIds.has(ct.hoaDon.toString())) {
      ctMayOrphanHD++;
      issues.push(`CT_HoaDon_May mồ côi hóa đơn: ${ct.hoaDon}`);
    }
    if (!ct.imei || !imeiMap[ct.imei]) {
      ctMayOrphanIMEI++;
      issues.push(`CT_HoaDon_May tham chiếu IMEI không tồn tại trong kho: "${ct.imei}"`);
    }
  });
  console.log(`- CT_HoaDon_May mồ côi Hóa đơn: ${ctMayOrphanHD}`);
  console.log(`- CT_HoaDon_May tham chiếu IMEI không tồn tại: ${ctMayOrphanIMEI}`);

  // 6. Kiểm tra Phiếu Nhập & Chi Tiết
  console.log('\n--- 5. Kiểm tra Phiếu Nhập Kho & Chi Tiết ---');
  const pns = await PhieuNhap.find();
  const pnIds = new Set(pns.map(p => p._id.toString()));
  const ctPns = await CT_PhieuNhap.find();
  let ctPnOrphanPN = 0;
  ctPns.forEach(ct => {
    if (!ct.phieuNhap || !pnIds.has(ct.phieuNhap.toString())) {
      ctPnOrphanPN++;
      issues.push(`CT_PhieuNhap mồ côi Phiếu Nhập: ${ct.phieuNhap}`);
    }
  });
  console.log(`- CT_PhieuNhap mồ côi Phiếu Nhập: ${ctPnOrphanPN}`);

  // 7. Kiểm tra Phiếu Thu / Chi & Sổ Quỹ
  console.log('\n--- 6. Kiểm tra Phiếu Thu & Phiếu Chi ---');
  const pts = await PhieuThu.find();
  const pcs = await PhieuChi.find();
  let ptZeroMoney = 0;
  let pcZeroMoney = 0;
  pts.forEach(p => { if (!p.soTien || p.soTien <= 0) ptZeroMoney++; });
  pcs.forEach(p => { if (!p.soTien || p.soTien <= 0) pcZeroMoney++; });
  console.log(`- Phiếu thu số tiền <= 0: ${ptZeroMoney}`);
  console.log(`- Phiếu chi số tiền <= 0: ${pcZeroMoney}`);

  // 8. Kiểm tra Đổi trả & Bảo hành
  console.log('\n--- 7. Kiểm tra Đổi Trả & Bảo Hành ---');
  const pbhs = await PhieuBaoHanh.find();
  const pdts = await PhieuDoiTra.find();
  console.log(`- Phiếu bảo hành: ${pbhs.length}, Phiếu đổi trả: ${pdts.length}`);

  // 9. Tổng kết vấn đề
  console.log('\n======================================================================');
  console.log(`📋 TỔNG KẾT PHÁT HIỆN: ${issues.length} VẤN ĐỀ DỮ LIỆU`);
  console.log('======================================================================');
  if (issues.length > 0) {
    issues.slice(0, 40).forEach((issue, idx) => console.log(`${idx + 1}. ⚠️ ${issue}`));
    if (issues.length > 40) console.log(`... và ${issues.length - 40} vấn đề khác.`);
  } else {
    console.log('✅ CƠ SỞ DỮ LIỆU HOÀN TOÀN NHẤT QUÁN, KHÔNG CÓ BẢN GHI MỒ CÔI HOẶC LỖI QUAN HỆ!');
  }

  process.exit(0);
}

auditDatabase();
