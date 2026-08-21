const BaseService = require('./BaseService');
const { SanPham, DanhMuc, MayImei } = require('../models');

class SanPhamService extends BaseService {
  constructor() {
    super(SanPham);
  }

  async getAllSanPhams(query = {}) {
    const { search, danhMucId } = query;
    const filter = {};

    if (search && search.trim()) {
      filter.tenMay = { $regex: search.trim(), $options: 'i' };
    }
    if (danhMucId) {
      filter.danhMuc = danhMucId;
    }

    const [sanPhams, danhMucs] = await Promise.all([
      SanPham.find(filter).populate('danhMuc').sort({ createdAt: -1 }),
      DanhMuc.find().sort({ tenDanhMuc: 1 })
    ]);

    // Thống kê tồn kho số lượng máy theo IMEI
    const counts = await MayImei.aggregate([
      { $match: { trangThai: 'Con hang' } },
      { $group: { _id: '$sanPham', soLuongTon: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id.toString()] = c.soLuongTon;
    });

    const enriched = sanPhams.map(sp => {
      const spObj = sp.toObject();
      spObj.soLuongTon = countMap[sp._id.toString()] || 0;
      return spObj;
    });

    return { sanPhams: enriched, danhMucs };
  }

  async getSanPhamDetail(id) {
    const [sanPham, danhMucs, imeis] = await Promise.all([
      SanPham.findById(id).populate('danhMuc'),
      DanhMuc.find().sort({ tenDanhMuc: 1 }),
      MayImei.find({ sanPham: id }).sort({ createdAt: -1 })
    ]);

    if (!sanPham) {
      throw this.createError('Không tìm thấy sản phẩm', 404);
    }

    return { sanPham, danhMucs, imeis };
  }

  async createSanPham(payload = {}) {
    const { tenMay, danhMuc, hang, giaBan, soThangBH, hinhAnh, moTa } = payload;
    if (!tenMay || !danhMuc || giaBan === undefined) {
      throw this.createError('Vui lòng điền đầy đủ Tên máy, Danh mục và Giá bán', 400);
    }

    return await SanPham.create({
      tenMay: tenMay.trim(),
      danhMuc,
      hang: hang ? hang.trim() : '',
      giaBan: Number(giaBan),
      soThangBH: soThangBH !== undefined ? Number(soThangBH) : 12,
      hinhAnh: hinhAnh ? hinhAnh.trim() : '',
      moTa: moTa ? moTa.trim() : ''
    });
  }

  async updateSanPham(id, payload = {}) {
    const { tenMay, danhMuc, hang, giaBan, soThangBH, hinhAnh, moTa } = payload;

    const updated = await SanPham.findByIdAndUpdate(
      id,
      {
        tenMay: tenMay ? tenMay.trim() : undefined,
        danhMuc,
        hang: hang ? hang.trim() : undefined,
        giaBan: giaBan !== undefined ? Number(giaBan) : undefined,
        soThangBH: soThangBH !== undefined ? Number(soThangBH) : undefined,
        hinhAnh: hinhAnh ? hinhAnh.trim() : undefined,
        moTa: moTa ? moTa.trim() : undefined
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw this.createError('Không tìm thấy sản phẩm để cập nhật', 404);
    }

    return updated;
  }

  async deleteSanPham(id) {
    const imeiCount = await MayImei.countDocuments({ sanPham: id });
    if (imeiCount > 0) {
      throw this.createError(`Không thể xóa model sản phẩm này vì vẫn còn ${imeiCount} máy IMEI liên kết!`, 400);
    }

    const deleted = await SanPham.findByIdAndDelete(id);
    if (!deleted) {
      throw this.createError('Không tìm thấy sản phẩm', 404);
    }

    return { success: true, id };
  }
}

module.exports = new SanPhamService();
