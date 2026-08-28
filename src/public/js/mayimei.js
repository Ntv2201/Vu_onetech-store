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
async function initMayImeiIndex() {
  const filterForm = document.getElementById('filterForm');
  const btnReset = document.getElementById('btnResetFilter');

  const params = getQueryParams();
  if (params.sanPhamId) {
    document.getElementById('filterSanPham').value = params.sanPhamId;
  }

  await loadMayImeiList();

  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadMayImeiList();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filterSearch').value = '';
      document.getElementById('filterSanPham').value = '';
      document.getElementById('filterTrangThai').value = '';
      loadMayImeiList();
    });
  }
}

async function loadMayImeiList() {
  const search = document.getElementById('filterSearch')?.value.trim() || '';
  const sanPhamId = document.getElementById('filterSanPham')?.value || '';
  const trangThai = document.getElementById('filterTrangThai')?.value || '';

  const res = await api.get('/may-imei', { search, sanPhamId, trangThai });
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách máy IMEI', 'danger');
    return;
  }

  const imeis = Array.isArray(res.data) ? res.data : (res.imeis || res.data?.imeis || res.data?.data || []);
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

  // 2. Render danh sách IMEI
  const tbody = document.getElementById('tableImeiBody');
  if (!tbody) return;

  if (imeis && imeis.length > 0) {
    const isTechOrManager = currentUser && ['Quản lý', 'Thủ kho', 'Kỹ thuật'].includes(currentUser.vaiTro);
    const isManager = currentUser && currentUser.vaiTro === 'Quản lý';

    tbody.innerHTML = imeis.map(item => {
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
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              ${isTechOrManager ? `
                <a href="/may-imei/form.html?imei=${item.imei}" class="btn btn-outline-primary" title="Chỉnh sửa trạng thái">
                  <i class="bi bi-pencil"></i>
                </a>
              ` : ''}
              ${isManager ? `
                <button type="button" class="btn btn-outline-danger" title="Xóa" ${item.trangThai === 'Da ban' ? 'disabled' : ''} onclick="deleteImei('${item.imei}')">
                  <i class="bi bi-trash"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Không tìm thấy máy IMEI nào</td></tr>';
  }
}

async function deleteImei(imei) {
  if (!confirm(`Bạn có chắc chắn muốn xóa IMEI ${imei}? Thao tác không thể hoàn tác!`)) {
    return;
  }

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
      document.getElementById('inputGiaNhap').value = m.giaNhap || '';
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
      const giaNhap = Number(document.getElementById('inputGiaNhap').value);
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
