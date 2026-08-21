/**
 * BaseController - Lớp Controller cha chuẩn hóa phản hồi RESTful API JSON
 * Theo đúng quy ước kế hoạch phát triển: { success: true/false, message: "...", ... }
 */

class BaseController {
  /**
   * Trả về phản hồi thành công (HTTP 200/201)
   */
  sendSuccess(res, data = null, message = 'Thành công', statusCode = 200, extra = {}) {
    const response = {
      success: true,
      message,
      ...extra
    };

    if (data !== null && data !== undefined) {
      // Nếu data đã có cấu trúc riêng (như pagination) hoặc là array/object
      if (typeof data === 'object' && !Array.isArray(data) && (data.pagination || data.stats || data.sanPhams || data.imeis || data.hoaDons || data.phieuBaoHanhs)) {
        Object.assign(response, data);
      } else {
        response.data = data;
      }
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Trả về phản hồi lỗi với mã HTTP tương ứng (400, 401, 403, 404, 409, 500)
   */
  sendError(res, message = 'Đã xảy ra lỗi', statusCode = 400, extra = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...extra
    });
  }

  /**
   * Bắt lỗi từ tầng Service hoặc Database và trả về phản hồi chuẩn
   */
  handleError(res, error, defaultMessage = 'Đã xảy ra lỗi trong quá trình xử lý') {
    console.error(`[Controller Error]:`, error);

    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || defaultMessage;

    const extra = {};
    if (error.invalidImeis) extra.invalidImeis = error.invalidImeis;
    if (error.missingImeis) extra.missingImeis = error.missingImeis;
    if (error.existingImeis) extra.existingImeis = error.existingImeis;

    return this.sendError(res, message, statusCode, extra);
  }
}

module.exports = BaseController;
