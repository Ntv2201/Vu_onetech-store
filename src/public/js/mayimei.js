/**
 * Module xử lý chức năng Quản lý Máy IMEI phía Client
 */

document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;

  if (path.includes('may-imei/index.html') || path.endsWith('/may-imei/')) {
    initMayImeiIndex();
  } else if (path.includes('may-imei/form.html')) {
    initMayImeiForm();
  }
});

/**
 * Trang danh sách máy IMEI
 */
let allImeisData = [];
let currentPage = 1;
let pageSize = 10;
let currentSortKey = 'ngayNhap';
let currentSortOrder = 'desc';

async function initMayImeiIndex() {
  const filterForm = document.getElementById('filterForm');
  const btnReset = document.getElementById('btnResetFilter');

  const params = getQueryParams();
  if (params.sanPhamId) {
    document.getElementById('filterSanPham').value = params.sanPhamId;
  }

  initSortableHeaders();
  await loadMayImeiList();

  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentPage = 1;
      loadMayImeiList();
    });
  }
  
  const searchInput = document.getElementById('filterSearch');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        currentPage = 1;
        loadMayImeiList();
      }, 300);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filterSearch').value = '';
      document.getElementById('filterSanPham').value = '';
      document.getElementById('filterTrangThai').value = '';
      currentPage = 1;
      loadMayImeiList();
    });
  }
}

function initSortableHeaders() {
  document.querySelectorAll('#tableImei th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const sortKey = th.getAttribute('data-sort');
      if (currentSortKey === sortKey) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortKey = sortKey;
        currentSortOrder = 'asc';
      }

      // Cập nhật icon mũi tên
      document.querySelectorAll('#tableImei th.sortable').forEach(el => {
        el.classList.remove('sorted-asc', 'sorted-desc');
        const icon = el.querySelector('.sort-icon');
        if (icon) icon.className = 'bi bi-arrow-down-up sort-icon';
      });

      th.classList.add(currentSortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
      const curIcon = th.querySelector('.sort-icon');
      if (curIcon) {
        curIcon.className = currentSortOrder === 'asc' ? 'bi bi-sort-up sort-icon' : 'bi bi-sort-down sort-icon';
      }

      renderImeiTablePage();
    });
  });
}

async function loadMayImeiList() {
  const search = document.getElementById('filterSearch')?.value.trim() || '';
  const sanPhamId = document.getElementById('filterSanPham')?.value || '';
  const trangThai = document.getElementById('filterTrangThai')?.value || '';

  const res = await api.get('/may-imei', { search, sanPhamId, trangThai, status: 'all' });
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách máy IMEI', 'danger');
    return;
  }

  allImeisData = Array.isArray(res.data) ? res.data : (res.imeis || res.data?.imeis || res.data?.data || []);
  const sanPhams = res.sanPhams || res.data?.sanPhams || [];

  // 1. Cập nhật ô chọn sản phẩm trong bộ lọc
  const selectSanPham = document.getElementById('filterSanPham');
  if (selectSanPham && selectSanPham.options.length <= 1 && sanPhams && sanPhams.length > 0) {
    sanPhams.forEach(sp => {
      const opt = document.createElement('option');
      opt.value = sp._id;
      opt.textContent = sp.tenMay;
      selectSanPham.appendChild(opt);
    });

    const params = getQueryParams();
    if (params.sanPhamId) {
      selectSanPham.value = params.sanPhamId;
    }
  }

  // 2. Render bảng theo phân trang
  renderImeiTablePage();
}

function renderImeiTablePage() {
  const tbody = document.getElementById('tableImeiBody');
  const paginationContainer = document.getElementById('imeiPaginationContainer');
  if (!tbody) return;

  if (!allImeisData || allImeisData.length === 0) {
    tbody.innerHTML = DataTableHelper.renderEmptyState(7, {
      icon: 'bi-upc-scan',
      title: 'Không tìm thấy máy IMEI nào',
      message: 'Không có số IMEI nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại.',
      resetText: 'Xóa bộ lọc để xem tất cả',
      onReset: () => {
        document.getElementById('filterSearch').value = '';
        document.getElementById('filterSanPham').value = '';
        document.getElementById('filterTrangThai').value = '';
        currentPage = 1;
        loadMayImeiList();
      }
    });
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // Sắp xếp dữ liệu
  const sortedData = DataTableHelper.sortList(allImeisData, currentSortKey, currentSortOrder);

  // Phân trang Client-side
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = sortedData.slice(startIdx, startIdx + pageSize);

  const isTechOrManager = currentUser && ['Quản lý', 'Thủ kho', 'Kỹ thuật'].includes(currentUser.vaiTro);
  const isManager = currentUser && currentUser.vaiTro === 'Quản lý';

  tbody.innerHTML = pageItems.map(item => {
    let badgeClass = 'badge-imei-loi';
    let badgeText = 'Lỗi';
    if (item.trangThai === 'Con hang') {
      badgeClass = 'badge-imei-conhang';
      badgeText = 'Còn hàng';
    } else if (item.trangThai === 'Da ban') {
      badgeClass = 'badge-imei-daban';
      badgeText = 'Đã bán';
    } else if (item.trangThai === 'Bao hanh') {
      badgeClass = 'badge-imei-baohanh';
      badgeText = 'Bảo hành';
    }

    return `
      <tr>
        <td>
          <span class="font-monospace fw-bold fs-6 text-dark">${escapeHtml(item.imei)}</span>
        </td>
        <td>
          ${item.sanPham ? `
            <a href="/san-pham/detail.html?id=${item.sanPham._id}" class="fw-semibold text-decoration-none text-dark">
              ${escapeHtml(item.sanPham.tenMay)}
            </a>
            <div class="text-muted small">${escapeHtml(item.sanPham.hang || '')} | BH ${item.sanPham.soThangBH || 12} tháng</div>
          ` : '<span class="text-muted">Không xác định</span>'}
        </td>
        <td>
          <div>${escapeHtml(item.mauSac || '-')}</div>
          <div class="small text-muted">${escapeHtml(item.dungLuong || '')}</div>
        </td>
        <td class="fw-semibold">${formatCurrency(item.giaNhap)}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>${formatDate(item.ngayNhap || item.createdAt)}</td>
        <td class="text-end pe-3">
          <div class="d-inline-flex justify-content-end align-items-center" style="gap: 6px;">
            ${isTechOrManager ? `
              <a href="/may-imei/form.html?imei=${item.imei}" class="btn-action btn-action-edit" title="Chỉnh sửa trạng thái">
                <i class="bi bi-pencil"></i>
              </a>
            ` : ''}
            ${isManager ? `
              <button type="button" class="btn-action btn-action-cancel" title="Xóa" ${item.trangThai === 'Da ban' ? 'disabled' : ''} onclick="deleteImei('${item.imei}')">
                <i class="bi bi-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Render thanh phân trang
  DataTableHelper.renderPagination('imeiPaginationContainer', {
    totalItems,
    currentPage,
    pageSize,
    onPageChange: (newPage) => {
      currentPage = newPage;
      renderImeiTablePage();
    },
    onPageSizeChange: (newSize) => {
      pageSize = newSize;
      currentPage = 1;
      renderImeiTablePage();
    }
  });
}

function exportMayImeiExcel() {
  if (!allImeisData || allImeisData.length === 0) {
    showToast('Không có dữ liệu máy IMEI để xuất', 'warning');
    return;
  }

  const columns = [
    { title: 'Số IMEI', key: 'imei' },
    { title: 'Model Sản Phẩm', render: (item) => item.sanPham ? item.sanPham.tenMay : '' },
    { title: 'Hãng', render: (item) => item.sanPham ? item.sanPham.hang || '' : '' },
    { title: 'Màu Sắc', key: 'mauSac' },
    { title: 'Dung Lượng', key: 'dungLuong' },
    { title: 'Giá Nhập (VNĐ)', key: 'giaNhap' },
    { title: 'Trạng Thái', render: (item) => {
      if (item.trangThai === 'Con hang') return 'Còn hàng';
      if (item.trangThai === 'Da ban') return 'Đã bán';
      if (item.trangThai === 'Bao hanh') return 'Bảo hành';
      return 'Lỗi';
    }},
    { title: 'Ngày Nhập', render: (item) => formatDate(item.ngayNhap || item.createdAt) }
  ];

  const nowStr = new Date().toISOString().slice(0, 10);
  DataTableHelper.exportToExcel(columns, allImeisData, `DanhSach_May_IMEI_${nowStr}.csv`);
}
window.exportMayImeiExcel = exportMayImeiExcel;

async function deleteImei(imei) {
  const ok = typeof showConfirm === 'function'
    ? await showConfirm({
        title: 'Xác nhận xóa máy theo IMEI',
        message: `Bạn có chắc chắn muốn xóa máy có IMEI <strong>${escapeHtml(imei)}</strong> khỏi hệ thống kho?<br><span class="text-danger small mt-1 d-inline-block"><i class="bi bi-info-circle me-1"></i>Thao tác này sẽ xóa vĩnh viễn và không thể hoàn tác!</span>`,
        confirmText: 'Xóa vĩnh viễn',
        cancelText: 'Hủy bỏ',
        type: 'danger'
      })
    : confirm(`Bạn có chắc chắn muốn xóa IMEI ${imei}? Thao tác không thể hoàn tác!`);

  if (!ok) return;

  const res = await api.delete(`/may-imei/${imei}`);
  if (res.success) {
    showToast(res.message || 'Đã xóa IMEI thành công', 'success');
    loadMayImeiList();
  } else {
    showToast(res.message || 'Lỗi khi xóa IMEI', 'danger');
  }
}

/**
 * Trang Thêm / Sửa IMEI
 */
async function initMayImeiForm() {
  const params = getQueryParams();
  const editImei = params.imei;
  const isEdit = Boolean(editImei);

  // 1. Tải danh sách Model sản phẩm
  const resSP = await api.get('/san-pham');
  const selectSanPham = document.getElementById('selectSanPham');
  const spList = Array.isArray(resSP.data) ? resSP.data : (resSP.data?.sanPhams || resSP.data?.list || []);
  if (resSP.success && spList && selectSanPham) {
    selectSanPham.innerHTML = '<option value="">-- Chọn model sản phẩm --</option>';
    spList.forEach(sp => {
      const opt = document.createElement('option');
      opt.value = sp._id;
      opt.textContent = `${sp.tenMay} (${sp.hang || 'Khác'}) - Niêm yết: ${formatCurrency(sp.giaBan || 0)}`;
      selectSanPham.appendChild(opt);
    });

    if (params.sanPhamId) {
      selectSanPham.value = params.sanPhamId;
    }
  }

  // 2. Chế độ Sửa
  if (isEdit) {
    document.getElementById('formTitle').textContent = `Chỉnh sửa máy IMEI: ${editImei}`;
    document.getElementById('btnSubmitForm').innerHTML = '<i class="bi bi-check2-circle me-1"></i> Cập nhật IMEI';
    document.getElementById('editImeiContainer').classList.remove('d-none');
    document.getElementById('createImeiContainer').classList.add('d-none');

    const res = await api.get(`/may-imei/${editImei}`);
    if (res.success && res.mayImei) {
      const m = res.mayImei;
      document.getElementById('selectSanPham').value = m.sanPham?._id || m.sanPham || '';
      document.getElementById('inputImeiReadonly').value = m.imei || '';
      document.getElementById('inputGiaNhap').value = m.giaNhap ? Number(m.giaNhap).toLocaleString('vi-VN') : '';
      document.getElementById('selectTrangThai').value = m.trangThai || 'Con hang';
      document.getElementById('inputMauSac').value = m.mauSac || '';
      document.getElementById('inputDungLuong').value = m.dungLuong || '';
    } else {
      showToast(res.message || 'Không tìm thấy máy IMEI', 'danger');
    }
  }

  // 3. Xử lý submit form
  const form = document.getElementById('mayImeiForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const sanPham = document.getElementById('selectSanPham').value;
      const giaNhap = Number((document.getElementById('inputGiaNhap').value || '').replace(/[^\\d]/g, ''));
      const trangThai = document.getElementById('selectTrangThai').value;
      const mauSac = document.getElementById('inputMauSac').value.trim();
      const dungLuong = document.getElementById('inputDungLuong').value.trim();

      if (!sanPham || isNaN(giaNhap)) {
        showToast('Vui lòng chọn sản phẩm và nhập giá nhập hợp lệ', 'danger');
        return;
      }

      let res;
      if (isEdit) {
        res = await api.put(`/may-imei/${editImei}`, {
          sanPham,
          giaNhap,
          trangThai,
          mauSac,
          dungLuong
        });
      } else {
        const singleImei = document.getElementById('inputSingleImei')?.value.trim() || '';
        const imeiList = document.getElementById('inputImeiList')?.value.trim() || '';

        if (!singleImei && !imeiList) {
          showToast('Vui lòng nhập ít nhất 1 số IMEI', 'danger');
          return;
        }

        res = await api.post('/may-imei', {
          sanPham,
          giaNhap,
          trangThai,
          mauSac,
          dungLuong,
          singleImei,
          imeiList
        });
      }

      if (res.success) {
        showToast(res.message || 'Lưu IMEI thành công', 'success');
        setTimeout(() => {
          window.location.href = '/may-imei/index.html';
        }, 800);
      } else {
        showToast(res.message || 'Lỗi khi lưu IMEI', 'danger');
      }
    });
  }
}
