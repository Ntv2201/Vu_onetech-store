const mongoose = require('mongoose');
const BaseService = require('./BaseService');
const { KhachHang, HoaDon } = require('../models');

function formatName(str) {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function validatePhone(phone) {
  return phone && /^[0-9]{10}$/.test(phone.trim());
}

class KhachHangService extends BaseService {
  constructor() {
    super(KhachHang);
  }

  async getAllKhachHangs(query = {}) {
    const { search } = query;
    const filter = {};

    if (query.status === 'all') {
      // Không lọc theo status (lấy tất cả)
    } else if (query.status === false || query.status === 'false') {
      filter.status = false;
    } else if (query.status === true || query.status === 'true') {
      filter.status = true;
    } else {
      filter.status = { $ne: false }; // Mặc định chỉ lấy khách hàng còn hoạt động
    }

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { hoTen: { $regex: safeSearch, $options: 'i' } },
        { sdt: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    if (query.hangThanhVien) {
      filter.hangThanhVien = query.hangThanhVien;
    }
    if (query.tongChiTieuMin || query.tongChiTieuMax) {
      filter.tongChiTieu = {};
      if (query.tongChiTieuMin) filter.tongChiTieu.$gte = Number(query.tongChiTieuMin);
      if (query.tongChiTieuMax) filter.tongChiTieu.$lte = Number(query.tongChiTieuMax);
    }

    return await KhachHang.find(filter).sort({ createdAt: -1 }).lean();
  }

  async getKhachHangDetail(id) {
    const khachHang = await KhachHang.findById(id);
    if (!khachHang) {
      throw this.createError('Không tìm thấy khách hàng', 404);
    }

    // Lịch sử mua hàng
    const hoaDons = await HoaDon.find({ khachHang: id }).sort({ ngayLap: -1 }).lean();

    return { khachHang, hoaDons };
  }

  async createKhachHang(payload = {}) {
    const { hoTen, sdt, cccd, diaChi, email } = payload;
    if (!hoTen || !hoTen.trim()) {
      throw this.createError('Vui lòng nhập họ tên khách hàng', 400);
    }
    if (!validatePhone(sdt)) {
      throw this.createError('Số điện thoại không hợp lệ (yêu cầu 10 chữ số)', 400);
    }

    const sdt_trim = sdt.trim();
    const existPhone = await KhachHang.findOne({ sdt: sdt_trim }).lean();
    if (existPhone) {
      throw this.createError(`Số điện thoại ${sdt_trim} đã được đăng ký cho một khách hàng khác`, 409);
    }

    if (email && email.trim() !== '') {
      const existEmail = await KhachHang.findOne({ email: email.trim() }).lean();
      if (existEmail) {
        throw this.createError('Email đã được đăng ký cho một khách hàng khác', 409);
      }
    }

    if (cccd && cccd.trim() !== '') {
      if (!/^[0-9]{12}$/.test(cccd.trim())) {
        throw this.createError('Căn cước công dân không hợp lệ (yêu cầu 12 chữ số)', 400);
      }
      const existCccd = await KhachHang.findOne({ cccd: cccd.trim() }).lean();
      if (existCccd) {
        throw this.createError('Căn cước công dân đã được đăng ký cho một khách hàng khác', 409);
      }
    }

    return await KhachHang.create({
      hoTen: formatName(hoTen),
      sdt: sdt_trim,
      cccd: cccd ? cccd.trim() : undefined,
      diaChi: formatName(diaChi),
      email: email ? email.trim() : '',
      status: true
    });
  }

  async updateKhachHang(id, payload = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.createError('ID khách hàng không hợp lệ', 400);
    }
    const { hoTen, sdt, cccd, diaChi, email, status } = payload;
    
    if (sdt !== undefined) {
      if (!validatePhone(sdt)) {
        throw this.createError('Số điện thoại không hợp lệ (yêu cầu 10 chữ số)', 400);
      }
      const sdt_trim = sdt.trim();
      const existPhone = await KhachHang.findOne({ sdt: sdt_trim, _id: { $ne: id } }).lean();
      if (existPhone) {
        throw this.createError(`Số điện thoại ${sdt_trim} đã được đăng ký cho một khách hàng khác`, 409);
      }
    }

    if (email && email.trim() !== '') {
      const existEmail = await KhachHang.findOne({ email: email.trim(), _id: { $ne: id } }).lean();
      if (existEmail) {
        throw this.createError('Email đã được đăng ký cho một khách hàng khác', 409);
      }
    }

    if (cccd && cccd.trim() !== '') {
      if (!/^[0-9]{12}$/.test(cccd.trim())) {
        throw this.createError('Căn cước công dân không hợp lệ (yêu cầu 12 chữ số)', 400);
      }
      const existCccd = await KhachHang.findOne({ cccd: cccd.trim(), _id: { $ne: id } }).lean();
      if (existCccd) {
        throw this.createError('Căn cước công dân đã được đăng ký cho một khách hàng khác', 409);
      }
    }

    const updated = await KhachHang.findByIdAndUpdate(
      id,
      {
        hoTen: hoTen ? formatName(hoTen) : undefined,
        sdt: sdt !== undefined ? sdt.trim() : undefined,
        cccd: cccd !== undefined ? cccd.trim() : undefined,
        diaChi: diaChi !== undefined ? formatName(diaChi) : undefined,
        email: email !== undefined ? email.trim() : undefined,
        status: status !== undefined ? status : undefined
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw this.createError('Không tìm thấy khách hàng để cập nhật', 404);
    }

    return updated;
  }

  async toggleStatusKhachHang(id) {
    const khachHang = await KhachHang.findById(id);
    if (!khachHang) {
      throw this.createError('Không tìm thấy khách hàng', 404);
    }
    khachHang.status = !khachHang.status;
    await khachHang.save();
    return { success: true, id, status: khachHang.status };
  }

  async deleteKhachHang(id) {
    return this.toggleStatusKhachHang(id);
  }
}

module.exports = new KhachHangService();
