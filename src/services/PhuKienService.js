const BaseService = require('./BaseService');
const { PhuKien, DanhMuc } = require('../models');

class PhuKienService extends BaseService {
  constructor() {
    super(PhuKien);
  }

  async getAllPhuKiens(query = {}) {
    const { search, danhMucId } = query;
    const filter = {};
    if (query.status !== 'all') {
      filter.status = { $ne: false };
    }

    if (search && search.trim()) {
      filter.tenPK = { $regex: search.trim(), $options: 'i' };
    }
    if (danhMucId) {
      filter.danhMuc = danhMucId;
    }

    const [phuKiens, danhMucs] = await Promise.all([
      PhuKien.find(filter).populate('danhMuc').sort({ createdAt: -1 }),
      DanhMuc.find().sort({ tenDanhMuc: 1 })
    ]);

    return { phuKiens, danhMucs };
  }

  async getPhuKienDetail(id) {
    const [phuKien, danhMucs] = await Promise.all([
      PhuKien.findById(id).populate('danhMuc'),
      DanhMuc.find().sort({ tenDanhMuc: 1 })
    ]);

    if (!phuKien) {
      throw this.createError('Không tìm thấy phụ kiện', 404);
    }

    return { phuKien, danhMucs };
  }

  async createPhuKien(payload = {}) {
    const { tenPK, danhMuc, giaBan, soLuongTon } = payload;
    if (!tenPK || !danhMuc || giaBan === undefined) {
      throw this.createError('Vui lòng điền đầy đủ Tên phụ kiện, Danh mục và Giá bán', 400);
    }

    return await PhuKien.create({
      tenPK: tenPK.trim(),
      danhMuc,
      giaBan: Number(giaBan),
      soLuongTon: soLuongTon !== undefined ? Math.max(0, Number(soLuongTon)) : 0
    });
  }

  async updatePhuKien(id, payload = {}) {
    const { tenPK, danhMuc, giaBan, soLuongTon } = payload;

    const updated = await PhuKien.findByIdAndUpdate(
      id,
      {
        tenPK: tenPK ? tenPK.trim() : undefined,
        danhMuc,
        giaBan: giaBan !== undefined ? Number(giaBan) : undefined,
        soLuongTon: soLuongTon !== undefined ? Math.max(0, Number(soLuongTon)) : undefined
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw this.createError('Không tìm thấy phụ kiện để cập nhật', 404);
    }

    return updated;
  }

  async toggleStatusPhuKien(id) {
    const pk = await PhuKien.findById(id);
    if (!pk) {
      throw this.createError('Không tìm thấy phụ kiện', 404);
    }
    pk.status = !pk.status;
    await pk.save();
    return { success: true, id, status: pk.status };
  }
}

module.exports = new PhuKienService();
