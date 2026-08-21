const BaseController = require('./BaseController');
const { DashboardService } = require('../services');

class DashboardController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
  }

  // GET /api/dashboard
  async index(req, res) {
    try {
      const data = await DashboardService.getDashboardStats();
      return this.sendSuccess(res, data, 'Lấy dữ liệu thống kê dashboard thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tải dữ liệu thống kê dashboard');
    }
  }
}

module.exports = new DashboardController();
