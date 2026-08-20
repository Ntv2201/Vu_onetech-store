const mongoose = require('mongoose');

const danhMucSchema = new mongoose.Schema({
  tenDanhMuc: { type: String, required: true, unique: true, trim: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('DanhMuc', danhMucSchema, 'DANHMUC');
