const BaseService = require('./BaseService');
const { TonKho, SanPham, Kho, PhieuXuatKho } = require('../models');

/**
 * TonKhoService
 * Phụ trách: Trương Thế An
 *
 * Cung cấp hàm dùng chung capNhatTonKho() để Tuấn (bán hàng), Tuân (nhập kho),
 * Việt (đặt trước / đổi trả) cùng gọi khi cần tăng/giảm tồn kho.
 *
 * LƯU Ý: model TONKHO tham chiếu bằng ObjectId (kho, sanPham), KHÔNG dùng mã
 * chuỗi (MaKho/MaSP) như bản thiết kế CSDL SQL ban đầu — mọi hàm trong service
 * này nhận vào sanPhamId / khoId là ObjectId (hoặc string hợp lệ ObjectId).
 */
const { TonKho, Kho } = require('../models');

class TonKhoService extends BaseService {
  constructor() {
    super(TonKho);
  }

  /**
   * Cập nhật tồn kho dùng chung cho toàn hệ thống.
   * @param {String|ObjectId} sanPhamId
   * @param {String|ObjectId} khoId
   * @param {Number} delta - Dương = nhập vào, Âm = xuất ra.
   * @param {Object} [options]
   * @param {mongoose.ClientSession} [options.session]
   * @param {Boolean} [options.choPhepAm=false]
   * @returns {Promise<Object>} bản ghi TonKho sau khi cập nhật
   */
  async capNhatTonKho(sanPhamId, khoId, delta, options = {}) {
    const { session = null, choPhepAm = false } = options;

    if (!sanPhamId || !khoId) {
      throw this.createError('Thiếu sanPhamId hoặc khoId khi cập nhật tồn kho', 400);
    }
    const soDelta = Number(delta);
    if (Number.isNaN(soDelta) || soDelta === 0) {
      throw this.createError('Giá trị delta không hợp lệ', 400);
    }

    const [sanPham, kho] = await Promise.all([
      SanPham.findById(sanPhamId).session(session),
      Kho.findById(khoId).session(session)
    ]);
    if (!sanPham) throw this.createError(`Không tìm thấy sản phẩm ${sanPhamId}`, 404);
    if (!kho) throw this.createError(`Không tìm thấy kho ${khoId}`, 404);

    let tonKho = await TonKho.findOne({ sanPham: sanPhamId, kho: khoId }).session(session);

    if (!tonKho) {
      if (soDelta < 0 && !choPhepAm) {
        throw this.createError(
          `Không thể xuất kho: sản phẩm chưa có tồn tại kho "${kho.tenKho}"`,
          409
        );
      }
      tonKho = new TonKho({ sanPham: sanPhamId, kho: khoId, soLuong: 0 });
    }

    const soLuongMoi = tonKho.soLuong + soDelta;
    if (soLuongMoi < 0 && !choPhepAm) {
      throw this.createError(
        `Không đủ tồn kho: hiện có ${tonKho.soLuong}, yêu cầu trừ ${Math.abs(soDelta)}`,
        409
      );
    }

    tonKho.soLuong = soLuongMoi;
    await tonKho.save({ session });
    return tonKho;
  }

  /**
   * GET /api/kho/ton-kho?maKho=
   * "maKho" ở đây nhận vào ObjectId của Kho (query string truyền _id).
   * Không truyền -> gộp tồn kho tất cả các kho theo từng sản phẩm.
   */
  async layThongKeTonKho({ maKho } = {}) {
    const filter = maKho ? { kho: maKho } : {};

    const rows = await TonKho.find(filter)
      .populate('sanPham', 'tenMay hang giaBan')
      .populate('kho', 'tenKho')
      .lean();

    if (maKho) {
      return rows.map(r => ({
        sanPham: r.sanPham,
        kho: r.kho,
        soLuong: r.soLuong
      }));
    }

    // Gộp theo sản phẩm khi không lọc theo kho cụ thể
    const gop = new Map();
    for (const r of rows) {
      const key = String(r.sanPham?._id);
      const cur = gop.get(key) || { sanPham: r.sanPham, tongSoLuong: 0, chiTietTheoKho: [] };
      cur.tongSoLuong += r.soLuong;
      cur.chiTietTheoKho.push({ kho: r.kho, soLuong: r.soLuong });
      gop.set(key, cur);
    }
    return [...gop.values()];
  }

  /**
   * GET /api/kho/phieu-xuat
   */
  async layDanhSachPhieuXuat(query = {}) {
    const { page, limit, skip } = this.getPaginationOptions(query);
    const [items, total] = await Promise.all([
      PhieuXuatKho.find()
        .populate({ path: 'hoaDon', select: 'soHD ngayLap tongTien' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PhieuXuatKho.countDocuments()
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new TonKhoService();
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
