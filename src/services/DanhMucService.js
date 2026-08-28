const BaseService = require('./BaseService');
const { DanhMuc, SanPham, PhuKien } = require('../models');

class DanhMucService extends BaseService {
  constructor() {
    super(DanhMuc);
  }

  async getAllDanhMucs() {
    const danhMucs = await DanhMuc.find().sort({ tenDanhMuc: 1 });

    const [spCounts, pkCounts] = await Promise.all([
      SanPham.aggregate([{ $group: { _id: '$danhMuc', count: { $sum: 1 } } }]),
      PhuKien.aggregate([{ $group: { _id: '$danhMuc', count: { $sum: 1 } } }])
    ]);

    const spMap = {};
    spCounts.forEach(c => { if (c._id) spMap[c._id.toString()] = c.count; });
    const pkMap = {};
    pkCounts.forEach(c => { if (c._id) pkMap[c._id.toString()] = c.count; });

    return danhMucs.map(dm => {
      const dmObj = dm.toObject();
      dmObj.countSP = spMap[dm._id.toString()] || 0;
      dmObj.countPK = pkMap[dm._id.toString()] || 0;
      dmObj.totalProducts = (dmObj.countSP + dmObj.countPK);
      return dmObj;
    });
  }

  async getDanhMucDetail(id) {
    const danhMuc = await DanhMuc.findById(id);
    if (!danhMuc) {
      throw this.createError('Không tìm thấy danh mục', 404);
    }
    return danhMuc;
  }

  async createDanhMuc(payload = {}) {
    const { tenDanhMuc, moTa } = payload;
    if (!tenDanhMuc || !tenDanhMuc.trim()) {
      throw this.createError('Vui lòng nhập tên danh mục', 400);
    }

    const existing = await DanhMuc.findOne({ tenDanhMuc: tenDanhMuc.trim() });
    if (existing) {
      throw this.createError('Tên danh mục này đã tồn tại', 409);
    }

    return await DanhMuc.create({
      tenDanhMuc: tenDanhMuc.trim(),
      moTa: moTa ? moTa.trim() : ''
    });
  }

  async updateDanhMuc(id, payload = {}) {
    const { tenDanhMuc, moTa } = payload;

    if (tenDanhMuc && tenDanhMuc.trim()) {
      const dup = await DanhMuc.findOne({ tenDanhMuc: tenDanhMuc.trim(), _id: { $ne: id } });
      if (dup) {
        throw this.createError('Tên danh mục mới đã tồn tại', 409);
      }
    }

    const updated = await DanhMuc.findByIdAndUpdate(
      id,
      {
        tenDanhMuc: tenDanhMuc ? tenDanhMuc.trim() : undefined,
        moTa: moTa !== undefined ? moTa.trim() : undefined
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw this.createError('Không tìm thấy danh mục để cập nhật', 404);
    }

    return updated;
  }

  async deleteDanhMuc(id) {
    const [spCount, pkCount] = await Promise.all([
      SanPham.countDocuments({ danhMuc: id }),
      PhuKien.countDocuments({ danhMuc: id })
    ]);

    if (spCount > 0 || pkCount > 0) {
      throw this.createError(`Không thể xóa danh mục vì vẫn còn ${spCount} sản phẩm máy và ${pkCount} phụ kiện liên kết!`, 400);
    }

    const deleted = await DanhMuc.findByIdAndDelete(id);
    if (!deleted) {
      throw this.createError('Không tìm thấy danh mục', 404);
    }

    return { success: true, id };
  }
}

module.exports = new DanhMucService();
