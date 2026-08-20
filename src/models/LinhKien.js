const mongoose = require('mongoose');

const linhKienSchema = new mongoose.Schema({
  tenLK: { type: String, required: true, trim: true },
  donGia: { type: Number, required: true, default: 0, min: 0 },
  soLuongTon: { type: Number, required: true, default: 0, min: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('LinhKien', linhKienSchema, 'LINHKIEN');
