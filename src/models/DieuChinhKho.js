const mongoose = require('mongoose');

const dieuChinhKhoSchema = new mongoose.Schema({
  bienBan: { type: mongoose.Schema.Types.ObjectId, ref: 'BienBanKiemKe', required: true },
  sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham' },
  imei: { type: String, trim: true },
  soLuongDC: { type: Number, required: true },
  lyDo: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('DieuChinhKho', dieuChinhKhoSchema, 'DIEUCHINHKHO');
