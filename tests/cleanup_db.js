require('dotenv').config();
const mongoose = require('mongoose');
const { PhuKien, MayImei, HoaDon, KhachHang } = require('../src/models');

async function clean() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store';
  await mongoose.connect(mongoUri);
  console.log('--- Đang quét và dọn dẹp dữ liệu rác từ các lần chạy test trước ---');
  
  const pkRes = await PhuKien.deleteMany({ tenPK: { $regex: 'E2E|Test', $options: 'i' } });
  console.log(`Đã xóa ${pkRes.deletedCount} phụ kiện test rác (Củ sạc OneTech 30W E2E...)`);

  const imeiRes = await MayImei.deleteMany({ imei: { $regex: 'TEST|E2E|DEMO|RETURN|HTTP|SOLD', $options: 'i' } });
  console.log(`Đã xóa ${imeiRes.deletedCount} máy IMEI test rác`);

  const khRes = await KhachHang.deleteMany({ hoTen: { $regex: 'Test|Demo', $options: 'i' } });
  console.log(`Đã xóa ${khRes.deletedCount} khách hàng test rác`);

  const countPK = await PhuKien.countDocuments();
  const countImei = await MayImei.countDocuments();
  console.log(`Dữ liệu thực tế chuẩn: ${countPK} Phụ kiện, ${countImei} Máy IMEI.`);
  process.exit(0);
}

clean();
