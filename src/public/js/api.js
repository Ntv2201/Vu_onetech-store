/**
 * Module hỗ trợ gọi RESTful API và các tiện ích Client-Side
 */

const API_BASE = '/api';

const api = {
  async request(endpoint, options = {}) {
    let url = endpoint;
    if (!url.startsWith('http')) {
      if (url.startsWith('/api/')) {
        // Đã có tiền tố /api/
      } else if (url.startsWith('/')) {
        url = `${API_BASE}${url}`;
      } else {
        url = `${API_BASE}/${url}`;
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        // Chưa đăng nhập hoặc hết phiên -> Chuyển về trang đăng nhập
        if (!window.location.pathname.includes('login.html')) {
          sessionStorage.setItem('returnTo', window.location.pathname + window.location.search);
          window.location.href = '/login.html';
        }
        return { success: false, message: data.message || 'Vui lòng đăng nhập' };
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.message || `Lỗi HTTP: ${response.status}`
        };
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.'
      };
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

const apiFetch = (endpoint, options = {}) => api.request(endpoint, options);
window.apiFetch = apiFetch;
window.api = api;

/**
 * Hiển thị Toast thông báo phía trên góc phải màn hình (Enhanced Micro-UX)
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  const toastId = 'toast_' + Date.now();
  const icon = type === 'success' ? 'bi-check-circle-fill' : (type === 'danger' ? 'bi-exclamation-triangle-fill' : (type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill'));
  const bgClass = type === 'success' ? 'bg-success text-white' : (type === 'danger' ? 'bg-danger text-white' : (type === 'warning' ? 'bg-warning text-dark' : 'bg-primary text-white'));

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg mb-2 show app-toast-item" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex align-items-center">
        <div class="toast-body d-flex align-items-center gap-2 py-2 px-3 fw-medium">
          <i class="bi ${icon} fs-5"></i>
          <div>${message}</div>
        </div>
        <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-3 m-auto" data-bs-dismiss="toast" aria-label="Close" onclick="this.closest('.toast').remove()"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHtml);

  setTimeout(() => {
    const el = document.getElementById(toastId);
    if (el) {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 250);
    }
  }, 4000);
}

/**
 * Hộp thoại xác nhận tùy biến Bootstrap hiện đại thay thế confirm() mặc định của trình duyệt
 * @param {Object|string} options
 * @returns {Promise<boolean>}
 */
function showConfirm(options = {}) {
  const opts = typeof options === 'string' ? { message: options } : options;
  const {
    title = 'Xác nhận hành động',
    message = 'Bạn có chắc chắn muốn tiếp tục thực hiện hành động này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    type = 'danger'
  } = opts;

  return new Promise((resolve) => {
    let container = document.getElementById('globalConfirmModalContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'globalConfirmModalContainer';
      document.body.appendChild(container);
    }

    const iconClass = type === 'danger' 
      ? 'bi-exclamation-triangle-fill text-danger' 
      : (type === 'warning' ? 'bi-exclamation-circle-fill text-warning' : 'bi-question-circle-fill text-primary');
    
    const iconBg = type === 'danger'
      ? 'rgba(239, 68, 68, 0.12)'
      : (type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(37, 99, 235, 0.12)');

    const confirmBtnClass = type === 'danger' 
      ? 'btn-danger' 
      : (type === 'warning' ? 'btn-warning text-dark fw-bold' : 'btn-primary');

    const modalId = 'confirmModal_' + Date.now();
    const modalHtml = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
            <div class="modal-header border-bottom-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-start">
              <div class="d-flex align-items-center gap-3">
                <div class="confirm-icon-box rounded-circle d-flex align-items-center justify-content-center" style="background: ${iconBg}; width: 46px; height: 46px; flex-shrink: 0;">
                  <i class="bi ${iconClass} fs-4"></i>
                </div>
                <div>
                  <h5 class="modal-title fw-bold mb-0 text-dark" style="font-size: 1.12rem;">${escapeHtml(title)}</h5>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body px-4 py-3 text-secondary" style="font-size: 0.94rem; line-height: 1.55; padding-left: calc(46px + 1rem + 1.5rem) !important;">
              ${typeof message === 'string' ? message : escapeHtml(String(message))}
            </div>
            <div class="modal-footer border-top-0 px-4 pb-4 pt-1 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-light px-3 fw-medium" data-bs-dismiss="modal" id="${modalId}_cancelBtn">
                ${escapeHtml(cancelText)}
              </button>
              <button type="button" class="btn ${confirmBtnClass} px-3 fw-semibold shadow-sm" id="${modalId}_confirmBtn">
                ${escapeHtml(confirmText)}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = modalHtml;
    const modalEl = document.getElementById(modalId);
    if (!modalEl) {
      resolve(false);
      return;
    }
    const bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: true });

    let isConfirmed = false;
    const confirmBtn = document.getElementById(`${modalId}_confirmBtn`);
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        isConfirmed = true;
        bsModal.hide();
      });
    }

    modalEl.addEventListener('hidden.bs.modal', () => {
      resolve(isConfirmed);
      modalEl.remove();
    });

    bsModal.show();
    setTimeout(() => {
      if (confirmBtn) confirmBtn.focus();
    }, 150);
  });
}

/**
 * Quản lý trạng thái loading cho nút bấm để chống double-click
 * @param {HTMLElement|string} btn Thẻ button hoặc selector/ID của button
 * @param {boolean} isLoading Trạng thái true (đang tải) hoặc false (hoàn tất)
 * @param {string} [loadingText='Đang xử lý...'] Dòng text hiển thị khi đang tải
 */
function setButtonLoading(btn, isLoading, loadingText = 'Đang xử lý...') {
  const el = typeof btn === 'string' ? document.querySelector(btn) : btn;
  if (!el) return;

  if (isLoading) {
    if (el.dataset.originalHtml === undefined) {
      el.dataset.originalHtml = el.innerHTML;
    }
    el.disabled = true;
    el.classList.add('btn-loading');
    el.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> ${escapeHtml(loadingText)}`;
  } else {
    el.disabled = false;
    el.classList.remove('btn-loading');
    if (el.dataset.originalHtml !== undefined) {
      el.innerHTML = el.dataset.originalHtml;
      delete el.dataset.originalHtml;
    }
  }
}

window.showToast = showToast;
window.showConfirm = showConfirm;
window.setButtonLoading = setButtonLoading;
api.showToast = showToast;
api.showConfirm = showConfirm;
api.setButtonLoading = setButtonLoading;

/**
 * Định dạng tiền tệ VNĐ
 */
function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return Number(amount).toLocaleString('vi-VN') + ' đ';
}

/**
 * Tự động thêm dấu chấm . phân cách hàng nghìn khi người dùng gõ số tiền vào ô input
 */
function maskCurrencyInput(el) {
  if (!el) return;
  const cursor = el.selectionStart;
  const oldLength = el.value ? el.value.length : 0;
  const rawVal = String(el.value || '').replace(/\D/g, '');
  if (!rawVal) {
    el.value = '';
    return;
  }
  const formatted = Number(rawVal).toLocaleString('vi-VN');
  el.value = formatted;
  const newLength = formatted.length;
  if (cursor !== null && document.activeElement === el) {
    const pos = Math.max(0, cursor + (newLength - oldLength));
    try {
      el.setSelectionRange(pos, pos);
    } catch (err) {}
  }
}

/**
 * Trích xuất giá trị số thuần túy (bỏ hết dấu chấm .) từ ô input tiền tệ
 */
function parseCurrencyValue(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/\./g, '').replace(/\D/g, '');
  return Number(cleaned) || 0;
}

window.maskCurrencyInput = maskCurrencyInput;
window.parseCurrencyValue = parseCurrencyValue;
window.unmaskCurrency = parseCurrencyValue;
api.maskCurrencyInput = maskCurrencyInput;
api.parseCurrencyValue = parseCurrencyValue;
api.unmaskCurrency = parseCurrencyValue;
api.formatCurrency = formatCurrency;

/**
 * Định dạng ngày giờ VN
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Lấy danh sách query parameters từ URL
 */
function getQueryParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

/**
 * Escape HTML để chống XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Debounce helper giúp hạn chế tần suất gọi hàm (tìm kiếm, gõ phím)
 * @param {Function} fn Hàm cần thực thi
 * @param {number} delay Thời gian chờ (mili-giây), mặc định 300ms
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

window.debounce = debounce;
api.showToast = showToast;
window.showToast = showToast;

/**
 * Bộ tiện ích DataTable dùng chung cho toàn bộ hệ thống
 */
const DataTableHelper = {
  /**
   * Sắp xếp mảng dữ liệu Client-side
   */
  sortList(items, sortKey, sortOrder = 'asc') {
    if (!sortKey || !Array.isArray(items)) return items;
    return [...items].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey.includes('.')) {
        const parts = sortKey.split('.');
        valA = parts.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, a);
        valB = parts.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, b);
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (valA instanceof Date || (!isNaN(Date.parse(valA)) && String(valA).length > 8 && String(valA).includes('-') && !String(valA).includes(' '))) {
        comparison = new Date(valA) - new Date(valB);
      } else {
        comparison = String(valA).localeCompare(String(valB), 'vi', { sensitivity: 'base' });
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  },

  /**
   * Render giao diện rỗng đẹp mắt (Empty State)
   */
  renderEmptyState(colSpan = 7, {
    icon = 'bi-inbox',
    title = 'Không tìm thấy dữ liệu',
    message = 'Không có bản ghi nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.',
    resetText = 'Đặt lại bộ lọc',
    onReset = null
  } = {}) {
    const resetBtnId = 'btnEmptyReset_' + Date.now() + Math.floor(Math.random() * 1000);
    setTimeout(() => {
      const btn = document.getElementById(resetBtnId);
      if (btn && typeof onReset === 'function') {
        btn.addEventListener('click', onReset);
      }
    }, 0);

    return `
      <tr>
        <td colspan="${colSpan}" class="text-center py-5">
          <div class="table-empty-box d-flex flex-column align-items-center justify-content-center">
            <div class="table-empty-icon mb-3">
              <i class="bi ${icon}"></i>
            </div>
            <h6 class="fw-bold text-dark mb-1">${escapeHtml(title)}</h6>
            <p class="text-muted small mb-3" style="max-width: 420px;">${escapeHtml(message)}</p>
            ${onReset ? `
              <button type="button" class="btn btn-sm btn-outline-primary" id="${resetBtnId}">
                <i class="bi bi-arrow-clockwise me-1"></i> ${escapeHtml(resetText)}
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  },

  /**
   * Render thanh phân trang hoàn chỉnh
   */
  renderPagination(containerId, {
    totalItems = 0,
    currentPage = 1,
    pageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    onPageChange = null,
    onPageSizeChange = null
  } = {}) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const curPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIdx = totalItems > 0 ? (curPage - 1) * pageSize + 1 : 0;
    const endIdx = Math.min(curPage * pageSize, totalItems);

    let startPage = Math.max(1, curPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    const pages = [];
    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }

    const instanceId = 'pg_' + Math.random().toString(36).substring(2, 8);

    container.innerHTML = `
      <div class="table-pagination-wrapper d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 pt-3">
        <div class="d-flex align-items-center gap-2 small text-muted">
          <span>Hiển thị <strong>${startIdx} - ${endIdx}</strong> trên tổng <strong>${totalItems}</strong> bản ghi</span>
          <span class="mx-1">•</span>
          <div class="d-flex align-items-center gap-1">
            <span>Dòng/trang:</span>
            <select class="form-select form-select-sm page-size-select" id="${instanceId}_size" style="width: auto; padding-right: 1.8rem;">
              ${pageSizeOptions.map(size => `<option value="${size}" ${size === pageSize ? 'selected' : ''}>${size}</option>`).join('')}
            </select>
          </div>
        </div>

        <nav aria-label="Table pagination">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item ${curPage === 1 ? 'disabled' : ''}">
              <button class="page-link" type="button" data-page="${curPage - 1}" title="Trang trước">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
            ${startPage > 1 ? `
              <li class="page-item"><button class="page-link" type="button" data-page="1">1</button></li>
              ${startPage > 2 ? `<li class="page-item disabled"><span class="page-link">...</span></li>` : ''}
            ` : ''}
            ${pages.map(p => `
              <li class="page-item ${p === curPage ? 'active' : ''}">
                <button class="page-link" type="button" data-page="${p}">${p}</button>
              </li>
            `).join('')}
            ${endPage < totalPages ? `
              ${endPage < totalPages - 1 ? `<li class="page-item disabled"><span class="page-link">...</span></li>` : ''}
              <li class="page-item"><button class="page-link" type="button" data-page="${totalPages}">${totalPages}</button></li>
            ` : ''}
            <li class="page-item ${curPage === totalPages ? 'disabled' : ''}">
              <button class="page-link" type="button" data-page="${curPage + 1}" title="Trang tiếp">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    `;

    container.querySelectorAll('.pagination .page-link[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.getAttribute('data-page'), 10);
        if (page && page !== curPage && typeof onPageChange === 'function') {
          onPageChange(page);
        }
      });
    });

    const sizeSelect = document.getElementById(`${instanceId}_size`);
    if (sizeSelect && typeof onPageSizeChange === 'function') {
      sizeSelect.addEventListener('change', () => {
        onPageSizeChange(parseInt(sizeSelect.value, 10));
      });
    }
  },

  /**
   * Xuất mảng dữ liệu ra file Excel (.xls) chuẩn bảng tính nhiều cột, không bị dồn cột
   */
  exportToExcel(columns, rows, filename = 'Xuat_Du_Lieu.xls') {
    if (!columns || !rows || rows.length === 0) {
      showToast('Không có dữ liệu để xuất file', 'warning');
      return;
    }

    let actualFilename = filename.replace(/\.csv$/i, '.xls');
    if (!actualFilename.endsWith('.xls')) {
      actualFilename += '.xls';
    }

    const tableHeaders = columns.map(c => 
      `<th style="background-color: #2563eb; color: #ffffff; font-weight: bold; border: 1px solid #1e40af; padding: 8px 12px; text-align: center;">${escapeHtml(c.title || c.key)}</th>`
    ).join('');

    const tableRows = rows.map((item, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = columns.map(col => {
        let val = '';
        if (typeof col.render === 'function') {
          val = col.render(item);
        } else if (col.key && col.key.includes('.')) {
          val = col.key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : '', item);
        } else if (col.key) {
          val = item[col.key];
        }
        if (val === null || val === undefined) val = '';

        const strVal = String(val);
        // Nhận diện cột số IMEI / SĐT / Mã định danh để giữ nguyên dạng text (không bị Excel làm tròn số mũ)
        const isImeiOrCode = col.key === 'imei' || col.key === 'soHD' || col.key === 'sdt' || (strVal.length >= 10 && !isNaN(strVal));
        const isMoney = (typeof val === 'number') || (col.key && (col.key.includes('gia') || col.key.includes('tien') || col.key.includes('Tien')));

        let style = 'border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt;';
        if (isImeiOrCode) {
          style += " mso-number-format: '\\@'; text-align: left;";
        } else if (isMoney && !isNaN(Number(strVal.replace(/\D/g, ''))) && strVal !== '') {
          style += " mso-number-format: '#,##0'; text-align: right;";
        }

        return `<td style="${style}">${escapeHtml(strVal)}</td>`;
      }).join('');

      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    }).join('');

    const excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>DuLieu</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>${tableHeaders}</tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob(['\uFEFF' + excelTemplate], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', actualFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất file Excel "${actualFilename}" thành công!`, 'success');
  }
};

window.DataTableHelper = DataTableHelper;
