require('dotenv').config();
const mongoose = require('mongoose');
const {
  HoaDon,
  CT_HoaDon_May,
  CT_HoaDon_PhuKien,
  DonDatHangTruoc,
  PhieuDoiTra,
  CT_PhieuDoiTra,
  PhieuBaoHanh,
  CT_PBH_LinhKien,
  PhieuThu,
  PhieuChi,
  CongNo,
  MayImei,
  SanPham
} = require('../src/models');

async function inspectTestJunk() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
  await mongoose.connect(mongoUri);

  console.log('--- PHÂN TÍCH DỮ LIỆU TEST RÁC TRONG CSDL ---');

  const testCtMays = await CT_HoaDon_May.find({ imei: { $regex: 'TEST|DEMO|E2E|RET|SOLD|HTTP', $options: 'i' } });
  console.log(`- CT_HoaDon_May có IMEI test rác: ${testCtMays.length}`);

  const testHdIds = new Set(testCtMays.map(c => c.hoaDon.toString()));
  console.log(`- Hóa đơn liên quan đến IMEI test rác: ${testHdIds.size}`);

  const testPreOrders = await DonDatHangTruoc.find({ ghiChu: { $regex: 'Test|Demo|E2E|Khách VIP', $options: 'i' } });
  console.log(`- Đơn đặt trước test rác: ${testPreOrders.length}`);

  const testPhieuDoiTras = await PhieuDoiTra.find({ $or: [{ lyDo: { $regex: 'Test|Demo|E2E', $options: 'i' } }, { maDT: { $regex: 'DT-TEST', $options: 'i' } }] });
  console.log(`- Phiếu đổi trả test rác: ${testPhieuDoiTras.length}`);

  const testPhieuThus = await PhieuThu.find({ ghiChu: { $regex: 'Test|Demo|E2E|Voucher|Khai trương', $options: 'i' } });
  console.log(`- Phiếu thu test rác: ${testPhieuThus.length}`);

  const testPhieuChis = await PhieuChi.find({ lyDo: { $regex: 'Test|Demo|E2E|hoàn tiền đổi trả', $options: 'i' } });
  console.log(`- Phiếu chi test rác: ${testPhieuChis.length}`);

  const testCongNos = await CongNo.find({ ghiChu: { $regex: 'Test|Demo|E2E', $options: 'i' } });
  console.log(`- Công nợ test rác: ${testCongNos.length}`);

  process.exit(0);
}

inspectTestJunk();
