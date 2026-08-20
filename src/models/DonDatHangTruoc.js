const mongoose = require('mongoose');

const donDatHangTruocSchema = new mongoose.Schema({
  khachHang: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang', required: true },
  sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
  imei: { type: String, trim: true }, // Có thể chỉ định IMEI khi hàng về
  soTienCoc: { type: Number, default: 0, min: 0 },
  hanLay: { type: Date },
  trangThai: {
    type: String,
    required: true,
    enum: ['Cho xu ly', 'Da co hang', 'Da nhan hang', 'Da huy'],
    default: 'Cho xu ly'
  },
  ghiChu: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('DonDatHangTruoc', donDatHangTruocSchema, 'DONDATHANGTRUOC');
