const mongoose = require('mongoose');

const ctPBHLinhKienSchema = new mongoose.Schema({
  phieuBaoHanh: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuBaoHanh', required: true, index: true },
  linhKien: { type: mongoose.Schema.Types.ObjectId, ref: 'LinhKien', required: true },
  soLuong: { type: Number, required: true, default: 1, min: 1 },
  donGia: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('CT_PBH_LinhKien', ctPBHLinhKienSchema, 'CT_PBH_LINHKIEN');
