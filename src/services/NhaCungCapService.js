const BaseService = require('./BaseService');
const { NhaCungCap, PhieuNhap, CongNo } = require('../models');

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

  /**
   * Lấy lịch sử phiếu nhập và tổng hợp dư nợ của Nhà Cung Cấp
   */
  async getLichSuNhap(id, query = {}) {
    // 1. Kiểm tra NCC tồn tại
    const ncc = await this.getNhaCungCapDetail(id);

    // 2. Tính tổng dư nợ hiện tại cộng dồn từ tất cả các khoản công nợ của NCC
    const danhSachCongNo = await CongNo.find({ loaiDoiTuong: 'NhaCungCap', nhaCungCap: id }).lean();
    const duNo = danhSachCongNo.reduce((sum, cn) => sum + Math.max(0, (cn.soTienNo || 0) - (cn.soTienDaTra || 0)), 0);

    // 3. Phân trang và lấy lịch sử Phiếu nhập
    const filter = { nhaCungCap: id };
    const { page, limit, skip } = this.getPaginationOptions(query);
    
    const [list, total] = await Promise.all([
      PhieuNhap.find(filter)
        .populate('nhanVien', 'hoTen tenDangNhap vaiTro')
        .sort({ ngayNhap: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PhieuNhap.countDocuments(filter)
    ]);

    return {
      nhaCungCap: { id: ncc._id, tenNCC: ncc.tenNCC, sdt: ncc.sdt, diaChi: ncc.diaChi },
      duNo,
      lichSuNhap: {
        list,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    };
  }
}

module.exports = new NhaCungCapService();
