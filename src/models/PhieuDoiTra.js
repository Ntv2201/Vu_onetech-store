const mongoose = require('mongoose');

const phieuDoiTraSchema = new mongoose.Schema({
  maDT: { type: String, unique: true, index: true },
  hoaDon: { type: mongoose.Schema.Types.ObjectId, ref: 'HoaDon', required: true },
  imei: { type: String, required: true, index: true },
  lyDo: { type: String, required: true, trim: true },
  ngayDoiTra: { type: Date, default: Date.now },
  trangThai: {
    type: String,
    required: true,
    enum: ['Cho xu ly', 'Da doi may', 'Da tra tien', 'Tu choi'],
    default: 'Cho xu ly'
  },
  ghiChu: { type: String, default: '' }
}, {
  timestamps: true
});

phieuDoiTraSchema.pre('save', function(next) {
  if (!this.maDT) {
    this.maDT = 'DT' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('PhieuDoiTra', phieuDoiTraSchema, 'PHIEUDOITRA');
