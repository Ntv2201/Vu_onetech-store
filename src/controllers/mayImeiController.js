const { MayImei, SanPham } = require('../models');

const mayImeiController = {
  // GET /api/may-imei
  index: async (req, res) => {
    try {
      const { search, sanPhamId, trangThai } = req.query;
      const query = {};

      if (search) {
        query.imei = { $regex: search.trim(), $options: 'i' };
      }
      if (sanPhamId) {
        query.sanPham = sanPhamId;
      }
      if (trangThai) {
        query.trangThai = trangThai;
      }

      const [imeis, sanPhams] = await Promise.all([
        MayImei.find(query).populate({
          path: 'sanPham',
          populate: { path: 'danhMuc' }
        }).sort({ createdAt: -1 }),
        SanPham.find().sort({ tenMay: 1 })
      ]);

      return res.status(200).json({
        success: true,
        data: imeis,
        sanPhams
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách IMEI:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách máy IMEI: ' + error.message
      });
    }
  },

  // GET /api/may-imei/:imei
  getDetail: async (req, res) => {
    try {
      const [mayImei, sanPhams] = await Promise.all([
        MayImei.findOne({ imei: req.params.imei }).populate('sanPham'),
        SanPham.find().sort({ tenMay: 1 })
      ]);

      if (!mayImei) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy máy IMEI'
        });
      }

      return res.status(200).json({
        success: true,
        mayImei,
        sanPhams
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết IMEI:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thông tin IMEI: ' + error.message
      });
    }
  },

  // POST /api/may-imei (Hỗ trợ nhập 1 máy hoặc nhập hàng loạt danh sách IMEI)
  postCreate: async (req, res) => {
    try {
      const { sanPham, giaNhap, trangThai, mauSac, dungLuong, imeiList, singleImei } = req.body;

      if (!sanPham || giaNhap === undefined || giaNhap === '') {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn Sản phẩm và nhập Giá nhập'
        });
      }

      // Xử lý danh sách IMEI (nhập lẻ hoặc paste nhiều dòng)
      let rawImeis = [];
      if (imeiList && imeiList.trim()) {
        rawImeis = imeiList
          .split(/[\n,;]+/)
          .map(i => i.trim())
          .filter(Boolean);
      } else if (singleImei && singleImei.trim()) {
        rawImeis = [singleImei.trim()];
      }

      if (rawImeis.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập ít nhất 1 số IMEI'
        });
      }

      // Kiểm tra trùng lặp IMEI
      const existing = await MayImei.find({ imei: { $in: rawImeis } });
      if (existing.length > 0) {
        const dupList = existing.map(e => e.imei).join(', ');
        return res.status(400).json({
          success: false,
          message: `Các IMEI sau đã tồn tại trong hệ thống: ${dupList}`
        });
      }

      const docs = rawImeis.map(imeiVal => ({
        imei: imeiVal,
        sanPham,
        giaNhap: Number(giaNhap),
        trangThai: trangThai || 'Con hang',
        mauSac: mauSac ? mauSac.trim() : '',
        dungLuong: dungLuong ? dungLuong.trim() : '',
        ngayNhap: new Date()
      }));

      await MayImei.insertMany(docs);

      return res.status(201).json({
        success: true,
        message: `Đã nhập thành công ${docs.length} máy IMEI vào kho`,
        count: docs.length
      });
    } catch (error) {
      console.error('Lỗi nhập IMEI:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi nhập IMEI: ' + error.message
      });
    }
  },

  // PUT /api/may-imei/:imei
  postEdit: async (req, res) => {
    try {
      const { sanPham, giaNhap, trangThai, mauSac, dungLuong } = req.body;

      const updated = await MayImei.findOneAndUpdate(
        { imei: req.params.imei },
        {
          sanPham,
          giaNhap: Number(giaNhap),
          trangThai,
          mauSac: mauSac ? mauSac.trim() : '',
          dungLuong: dungLuong ? dungLuong.trim() : ''
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy IMEI để cập nhật'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Cập nhật thông tin IMEI ${req.params.imei} thành công`,
        data: updated
      });
    } catch (error) {
      console.error('Lỗi cập nhật IMEI:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật IMEI: ' + error.message
      });
    }
  },

  // DELETE /api/may-imei/:imei
  delete: async (req, res) => {
    try {
      const may = await MayImei.findOne({ imei: req.params.imei });
      if (!may) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy IMEI'
        });
      }

      if (may.trangThai === 'Da ban') {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa máy đã bán. Vui lòng kiểm tra lại lịch sử hóa đơn.'
        });
      }

      await MayImei.findOneAndDelete({ imei: req.params.imei });
      return res.status(200).json({
        success: true,
        message: `Đã xóa IMEI ${req.params.imei} thành công`
      });
    } catch (error) {
      console.error('Lỗi xóa IMEI:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa IMEI: ' + error.message
      });
    }
  }
};

module.exports = mayImeiController;
