const { NhanVien } = require('../models');

const nhanVienController = {
  // GET /nhan-vien
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

      res.render('nhanvien/index', {
        title: 'Quản lý Nhân viên & Phân quyền - One Tech Store',
        nhanViens,
        roles: ['Quản lý', 'Thủ kho', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Kỹ thuật'],
        filters: { search, vaiTro }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách nhân viên:', error);
      req.flash('error_msg', 'Không thể tải danh sách nhân viên');
      res.redirect('/dashboard');
    }
  },

  // GET /nhan-vien/them-moi
  getCreate: (req, res) => {
    res.render('nhanvien/form', {
      title: 'Thêm Nhân viên mới',
      nhanVien: {},
      roles: ['Quản lý', 'Thủ kho', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Kỹ thuật'],
      isEdit: false
    });
  },

  // POST /nhan-vien/them-moi
  postCreate: async (req, res) => {
    try {
      const { hoTen, sdt, vaiTro, tenDangNhap, matKhau } = req.body;

      if (!hoTen || !vaiTro || !tenDangNhap || !matKhau) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ các trường bắt buộc');
        return res.redirect('/nhan-vien/them-moi');
      }

      const existing = await NhanVien.findOne({ tenDangNhap: tenDangNhap.trim().toLowerCase() });
      if (existing) {
        req.flash('error_msg', 'Tên đăng nhập này đã tồn tại');
        return res.redirect('/nhan-vien/them-moi');
      }

      await NhanVien.create({
        hoTen: hoTen.trim(),
        sdt: sdt ? sdt.trim() : '',
        vaiTro,
        tenDangNhap: tenDangNhap.trim().toLowerCase(),
        matKhau
      });

      req.flash('success_msg', `Đã tạo tài khoản cho nhân viên "${hoTen}" với vai trò ${vaiTro}`);
      res.redirect('/nhan-vien');
    } catch (error) {
      console.error('Lỗi tạo nhân viên:', error);
      req.flash('error_msg', 'Lỗi khi tạo nhân viên: ' + error.message);
      res.redirect('/nhan-vien/them-moi');
    }
  },

  // GET /nhan-vien/:id/chinh-sua
  getEdit: async (req, res) => {
    try {
      const nhanVien = await NhanVien.findById(req.params.id).select('-matKhau');
      if (!nhanVien) {
        req.flash('error_msg', 'Không tìm thấy nhân viên');
        return res.redirect('/nhan-vien');
      }

      res.render('nhanvien/form', {
        title: `Chỉnh sửa - ${nhanVien.hoTen}`,
        nhanVien,
        roles: ['Quản lý', 'Thủ kho', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Kỹ thuật'],
        isEdit: true
      });
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi tải thông tin nhân viên');
      res.redirect('/nhan-vien');
    }
  },

  // POST /nhan-vien/:id/chinh-sua
  postEdit: async (req, res) => {
    try {
      const { hoTen, sdt, vaiTro, matKhau, trangThai } = req.body;
      const nhanVien = await NhanVien.findById(req.params.id);

      if (!nhanVien) {
        req.flash('error_msg', 'Không tìm thấy nhân viên');
        return res.redirect('/nhan-vien');
      }

      nhanVien.hoTen = hoTen.trim();
      nhanVien.sdt = sdt ? sdt.trim() : '';
      nhanVien.vaiTro = vaiTro;
      nhanVien.trangThai = trangThai || nhanVien.trangThai;

      // Nếu nhập mật khẩu mới thì cập nhật
      if (matKhau && matKhau.trim().length > 0) {
        nhanVien.matKhau = matKhau.trim();
      }

      await nhanVien.save();

      req.flash('success_msg', 'Cập nhật thông tin nhân viên thành công');
      res.redirect('/nhan-vien');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi cập nhật nhân viên: ' + error.message);
      res.redirect(`/nhan-vien/${req.params.id}/chinh-sua`);
    }
  },

  // POST /nhan-vien/:id/xoa
  delete: async (req, res) => {
    try {
      // Không cho tự xóa chính mình
      if (req.session.user._id.toString() === req.params.id) {
        req.flash('error_msg', 'Bạn không thể tự xóa tài khoản đang đăng nhập');
        return res.redirect('/nhan-vien');
      }

      await NhanVien.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Đã xóa nhân viên thành công');
      res.redirect('/nhan-vien');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi xóa nhân viên');
      res.redirect('/nhan-vien');
    }
  }
};

module.exports = nhanVienController;
