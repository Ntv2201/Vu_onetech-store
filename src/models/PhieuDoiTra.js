const mongoose = require('mongoose');

const phieuDoiTraSchema = new mongoose.Schema({
  maDT: { type: String, unique: true, index: true },
  hoaDon: { type: mongoose.Schema.Types.ObjectId, ref: 'HoaDon', required: true, index: true },
  khachHang: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang' },
  nhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' },
  imeiCu: { type: String, required: true, index: true }, // Số IMEI máy cũ trả lại
  imei: { type: String, index: true }, // Alias tương thích với imeiCu
  imeiMoi: { type: String, default: null, index: true }, // Số IMEI máy mới đổi (nếu có)
  loaiDoiTra: {
    type: String,
    enum: ['Doi may', 'Tra hang'],
    default: 'Doi may'
  },
  giaMayCu: { type: Number, default: 0, min: 0 },
  giaMayMoi: { type: Number, default: 0, min: 0 },
  danhSachPhuKien: [{
    phuKien: { type: mongoose.Schema.Types.ObjectId, ref: 'PhuKien', required: true },
    soLuong: { type: Number, required: true, min: 1, default: 1 },
    donGia: { type: Number, required: true, min: 0, default: 0 }
  }],
  tongTienPhuKien: { type: Number, default: 0, min: 0 },
  tienChenhLech: { type: Number, default: 0 }, // (giaMayMoi + tongTienPhuKien) - giaMayCu
  phieuThu: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuThu', default: null },
  phieuChi: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuChi', default: null },
  hinhThuc: {
    type: String,
    enum: ['Tien mat', 'Chuyen khoan', 'Quet the', 'Vi dien tu'],
    default: 'Tien mat'
  },
  lyDo: { type: String, required: true, trim: true },
  ngayDoiTra: { type: Date, default: Date.now },
  trangThai: {
    type: String,
    required: true,
    enum: ['Cho xu ly', 'Da doi may', 'Da tra tien', 'Hoan tat', 'Da huy', 'Tu choi'],
    default: 'Hoan tat'
  },
  ghiChu: { type: String, default: '' },
  // Thông tin hủy / hoàn tác phiếu đổi trả (dành cho Quản lý)
  lyDoHuy: { type: String, default: '' },
  ngayHuy: { type: Date, default: null },
  nguoiHuy: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien', default: null },
  phieuThuDaoNguoc: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuThu', default: null },
  phieuChiDaoNguoc: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuChi', default: null }
}, {
  timestamps: true
});

phieuDoiTraSchema.pre('save', function(next) {
  if (!this.maDT) {
    this.maDT = 'DT' + Date.now().toString().slice(-8);
  }
  if (!this.imei && this.imeiCu) {
    this.imei = this.imeiCu;
  }
  if (!this.imeiCu && this.imei) {
    this.imeiCu = this.imei;
  }
  next();
});

module.exports = mongoose.model('PhieuDoiTra', phieuDoiTraSchema, 'PHIEUDOITRA');
