/**
 * Test tự động - Trương Thế An - Tuần 3
 * Chạy: node tests/test_an_tuan3.js
 *
 * Cần seed sẵn ít nhất: 1 Kho, 1 SanPham, 1 KhachHang, 1 NhaCungCap trong DB test
 * trước khi chạy (điền _id thật vào các biến bên dưới).
 */
const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config();

const TonKhoService = require('../src/services/TonKhoService');
const CongNoService = require('../src/services/CongNoService');
const { Kho, SanPham, KhachHang } = require('../src/models');

async function run() {
  await mongoose.connect(process.env.MONGO_URI_TEST || process.env.MONGODB_URI);

  // Lấy sẵn 1 kho + 1 sản phẩm + 1 khách hàng có thật trong DB để test (seed data)
  const kho = await Kho.findOne();
  const sanPham = await SanPham.findOne();
  const khachHang = await KhachHang.findOne();
  assert.ok(kho, 'Cần seed ít nhất 1 Kho trước khi test');
  assert.ok(sanPham, 'Cần seed ít nhất 1 SanPham trước khi test');
  assert.ok(khachHang, 'Cần seed ít nhất 1 KhachHang trước khi test');

  console.log('--- Test capNhatTonKho ---');
  await TonKhoService.capNhatTonKho(sanPham._id, kho._id, 10);
  let ton = await TonKhoService.layThongKeTonKho({ maKho: kho._id });
  let dong = ton.find(t => String(t.sanPham._id) === String(sanPham._id));
  assert.strictEqual(dong.soLuong, 10, 'Nhập 10 phải ra tồn 10');
  console.log('OK: nhập kho +10');

  await TonKhoService.capNhatTonKho(sanPham._id, kho._id, -3);
  ton = await TonKhoService.layThongKeTonKho({ maKho: kho._id });
  dong = ton.find(t => String(t.sanPham._id) === String(sanPham._id));
  assert.strictEqual(dong.soLuong, 7, 'Xuất 3 từ tồn 10 phải còn 7');
  console.log('OK: xuất kho -3');

  let bChan = false;
  try {
    await TonKhoService.capNhatTonKho(sanPham._id, kho._id, -1000);
  } catch (err) {
    bChan = err.statusCode === 409;
  }
  assert.strictEqual(bChan, true, 'Xuất vượt tồn phải bị chặn với mã lỗi 409');
  console.log('OK: chặn xuất vượt tồn kho');

  // dọn lại tồn kho test về 0 để không ảnh hưởng lần chạy sau
  await TonKhoService.capNhatTonKho(sanPham._id, kho._id, -7);

  console.log('--- Test CongNo validate đa hình ---');
  let loi1 = false;
  try {
    await CongNoService.validateDoiTuongCongNo({ loaiDoiTuong: 'KhachHang', khachHang: null, nhaCungCap: null });
  } catch (err) {
    loi1 = err.statusCode === 400;
  }
  assert.strictEqual(loi1, true, 'Thiếu khachHang khi loaiDoiTuong=KhachHang phải báo lỗi 400');
  console.log('OK: chặn thiếu khachHang');

  let loi2 = false;
  try {
    await CongNoService.validateDoiTuongCongNo({
      loaiDoiTuong: 'KhachHang', khachHang: khachHang._id, nhaCungCap: '000000000000000000000000'
    });
  } catch (err) {
    loi2 = err.statusCode === 400;
  }
  assert.strictEqual(loi2, true, 'Có cả khachHang và nhaCungCap phải báo lỗi 400');
  console.log('OK: chặn lẫn cả 2 chiều đối tượng công nợ');

  console.log('\nTẤT CẢ TEST TUẦN 3 (An) PASS ✅');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});