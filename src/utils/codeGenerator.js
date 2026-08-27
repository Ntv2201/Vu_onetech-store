/**
 * CodeGenerator - Utility sinh mã chứng từ chuẩn hóa toàn hệ thống OneTech Store
 * Định dạng: [PREFIX][YYMMDD][RANDOM_4_DIGITS] hoặc [PREFIX][TIMESTAMP_SLICE]
 */

const PREFIXES = {
  HOA_DON: 'HD',
  PHIEU_NHAP: 'PN',
  PHIEU_XUAT: 'PX',
  PHIEU_BAO_HANH: 'PBH',
  PHIEU_DOI_TRA: 'DT',
  HOP_DONG_TRA_GOP: 'HDTG',
  PHIEU_THU: 'PT',
  PHIEU_CHI: 'PC',
  BIEN_BAN_KIEM_KE: 'BBKK',
  DIEU_CHINH_KHO: 'PDC'
};

/**
 * Sinh mã chứng từ ngẫu nhiên duy nhất dựa trên thời gian và số ngẫu nhiên
 * @param {string} prefix Tiền tố mã chứng từ (HD, PN, PBH, DT, ...)
 * @returns {string} Mã chứng từ chuẩn hóa
 */
function generateCode(prefix = 'DOC') {
  const dateStr = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString().slice(-3);
  return `${prefix}${dateStr}${randomSuffix}`;
}

module.exports = {
  PREFIXES,
  generateCode
};
