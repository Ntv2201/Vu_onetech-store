const mongoose = require('mongoose');

const khachHangSchema = new mongoose.Schema({
  hoTen: { type: String, required: true, trim: true },
  sdt: { type: String, trim: true },
  diaChi: { type: String, trim: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('KhachHang', khachHangSchema, 'KHACHHANG');
