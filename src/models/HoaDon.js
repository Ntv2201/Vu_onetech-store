const mongoose = require('mongoose');

const hoaDonSchema = new mongoose.Schema({
  soHD: { type: String, unique: true, index: true },
  khachHang: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang' },
  nhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien', required: true },
  donDatHang: { type: mongoose.Schema.Types.ObjectId, ref: 'DonDatHangTruoc' },
  tienCocDaTru: { type: Number, default: 0, min: 0 },
  soTienGiam: { type: Number, default: 0, min: 0 },
  soTienThanhToan: { type: Number, default: 0, min: 0 },
  ngayLap: { type: Date, default: Date.now },
  tongTien: { type: Number, required: true, default: 0, min: 0 },
  trangThai: {
    type: String,
    required: true,
    enum: ['Da thanh toan', 'Cong no', 'Tra gop', 'Da huy'],
    default: 'Da thanh toan'
  },
  hanThanhToan: { type: Date },
  ghiChu: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto sinh số hóa đơn nếu chưa có
hoaDonSchema.pre('save', function(next) {
  if (!this.soHD) {
    this.soHD = 'HD' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('HoaDon', hoaDonSchema, 'HOADON');
