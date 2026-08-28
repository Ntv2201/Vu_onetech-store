const mongoose = require('mongoose');

const dieuChinhKhoSchema = new mongoose.Schema({
  bienBan: { type: mongoose.Schema.Types.ObjectId, ref: 'BienBanKiemKe', required: true, index: true },
  sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', index: true },
  imei: { type: String, trim: true, index: true },
  loaiLech: {
    type: String,
    enum: ['Thieu', 'Thua', 'Bat thuong', 'Khop'],
    default: 'Thieu',
    index: true
  },
  trangThaiMayDB: { type: String, default: '' },
  soLuongDC: { type: Number, required: true, default: 0 },
  lyDo: { type: String, default: '' },
  daXuLy: { type: Boolean, default: false },
  status: { type: Boolean, default: true }
}, {
  timestamps: true
});

dieuChinhKhoSchema.index({ bienBan: 1, loaiLech: 1 });

module.exports = mongoose.model('DieuChinhKho', dieuChinhKhoSchema, 'DIEUCHINHKHO');
