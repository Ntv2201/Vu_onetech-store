const BaseService = require('./BaseService');
const { TonKho, Kho } = require('../models');

class TonKhoService extends BaseService {
  constructor() {
    super(TonKho);
  }

  /**
   * Cập nhật số lượng tồn kho của một sản phẩm (điện thoại/máy tính bảng) trong một kho cụ thể.
   * Dùng chung cho: Nhập kho (Tuân), Bán hàng (Tuấn), Đổi trả (Việt)
   * 
   * @param {String} maSP - ObjectId của Sản phẩm
   * @param {String} maKho - ObjectId của Kho (nếu bỏ trống sẽ lấy kho đầu tiên làm mặc định)
   * @param {Number} delta - Số lượng thay đổi (dương: nhập, âm: xuất)
   */
  async capNhatTonKho(maSP, maKho, delta) {
    if (!maSP || delta === undefined) {
      throw this.createError('Thiếu maSP hoặc delta để cập nhật tồn kho', 400);
    }

    let targetKho = maKho;
    // Nếu không truyền maKho, lấy kho đầu tiên làm mặc định
    if (!targetKho) {
      const defaultKho = await Kho.findOne();
      if (!defaultKho) {
        throw this.createError('Hệ thống chưa có Kho nào để lưu trữ', 400);
      }
      targetKho = defaultKho._id;
    }

    // Tìm record tồn kho hiện tại
    let tonKho = await TonKho.findOne({ sanPham: maSP, kho: targetKho });

    if (!tonKho) {
      if (delta < 0) {
        throw this.createError('Sản phẩm không có trong kho để xuất', 400);
      }
      // Tạo mới nếu chưa có
      tonKho = new TonKho({
        sanPham: maSP,
        kho: targetKho,
        soLuong: delta
      });
    } else {
      // Cập nhật số lượng
      tonKho.soLuong += delta;
      if (tonKho.soLuong < 0) {
        throw this.createError('Số lượng tồn kho không đủ', 400);
      }
    }

    await tonKho.save();
    return tonKho;
  }
}

module.exports = new TonKhoService();
