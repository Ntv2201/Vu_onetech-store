const mongoose = require('mongoose');

const bienBanKiemKeSchema = new mongoose.Schema({
  kho: { type: mongoose.Schema.Types.ObjectId, ref: 'Kho', required: true },
  ngay: { type: Date, required: true, default: Date.now },
  ghiChu: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('BienBanKiemKe', bienBanKiemKeSchema, 'BIENBANKIEMKE');
