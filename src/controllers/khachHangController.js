const { KhachHang, HoaDon } = require('../models');

const khachHangController = {
  // GET /khach-hang
  index: async (req, res) => {
    try {
      const { search } = req.query;
      const query = {};
      if (search) {
        query.$or = [
          { hoTen: { $regex: search.trim(), $options: 'i' } },
          { sdt: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      const khachHangs = await KhachHang.find(query).sort({ createdAt: -1 });

      res.render('khachhang/index', {
        title: 'Quản lý Khách hàng - One Tech Store',
        khachHangs,
        filters: { search }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách khách hàng:', error);
      req.flash('error_msg', 'Không thể tải danh sách khách hàng');
      res.redirect('/dashboard');
    }
  },

  // GET /khach-hang/them-moi
  getCreate: (req, res) => {
    res.render('khachhang/form', {
      title: 'Thêm Khách hàng mới',
      khachHang: {},
      isEdit: false
    });
  },

  // POST /khach-hang/them-moi
  postCreate: async (req, res) => {
    try {
      const { hoTen, sdt, diaChi } = req.body;

      if (!hoTen) {
        req.flash('error_msg', 'Họ tên khách hàng không được để trống');
        return res.redirect('/khach-hang/them-moi');
      }

      await KhachHang.create({
        hoTen: hoTen.trim(),
        sdt: sdt ? sdt.trim() : '',
        diaChi: diaChi ? diaChi.trim() : ''
      });

      req.flash('success_msg', `Đã thêm khách hàng "${hoTen}"`);
      res.redirect('/khach-hang');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi thêm khách hàng: ' + error.message);
      res.redirect('/khach-hang/them-moi');
    }
  },

  // GET /khach-hang/:id/chinh-sua
  getEdit: async (req, res) => {
    try {
      const khachHang = await KhachHang.findById(req.params.id);
      if (!khachHang) {
        req.flash('error_msg', 'Không tìm thấy khách hàng');
        return res.redirect('/khach-hang');
      }
      res.render('khachhang/form', {
        title: `Chỉnh sửa - ${khachHang.hoTen}`,
        khachHang,
        isEdit: true
      });
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi tải thông tin khách hàng');
      res.redirect('/khach-hang');
    }
  },

  // POST /khach-hang/:id/chinh-sua
  postEdit: async (req, res) => {
    try {
      const { hoTen, sdt, diaChi } = req.body;
      await KhachHang.findByIdAndUpdate(req.params.id, {
        hoTen: hoTen.trim(),
        sdt: sdt ? sdt.trim() : '',
        diaChi: diaChi ? diaChi.trim() : ''
      });

      req.flash('success_msg', 'Cập nhật thông tin khách hàng thành công');
      res.redirect('/khach-hang');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi cập nhật khách hàng');
      res.redirect(`/khach-hang/${req.params.id}/chinh-sua`);
    }
  },

  // POST /khach-hang/:id/xoa
  delete: async (req, res) => {
    try {
      const countHD = await HoaDon.countDocuments({ khachHang: req.params.id });
      if (countHD > 0) {
        req.flash('error_msg', `Không thể xóa khách hàng đã có ${countHD} hóa đơn trong hệ thống`);
        return res.redirect('/khach-hang');
      }

      await KhachHang.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Đã xóa khách hàng thành công');
      res.redirect('/khach-hang');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi xóa khách hàng');
      res.redirect('/khach-hang');
    }
  }
};

module.exports = khachHangController;
