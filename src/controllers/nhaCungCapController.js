const { NhaCungCap, PhieuNhap } = require('../models');

const nhaCungCapController = {
  // GET /nha-cung-cap
  index: async (req, res) => {
    try {
      const { search } = req.query;
      const query = {};
      if (search) {
        query.$or = [
          { tenNCC: { $regex: search.trim(), $options: 'i' } },
          { sdt: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      const nhaCungCaps = await NhaCungCap.find(query).sort({ createdAt: -1 });

      res.render('nhacungcap/index', {
        title: 'Quản lý Nhà cung cấp - One Tech Store',
        nhaCungCaps,
        filters: { search }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách NCC:', error);
      req.flash('error_msg', 'Không thể tải danh sách nhà cung cấp');
      res.redirect('/dashboard');
    }
  },

  // GET /nha-cung-cap/them-moi
  getCreate: (req, res) => {
    res.render('nhacungcap/form', {
      title: 'Thêm Nhà cung cấp mới',
      nhaCungCap: {},
      isEdit: false
    });
  },

  // POST /nha-cung-cap/them-moi
  postCreate: async (req, res) => {
    try {
      const { tenNCC, sdt, diaChi } = req.body;

      if (!tenNCC) {
        req.flash('error_msg', 'Tên nhà cung cấp không được để trống');
        return res.redirect('/nha-cung-cap/them-moi');
      }

      await NhaCungCap.create({
        tenNCC: tenNCC.trim(),
        sdt: sdt ? sdt.trim() : '',
        diaChi: diaChi ? diaChi.trim() : ''
      });

      req.flash('success_msg', `Đã thêm nhà cung cấp "${tenNCC}"`);
      res.redirect('/nha-cung-cap');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi thêm nhà cung cấp: ' + error.message);
      res.redirect('/nha-cung-cap/them-moi');
    }
  },

  // GET /nha-cung-cap/:id/chinh-sua
  getEdit: async (req, res) => {
    try {
      const nhaCungCap = await NhaCungCap.findById(req.params.id);
      if (!nhaCungCap) {
        req.flash('error_msg', 'Không tìm thấy nhà cung cấp');
        return res.redirect('/nha-cung-cap');
      }
      res.render('nhacungcap/form', {
        title: `Chỉnh sửa - ${nhaCungCap.tenNCC}`,
        nhaCungCap,
        isEdit: true
      });
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi tải thông tin nhà cung cấp');
      res.redirect('/nha-cung-cap');
    }
  },

  // POST /nha-cung-cap/:id/chinh-sua
  postEdit: async (req, res) => {
    try {
      const { tenNCC, sdt, diaChi } = req.body;
      await NhaCungCap.findByIdAndUpdate(req.params.id, {
        tenNCC: tenNCC.trim(),
        sdt: sdt ? sdt.trim() : '',
        diaChi: diaChi ? diaChi.trim() : ''
      });

      req.flash('success_msg', 'Cập nhật nhà cung cấp thành công');
      res.redirect('/nha-cung-cap');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi cập nhật nhà cung cấp');
      res.redirect(`/nha-cung-cap/${req.params.id}/chinh-sua`);
    }
  },

  // POST /nha-cung-cap/:id/xoa
  delete: async (req, res) => {
    try {
      const countPN = await PhieuNhap.countDocuments({ nhaCungCap: req.params.id });
      if (countPN > 0) {
        req.flash('error_msg', `Không thể xóa: Đã có ${countPN} phiếu nhập từ nhà cung cấp này`);
        return res.redirect('/nha-cung-cap');
      }

      await NhaCungCap.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Đã xóa nhà cung cấp thành công');
      res.redirect('/nha-cung-cap');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi xóa nhà cung cấp');
      res.redirect('/nha-cung-cap');
    }
  }
};

module.exports = nhaCungCapController;
