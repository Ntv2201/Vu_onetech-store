const BaseService = require('./BaseService');
const { PhuKien, DanhMuc } = require('../models');

class PhuKienService extends BaseService {
  constructor() {
    super(PhuKien);
  }

  async getAllPhuKiens(query = {}) {
    const { search, danhMucId } = query;
    const filter = {};

    if (query.status === 'all') {
      // Không lọc theo status (lấy cả hoạt động lẫn đã khóa)
    } else if (query.status === false || query.status === 'false') {
      filter.status = false;
    } else if (query.status === true || query.status === 'true') {
      filter.status = true;
    } else {
      filter.status = { $ne: false }; // Mặc định: chỉ lấy hoạt động
    }

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.tenPK = { $regex: safeSearch, $options: 'i' };
    }
    if (danhMucId) {
      filter.danhMuc = danhMucId;
    }

    const [phuKiens, danhMucs] = await Promise.all([
      PhuKien.find(filter).populate('danhMuc').sort({ createdAt: -1 }).lean(),
      DanhMuc.find().sort({ tenDanhMuc: 1 }).lean()
    ]);

    return { phuKiens, danhMucs };
  }

  async getPhuKienDetail(id) {
    const [phuKien, danhMucs] = await Promise.all([
      PhuKien.findById(id).populate('danhMuc'),
      DanhMuc.find().sort({ tenDanhMuc: 1 }).lean()
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

  async deletePhuKien(id) {
    return this.toggleStatusPhuKien(id);
  }
}

module.exports = new PhuKienService();
