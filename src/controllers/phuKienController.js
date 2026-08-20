const { PhuKien, DanhMuc } = require('../models');

const phuKienController = {
  // GET /api/phu-kien
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

      return res.status(200).json({
        success: true,
        data: phuKiens,
        danhMucs
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách phụ kiện:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách phụ kiện: ' + error.message
      });
    }
  },

  // GET /api/phu-kien/:id
  getDetail: async (req, res) => {
    try {
      const phuKien = await PhuKien.findById(req.params.id).populate('danhMuc');
      if (!phuKien) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phụ kiện'
        });
      }
      return res.status(200).json({
        success: true,
        data: phuKien
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết phụ kiện:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thông tin phụ kiện: ' + error.message
      });
    }
  },

  // POST /api/phu-kien
  postCreate: async (req, res) => {
    try {
      const { tenPK, danhMuc, giaBan, soLuongTon } = req.body;

      if (!tenPK || !danhMuc || giaBan === undefined || giaBan === '') {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ Tên phụ kiện, Danh mục và Giá bán'
        });
      }

      const newPK = await PhuKien.create({
        tenPK: tenPK.trim(),
        danhMuc,
        giaBan: Number(giaBan),
        soLuongTon: soLuongTon !== undefined ? Number(soLuongTon) : 0
      });

      return res.status(201).json({
        success: true,
        message: `Đã thêm phụ kiện "${tenPK}" thành công`,
        data: newPK
      });
    } catch (error) {
      console.error('Lỗi thêm phụ kiện:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm phụ kiện: ' + error.message
      });
    }
  },

  // PUT /api/phu-kien/:id
  postEdit: async (req, res) => {
    try {
      const { tenPK, danhMuc, giaBan, soLuongTon } = req.body;

      const updated = await PhuKien.findByIdAndUpdate(
        req.params.id,
        {
          tenPK: tenPK.trim(),
          danhMuc,
          giaBan: Number(giaBan),
          soLuongTon: Number(soLuongTon)
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phụ kiện để cập nhật'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật phụ kiện thành công',
        data: updated
      });
    } catch (error) {
      console.error('Lỗi cập nhật phụ kiện:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật phụ kiện: ' + error.message
      });
    }
  },

  // DELETE /api/phu-kien/:id
  delete: async (req, res) => {
    try {
      const deleted = await PhuKien.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phụ kiện để xóa'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã xóa phụ kiện thành công'
      });
    } catch (error) {
      console.error('Lỗi xóa phụ kiện:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa phụ kiện: ' + error.message
      });
    }
  }
};

module.exports = phuKienController;
