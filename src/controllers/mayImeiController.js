const { MayImei, SanPham } = require('../models');

const mayImeiController = {
  // GET /may-imei
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

      res.render('mayimei/index', {
        title: 'Quản lý IMEI / Serial - One Tech Store',
        imeis,
        sanPhams,
        filters: { search, sanPhamId, trangThai }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách IMEI:', error);
      req.flash('error_msg', 'Không thể tải danh sách máy IMEI');
      res.redirect('/dashboard');
    }
  },

  // GET /may-imei/them-moi
  getCreate: async (req, res) => {
    try {
      const { sanPhamId } = req.query;
      const sanPhams = await SanPham.find().sort({ tenMay: 1 });
      res.render('mayimei/form', {
        title: 'Nhập máy IMEI mới',
        mayImei: { sanPham: sanPhamId || '' },
        sanPhams,
        isEdit: false
      });
    } catch (error) {
      req.flash('error_msg', 'Không thể tải biểu mẫu nhập IMEI');
      res.redirect('/may-imei');
    }
  },

  // POST /may-imei/them-moi (Hỗ trợ nhập 1 máy hoặc nhập hàng loạt danh sách IMEI)
  postCreate: async (req, res) => {
    try {
      const { sanPham, giaNhap, trangThai, mauSac, dungLuong, imeiList, singleImei } = req.body;

      if (!sanPham || !giaNhap) {
        req.flash('error_msg', 'Vui lòng chọn Sản phẩm và nhập Giá nhập');
        return res.redirect('/may-imei/them-moi');
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
        req.flash('error_msg', 'Vui lòng nhập ít nhất 1 số IMEI');
        return res.redirect('/may-imei/them-moi');
      }

      // Kiểm tra trùng lặp IMEI
      const existing = await MayImei.find({ imei: { $in: rawImeis } });
      if (existing.length > 0) {
        const dupList = existing.map(e => e.imei).join(', ');
        req.flash('error_msg', `Các IMEI sau đã tồn tại trong hệ thống: ${dupList}`);
        return res.redirect('/may-imei/them-moi');
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

      req.flash('success_msg', `Đã nhập thành công ${docs.length} máy IMEI vào kho`);
      res.redirect('/may-imei');
    } catch (error) {
      console.error('Lỗi nhập IMEI:', error);
      req.flash('error_msg', 'Lỗi khi nhập IMEI: ' + error.message);
      res.redirect('/may-imei/them-moi');
    }
  },

  // GET /may-imei/:imei/chinh-sua
  getEdit: async (req, res) => {
    try {
      const [mayImei, sanPhams] = await Promise.all([
        MayImei.findOne({ imei: req.params.imei }).populate('sanPham'),
        SanPham.find().sort({ tenMay: 1 })
      ]);

      if (!mayImei) {
        req.flash('error_msg', 'Không tìm thấy máy IMEI');
        return res.redirect('/may-imei');
      }

      res.render('mayimei/form', {
        title: `Chỉnh sửa IMEI: ${mayImei.imei}`,
        mayImei,
        sanPhams,
        isEdit: true
      });
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi tải thông tin IMEI');
      res.redirect('/may-imei');
    }
  },

  // POST /may-imei/:imei/chinh-sua
  postEdit: async (req, res) => {
    try {
      const { sanPham, giaNhap, trangThai, mauSac, dungLuong } = req.body;

      await MayImei.findOneAndUpdate(
        { imei: req.params.imei },
        {
          sanPham,
          giaNhap: Number(giaNhap),
          trangThai,
          mauSac: mauSac ? mauSac.trim() : '',
          dungLuong: dungLuong ? dungLuong.trim() : ''
        }
      );

      req.flash('success_msg', `Cập nhật thông tin IMEI ${req.params.imei} thành công`);
      res.redirect('/may-imei');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi cập nhật IMEI');
      res.redirect(`/may-imei/${req.params.imei}/chinh-sua`);
    }
  },

  // POST /may-imei/:imei/xoa
  delete: async (req, res) => {
    try {
      const may = await MayImei.findOne({ imei: req.params.imei });
      if (!may) {
        req.flash('error_msg', 'Không tìm thấy IMEI');
        return res.redirect('/may-imei');
      }

      if (may.trangThai === 'Da ban') {
        req.flash('error_msg', 'Không thể xóa máy đã bán. Vui lòng kiểm tra lại lịch sử hóa đơn.');
        return res.redirect('/may-imei');
      }

      await MayImei.findOneAndDelete({ imei: req.params.imei });
      req.flash('success_msg', `Đã xóa IMEI ${req.params.imei} thành công`);
      res.redirect('/may-imei');
    } catch (error) {
      req.flash('error_msg', 'Lỗi khi xóa IMEI');
      res.redirect('/may-imei');
    }
  }
};

module.exports = mayImeiController;
