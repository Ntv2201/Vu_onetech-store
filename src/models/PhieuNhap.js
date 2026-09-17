const mongoose = require('mongoose');

const phieuNhapSchema = new mongoose.Schema({
  maPN: { type: String, unique: true, index: true },
  nhaCungCap: { type: mongoose.Schema.Types.ObjectId, ref: 'NhaCungCap', required: true },
  nhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien', required: true },
  donDatHangNCC: { type: mongoose.Schema.Types.ObjectId, ref: 'DonDatHangNCC' }, // Bổ sung khóa ngoại tới Đơn Đặt Hàng NCC
  ngayNhap: { type: Date, default: Date.now },
  tongTien: { type: Number, default: 0, min: 0 },
  tienChietKhau: { type: Number, default: 0, min: 0 },
  phiVanChuyen: { type: Number, default: 0, min: 0 },
  tenNguoiGiao: { type: String, default: '' },
  sdtNguoiGiao: { type: String, default: '' },
  cccdNguoiGiao: { type: String, default: '' },
  ghiChu: { type: String, default: '' },
  status: { type: Boolean, default: true } // Trạng thái hiệu lực phiếu nhập (Bit: 1 - Hiệu lực, 0 - Đã hủy)
}, {
  timestamps: true
});

phieuNhapSchema.pre('save', function(next) {
  if (!this.maPN) {
    this.maPN = 'PN' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('PhieuNhap', phieuNhapSchema, 'PHIEUNHAP');
