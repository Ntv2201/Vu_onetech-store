const mongoose = require('mongoose');

const danhMucSchema = new mongoose.Schema({
  tenDanhMuc: { type: String, required: true, unique: true, trim: true },
  status: { type: Boolean, default: true } // Trạng thái hoạt động (Bit: 1 - Hoạt động, 0 - Đã xóa/Khóa)
}, {
  timestamps: true
});

module.exports = mongoose.model('DanhMuc', danhMucSchema, 'DANHMUC');
