/**
 * Module xử lý Danh mục phía Client
 */

let editModalInstance = null;
let addModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const addModalEl = document.getElementById('addDanhMucModal');
  if (addModalEl) addModalInstance = new bootstrap.Modal(addModalEl);

  const editModalEl = document.getElementById('editDanhMucModal');
  if (editModalEl) editModalInstance = new bootstrap.Modal(editModalEl);

  await loadDanhMucList();

  // Xử lý thêm mới
  const formAdd = document.getElementById('formAddDanhMuc');
  if (formAdd) {
    formAdd.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tenDanhMuc = document.getElementById('inputAddTenDM').value.trim();
      if (!tenDanhMuc) return;

      const res = await api.post('/danh-muc', { tenDanhMuc });
      if (res.success) {
        showToast(res.message || 'Thêm danh mục thành công', 'success');
        document.getElementById('inputAddTenDM').value = '';
        if (addModalInstance) addModalInstance.hide();
        loadDanhMucList();
      } else {
        showToast(res.message || 'Lỗi khi thêm danh mục', 'danger');
      }
    });
  }

  // Xử lý sửa
  const formEdit = document.getElementById('formEditDanhMuc');
  if (formEdit) {
    formEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('inputEditDMId').value;
      const tenDanhMuc = document.getElementById('inputEditTenDM').value.trim();
      if (!id || !tenDanhMuc) return;

      const res = await api.put(`/danh-muc/${id}`, { tenDanhMuc });
      if (res.success) {
        showToast(res.message || 'Cập nhật danh mục thành công', 'success');
        if (editModalInstance) editModalInstance.hide();
        loadDanhMucList();
      } else {
        showToast(res.message || 'Lỗi khi cập nhật danh mục', 'danger');
      }
    });
  }
});

async function loadDanhMucList() {
  const res = await api.get('/danh-muc');
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách danh mục', 'danger');
    return;
  }

  const danhMucs = res.data;
  const tbody = document.getElementById('tableDanhMucBody');
  if (!tbody) return;

  if (danhMucs && danhMucs.length > 0) {
    const isManagerOrStorekeeper = currentUser && ['Quản lý', 'Thủ kho'].includes(currentUser.vaiTro);
    const isManager = currentUser && currentUser.vaiTro === 'Quản lý';

    tbody.innerHTML = danhMucs.map(dm => `
      <tr>
        <td>
          <span class="fw-bold text-dark fs-6">${escapeHtml(dm.tenDanhMuc)}</span>
        </td>
        <td>
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
            ${dm.countSP || 0} Model
          </span>
        </td>
        <td>
          <span class="badge bg-info-subtle text-info-emphasis px-2 py-1">
            ${dm.countPK || 0} Phụ kiện
          </span>
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            ${isManagerOrStorekeeper ? `
              <button type="button" class="btn btn-outline-primary" title="Sửa" onclick="openEditModal('${dm._id}', '${escapeHtml(dm.tenDanhMuc)}')">
                <i class="bi bi-pencil"></i>
              </button>
            ` : ''}
            ${isManager ? `
              <button type="button" class="btn btn-outline-danger" title="Xóa" ${(dm.countSP > 0 || dm.countPK > 0) ? 'disabled' : ''} onclick="deleteDanhMuc('${dm._id}', '${escapeHtml(dm.tenDanhMuc)}')">
                <i class="bi bi-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Chưa có danh mục nào</td></tr>';
  }
}

function openEditModal(id, tenDanhMuc) {
  document.getElementById('inputEditDMId').value = id;
  document.getElementById('inputEditTenDM').value = tenDanhMuc;
  if (editModalInstance) editModalInstance.show();
}

async function deleteDanhMuc(id, tenDanhMuc) {
  if (!confirm(`Bạn có chắc muốn xóa danh mục "${tenDanhMuc}"?`)) return;

  const res = await api.delete(`/danh-muc/${id}`);
  if (res.success) {
    showToast(res.message || 'Xóa danh mục thành công', 'success');
    loadDanhMucList();
  } else {
    showToast(res.message || 'Lỗi khi xóa danh mục', 'danger');
  }
}
