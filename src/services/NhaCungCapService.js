const BaseService = require('./BaseService');
const { NhaCungCap } = require('../models');

class NhaCungCapService extends BaseService {
  constructor() {
    super(NhaCungCap);
  }

  async getAllNhaCungCaps(query = {}) {
    const { search } = query;
    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { tenNCC: { $regex: search.trim(), $options: 'i' } },
        { sdt: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    return await NhaCungCap.find(filter).sort({ createdAt: -1 });
  }

  async getNhaCungCapDetail(id) {
    const ncc = await NhaCungCap.findById(id);
    if (!ncc) {
      throw this.createError('Không tìm thấy nhà cung cấp', 404);
    }
    return ncc;
  }

  async createNhaCungCap(payload = {}) {
    const { tenNCC, sdt, diaChi } = payload;
    if (!tenNCC || !tenNCC.trim()) {
      throw this.createError('Vui lòng nhập tên nhà cung cấp', 400);
    }

    return await NhaCungCap.create({
      tenNCC: tenNCC.trim(),
      sdt: sdt ? sdt.trim() : '',
      diaChi: diaChi ? diaChi.trim() : ''
    });
  }

  async updateNhaCungCap(id, payload = {}) {
    const { tenNCC, sdt, diaChi } = payload;
    const updated = await NhaCungCap.findByIdAndUpdate(
      id,
      {
        tenNCC: tenNCC ? tenNCC.trim() : undefined,
        sdt: sdt !== undefined ? sdt.trim() : undefined,
        diaChi: diaChi !== undefined ? diaChi.trim() : undefined
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw this.createError('Không tìm thấy nhà cung cấp để cập nhật', 404);
    }

    return updated;
  }

  async deleteNhaCungCap(id) {
    const deleted = await NhaCungCap.findByIdAndDelete(id);
    if (!deleted) {
      throw this.createError('Không tìm thấy nhà cung cấp', 404);
    }
    return { success: true, id };
  }
}

module.exports = new NhaCungCapService();
