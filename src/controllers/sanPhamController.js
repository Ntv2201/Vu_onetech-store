const { SanPham, DanhMuc, MayImei } = require('../models');

const sanPhamController = {
  // GET /api/san-pham
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

      return res.status(200).json({
        success: true,
        data: sanPhamWithCounts,
        danhMucs,
        allHangs: allHangs.filter(Boolean)
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách sản phẩm:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách sản phẩm: ' + error.message
      });
    }
  },

  // GET /api/san-pham/:id
  getDetail: async (req, res) => {
    try {
      const sanPham = await SanPham.findById(req.params.id).populate('danhMuc');
      if (!sanPham) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm'
        });
      }

      const imeis = await MayImei.find({ sanPham: sanPham._id }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        sanPham,
        imeis
      });
    } catch (error) {
      console.error('Lỗi xem chi tiết sản phẩm:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xem chi tiết sản phẩm: ' + error.message
      });
    }
  },

  // POST /api/san-pham
  postCreate: async (req, res) => {
    try {
      const { tenMay, danhMuc, hang, giaBan, soThangBH, moTa, hinhAnh } = req.body;

      if (!tenMay || !danhMuc || !giaBan) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ Tên máy, Danh mục và Giá bán'
        });
      }

      const newSP = await SanPham.create({
        tenMay: tenMay.trim(),
        danhMuc,
        hang: hang ? hang.trim() : '',
        giaBan: Number(giaBan),
        soThangBH: soThangBH ? Number(soThangBH) : 12,
        moTa: moTa ? moTa.trim() : '',
        hinhAnh: hinhAnh ? hinhAnh.trim() : ''
      });

      return res.status(201).json({
        success: true,
        message: `Đã thêm sản phẩm "${tenMay}" thành công`,
        data: newSP
      });
    } catch (error) {
      console.error('Lỗi tạo sản phẩm:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm sản phẩm: ' + error.message
      });
    }
  },

  // PUT /api/san-pham/:id
  postEdit: async (req, res) => {
    try {
      const { tenMay, danhMuc, hang, giaBan, soThangBH, moTa, hinhAnh } = req.body;

      const updated = await SanPham.findByIdAndUpdate(
        req.params.id,
        {
          tenMay: tenMay.trim(),
          danhMuc,
          hang: hang ? hang.trim() : '',
          giaBan: Number(giaBan),
          soThangBH: soThangBH ? Number(soThangBH) : 12,
          moTa: moTa ? moTa.trim() : '',
          hinhAnh: hinhAnh ? hinhAnh.trim() : ''
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm để cập nhật'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật sản phẩm thành công',
        data: updated
      });
    } catch (error) {
      console.error('Lỗi cập nhật sản phẩm:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật sản phẩm: ' + error.message
      });
    }
  },

  // DELETE /api/san-pham/:id
  delete: async (req, res) => {
    try {
      const countImei = await MayImei.countDocuments({ sanPham: req.params.id });
      if (countImei > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa: Sản phẩm đang có ${countImei} bản ghi IMEI trong hệ thống`
        });
      }

      const deleted = await SanPham.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm để xóa'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã xóa sản phẩm thành công'
      });
    } catch (error) {
      console.error('Lỗi xóa sản phẩm:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa sản phẩm: ' + error.message
      });
    }
  }
};

module.exports = sanPhamController;
