const mongoose = require('mongoose');

const phuKienSchema = new mongoose.Schema({
  danhMuc: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
  tenPK: { type: String, required: true, trim: true },
  giaBan: { type: Number, required: true, default: 0, min: 0 },
  soLuongTon: { type: Number, required: true, default: 0, min: 0 },
  status: { type: Boolean, default: true } // Trạng thái hoạt động (Bit: 1 - Hoạt động, 0 - Đã xóa/Khóa)
}, {
  timestamps: true
});

module.exports = mongoose.model('PhuKien', phuKienSchema, 'PHUKIEN');
