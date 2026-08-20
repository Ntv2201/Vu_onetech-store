const { DanhMuc, SanPham, PhuKien } = require('../models');

const danhMucController = {
  // GET /danh-muc
  index: async (req, res) => {
    try {
      const danhMucs = await DanhMuc.find().sort({ tenDanhMuc: 1 });
      
      const danhMucWithCounts = await Promise.all(
        danhMucs.map(async (dm) => {
          const countSP = await SanPham.countDocuments({ danhMuc: dm._id });
          const countPK = await PhuKien.countDocuments({ danhMuc: dm._id });
          return {
            ...dm.toObject(),
            countSP,
            countPK
          };
        })
      );

      res.render('danhmuc/index', {
        title: 'Quản lý Danh mục - One Tech Store',
        danhMucs: danhMucWithCounts
      });
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
      req.flash('error_msg', 'Không thể tải danh sách danh mục');
      res.redirect('/dashboard');
    }
  },

  // POST /danh-muc/them-moi
  postCreate: async (req, res) => {
    try {
      const { tenDanhMuc } = req.body;
      if (!tenDanhMuc || !tenDanhMuc.trim()) {
        req.flash('error_msg', 'Tên danh mục không được để trống');
        return res.redirect('/danh-muc');
      }

      await DanhMuc.create({ tenDanhMuc: tenDanhMuc.trim() });
      req.flash('success_msg', `Đã thêm danh mục "${tenDanhMuc}"`);
      res.redirect('/danh-muc');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi thêm danh mục: ' + error.message);
      res.redirect('/danh-muc');
    }
  },

  // POST /danh-muc/:id/chinh-sua
  postEdit: async (req, res) => {
    try {
      const { tenDanhMuc } = req.body;
      await DanhMuc.findByIdAndUpdate(req.params.id, { tenDanhMuc: tenDanhMuc.trim() });
      req.flash('success_msg', 'Cập nhật danh mục thành công');
      res.redirect('/danh-muc');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi cập nhật danh mục');
      res.redirect('/danh-muc');
    }
  },

  // POST /danh-muc/:id/xoa
  delete: async (req, res) => {
    try {
      const countSP = await SanPham.countDocuments({ danhMuc: req.params.id });
      if (countSP > 0) {
        req.flash('error_msg', `Không thể xóa danh mục đang chứa ${countSP} sản phẩm`);
        return res.redirect('/danh-muc');
      }

      await DanhMuc.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Đã xóa danh mục thành công');
      res.redirect('/danh-muc');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi xóa danh mục');
      res.redirect('/danh-muc');
    }
  }
};

module.exports = danhMucController;
