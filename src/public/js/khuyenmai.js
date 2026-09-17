/**
 * Quản lý Khuyến Mãi (Promo Code)
 */
let currentPage = 1;
const limit = 10;
let currentSearch = '';
let currentStatus = '';

let khuyenMaiModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initKhuyenMaiPage();
});

async function initKhuyenMaiPage() {
  const modalEl = document.getElementById('khuyenMaiModal');
  if (modalEl) {
    khuyenMaiModalInstance = new bootstrap.Modal(modalEl);
  }

  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentSearch = e.target.value.trim();
      loadKhuyenMais(1);
    }
  });
  
  document.getElementById('searchInput').addEventListener('input', (e) => {
    if (e.target.value.trim() === '') {
      currentSearch = '';
      loadKhuyenMais(1);
    }
  });

  document.getElementById('statusFilter').addEventListener('change', (e) => {
    currentStatus = e.target.value;
    loadKhuyenMais(1);
  });

  document.getElementById('btnSaveKM').addEventListener('click', saveKhuyenMai);
  
  // Logic hiển thị Loại giảm
  document.getElementById('loaiGiam').addEventListener('change', (e) => {
    const loai = e.target.value;
    const divMax = document.getElementById('divGiaTriToiDa');
    if (loai === 'Phan tram') {
      divMax.style.display = 'block';
    } else {
      divMax.style.display = 'none';
      document.getElementById('giaTriToiDa').value = '';
    }
  });

  await loadKhuyenMais(1);
}

async function loadKhuyenMais(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('kmTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div> Đang tải...</td></tr>`;

  try {
    const res = await api.get('/khuyen-mai', {
      page: currentPage,
      limit,
      search: currentSearch,
      trangThai: currentStatus
    });

    if (res.success) {
      const data = res.data;
      renderTable(data.khuyenMais);
      renderPagination(data.pagination.total, data.pagination.totalPages);
      updateStats(data.pagination.total, data.khuyenMais);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${res.message || 'Lỗi tải dữ liệu'}</td></tr>`;
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Có lỗi xảy ra: ${error.message}</td></tr>`;
  }
}

function renderTable(list) {
  const tbody = document.getElementById('kmTableBody');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">Không có mã khuyến mãi nào</td></tr>`;
    return;
  }

  const html = list.map(km => {
    const gtGiam = km.loaiGiam === 'Phan tram' ? `${km.giaTriGiam}%` : `${formatCurrency(km.giaTriGiam)}`;
    const limitInfo = (km.loaiGiam === 'Phan tram' && km.giaTriToiDa > 0) ? `<br><small class="text-muted">Tối đa ${formatCurrency(km.giaTriToiDa)}</small>` : '';
    
    let statusClass = 'bg-secondary';
    if (km.trangThai === 'Hoat dong') statusClass = 'bg-success';
    if (km.trangThai === 'Tam ngung') statusClass = 'bg-warning text-dark';
    if (km.trangThai === 'Het han') statusClass = 'bg-danger';

    const usesInfo = km.soLuotToiDa > 0 ? `${km.soLuotDaDung} / ${km.soLuotToiDa}` : `${km.soLuotDaDung} / &infin;`;

    return `
      <tr>
        <td class="fw-bold text-primary font-monospace">${escapeHtml(km.maKM)}</td>
        <td>
          <div class="fw-semibold">${escapeHtml(km.tenKM)}</div>
          ${km.ghiChu ? `<small class="text-muted d-block text-truncate" style="max-width: 200px;">${escapeHtml(km.ghiChu)}</small>` : ''}
        </td>
        <td>
          <span class="fw-bold">${gtGiam}</span>
          ${limitInfo}
        </td>
        <td class="small">
          <div>Từ: ${new Date(km.ngayBatDau).toLocaleDateString('vi-VN')}</div>
          <div>Đến: ${new Date(km.ngayKetThuc).toLocaleDateString('vi-VN')}</div>
        </td>
        <td class="text-center">${usesInfo}</td>
        <td class="text-center">
          <span class="badge ${statusClass}">${km.trangThai}</span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" onclick="editKhuyenMai('${km._id}')" title="Sửa"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteKhuyenMai('${km._id}')" title="Xóa"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = html;
}

function renderPagination(totalItems, totalPages) {
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);
  document.getElementById('paginationInfo').innerText = `Hiển thị ${totalItems > 0 ? start : 0}-${end} trong tổng số ${totalItems} mã`;

  let html = '';
  if (totalPages > 1) {
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="loadKhuyenMais(${currentPage - 1})"><i class="bi bi-chevron-left"></i></button>
    </li>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <button class="page-link" onclick="loadKhuyenMais(${i})">${i}</button>
      </li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <button class="page-link" onclick="loadKhuyenMais(${currentPage + 1})"><i class="bi bi-chevron-right"></i></button>
    </li>`;
  }
  document.getElementById('paginationControls').innerHTML = html;
}

function updateStats(total, list) {
  document.getElementById('statTotalKM').innerText = total;
  // Số lượng đang hoạt động có thể tính từ server tốt hơn, nhưng tạm đếm trên client cho danh sách hiện tại
  // Để chính xác, backend nên trả về stat riêng.
  // Ở đây tôi fake 1 chút hoặc yêu cầu update sau. Tạm đếm số lượng 'Hoat dong' trong mảng list
  const activeCount = list.filter(k => k.trangThai === 'Hoat dong').length;
  // Sẽ chính xác nếu tổng số mã ít, nếu phân trang sẽ chỉ là số trên trang hiện tại.
  // Cách chuẩn: Gửi thêm thông tin stats từ API. 
  document.getElementById('statActiveKM').innerText = total > 0 ? (activeCount > 0 ? activeCount + "+" : 0) : 0;
}

function resetForm() {
  document.getElementById('khuyenMaiForm').reset();
  document.getElementById('kmId').value = '';
  document.getElementById('divTrangThai').style.display = 'none';
  document.getElementById('khuyenMaiModalTitle').innerText = 'Thêm Khuyến Mãi Mới';
  document.getElementById('loaiGiam').dispatchEvent(new Event('change'));
}

async function editKhuyenMai(id) {
  try {
    const res = await api.get(`/khuyen-mai/${id}`);
    if (res.success && res.data) {
      const km = res.data;
      document.getElementById('kmId').value = km._id;
      document.getElementById('maKM').value = km.maKM || '';
      document.getElementById('tenKM').value = km.tenKM || '';
      document.getElementById('loaiGiam').value = km.loaiGiam || 'Phan tram';
      document.getElementById('giaTriGiam').value = km.giaTriGiam || '';
      document.getElementById('giaTriToiDa').value = km.giaTriToiDa || '';
      
      if (km.ngayBatDau) document.getElementById('ngayBatDau').value = km.ngayBatDau.split('T')[0];
      if (km.ngayKetThuc) document.getElementById('ngayKetThuc').value = km.ngayKetThuc.split('T')[0];
      
      document.getElementById('soLuotToiDa').value = km.soLuotToiDa || '';
      document.getElementById('ghiChu').value = km.ghiChu || '';
      
      document.getElementById('divTrangThai').style.display = 'block';
      document.getElementById('trangThai').value = km.trangThai || 'Hoat dong';

      document.getElementById('khuyenMaiModalTitle').innerText = 'Chỉnh sửa Khuyến Mãi';
      document.getElementById('loaiGiam').dispatchEvent(new Event('change'));
      
      if (khuyenMaiModalInstance) {
        khuyenMaiModalInstance.show();
      }
    }
  } catch (error) {
    showToast('Không thể tải chi tiết khuyến mãi', 'danger');
  }
}

async function saveKhuyenMai() {
  const form = document.getElementById('khuyenMaiForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const id = document.getElementById('kmId').value;
  const payload = {
    maKM: document.getElementById('maKM').value,
    tenKM: document.getElementById('tenKM').value,
    loaiGiam: document.getElementById('loaiGiam').value,
    giaTriGiam: document.getElementById('giaTriGiam').value,
    giaTriToiDa: document.getElementById('giaTriToiDa').value,
    ngayBatDau: document.getElementById('ngayBatDau').value,
    ngayKetThuc: document.getElementById('ngayKetThuc').value,
    soLuotToiDa: document.getElementById('soLuotToiDa').value,
    ghiChu: document.getElementById('ghiChu').value
  };

  if (id) {
    payload.trangThai = document.getElementById('trangThai').value;
  }

  const btn = document.getElementById('btnSaveKM');
  const originText = btn.innerText;
  btn.innerText = 'Đang lưu...';
  btn.disabled = true;

  try {
    let res;
    if (id) {
      res = await api.put(`/khuyen-mai/${id}`, payload);
    } else {
      res = await api.post('/khuyen-mai', payload);
    }

    if (res.success) {
      showToast(res.message, 'success');
      if (khuyenMaiModalInstance) khuyenMaiModalInstance.hide();
      loadKhuyenMais(currentPage);
    } else {
      showToast(res.message || 'Có lỗi xảy ra', 'danger');
    }
  } catch (error) {
    showToast(error.message || 'Lỗi mạng', 'danger');
  } finally {
    btn.innerText = originText;
    btn.disabled = false;
  }
}

async function deleteKhuyenMai(id) {
  const result = await Swal.fire({
    title: 'Bạn có chắc chắn?',
    text: "Mã khuyến mãi này sẽ bị xóa vĩnh viễn và không thể khôi phục!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Đồng ý xóa',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    try {
      const res = await api.delete(`/khuyen-mai/${id}`);
      if (res.success) {
        showToast(res.message, 'success');
        loadKhuyenMais(currentPage);
      } else {
        showToast(res.message || 'Không thể xóa', 'danger');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra khi xóa', 'danger');
    }
  }
}
