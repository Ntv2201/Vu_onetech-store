const mongoose = require('mongoose');

const phieuBaoHanhSchema = new mongoose.Schema({
  maPBH: { type: String, unique: true, index: true },
  imei: { type: String, required: true, index: true },
  khachHang: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang' },
  nhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien', required: true },
  moTaLoi: { type: String, required: true, trim: true },
  ngayTiepNhan: { type: Date, default: Date.now },
  trangThai: {
    type: String,
    required: true,
    enum: ['Dang xu ly', 'Da sua xong', 'Tra khach', 'Tu choi bao hanh'],
    default: 'Dang xu ly'
  },
  ghiChu: { type: String, default: '' }
}, {
  timestamps: true
});

phieuBaoHanhSchema.pre('save', function(next) {
  if (!this.maPBH) {
    this.maPBH = 'PBH' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('PhieuBaoHanh', phieuBaoHanhSchema, 'PHIEUBAOHANH');
