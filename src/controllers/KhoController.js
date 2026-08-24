const BaseController = require('./BaseController');
const TonKhoService = require('../services/TonKhoService');

class KhoController extends BaseController {
  /**
   * GET /api/kho/ton-kho?maKho=
   */
  async layTonKho(req, res) {
    try {
      const { maKho } = req.query;
      const data = await TonKhoService.layThongKeTonKho({ maKho });
      return this.sendSuccess(res, data, 'Lấy thống kê tồn kho thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }

  /**
   * GET /api/kho/phieu-xuat
   */
  async layPhieuXuat(req, res) {
    try {
      const { page, limit } = req.query;
      const data = await TonKhoService.layDanhSachPhieuXuat({ page, limit });
      return this.sendSuccess(res, data, 'Lấy danh sách phiếu xuất kho thành công');
    } catch (err) {
      return this.handleError(res, err);
    }
  }
}

module.exports = new KhoController();