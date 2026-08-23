const mongoose = require('mongoose');

const phieuChiSchema = new mongoose.Schema({
  phieuNhap: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuNhap' },
  donDatHang: { type: mongoose.Schema.Types.ObjectId, ref: 'DonDatHangTruoc' },
  maDT: { type: String, default: '' }, // Mã đối tượng chi (NCC, Khách hàng...)
  soTien: { type: Number, required: true, min: 0 },
  ngayChi: { type: Date, default: Date.now },
  hinhThuc: {
    type: String,
    enum: ['Tien mat', 'Chuyen khoan', 'Quet the', 'Vi dien tu'],
    default: 'Tien mat'
  },
  lyDo: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('PhieuChi', phieuChiSchema, 'PHIEUCHI');
