const mongoose = require('mongoose');

const nhaCungCapSchema = new mongoose.Schema({
  tenNCC: { type: String, required: true, trim: true },
  sdt: { type: String, trim: true },
  diaChi: { type: String, trim: true },
  status: { type: Boolean, default: true } // Trạng thái hoạt động (Bit: 1 - Hoạt động, 0 - Đã xóa/Khóa)
}, {
  timestamps: true
});

module.exports = mongoose.model('NhaCungCap', nhaCungCapSchema, 'NHACUNGCAP');
