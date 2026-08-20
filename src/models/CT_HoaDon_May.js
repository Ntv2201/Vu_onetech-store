const mongoose = require('mongoose');

const ctHoaDonMaySchema = new mongoose.Schema({
  hoaDon: { type: mongoose.Schema.Types.ObjectId, ref: 'HoaDon', required: true, index: true },
  imei: { type: String, required: true, unique: true, index: true }, // Mỗi IMEI chỉ được bán 1 lần
  donGiaBan: { type: Number, required: true, min: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('CT_HoaDon_May', ctHoaDonMaySchema, 'CT_HOADON_MAY');
