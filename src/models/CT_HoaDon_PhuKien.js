const mongoose = require('mongoose');

const ctHoaDonPhuKienSchema = new mongoose.Schema({
  hoaDon: { type: mongoose.Schema.Types.ObjectId, ref: 'HoaDon', required: true, index: true },
  phuKien: { type: mongoose.Schema.Types.ObjectId, ref: 'PhuKien', required: true },
  soLuong: { type: Number, required: true, default: 1, min: 1 },
  donGiaBan: { type: Number, required: true, default: 0, min: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('CT_HoaDon_PhuKien', ctHoaDonPhuKienSchema, 'CT_HOADON_PHUKIEN');
