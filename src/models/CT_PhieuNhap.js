const mongoose = require('mongoose');

const ctPhieuNhapSchema = new mongoose.Schema({
  phieuNhap: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuNhap', required: true, index: true },
  imei: { type: String, required: true, index: true },
  sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham' }, // Bổ sung để hiển thị tên sản phẩm theo ràng buộc brief
  donGiaNhap: { type: Number, required: true, min: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('CT_PhieuNhap', ctPhieuNhapSchema, 'CT_PHIEUNHAP');
