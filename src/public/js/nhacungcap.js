/**
 * Module xử lý Nhà cung cấp phía Client
 */

document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;

  if (path.includes('nha-cung-cap/index.html') || path.endsWith('/nha-cung-cap/')) {
    initNhaCungCapIndex();
  } else if (path.includes('nha-cung-cap/form.html')) {
    initNhaCungCapForm();
  }
});

async function initNhaCungCapIndex() {
  const filterForm = document.getElementById('filterForm');
  const btnReset = document.getElementById('btnResetFilter');

  await loadNhaCungCapList();

  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadNhaCungCapList();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filterSearch').value = '';
      loadNhaCungCapList();
    });
  }
}

async function loadNhaCungCapList() {
  const search = document.getElementById('filterSearch')?.value.trim() || '';

  const res = await api.get('/nha-cung-cap', { search });
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách nhà cung cấp', 'danger');
    return;
  }

  const nhaCungCaps = res.data;
  const tbody = document.getElementById('tableNhaCungCapBody');
  if (!tbody) return;

  if (nhaCungCaps && nhaCungCaps.length > 0) {
    const isStoreOrAccountantOrManager = currentUser && ['Quản lý', 'Thủ kho', 'Kế toán'].includes(currentUser.vaiTro);
    const isManager = currentUser && currentUser.vaiTro === 'Quản lý';

    tbody.innerHTML = nhaCungCaps.map(ncc => `
      <tr>
        <td class="fw-bold text-dark">${escapeHtml(ncc.tenNCC)}</td>
        <td><span class="font-monospace text-primary">${escapeHtml(ncc.sdt || 'Chưa cập nhật')}</span></td>
        <td>${escapeHtml(ncc.diaChi || 'Chưa cập nhật')}</td>
        <td>${formatDate(ncc.createdAt)}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            ${isStoreOrAccountantOrManager ? `
              <a href="/nha-cung-cap/form.html?id=${ncc._id}" class="btn btn-outline-primary" title="Sửa">
                <i class="bi bi-pencil"></i>
              </a>
            ` : ''}
            ${isManager ? `
              <button type="button" class="btn btn-outline-danger" title="Xóa" onclick="deleteNhaCungCap('${ncc._id}', '${escapeHtml(ncc.tenNCC)}')">
                <i class="bi bi-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Không tìm thấy nhà cung cấp nào</td></tr>';
  }
}

async function deleteNhaCungCap(id, tenNCC) {
  if (!confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${tenNCC}"?`)) return;

  const res = await api.delete(`/nha-cung-cap/${id}`);
  if (res.success) {
    showToast(res.message || 'Xóa nhà cung cấp thành công', 'success');
    loadNhaCungCapList();
  } else {
    showToast(res.message || 'Lỗi khi xóa nhà cung cấp', 'danger');
  }
}

async function initNhaCungCapForm() {
  const params = getQueryParams();
  const editId = params.id;
  const isEdit = Boolean(editId);

  if (isEdit) {
    document.getElementById('formTitle').textContent = 'Chỉnh sửa Nhà cung cấp';
    document.getElementById('btnSubmitForm').innerHTML = '<i class="bi bi-check2-circle me-1"></i> Cập nhật Nhà cung cấp';

    const res = await api.get(`/nha-cung-cap/${editId}`);
    if (res.success && res.data) {
      const ncc = res.data;
      document.getElementById('inputTenNCC').value = ncc.tenNCC || '';
      document.getElementById('inputSdt').value = ncc.sdt || '';
      document.getElementById('inputDiaChi').value = ncc.diaChi || '';
    } else {
      showToast('Không tìm thấy thông tin nhà cung cấp', 'danger');
    }
  }

  const form = document.getElementById('nhaCungCapForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const body = {
        tenNCC: document.getElementById('inputTenNCC').value.trim(),
        sdt: document.getElementById('inputSdt').value.trim(),
        diaChi: document.getElementById('inputDiaChi').value.trim()
      };

      if (!body.tenNCC) {
        showToast('Tên nhà cung cấp không được để trống', 'danger');
        return;
      }

      let res;
      if (isEdit) {
        res = await api.put(`/nha-cung-cap/${editId}`, body);
      } else {
        res = await api.post('/nha-cung-cap', body);
      }

      if (res.success) {
        showToast(res.message || 'Lưu thông tin nhà cung cấp thành công', 'success');
        setTimeout(() => {
          window.location.href = '/nha-cung-cap/index.html';
        }, 800);
      } else {
        showToast(res.message || 'Lỗi khi lưu nhà cung cấp', 'danger');
      }
    });
  }
}
