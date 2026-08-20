const mongoose = require('mongoose');

const phieuChiSchema = new mongoose.Schema({
  phieuNhap: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuNhap', required: true },
  maDT: { type: String, default: '' }, // Mã đối tượng chi (NCC...)
  soTien: { type: Number, required: true, min: 0 },
  ngayChi: { type: Date, default: Date.now },
  lyDo: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('PhieuChi', phieuChiSchema, 'PHIEUCHI');
