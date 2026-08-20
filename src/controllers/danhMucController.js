const { DanhMuc, SanPham, PhuKien } = require('../models');

const danhMucController = {
  // GET /api/danh-muc
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

      return res.status(200).json({
        success: true,
        data: danhMucWithCounts
      });
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách danh mục: ' + error.message
      });
    }
  },

  // POST /api/danh-muc
  postCreate: async (req, res) => {
    try {
      const { tenDanhMuc } = req.body;
      if (!tenDanhMuc || !tenDanhMuc.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục không được để trống'
        });
      }

      const newDM = await DanhMuc.create({ tenDanhMuc: tenDanhMuc.trim() });
      return res.status(201).json({
        success: true,
        message: `Đã thêm danh mục "${tenDanhMuc}" thành công`,
        data: newDM
      });
    } catch (error) {
      console.error('Lỗi thêm danh mục:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm danh mục: ' + error.message
      });
    }
  },

  // PUT /api/danh-muc/:id
  postEdit: async (req, res) => {
    try {
      const { tenDanhMuc } = req.body;
      if (!tenDanhMuc || !tenDanhMuc.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục không được để trống'
        });
      }

      const updated = await DanhMuc.findByIdAndUpdate(
        req.params.id,
        { tenDanhMuc: tenDanhMuc.trim() },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục để cập nhật'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật danh mục thành công',
        data: updated
      });
    } catch (error) {
      console.error('Lỗi cập nhật danh mục:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật danh mục: ' + error.message
      });
    }
  },

  // DELETE /api/danh-muc/:id
  delete: async (req, res) => {
    try {
      const countSP = await SanPham.countDocuments({ danhMuc: req.params.id });
      const countPK = await PhuKien.countDocuments({ danhMuc: req.params.id });
      if (countSP > 0 || countPK > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa: Danh mục đang chứa ${countSP} sản phẩm và ${countPK} phụ kiện`
        });
      }

      const deleted = await DanhMuc.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục để xóa'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã xóa danh mục thành công'
      });
    } catch (error) {
      console.error('Lỗi xóa danh mục:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa danh mục: ' + error.message
      });
    }
  }
};

module.exports = danhMucController;
