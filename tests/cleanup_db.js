require('dotenv').config();
const mongoose = require('mongoose');
const {
  PhuKien,
  LinhKien,
  SanPham,
  MayImei,
  HoaDon,
  CT_HoaDon_May,
  CT_HoaDon_PhuKien,
  KhachHang,
  DonDatHangTruoc,
  PhieuDoiTra,
  PhieuThu,
  PhieuChi,
  PhieuBaoHanh,
  CT_PBH_LinhKien,
  TonKho,
  CongNo
} = require('../src/models');

async function clean() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
  await mongoose.connect(mongoUri);
  console.log('--- Đang quét và dọn dẹp dữ liệu rác từ các lần chạy test trước ---');
  
  const testImeiRegex = 'TEST|E2E|DEMO|RETURN|HTTP|SOLD';
  const testGeneralRegex = 'Test|Demo|E2E|khai trương|voucher|combo 2 flagship|Khách VIP|hoàn tiền đổi trả';

  // 1. Tìm các chi tiết hóa đơn gắn với IMEI test
  const testCtMays = await CT_HoaDon_May.find({ imei: { $regex: testImeiRegex, $options: 'i' } });
  const testHdIds = testCtMays.map(c => c.hoaDon);

  // 2. Xóa chi tiết hóa đơn và hóa đơn test
  await CT_HoaDon_May.deleteMany({ imei: { $regex: testImeiRegex, $options: 'i' } });
  await CT_HoaDon_PhuKien.deleteMany({ hoaDon: { $in: testHdIds } });
  await HoaDon.deleteMany({
    $or: [
      { _id: { $in: testHdIds } },
      { ghiChu: { $regex: testGeneralRegex, $options: 'i' } }
    ]
  });

  // 3. Xóa các chi tiết hóa đơn mồ côi (không tồn tại trong HoaDon)
  const allHds = await HoaDon.find().select('_id');
  const validHdIds = allHds.map(h => h._id);
  await CT_HoaDon_May.deleteMany({ hoaDon: { $nin: validHdIds } });
  await CT_HoaDon_PhuKien.deleteMany({ hoaDon: { $nin: validHdIds } });

  // 4. Xóa các thực thể test khác
  await PhuKien.deleteMany({ tenPK: { $regex: 'E2E|Test', $options: 'i' } });
  await LinhKien.deleteMany({ tenLK: { $regex: 'E2E|Test', $options: 'i' } });
  await SanPham.deleteMany({ tenMay: { $regex: 'E2E|Test', $options: 'i' } });
  await MayImei.deleteMany({ imei: { $regex: testImeiRegex, $options: 'i' } });
  await KhachHang.deleteMany({ hoTen: { $regex: 'Test|Demo', $options: 'i' } });
  await DonDatHangTruoc.deleteMany({ ghiChu: { $regex: testGeneralRegex, $options: 'i' } });
  await PhieuDoiTra.deleteMany({
    $or: [
      { lyDo: { $regex: testGeneralRegex, $options: 'i' } },
      { maDT: { $regex: 'DT-TEST', $options: 'i' } }
    ]
  });
  await PhieuThu.deleteMany({ ghiChu: { $regex: testGeneralRegex, $options: 'i' } });
  await PhieuChi.deleteMany({ lyDo: { $regex: testGeneralRegex, $options: 'i' } });
  await CongNo.deleteMany({ ghiChu: { $regex: testGeneralRegex, $options: 'i' } });

  const countPK = await PhuKien.countDocuments();
  const countImei = await MayImei.countDocuments();
  const countHD = await HoaDon.countDocuments();
  console.log(`Dữ liệu thực tế chuẩn sau khi dọn: ${countPK} Phụ kiện, ${countImei} Máy IMEI, ${countHD} Hóa đơn.`);
  process.exit(0);
}

clean();
