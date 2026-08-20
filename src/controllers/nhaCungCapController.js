const { NhaCungCap, PhieuNhap } = require('../models');

const nhaCungCapController = {
  // GET /api/nha-cung-cap
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

      return res.status(200).json({
        success: true,
        data: nhaCungCaps
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách NCC:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách nhà cung cấp: ' + error.message
      });
    }
  },

  // GET /api/nha-cung-cap/:id
  getDetail: async (req, res) => {
    try {
      const nhaCungCap = await NhaCungCap.findById(req.params.id);
      if (!nhaCungCap) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhà cung cấp'
        });
      }
      return res.status(200).json({
        success: true,
        data: nhaCungCap
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết nhà cung cấp:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thông tin nhà cung cấp: ' + error.message
      });
    }
  },

  // POST /api/nha-cung-cap
  postCreate: async (req, res) => {
    try {
      const { tenNCC, sdt, diaChi } = req.body;

      if (!tenNCC || !tenNCC.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên nhà cung cấp không được để trống'
        });
      }

      const newNCC = await NhaCungCap.create({
        tenNCC: tenNCC.trim(),
        sdt: sdt ? sdt.trim() : '',
        diaChi: diaChi ? diaChi.trim() : ''
      });

      return res.status(201).json({
        success: true,
        message: `Đã thêm nhà cung cấp "${tenNCC}" thành công`,
        data: newNCC
      });
    } catch (error) {
      console.error('Lỗi thêm nhà cung cấp:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm nhà cung cấp: ' + error.message
      });
    }
  },

  // PUT /api/nha-cung-cap/:id
  postEdit: async (req, res) => {
    try {
      const { tenNCC, sdt, diaChi } = req.body;

      if (!tenNCC || !tenNCC.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên nhà cung cấp không được để trống'
        });
      }

      const updated = await NhaCungCap.findByIdAndUpdate(
        req.params.id,
        {
          tenNCC: tenNCC.trim(),
          sdt: sdt ? sdt.trim() : '',
          diaChi: diaChi ? diaChi.trim() : ''
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhà cung cấp để cập nhật'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật nhà cung cấp thành công',
        data: updated
      });
    } catch (error) {
      console.error('Lỗi cập nhật nhà cung cấp:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật nhà cung cấp: ' + error.message
      });
    }
  },

  // DELETE /api/nha-cung-cap/:id
  delete: async (req, res) => {
    try {
      const countPN = await PhieuNhap.countDocuments({ nhaCungCap: req.params.id });
      if (countPN > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa: Đã có ${countPN} phiếu nhập từ nhà cung cấp này`
        });
      }

      const deleted = await NhaCungCap.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhà cung cấp để xóa'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã xóa nhà cung cấp thành công'
      });
    } catch (error) {
      console.error('Lỗi xóa nhà cung cấp:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa nhà cung cấp: ' + error.message
      });
    }
  }
};

module.exports = nhaCungCapController;
