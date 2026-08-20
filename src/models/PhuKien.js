const mongoose = require('mongoose');

const phuKienSchema = new mongoose.Schema({
  danhMuc: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
  tenPK: { type: String, required: true, trim: true },
  giaBan: { type: Number, required: true, default: 0, min: 0 },
  soLuongTon: { type: Number, required: true, default: 0, min: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('PhuKien', phuKienSchema, 'PHUKIEN');
