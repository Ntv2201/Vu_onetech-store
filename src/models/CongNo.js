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
  hanThanhToan: { type: Date },
  trangThai: {
    type: String,
    required: true,
    enum: ['Con no', 'Da tra het', 'Qua han'],
    default: 'Con no'
  }
}, {
  timestamps: true
});

// Hook validate đa hình
congNoSchema.pre('save', function (next) {
  if (this.loaiDoiTuong === 'KhachHang') {
    if (!this.khachHang) {
      return next(new Error("ValidationError: Đối tượng Khách Hàng bắt buộc phải có thông tin 'khachHang'"));
    }
    this.nhaCungCap = undefined; // Đảm bảo null/undefined
  } else if (this.loaiDoiTuong === 'NhaCungCap') {
    if (!this.nhaCungCap) {
      return next(new Error("ValidationError: Đối tượng Nhà Cung Cấp bắt buộc phải có thông tin 'nhaCungCap'"));
    }
    this.khachHang = undefined; // Đảm bảo null/undefined
  }
  next();
});

module.exports = mongoose.model('CongNo', congNoSchema, 'CONGNO');
