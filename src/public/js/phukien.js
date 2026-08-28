/**
 * Module xử lý Phụ kiện phía Client
 */

let addPKModalInstance = null;
let editPKModalInstance = null;
let cachedDanhMucs = [];

document.addEventListener('DOMContentLoaded', async () => {
  const addModalEl = document.getElementById('addPhuKienModal');
  if (addModalEl) addPKModalInstance = new bootstrap.Modal(addModalEl);

  const editModalEl = document.getElementById('editPhuKienModal');
  if (editModalEl) editPKModalInstance = new bootstrap.Modal(editModalEl);

  const filterForm = document.getElementById('filterForm');
  const btnReset = document.getElementById('btnResetFilter');

  await loadPhuKienList();

  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadPhuKienList();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filterSearch').value = '';
      document.getElementById('filterDanhMuc').value = '';
      loadPhuKienList();
    });
  }

  // Xử lý thêm mới
  const formAdd = document.getElementById('formAddPhuKien');
  if (formAdd) {
    formAdd.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        tenPK: document.getElementById('inputAddTenPK').value.trim(),
        danhMuc: document.getElementById('selectAddDanhMuc').value,
        giaBan: Number(document.getElementById('inputAddGiaBan').value),
        soLuongTon: Number(document.getElementById('inputAddSoLuongTon').value) || 0
      };

      if (!body.tenPK || !body.danhMuc || isNaN(body.giaBan)) {
        showToast('Vui lòng điền đầy đủ các thông tin bắt buộc', 'danger');
        return;
      }

      const res = await api.post('/phu-kien', body);
      if (res.success) {
        showToast(res.message || 'Thêm phụ kiện thành công', 'success');
        formAdd.reset();
        if (addPKModalInstance) addPKModalInstance.hide();
        loadPhuKienList();
      } else {
        showToast(res.message || 'Lỗi khi thêm phụ kiện', 'danger');
      }
    });
  }

  // Xử lý sửa
  const formEdit = document.getElementById('formEditPhuKien');
  if (formEdit) {
    formEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('inputEditPKId').value;
      const body = {
        tenPK: document.getElementById('inputEditTenPK').value.trim(),
        danhMuc: document.getElementById('selectEditDanhMuc').value,
        giaBan: Number(document.getElementById('inputEditGiaBan').value),
        soLuongTon: Number(document.getElementById('inputEditSoLuongTon').value) || 0
      };

      if (!id || !body.tenPK || !body.danhMuc || isNaN(body.giaBan)) {
        showToast('Vui lòng điền đầy đủ các thông tin bắt buộc', 'danger');
        return;
      }

      const res = await api.put(`/phu-kien/${id}`, body);
      if (res.success) {
        showToast(res.message || 'Cập nhật phụ kiện thành công', 'success');
        if (editPKModalInstance) editPKModalInstance.hide();
        loadPhuKienList();
      } else {
        showToast(res.message || 'Lỗi khi cập nhật phụ kiện', 'danger');
      }
    });
  }
});

async function loadPhuKienList() {
  const search = document.getElementById('filterSearch')?.value.trim() || '';
  const danhMucId = document.getElementById('filterDanhMuc')?.value || '';

  const res = await api.get('/phu-kien', { search, danhMucId });
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách phụ kiện', 'danger');
    return;
  }

  const phuKiens = Array.isArray(res.data) ? res.data : (res.phuKiens || res.data?.phuKiens || res.data?.data || []);
  const danhMucs = res.danhMucs || res.data?.danhMucs || [];
  if (danhMucs && danhMucs.length > 0) {
    cachedDanhMucs = danhMucs;
    populateDanhMucSelects(danhMucs);
  }

  const tbody = document.getElementById('tablePhuKienBody');
  if (!tbody) return;

  if (phuKiens && phuKiens.length > 0) {
    const isManagerOrStorekeeper = currentUser && ['Quản lý', 'Thủ kho'].includes(currentUser.vaiTro);
    const isManager = currentUser && currentUser.vaiTro === 'Quản lý';

    tbody.innerHTML = phuKiens.map(pk => `
      <tr>
        <td class="fw-bold text-dark">${escapeHtml(pk.tenPK)}</td>
        <td><span class="badge bg-light text-secondary border">${pk.danhMuc ? escapeHtml(pk.danhMuc.tenDanhMuc) : 'N/A'}</span></td>
        <td class="text-primary fw-semibold">${formatCurrency(pk.giaBan)}</td>
        <td>
          <span class="badge ${pk.soLuongTon > 5 ? 'bg-success' : (pk.soLuongTon > 0 ? 'bg-warning text-dark' : 'bg-danger')}">
            ${pk.soLuongTon} cái
          </span>
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            ${isManagerOrStorekeeper ? `
              <button type="button" class="btn btn-outline-primary" title="Sửa" onclick="openEditPKModal('${pk._id}')">
                <i class="bi bi-pencil"></i>
              </button>
            ` : ''}
            ${isManager ? `
              <button type="button" class="btn btn-outline-danger" title="Xóa" onclick="deletePhuKien('${pk._id}', '${escapeHtml(pk.tenPK)}')">
                <i class="bi bi-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Không tìm thấy phụ kiện nào</td></tr>';
  }
}

function populateDanhMucSelects(danhMucs) {
  const filterSelect = document.getElementById('filterDanhMuc');
  const addSelect = document.getElementById('selectAddDanhMuc');
  const editSelect = document.getElementById('selectEditDanhMuc');

  if (filterSelect && filterSelect.options.length <= 1) {
    danhMucs.forEach(dm => {
      const opt = document.createElement('option');
      opt.value = dm._id;
      opt.textContent = dm.tenDanhMuc;
      filterSelect.appendChild(opt);
    });
  }

  if (addSelect && addSelect.options.length <= 1) {
    danhMucs.forEach(dm => {
      const opt = document.createElement('option');
      opt.value = dm._id;
      opt.textContent = dm.tenDanhMuc;
      addSelect.appendChild(opt);
    });
  }

  if (editSelect && editSelect.options.length <= 1) {
    danhMucs.forEach(dm => {
      const opt = document.createElement('option');
      opt.value = dm._id;
      opt.textContent = dm.tenDanhMuc;
      editSelect.appendChild(opt);
    });
  }
}

async function openEditPKModal(id) {
  const res = await api.get(`/phu-kien/${id}`);
  if (!res.success || !res.data) {
    showToast('Không tìm thấy phụ kiện', 'danger');
    return;
  }

  const pk = res.data;
  document.getElementById('inputEditPKId').value = pk._id;
  document.getElementById('inputEditTenPK').value = pk.tenPK;
  document.getElementById('selectEditDanhMuc').value = pk.danhMuc?._id || pk.danhMuc || '';
  document.getElementById('inputEditGiaBan').value = pk.giaBan;
  document.getElementById('inputEditSoLuongTon').value = pk.soLuongTon;

  if (editPKModalInstance) editPKModalInstance.show();
}

async function deletePhuKien(id, tenPK) {
  if (!confirm(`Bạn có chắc muốn xóa phụ kiện "${tenPK}"?`)) return;

  const res = await api.delete(`/phu-kien/${id}`);
  if (res.success) {
    showToast(res.message || 'Xóa phụ kiện thành công', 'success');
    loadPhuKienList();
  } else {
    showToast(res.message || 'Lỗi khi xóa phụ kiện', 'danger');
  }
}
