const { KhachHang, HoaDon } = require('../models');

const khachHangController = {
  // GET /api/khach-hang
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

      return res.status(200).json({
        success: true,
        data: khachHangs
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách khách hàng:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách khách hàng: ' + error.message
      });
    }
  },

  // GET /api/khach-hang/:id
  getDetail: async (req, res) => {
    try {
      const khachHang = await KhachHang.findById(req.params.id);
      if (!khachHang) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách hàng'
        });
      }
      return res.status(200).json({
        success: true,
        data: khachHang
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết khách hàng:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thông tin khách hàng: ' + error.message
      });
    }
  },

  // POST /api/khach-hang
  postCreate: async (req, res) => {
    try {
      const { hoTen, sdt, diaChi } = req.body;

      if (!hoTen || !hoTen.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Họ tên khách hàng không được để trống'
        });
      }

      const newKH = await KhachHang.create({
        hoTen: hoTen.trim(),
        sdt: sdt ? sdt.trim() : '',
        diaChi: diaChi ? diaChi.trim() : ''
      });

      return res.status(201).json({
        success: true,
        message: `Đã thêm khách hàng "${hoTen}" thành công`,
        data: newKH
      });
    } catch (error) {
      console.error('Lỗi thêm khách hàng:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm khách hàng: ' + error.message
      });
    }
  },

  // PUT /api/khach-hang/:id
  postEdit: async (req, res) => {
    try {
      const { hoTen, sdt, diaChi } = req.body;

      if (!hoTen || !hoTen.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Họ tên khách hàng không được để trống'
        });
      }

      const updated = await KhachHang.findByIdAndUpdate(
        req.params.id,
        {
          hoTen: hoTen.trim(),
          sdt: sdt ? sdt.trim() : '',
          diaChi: diaChi ? diaChi.trim() : ''
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách hàng để cập nhật'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin khách hàng thành công',
        data: updated
      });
    } catch (error) {
      console.error('Lỗi cập nhật khách hàng:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật khách hàng: ' + error.message
      });
    }
  },

  // DELETE /api/khach-hang/:id
  delete: async (req, res) => {
    try {
      const countHD = await HoaDon.countDocuments({ khachHang: req.params.id });
      if (countHD > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa khách hàng đã có ${countHD} hóa đơn trong hệ thống`
        });
      }

      const deleted = await KhachHang.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách hàng để xóa'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã xóa khách hàng thành công'
      });
    } catch (error) {
      console.error('Lỗi xóa khách hàng:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa khách hàng: ' + error.message
      });
    }
  }
};

module.exports = khachHangController;
