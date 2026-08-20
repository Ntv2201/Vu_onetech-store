const { NhanVien } = require('../models');

const ROLES = ['Quản lý', 'Thủ kho', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Kỹ thuật'];

const nhanVienController = {
  // GET /api/nhan-vien
  index: async (req, res) => {
    try {
      const { search, vaiTro } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { hoTen: { $regex: search.trim(), $options: 'i' } },
          { tenDangNhap: { $regex: search.trim(), $options: 'i' } },
          { sdt: { $regex: search.trim(), $options: 'i' } }
        ];
      }
      if (vaiTro) {
        query.vaiTro = vaiTro;
      }

      const nhanViens = await NhanVien.find(query).select('-matKhau').sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: nhanViens,
        roles: ROLES
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách nhân viên:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách nhân viên: ' + error.message
      });
    }
  },

  // GET /api/nhan-vien/:id
  getDetail: async (req, res) => {
    try {
      const nhanVien = await NhanVien.findById(req.params.id).select('-matKhau');
      if (!nhanVien) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhân viên'
        });
      }
      return res.status(200).json({
        success: true,
        data: nhanVien,
        roles: ROLES
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết nhân viên:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thông tin nhân viên: ' + error.message
      });
    }
  },

  // POST /api/nhan-vien
  postCreate: async (req, res) => {
    try {
      const { hoTen, sdt, vaiTro, tenDangNhap, matKhau } = req.body;

      if (!hoTen || !vaiTro || !tenDangNhap || !matKhau) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ các trường bắt buộc (Họ tên, Vai trò, Tên đăng nhập, Mật khẩu)'
        });
      }

      const existing = await NhanVien.findOne({ tenDangNhap: tenDangNhap.trim().toLowerCase() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập này đã tồn tại trong hệ thống'
        });
      }

      const newNV = await NhanVien.create({
        hoTen: hoTen.trim(),
        sdt: sdt ? sdt.trim() : '',
        vaiTro,
        tenDangNhap: tenDangNhap.trim().toLowerCase(),
        matKhau
      });

      return res.status(201).json({
        success: true,
        message: `Đã tạo tài khoản cho nhân viên "${hoTen}" với vai trò ${vaiTro}`,
        data: {
          _id: newNV._id,
          hoTen: newNV.hoTen,
          tenDangNhap: newNV.tenDangNhap,
          vaiTro: newNV.vaiTro,
          sdt: newNV.sdt,
          trangThai: newNV.trangThai
        }
      });
    } catch (error) {
      console.error('Lỗi tạo nhân viên:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo nhân viên: ' + error.message
      });
    }
  },

  // PUT /api/nhan-vien/:id
  postEdit: async (req, res) => {
    try {
      const { hoTen, sdt, vaiTro, matKhau, trangThai } = req.body;
      const nhanVien = await NhanVien.findById(req.params.id);

      if (!nhanVien) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhân viên để cập nhật'
        });
      }

      nhanVien.hoTen = hoTen ? hoTen.trim() : nhanVien.hoTen;
      nhanVien.sdt = sdt !== undefined ? sdt.trim() : nhanVien.sdt;
      nhanVien.vaiTro = vaiTro || nhanVien.vaiTro;
      nhanVien.trangThai = trangThai || nhanVien.trangThai;

      // Nếu nhập mật khẩu mới thì cập nhật
      if (matKhau && matKhau.trim().length > 0) {
        nhanVien.matKhau = matKhau.trim();
      }

      await nhanVien.save();

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin nhân viên thành công',
        data: {
          _id: nhanVien._id,
          hoTen: nhanVien.hoTen,
          tenDangNhap: nhanVien.tenDangNhap,
          vaiTro: nhanVien.vaiTro,
          sdt: nhanVien.sdt,
          trangThai: nhanVien.trangThai
        }
      });
    } catch (error) {
      console.error('Lỗi cập nhật nhân viên:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật nhân viên: ' + error.message
      });
    }
  },

  // DELETE /api/nhan-vien/:id
  delete: async (req, res) => {
    try {
      // Không cho tự xóa chính mình
      if (req.session.user && req.session.user._id.toString() === req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Bạn không thể tự xóa tài khoản đang đăng nhập'
        });
      }

      const deleted = await NhanVien.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhân viên để xóa'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã xóa nhân viên thành công'
      });
    } catch (error) {
      console.error('Lỗi xóa nhân viên:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa nhân viên: ' + error.message
      });
    }
  }
};

module.exports = nhanVienController;
