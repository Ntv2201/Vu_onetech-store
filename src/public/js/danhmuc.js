/**
 * Module xử lý Danh mục phía Client
 */

let editModalInstance = null;
let addModalInstance = null;
let cachedDanhMucs = [];

document.addEventListener('DOMContentLoaded', async () => {
  const addModalEl = document.getElementById('addDanhMucModal');
  if (addModalEl) addModalInstance = new bootstrap.Modal(addModalEl);

  const editModalEl = document.getElementById('editDanhMucModal');
  if (editModalEl) editModalInstance = new bootstrap.Modal(editModalEl);

  await loadDanhMucList();

  // 1. Xử lý thêm mới từ Modal
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

  // 2. Xử lý thêm mới từ Quick Add Form bên cột phải
  const formQuick = document.getElementById('formQuickAddDanhMuc');
  if (formQuick) {
    formQuick.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('inputQuickTenDM');
      const tenDanhMuc = input ? input.value.trim() : '';
      if (!tenDanhMuc) return;

      const res = await api.post('/danh-muc', { tenDanhMuc });
      if (res.success) {
        showToast(res.message || `Đã tạo danh mục "${tenDanhMuc}" thành công`, 'success');
        if (input) input.value = '';
        loadDanhMucList();
      } else {
        showToast(res.message || 'Lỗi khi thêm danh mục', 'danger');
      }
    });
  }

  // 3. Xử lý sửa danh mục
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

  // 4. Tìm kiếm nhanh danh mục
  const searchInput = document.getElementById('searchDanhMucInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderDanhMucTable(e.target.value);
    });
  }
});

function getCategoryIconConfig(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('điện thoại') || n.includes('phone') || n.includes('iphone') || n.includes('smartphone')) {
    return { icon: 'bi-phone-fill', bg: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#ffffff' };
  }
  if (n.includes('tablet') || n.includes('ipad') || n.includes('máy tính bảng')) {
    return { icon: 'bi-tablet-fill', bg: 'linear-gradient(135deg, #10b981, #34d399)', color: '#ffffff' };
  }
  if (n.includes('phụ kiện') || n.includes('accessory') || n.includes('sạc') || n.includes('tai nghe')) {
    return { icon: 'bi-headphones', bg: 'linear-gradient(135deg, #8b5cf6, #c084fc)', color: '#ffffff' };
  }
  if (n.includes('linh kiện') || n.includes('sửa chữa') || n.includes('màn hình') || n.includes('pin')) {
    return { icon: 'bi-wrench-adjustable-circle-fill', bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#ffffff' };
  }
  return { icon: 'bi-tags-fill', bg: 'linear-gradient(135deg, #4f46e5, #818cf8)', color: '#ffffff' };
}

function updateOverviewStats(danhMucs) {
  const statDM = document.getElementById('statTotalDanhMuc');
  const statPhones = document.getElementById('statTotalPhones');
  const statTablets = document.getElementById('statTotalTablets');
  const statAcc = document.getElementById('statTotalAccessories');

  if (statDM) statDM.textContent = danhMucs.length;

  let totalPhones = 0;
  let totalTablets = 0;
  let totalAccessories = 0;

  danhMucs.forEach(dm => {
    const n = (dm.tenDanhMuc || '').toLowerCase();
    if (n.includes('tablet') || n.includes('ipad')) {
      totalTablets += (dm.countSP || 0);
    } else if (n.includes('điện thoại') || n.includes('phone')) {
      totalPhones += (dm.countSP || 0);
    }
    totalAccessories += (dm.countPK || 0);
  });

  if (statPhones) statPhones.textContent = totalPhones;
  if (statTablets) statTablets.textContent = totalTablets;
  if (statAcc) statAcc.textContent = totalAccessories;
}

function renderDanhMucTable(keyword = '') {
  const tbody = document.getElementById('tableDanhMucBody');
  if (!tbody) return;

  const kw = (keyword || '').trim().toLowerCase();
  const filtered = cachedDanhMucs.filter(dm => !kw || dm.tenDanhMuc.toLowerCase().includes(kw));

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted small"><i class="bi bi-search me-1"></i>Không tìm thấy danh mục phù hợp</td></tr>';
    return;
  }

  const isManagerOrStorekeeper = currentUser && ['Quản lý', 'Thủ kho'].includes(currentUser.vaiTro);
  const isManager = currentUser && currentUser.vaiTro === 'Quản lý';

  tbody.innerHTML = filtered.map(dm => {
    const iconConf = getCategoryIconConfig(dm.tenDanhMuc);
    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-3 py-1">
            <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style="width: 38px; height: 38px; background: ${iconConf.bg}; color: ${iconConf.color}; font-size: 1rem;">
              <i class="bi ${iconConf.icon}"></i>
            </div>
            <div class="ps-1">
              <div class="fw-bold text-dark fs-6" style="letter-spacing: -0.01em;">${escapeHtml(dm.tenDanhMuc)}</div>
              <div class="text-muted" style="font-size: 0.75rem;">Phân loại hệ thống</div>
            </div>
          </div>
        </td>
        <td class="text-center">
          <a href="/san-pham/index.html?danhMucId=${dm._id}" class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 text-decoration-none" title="Xem danh sách model máy">
            <i class="bi bi-phone me-1"></i> ${dm.countSP || 0} Model
          </a>
        </td>
        <td class="text-center">
          <a href="/phu-kien/index.html?danhMucId=${dm._id}" class="badge bg-purple-subtle text-purple border border-purple-subtle px-2.5 py-1.5 text-decoration-none" style="background-color: #f3e8ff; color: #7e22ce; border-color: #e9d5ff;" title="Xem danh sách phụ kiện">
            <i class="bi bi-headphones me-1"></i> ${dm.countPK || 0} Phụ kiện
          </a>
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            ${isManagerOrStorekeeper ? `
              <button type="button" class="btn btn-outline-primary" title="Sửa tên danh mục" onclick="openEditModal('${dm._id}', '${escapeHtml(dm.tenDanhMuc)}')">
                <i class="bi bi-pencil"></i>
              </button>
            ` : ''}
            ${isManager ? `
              <button type="button" class="btn btn-outline-danger" title="${(dm.countSP > 0 || dm.countPK > 0) ? 'Không thể xóa danh mục đang có sản phẩm' : 'Xóa danh mục'}" ${(dm.countSP > 0 || dm.countPK > 0) ? 'disabled' : ''} onclick="deleteDanhMuc('${dm._id}', '${escapeHtml(dm.tenDanhMuc)}')">
                <i class="bi bi-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadDanhMucList() {
  const res = await api.get('/danh-muc');
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách danh mục', 'danger');
    return;
  }

  cachedDanhMucs = res.data || [];
  updateOverviewStats(cachedDanhMucs);
  renderDanhMucTable('');
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
