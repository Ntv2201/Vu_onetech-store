const mongoose = require('mongoose');

const mayImeiSchema = new mongoose.Schema({
  imei: { type: String, required: true, unique: true, trim: true, index: true }, // Mỗi máy vật lý có 1 IMEI duy nhất
  sanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true, index: true },
  giaNhap: { type: Number, required: true, min: 0 },
  trangThai: {
    type: String,
    required: true,
    enum: ['Con hang', 'Da ban', 'Bao hanh', 'Loi'],
    default: 'Con hang',
    index: true
  },
  mauSac: { type: String, default: '' },
  dungLuong: { type: String, default: '' },
  ngayNhap: { type: Date, default: Date.now },
  status: { type: Boolean, default: true } // Trạng thái vật lý máy (Bit: 1 - Khả dụng/Hoạt động, 0 - Hỏng hủy/Đã xuất)
}, {
  timestamps: true
});

mayImeiSchema.index({ sanPham: 1, trangThai: 1 });
mayImeiSchema.index({ imei: 1, trangThai: 1 });

module.exports = mongoose.model('MayImei', mayImeiSchema, 'MAY_IMEI');
