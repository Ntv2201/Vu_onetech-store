const mongoose = require('mongoose');

const khoSchema = new mongoose.Schema({
  tenKho: { type: String, required: true, trim: true },
  diaChi: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Kho', khoSchema, 'KHO');
