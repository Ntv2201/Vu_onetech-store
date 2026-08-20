const mongoose = require('mongoose');

const nhaCungCapSchema = new mongoose.Schema({
  tenNCC: { type: String, required: true, trim: true },
  sdt: { type: String, trim: true },
  diaChi: { type: String, trim: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('NhaCungCap', nhaCungCapSchema, 'NHACUNGCAP');
