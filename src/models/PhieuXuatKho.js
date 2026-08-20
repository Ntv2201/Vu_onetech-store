const mongoose = require('mongoose');

const phieuXuatKhoSchema = new mongoose.Schema({
  hoaDon: { type: mongoose.Schema.Types.ObjectId, ref: 'HoaDon', required: true },
  lyDoXuat: { type: String, default: 'Xuat ban hang theo hoa don' },
  ngayXuat: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('PhieuXuatKho', phieuXuatKhoSchema, 'PHIEUXUATKHO');
