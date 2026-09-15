/**
 * Module xử lý Khách hàng phía Client
 */

document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;

  if (path.includes('khach-hang/index.html') || path.endsWith('/khach-hang/')) {
    initKhachHangIndex();
  } else if (path.includes('khach-hang/form.html')) {
    initKhachHangForm();
  }
});

async function initKhachHangIndex() {
  const filterForm = document.getElementById('filterForm');
  const btnReset = document.getElementById('btnResetFilter');
  const searchInput = document.getElementById('filterSearch');
  const filterHangThanhVien = document.getElementById('filterHangThanhVien');
  const filterTongChiTieu = document.getElementById('filterTongChiTieu');

  await loadKhachHangList();

  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadKhachHangList();
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadKhachHangList();
      }, 300);
    });
  }
  
  if (filterHangThanhVien) {
    filterHangThanhVien.addEventListener('change', loadKhachHangList);
  }
  
  if (filterTongChiTieu) {
    filterTongChiTieu.addEventListener('change', loadKhachHangList);
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (filterHangThanhVien) filterHangThanhVien.value = '';
      if (filterTongChiTieu) filterTongChiTieu.value = '';
      loadKhachHangList();
    });
  }
}

// Debounce implementation for search
let searchTimeout;

async function loadKhachHangList() {
  const search = document.getElementById('filterSearch')?.value.trim() || '';
  const hangThanhVien = document.getElementById('filterHangThanhVien')?.value || '';
  const tongChiTieuRange = document.getElementById('filterTongChiTieu')?.value || '';
  
  let query = { search, hangThanhVien, status: 'all' };
  if (tongChiTieuRange) {
    const parts = tongChiTieuRange.split('-');
    if (parts[0]) query.tongChiTieuMin = parts[0];
    if (parts[1]) query.tongChiTieuMax = parts[1];
  }

  const res = await api.get('/khach-hang', query);
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách khách hàng', 'danger');
    return;
  }

  const khachHangs = res.data;
  const tbody = document.getElementById('tableKhachHangBody');
  if (!tbody) return;

  if (khachHangs && khachHangs.length > 0) {
    const isSellerOrCashierOrManager = currentUser && ['Quản lý', 'NV bán hàng', 'Thu ngân'].includes(currentUser.vaiTro);
    const isManager = currentUser && currentUser.vaiTro === 'Quản lý';

    tbody.innerHTML = khachHangs.map(kh => {
      const getBadgeColor = (hang) => {
        if (hang === 'Kim Cương') return 'bg-dark';
        if (hang === 'Vàng') return 'bg-warning text-dark';
        if (hang === 'Bạc') return 'bg-secondary';
        return 'bg-info text-dark';
      };
      const safeHoTen = escapeHtml((kh.hoTen || '').replace(/'/g, "\\'"));
      
      return `
      <tr>
        <td>
          <div class="fw-semibold">${escapeHtml(kh.hoTen)}</div>
          <div class="small text-muted">${escapeHtml(kh.email || '')}</div>
        </td>
        <td>
          <div class="font-monospace text-primary">${escapeHtml(kh.sdt || 'Chưa cập nhật')}</div>
          <div class="small text-muted" style="font-size: 0.75rem;"><i class="bi bi-geo-alt"></i> ${escapeHtml(kh.diaChi || 'Chưa cập nhật')}</div>
        </td>
        <td><span class="badge ${getBadgeColor(kh.hangThanhVien)}">${escapeHtml(kh.hangThanhVien || 'Đồng')}</span></td>
        <td class="fw-semibold">${formatCurrency(kh.tongChiTieu || 0)}</td>
        <td>
          ${kh.status !== false 
            ? '<span class="badge bg-success-subtle text-success"><i class="bi bi-check-circle me-1"></i>Hoạt động</span>' 
            : '<span class="badge bg-danger-subtle text-danger"><i class="bi bi-lock me-1"></i>Đã khóa</span>'}
        </td>
        <td class="text-end pe-3">
          <div class="d-inline-flex justify-content-end align-items-center" style="gap: 6px;">
            ${isSellerOrCashierOrManager ? `
              <a href="/khach-hang/form.html?id=${kh._id}" class="btn-action btn-action-edit" title="Sửa">
                <i class="bi bi-pencil"></i>
              </a>
            ` : ''}
            ${isManager ? `
              <button type="button" class="btn-action ${kh.status !== false ? 'btn-action-cancel' : 'btn-action-success'}" title="${kh.status !== false ? 'Khóa' : 'Mở khóa'}" onclick="toggleStatusKhachHang('${kh._id}', '${safeHoTen}', ${kh.status !== false})">
                <i class="bi ${kh.status !== false ? 'bi-lock-fill' : 'bi-unlock-fill'}"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Không tìm thấy khách hàng nào</td></tr>';
  }
}

async function toggleStatusKhachHang(id, hoTen, currentStatus) {
  const actionName = currentStatus ? 'khóa' : 'mở khóa';
  if (!confirm(`Bạn có chắc chắn muốn ${actionName} khách hàng "${hoTen}"?`)) return;

  const res = await api.put(`/khach-hang/${id}/toggle-status`);
  if (res.success) {
    showToast(res.message || `${actionName} khách hàng thành công`, 'success');
    loadKhachHangList();
  } else {
    showToast(res.message || `Lỗi khi ${actionName} khách hàng`, 'danger');
  }
}

async function initKhachHangForm() {
  const params = getQueryParams();
  const editId = params.id;
  const isEdit = Boolean(editId);

  if (isEdit) {
    document.getElementById('formTitle').textContent = 'Chỉnh sửa Khách hàng';
    document.getElementById('btnSubmitForm').innerHTML = '<i class="bi bi-check2-circle me-1"></i> Cập nhật Khách hàng';

    const res = await api.get(`/khach-hang/${editId}`);
    if (res.success && res.data && res.data.khachHang) {
      const kh = res.data.khachHang;
      document.getElementById('inputHoTen').value = kh.hoTen || '';
      document.getElementById('inputSdt').value = kh.sdt || '';
      if(document.getElementById('inputCccd')) document.getElementById('inputCccd').value = kh.cccd || '';
      if(document.getElementById('inputEmail')) document.getElementById('inputEmail').value = kh.email || '';
      document.getElementById('inputDiaChi').value = kh.diaChi || '';
    } else {
      showToast('Không tìm thấy thông tin khách hàng', 'danger');
    }
  }

  const form = document.getElementById('khachHangForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const body = {
        hoTen: document.getElementById('inputHoTen').value.trim(),
        sdt: document.getElementById('inputSdt').value.trim(),
        cccd: document.getElementById('inputCccd')?.value.trim() || '',
        email: document.getElementById('inputEmail')?.value.trim() || '',
        diaChi: document.getElementById('inputDiaChi').value.trim()
      };

      if (!body.hoTen) {
        showToast('Họ tên khách hàng không được để trống', 'danger');
        return;
      }

      let res;
      if (isEdit) {
        res = await api.put(`/khach-hang/${editId}`, body);
      } else {
        res = await api.post('/khach-hang', body);
      }

      if (res.success) {
        showToast(res.message || 'Lưu thông tin khách hàng thành công', 'success');
        setTimeout(() => {
          window.location.href = '/khach-hang/index.html';
        }, 800);
      } else {
        showToast(res.message || 'Lỗi khi lưu khách hàng', 'danger');
      }
    });
  }
}
