const { SanPham, DanhMuc, MayImei } = require('../models');

const sanPhamController = {
  // GET /san-pham
  index: async (req, res) => {
    try {
      const { search, danhMucId, hang } = req.query;
      const query = {};

      if (search) {
        query.tenMay = { $regex: search.trim(), $options: 'i' };
      }
      if (danhMucId) {
        query.danhMuc = danhMucId;
      }
      if (hang) {
        query.hang = { $regex: hang.trim(), $options: 'i' };
      }

      const [sanPhams, danhMucs, allHangs] = await Promise.all([
        SanPham.find(query).populate('danhMuc').sort({ createdAt: -1 }),
        DanhMuc.find().sort({ tenDanhMuc: 1 }),
        SanPham.distinct('hang')
      ]);

      // Đếm số lượng máy IMEI còn hàng cho từng sản phẩm
      const sanPhamWithCounts = await Promise.all(
        sanPhams.map(async (sp) => {
          const conHang = await MayImei.countDocuments({ sanPham: sp._id, trangThai: 'Con hang' });
          const daBan = await MayImei.countDocuments({ sanPham: sp._id, trangThai: 'Da ban' });
          const tongImei = await MayImei.countDocuments({ sanPham: sp._id });
          return {
            ...sp.toObject(),
            soLuongCon: conHang,
            soLuongDaBan: daBan,
            tongImei
          };
        })
      );

      res.render('sanpham/index', {
        title: 'Quản lý Sản phẩm - One Tech Store',
        sanPhams: sanPhamWithCounts,
        danhMucs,
        allHangs: allHangs.filter(Boolean),
        filters: { search, danhMucId, hang }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách sản phẩm:', error);
      req.flash('error_msg', 'Không thể tải danh sách sản phẩm');
      res.redirect('/dashboard');
    }
  },

  // GET /san-pham/them-moi
  getCreate: async (req, res) => {
    try {
      const danhMucs = await DanhMuc.find().sort({ tenDanhMuc: 1 });
      res.render('sanpham/form', {
        title: 'Thêm Sản phẩm mới',
        sanPham: {},
        danhMucs,
        isEdit: false
      });
    } catch (error) {
      req.flash('error_msg', 'Không thể tải biểu mẫu');
      res.redirect('/san-pham');
    }
  },

  // POST /san-pham/them-moi
  postCreate: async (req, res) => {
    try {
      const { tenMay, danhMuc, hang, giaBan, soThangBH, moTa, hinhAnh } = req.body;

      if (!tenMay || !danhMuc || !giaBan) {
        req.flash('error_msg', 'Vui lòng điền đầy đủ Tên máy, Danh mục và Giá bán');
        return res.redirect('/san-pham/them-moi');
      }

      await SanPham.create({
        tenMay: tenMay.trim(),
        danhMuc,
        hang: hang ? hang.trim() : '',
        giaBan: Number(giaBan),
        soThangBH: soThangBH ? Number(soThangBH) : 12,
        moTa: moTa ? moTa.trim() : '',
        hinhAnh: hinhAnh ? hinhAnh.trim() : ''
      });

      req.flash('success_msg', `Đã thêm sản phẩm "${tenMay}" thành công`);
      res.redirect('/san-pham');
    } catch (error) {
      console.error('Lỗi tạo sản phẩm:', error);
      req.flash('error_msg', 'Lỗi khi thêm sản phẩm: ' + error.message);
      res.redirect('/san-pham/them-moi');
    }
  },

  // GET /san-pham/:id/chinh-sua
  getEdit: async (req, res) => {
    try {
      const [sanPham, danhMucs] = await Promise.all([
        SanPham.findById(req.params.id),
        DanhMuc.find().sort({ tenDanhMuc: 1 })
      ]);

      if (!sanPham) {
        req.flash('error_msg', 'Không tìm thấy sản phẩm');
        return res.redirect('/san-pham');
      }

      res.render('sanpham/form', {
        title: `Chỉnh sửa - ${sanPham.tenMay}`,
        sanPham,
        danhMucs,
        isEdit: true
      });
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi tải thông tin sản phẩm');
      res.redirect('/san-pham');
    }
  },

  // POST /san-pham/:id/chinh-sua
  postEdit: async (req, res) => {
    try {
      const { tenMay, danhMuc, hang, giaBan, soThangBH, moTa, hinhAnh } = req.body;

      await SanPham.findByIdAndUpdate(req.params.id, {
        tenMay: tenMay.trim(),
        danhMuc,
        hang: hang ? hang.trim() : '',
        giaBan: Number(giaBan),
        soThangBH: soThangBH ? Number(soThangBH) : 12,
        moTa: moTa ? moTa.trim() : '',
        hinhAnh: hinhAnh ? hinhAnh.trim() : ''
      });

      req.flash('success_msg', 'Cập nhật sản phẩm thành công');
      res.redirect('/san-pham');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi cập nhật sản phẩm');
      res.redirect(`/san-pham/${req.params.id}/chinh-sua`);
    }
  },

  // POST /san-pham/:id/xoa
  delete: async (req, res) => {
    try {
      const countImei = await MayImei.countDocuments({ sanPham: req.params.id });
      if (countImei > 0) {
        req.flash('error_msg', `Không thể xóa: Sản phẩm đang có ${countImei} bản ghi IMEI trong hệ thống`);
        return res.redirect('/san-pham');
      }

      await SanPham.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Đã xóa sản phẩm thành công');
      res.redirect('/san-pham');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi xóa sản phẩm');
      res.redirect('/san-pham');
    }
  },

  // GET /san-pham/:id/chi-tiet
  getDetail: async (req, res) => {
    try {
      const sanPham = await SanPham.findById(req.params.id).populate('danhMuc');
      if (!sanPham) {
        req.flash('error_msg', 'Không tìm thấy sản phẩm');
        return res.redirect('/san-pham');
      }

      const imeis = await MayImei.find({ sanPham: sanPham._id }).sort({ createdAt: -1 });

      res.render('sanpham/detail', {
        title: `Chi tiết - ${sanPham.tenMay}`,
        sanPham,
        imeis
      });
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi xem chi tiết sản phẩm');
      res.redirect('/san-pham');
    }
  }
};

module.exports = sanPhamController;
