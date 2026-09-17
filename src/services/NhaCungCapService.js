const BaseService = require('./BaseService');
const { NhaCungCap, PhieuNhap, CongNo } = require('../models');

class NhaCungCapService extends BaseService {
  constructor() {
    super(NhaCungCap);
  }

  async getAllNhaCungCaps(query = {}) {
    const { search } = query;
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
      filter.$or = [
        { tenNCC: { $regex: safeSearch, $options: 'i' } },
        { sdt: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    return await NhaCungCap.find(filter).sort({ createdAt: -1 }).lean();
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
    const tenNCC_trim = tenNCC.trim();
    const sdt_trim = sdt ? sdt.trim() : '';

    const orConditions = [{ tenNCC: new RegExp(`^${tenNCC_trim}$`, 'i') }];
    if (sdt_trim) {
      orConditions.push({ sdt: sdt_trim });
    }

    const existingNcc = await NhaCungCap.findOne({ $or: orConditions }).lean();
    if (existingNcc) {
      if (existingNcc.tenNCC.toLowerCase() === tenNCC_trim.toLowerCase()) {
        throw this.createError(`Nhà cung cấp có tên "${existingNcc.tenNCC}" đã tồn tại`, 409);
      }
      if (sdt_trim && existingNcc.sdt === sdt_trim) {
        throw this.createError(`Nhà cung cấp với số điện thoại "${sdt_trim}" đã tồn tại`, 409);
      }
    }

    return await NhaCungCap.create({
      tenNCC: tenNCC.trim(),
      sdt: sdt ? sdt.trim() : '',
      diaChi: diaChi ? diaChi.trim() : ''
    });
  }

  async updateNhaCungCap(id, payload = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('ID nhà cung cấp không hợp lệ', 400);
    }
    const { tenNCC, sdt, diaChi } = payload;
    const tenNCC_trim = tenNCC ? tenNCC.trim() : undefined;
    const sdt_trim = sdt !== undefined ? sdt.trim() : undefined;

    if (tenNCC_trim || sdt_trim !== undefined) {
      const orConditions = [];
      if (tenNCC_trim) orConditions.push({ tenNCC: new RegExp(`^${tenNCC_trim}$`, 'i') });
      if (sdt_trim) orConditions.push({ sdt: sdt_trim });

      if (orConditions.length > 0) {
        const existingNcc = await NhaCungCap.findOne({ _id: { $ne: id }, $or: orConditions }).lean();
        if (existingNcc) {
          if (tenNCC_trim && existingNcc.tenNCC.toLowerCase() === tenNCC_trim.toLowerCase()) {
             throw this.createError(`Nhà cung cấp có tên "${existingNcc.tenNCC}" đã tồn tại`, 409);
          }
          if (sdt_trim && existingNcc.sdt === sdt_trim) {
             throw this.createError(`Nhà cung cấp với số điện thoại "${sdt_trim}" đã tồn tại`, 409);
          }
        }
      }
    }

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

  async toggleStatusNhaCungCap(id) {
    const ncc = await NhaCungCap.findById(id);
    if (!ncc) {
      throw this.createError('Không tìm thấy nhà cung cấp', 404);
    }
    ncc.status = !ncc.status;
    await ncc.save();
    return { success: true, id, status: ncc.status };
  }

  async deleteNhaCungCap(id) {
    return this.toggleStatusNhaCungCap(id);
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
        .limit(limit)
        .lean(),
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
