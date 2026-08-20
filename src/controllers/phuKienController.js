const { PhuKien, DanhMuc } = require('../models');

const phuKienController = {
  // GET /phu-kien
  index: async (req, res) => {
    try {
      const { search, danhMucId } = req.query;
      const query = {};

      if (search) {
        query.tenPK = { $regex: search.trim(), $options: 'i' };
      }
      if (danhMucId) {
        query.danhMuc = danhMucId;
      }

      const [phuKiens, danhMucs] = await Promise.all([
        PhuKien.find(query).populate('danhMuc').sort({ createdAt: -1 }),
        DanhMuc.find().sort({ tenDanhMuc: 1 })
      ]);

      res.render('phukien/index', {
        title: 'Quản lý Phụ kiện - One Tech Store',
        phuKiens,
        danhMucs,
        filters: { search, danhMucId }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách phụ kiện:', error);
      req.flash('error_msg', 'Không thể tải danh sách phụ kiện');
      res.redirect('/dashboard');
    }
  },

  // POST /phu-kien/them-moi
  postCreate: async (req, res) => {
    try {
      const { tenPK, danhMuc, giaBan, soLuongTon } = req.body;

      if (!tenPK || !danhMuc || !giaBan) {
        req.flash('error_msg', 'Vui lòng nhập đầy đủ Tên phụ kiện, Danh mục và Giá bán');
        return res.redirect('/phu-kien');
      }

      await PhuKien.create({
        tenPK: tenPK.trim(),
        danhMuc,
        giaBan: Number(giaBan),
        soLuongTon: soLuongTon ? Number(soLuongTon) : 0
      });

      req.flash('success_msg', `Đã thêm phụ kiện "${tenPK}"`);
      res.redirect('/phu-kien');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi thêm phụ kiện: ' + error.message);
      res.redirect('/phu-kien');
    }
  },

  // POST /phu-kien/:id/chinh-sua
  postEdit: async (req, res) => {
    try {
      const { tenPK, danhMuc, giaBan, soLuongTon } = req.body;

      await PhuKien.findByIdAndUpdate(req.params.id, {
        tenPK: tenPK.trim(),
        danhMuc,
        giaBan: Number(giaBan),
        soLuongTon: Number(soLuongTon)
      });

      req.flash('success_msg', 'Cập nhật phụ kiện thành công');
      res.redirect('/phu-kien');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi cập nhật phụ kiện');
      res.redirect('/phu-kien');
    }
  },

  // POST /phu-kien/:id/xoa
  delete: async (req, res) => {
    try {
      await PhuKien.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Đã xóa phụ kiện thành công');
      res.redirect('/phu-kien');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi xóa phụ kiện');
      res.redirect('/phu-kien');
    }
  }
};

module.exports = phuKienController;
