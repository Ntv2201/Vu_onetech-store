/**
 * BaseService - Lớp cha cho tất cả các Service nghiệp vụ trong hệ thống One Tech Store
 * Cung cấp các hàm tiện ích chung về phân trang, xử lý lỗi, validate
 */

class BaseService {
  constructor(model = null) {
    this.model = model;
  }

  /**
   * Tạo cấu trúc phân trang chuẩn
   */
  getPaginationOptions(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Định dạng đối tượng lỗi có HTTP status code
   */
  createError(message, statusCode = 400, extra = {}) {
    const error = new Error(message);
    error.statusCode = statusCode;
    Object.assign(error, extra);
    return error;
  }
}

module.exports = BaseService;
