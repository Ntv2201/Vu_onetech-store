const mongoose = require('mongoose');

const hopDongTraGopSchema = new mongoose.Schema({
  hoaDon: { type: mongoose.Schema.Types.ObjectId, ref: 'HoaDon', required: true, unique: true },
  soTienTraGop: { type: Number, required: true, min: 0 },
  soKy: { type: Number, required: true, min: 1 }, // Số kỳ trả góp (ví dụ: 6, 12 tháng)
  soTienMoiKy: { type: Number, default: 0 },
  trangThaiDuyet: {
    type: String,
    required: true,
    enum: ['Cho duyet', 'Da duyet', 'Tu choi', 'Hoan tat'],
    default: 'Da duyet'
  },
  ghiChu: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('HopDongTraGop', hopDongTraGopSchema, 'HOPDONGTRAGOP');
