const mongoose = require('mongoose');

const phieuThuSchema = new mongoose.Schema({
  hoaDon: { type: mongoose.Schema.Types.ObjectId, ref: 'HoaDon' },
  donDatHang: { type: mongoose.Schema.Types.ObjectId, ref: 'DonDatHangTruoc' },
  congNo: { type: mongoose.Schema.Types.ObjectId, ref: 'CongNo' },
  phieuDoiTra: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuDoiTra' },
  soTien: { type: Number, required: true, min: 0 },
  ngayThu: { type: Date, default: Date.now },
  hinhThuc: {
    type: String,
    enum: ['Tien mat', 'Chuyen khoan', 'Quet the', 'Vi dien tu'],
    default: 'Tien mat'
  },
  ghiChu: { type: String, default: '' },
  status: { type: Boolean, default: true } // Trạng thái hiệu lực phiếu (Bit: 1 - Hiệu lực, 0 - Đã hủy)
}, {
  timestamps: true
});

module.exports = mongoose.model('PhieuThu', phieuThuSchema, 'PHIEUTHU');
