const mongoose = require('mongoose');

const congNoSchema = new mongoose.Schema({
  loaiDoiTuong: {
    type: String,
    required: true,
    enum: ['KhachHang', 'NhaCungCap']
  },
  khachHang: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang' },
  nhaCungCap: { type: mongoose.Schema.Types.ObjectId, ref: 'NhaCungCap' },
  hoaDon: { type: mongoose.Schema.Types.ObjectId, ref: 'HoaDon' },
  phieuNhap: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuNhap' },
  soTienNo: { type: Number, required: true, default: 0, min: 0 },
  soTienDaTra: { type: Number, required: true, default: 0, min: 0 },
  trangThai: {
    type: String,
    required: true,
    enum: ['Con no', 'Da tra het', 'Qua han'],
    default: 'Con no'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CongNo', congNoSchema, 'CONGNO');
