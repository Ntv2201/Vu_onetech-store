const mongoose = require('mongoose');

const tonKhoSchema = new mongoose.Schema({
  kho: { type: mongoose.Schema.Types.ObjectId, ref: 'Kho', required: true },
  sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
  soLuong: { type: Number, required: true, default: 0, min: 0 }
}, {
  timestamps: true
});

tonKhoSchema.index({ kho: 1, sanPham: 1 }, { unique: true });

module.exports = mongoose.model('TonKho', tonKhoSchema, 'TONKHO');
