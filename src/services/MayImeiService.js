const BaseService = require('./BaseService');
const { MayImei, SanPham } = require('../models');

class MayImeiService extends BaseService {
  constructor() {
    super(MayImei);
  }

  async getAllImeis(query = {}) {
    const { search, sanPhamId, trangThai } = query;
    const filter = {};

    if (search && search.trim()) {
      filter.imei = { $regex: search.trim(), $options: 'i' };
    }
    if (sanPhamId) {
      filter.sanPham = sanPhamId;
    }
    if (trangThai) {
      filter.trangThai = trangThai;
    }

    const [imeis, sanPhams] = await Promise.all([
      MayImei.find(filter)
        .populate({
          path: 'sanPham',
          populate: { path: 'danhMuc' }
        })
        .sort({ createdAt: -1 }),
      SanPham.find().sort({ tenMay: 1 })
    ]);

    return { imeis, sanPhams };
  }

  async getImeiDetail(imei) {
    const [mayImei, sanPhams] = await Promise.all([
      MayImei.findOne({ imei }).populate('sanPham'),
      SanPham.find().sort({ tenMay: 1 })
    ]);

    if (!mayImei) {
      throw this.createError('Không tìm thấy máy IMEI', 404);
    }

    return { mayImei, sanPhams };
  }

  async importImeis(payload = {}) {
    const { sanPham, giaNhap, trangThai, mauSac, dungLuong, imeiList, singleImei } = payload;

    if (!sanPham || giaNhap === undefined || giaNhap === '') {
      throw this.createError('Vui lòng chọn Sản phẩm và nhập Giá nhập', 400);
    }

    let rawImeis = [];
    if (imeiList && imeiList.trim()) {
      rawImeis = imeiList
        .split(/[\n,;]+/)
        .map(i => i.trim())
        .filter(Boolean);
    } else if (singleImei && singleImei.trim()) {
      rawImeis = [singleImei.trim()];
    }

    if (rawImeis.length === 0) {
      throw this.createError('Vui lòng nhập ít nhất 1 số IMEI', 400);
    }

    // Kiểm tra trùng lặp IMEI
    const existing = await MayImei.find({ imei: { $in: rawImeis } });
    if (existing.length > 0) {
      const dupList = existing.map(e => e.imei).join(', ');
      throw this.createError(`Các IMEI sau đã tồn tại trong hệ thống: ${dupList}`, 409, { existingImeis: existing.map(e => e.imei) });
    }

    const docs = rawImeis.map(imeiVal => ({
      imei: imeiVal,
      sanPham,
      giaNhap: Number(giaNhap),
      trangThai: trangThai || 'Con hang',
      mauSac: mauSac ? mauSac.trim() : '',
      dungLuong: dungLuong ? dungLuong.trim() : '',
      ngayNhap: new Date()
    }));

    await MayImei.insertMany(docs);
    return { count: docs.length, imeis: rawImeis };
  }

  async updateImei(imei, payload = {}) {
    const { sanPham, giaNhap, trangThai, mauSac, dungLuong } = payload;

    const updated = await MayImei.findOneAndUpdate(
      { imei },
      {
        sanPham,
        giaNhap: Number(giaNhap),
        trangThai,
        mauSac: mauSac ? mauSac.trim() : '',
        dungLuong: dungLuong ? dungLuong.trim() : ''
      },
      { new: true }
    );

    if (!updated) {
      throw this.createError('Không tìm thấy IMEI để cập nhật', 404);
    }

    return updated;
  }

  async deleteImei(imei) {
    const may = await MayImei.findOne({ imei });
    if (!may) {
      throw this.createError('Không tìm thấy IMEI', 404);
    }

    if (may.trangThai === 'Da ban') {
      throw this.createError('Không thể xóa máy đã bán. Vui lòng kiểm tra lại lịch sử hóa đơn.', 400);
    }

    await MayImei.findOneAndDelete({ imei });
    return { success: true, imei };
  }
}

module.exports = new MayImeiService();
