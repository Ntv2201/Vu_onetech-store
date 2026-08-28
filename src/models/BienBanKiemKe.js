const mongoose = require('mongoose');

const bienBanKiemKeSchema = new mongoose.Schema({
  maBienBan: { type: String, unique: true, sparse: true, trim: true },
  kho: { type: mongoose.Schema.Types.ObjectId, ref: 'Kho', required: true },
  nhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' },
  ngay: { type: Date, required: true, default: Date.now },
  tongLyThuyet: { type: Number, default: 0 },
  tongThucTe: { type: Number, default: 0 },
  tongKhop: { type: Number, default: 0 },
  tongLech: { type: Number, default: 0 },
  tongThieu: { type: Number, default: 0 },
  tongThua: { type: Number, default: 0 },
  trangThai: {
    type: String,
    enum: ['Da kiem ke', 'Da dieu chinh', 'Huy'],
    default: 'Da kiem ke',
    index: true
  },
  ghiChu: { type: String, default: '' },
  status: { type: Boolean, default: true }
}, {
  timestamps: true
});

bienBanKiemKeSchema.index({ kho: 1, ngay: -1 });
bienBanKiemKeSchema.index({ trangThai: 1, ngay: -1 });

module.exports = mongoose.model('BienBanKiemKe', bienBanKiemKeSchema, 'BIENBANKIEMKE');
