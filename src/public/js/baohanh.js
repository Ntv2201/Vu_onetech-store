/**
 * Module Xử lý Dịch vụ & Bảo hành phía Client (Nguyễn Quang Tuấn)
 */

document.addEventListener('DOMContentLoaded', async () => {
  initLookupForm();
  initCreateWarrantyForm();
  initWarrantyList();
});

/* =========================================================================
   1. TRA CỨU BẢO HÀNH THEO IMEI
========================================================================= */

function initLookupForm() {
  const form = document.getElementById('lookupForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const imei = document.getElementById('lookupImeiInput')?.value.trim();
    if (!imei) return;

    await performLookup(imei);
  });
}

async function performLookup(imei) {
  const container = document.getElementById('lookupResultContainer');
  if (!container) return;

  container.style.display = 'block';
  container.innerHTML = `<div class="card-custom p-5 text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Đang truy vấn lịch sử máy IMEI ${imei}...</div>`;

  const res = await api.get(`/bao-hanh/tra-cuu/${imei}`);
  if (!res.success) {
    container.innerHTML = `
      <div class="alert alert-danger p-4">
        <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
        ${escapeHtml(res.message || 'Không tìm thấy thông tin IMEI')}
      </div>
    `;
    return;
  }

  const data = res.data || res;
  const sp = data.sanPham || {};
  const bh = data.baoHanh || {};
  const sell = data.thongTinBanHang;
  const history = data.lichSuBaoHanh || [];

  const statusBadge = bh.conHanBaoHanh
    ? `<span class="badge bg-success fs-6 py-2 px-3"><i class="bi bi-shield-check me-1"></i> Còn hạn bảo hành (${bh.soNgayConLai} ngày)</span>`
    : (data.daBan
        ? `<span class="badge bg-danger fs-6 py-2 px-3"><i class="bi bi-shield-x me-1"></i> Đã hết hạn bảo hành</span>`
        : `<span class="badge bg-secondary fs-6 py-2 px-3"><i class="bi bi-info-circle me-1"></i> Máy chưa bán</span>`);

  container.innerHTML = `
    <div class="card-custom p-4 mb-4">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 border-bottom pb-3 mb-3">
        <div>
          <h5 class="fw-bold mb-1">${escapeHtml(sp.tenMay || 'Sản phẩm')}</h5>
          <div class="text-muted small">
            Số IMEI: <strong class="font-monospace text-primary">${data.imei}</strong> | 
            Hãng: <strong>${escapeHtml(sp.hang || '')}</strong> | 
            Màu: ${escapeHtml(data.mauSac || '')} | ${escapeHtml(data.dungLuong || '')}
          </div>
        </div>
        <div>${statusBadge}</div>
      </div>

      <!-- Thông tin chi tiết 3 cột -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="bg-light p-3 rounded h-100">
            <h6 class="fw-bold text-secondary mb-2"><i class="bi bi-box-seam me-1"></i> Nhập kho</h6>
            <div class="small">
              <div>Ngày nhập: <strong>${formatDate(data.ngayNhapKho)}</strong></div>
              <div>Trạng thái hiện tại: <span class="badge bg-primary">${escapeHtml(data.trangThaiHienTai)}</span></div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="bg-light p-3 rounded h-100">
            <h6 class="fw-bold text-secondary mb-2"><i class="bi bi-cart-check me-1"></i> Bán hàng & Khách hàng</h6>
            <div class="small">
              ${sell ? `
                <div>Số hóa đơn: <strong class="font-monospace text-primary">${sell.soHD}</strong></div>
                <div>Ngày bán: <strong>${formatDate(sell.ngayBan)}</strong></div>
                <div>Khách hàng: <strong>${escapeHtml(sell.khachHang ? sell.khachHang.hoTen : 'Khách vãng lai')}</strong></div>
                <div>SĐT: ${escapeHtml(sell.khachHang ? sell.khachHang.sdt : '')}</div>
              ` : `<div class="text-muted">Máy chưa có lịch sử hóa đơn bán</div>`}
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="bg-light p-3 rounded h-100">
            <h6 class="fw-bold text-secondary mb-2"><i class="bi bi-shield-lock me-1"></i> Thời hạn bảo hành</h6>
            <div class="small">
              <div>Chính sách BH: <strong>${bh.soThangBH || 12} tháng</strong></div>
              <div>Hạn bảo hành đến: <strong class="text-danger">${bh.hanBaoHanhStr || 'Chưa xác định'}</strong></div>
              ${bh.conHanBaoHanh ? `<div class="text-success fw-bold mt-1">Còn ${bh.soNgayConLai} ngày bảo hành chính hãng</div>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Lịch sử các lần bảo hành -->
      <h6 class="fw-bold mb-3"><i class="bi bi-clock-history text-primary me-2"></i>Lịch Sử Các Lần Tiếp Nhận Bảo Hành (${history.length})</h6>
      <div class="table-responsive">
        <table class="table table-bordered table-sm align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Mã PBH</th>
              <th>Ngày tiếp nhận</th>
              <th>Mô tả lỗi</th>
              <th>Linh kiện đã thay thế</th>
              <th>Trạng thái</th>
              <th class="text-end">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            ${history.length > 0 ? history.map(h => `
              <tr>
                <td class="font-monospace fw-bold text-primary">${h.maPBH}</td>
                <td>${formatDate(h.ngayTiepNhan)}</td>
                <td>${escapeHtml(h.moTaLoi)}</td>
                <td>
                  ${h.linhKienThayThe && h.linhKienThayThe.length > 0
                    ? h.linhKienThayThe.map(lk => `<span class="badge bg-secondary me-1">${escapeHtml(lk.linhKien ? lk.linhKien.tenLK : 'LK')} (x${lk.soLuong})</span>`).join('')
                    : '<span class="text-muted small">Không thay linh kiện</span>'}
                </td>
                <td><span class="badge ${h.trangThai === 'Da sua xong' || h.trangThai === 'Tra khach' ? 'bg-success' : 'bg-warning'}">${escapeHtml(h.trangThai)}</span></td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary" onclick="viewPbhDetail('${h._id}')">
                    <i class="bi bi-eye"></i>
                  </button>
                </td>
              </tr>
            `).join('') : `<tr><td colspan="6" class="text-center text-muted py-3 small">Máy chưa từng có lịch sử bảo hành nào trước đây</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* =========================================================================
   2. TIẾP NHẬN BẢO HÀNH
========================================================================= */

function initCreateWarrantyForm() {
  const form = document.getElementById('createWarrantyForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const imei = document.getElementById('createImei')?.value.trim();
    const moTaLoi = document.getElementById('createMoTaLoi')?.value.trim();
    const ghiChu = document.getElementById('createGhiChu')?.value.trim();

    if (!imei || !moTaLoi) {
      showToast('Vui lòng nhập đầy đủ IMEI và Mô tả lỗi', 'warning');
      return;
    }

    const btn = document.getElementById('btnSubmitWarranty');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Đang xử lý tiếp nhận...`;

    const res = await api.post('/bao-hanh', { imei, moTaLoi, ghiChu });

    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check-lg me-1"></i> TIẾP NHẬN BẢO HÀNH`;

    if (!res.success) {
      showToast(res.message || 'Lỗi khi tiếp nhận bảo hành', 'danger');
      return;
    }

    showToast(res.message || 'Tiếp nhận bảo hành thành công!', 'success');
    form.reset();

    // Chuyển sang tab danh sách và reload
    const tabListBtn = document.getElementById('tab-list-btn');
    if (tabListBtn) tabListBtn.click();
    await loadWarrantyList();
  });
}

/* =========================================================================
   3. DANH SÁCH & XỬ LÝ BẢO HÀNH (XUẤT LINH KIỆN, HOÀN TẤT)
========================================================================= */

async function initWarrantyList() {
  const form = document.getElementById('filterWarrantyListForm');
  const btnReset = document.getElementById('btnResetPbhFilter');

  await loadWarrantyList();

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      loadWarrantyList();
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filterPbhSearch').value = '';
      document.getElementById('filterPbhTrangThai').value = '';
      loadWarrantyList();
    });
  }

  // Setup form xuất linh kiện
  const formXuat = document.getElementById('formXuatLK');
  if (formXuat) {
    formXuat.addEventListener('submit', handleXuatLinhKien);
  }
}

async function loadWarrantyList() {
  const tbody = document.getElementById('tableWarrantyBody');
  if (!tbody) return;

  const search = document.getElementById('filterPbhSearch')?.value.trim() || '';
  const trangThai = document.getElementById('filterPbhTrangThai')?.value || '';

  const res = await api.get('/bao-hanh', { search, trangThai });
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách phiếu bảo hành', 'danger');
    return;
  }

  const pbhs = res.phieuBaoHanhs || res.data || [];
  if (pbhs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">Không có phiếu bảo hành nào</td></tr>`;
    return;
  }

  tbody.innerHTML = pbhs.map(pbh => {
    const khName = pbh.khachHang ? pbh.khachHang.hoTen : 'Khách vãng lai';
    const statusClass = pbh.trangThai === 'Da sua xong' || pbh.trangThai === 'Tra khach' ? 'bg-success' : 'bg-warning text-dark';
    return `
      <tr>
        <td class="fw-bold font-monospace text-primary">${pbh.maPBH}</td>
        <td class="font-monospace">${pbh.imei}</td>
        <td>${escapeHtml(khName)}</td>
        <td>${formatDate(pbh.ngayTiepNhan)}</td>
        <td class="text-truncate" style="max-width: 200px;">${escapeHtml(pbh.moTaLoi)}</td>
        <td><span class="badge ${statusClass}">${escapeHtml(pbh.trangThai)}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" onclick="viewPbhDetail('${pbh._id}')">
            <i class="bi bi-wrench-adjustable me-1"></i> Xử lý / Chi tiết
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function viewPbhDetail(id) {
  const res = await api.get(`/bao-hanh/${id}`);
  if (!res.success) {
    showToast(res.message || 'Không thể tải chi tiết phiếu bảo hành', 'danger');
    return;
  }

  const { phieuBaoHanh: pbh, mayImei, danhSachLinhKien } = res;
  const content = document.getElementById('pbhDetailContent');
  const footer = document.getElementById('pbhDetailFooter');
  if (!content) return;

  const kh = pbh.khachHang || {};
  const nv = pbh.nhanVien || {};
  const sp = (mayImei && mayImei.sanPham) ? mayImei.sanPham : {};
  const canRepair = currentUser && ['Quản lý', 'Kỹ thuật'].includes(currentUser.vaiTro);

  content.innerHTML = `
    <div class="p-3 bg-light rounded mb-3">
      <div class="row small">
        <div class="col-sm-6">
          <strong>Mã PBH:</strong> <span class="font-monospace text-primary fw-bold">${pbh.maPBH}</span><br>
          <strong>Ngày tiếp nhận:</strong> ${formatDate(pbh.ngayTiepNhan)}<br>
          <strong>Nhân viên tiếp nhận:</strong> ${escapeHtml(nv.hoTen || '')}<br>
          <strong>Trạng thái:</strong> <span class="badge ${pbh.trangThai === 'Dang xu ly' ? 'bg-warning text-dark' : 'bg-success'}">${escapeHtml(pbh.trangThai)}</span>
        </div>
        <div class="col-sm-6">
          <strong>Khách hàng:</strong> ${escapeHtml(kh.hoTen || 'Khách vãng lai')}<br>
          <strong>SĐT:</strong> ${escapeHtml(kh.sdt || '')}<br>
          <strong>Số IMEI:</strong> <span class="font-monospace">${pbh.imei}</span><br>
          <strong>Model máy:</strong> ${escapeHtml(sp.tenMay || '')}
        </div>
      </div>
      <hr class="my-2">
      <div class="small">
        <strong>Mô tả lỗi:</strong> <span class="text-danger fw-semibold">${escapeHtml(pbh.moTaLoi)}</span><br>
        ${pbh.ghiChu ? `<strong>Ghi chú:</strong> ${escapeHtml(pbh.ghiChu)}` : ''}
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="fw-bold mb-0">Linh Kiện Đã Thay Thế / Sửa Chữa</h6>
      ${(pbh.trangThai === 'Dang xu ly' && canRepair) ? `
        <button class="btn btn-sm btn-outline-primary" onclick="openModalXuatLinhKien('${pbh._id}')">
          <i class="bi bi-plus-lg me-1"></i> Xuất Linh Kiện Thay Thế
        </button>
      ` : ''}
    </div>

    <div class="table-responsive mb-3">
      <table class="table table-bordered table-sm mb-0">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Tên linh kiện</th>
            <th class="text-center">Số lượng</th>
            <th class="text-end">Đơn giá</th>
          </tr>
        </thead>
        <tbody>
          ${danhSachLinhKien && danhSachLinhKien.length > 0 ? danhSachLinhKien.map((lk, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td class="fw-semibold">${escapeHtml(lk.linhKien ? lk.linhKien.tenLK : 'Linh kiện')}</td>
              <td class="text-center">${lk.soLuong}</td>
              <td class="text-end">${formatCurrency(lk.donGia || 0)}</td>
            </tr>
          `).join('') : `<tr><td colspan="4" class="text-center text-muted small">Chưa xuất linh kiện nào</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  // Render buttons in footer
  if (footer) {
    const canRepair = currentUser && ['Quản lý', 'Kỹ thuật'].includes(currentUser.vaiTro);
    if (pbh.trangThai === 'Dang xu ly') {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
        ${canRepair ? `
          <button type="button" class="btn btn-success fw-semibold" onclick="handleHoanTatBaoHanh('${pbh._id}')">
            <i class="bi bi-check-circle me-1"></i> Hoàn Tất Sửa Chữa & Trả Khách
          </button>
        ` : '<span class="badge bg-warning text-dark p-2"><i class="bi bi-hourglass-split me-1"></i> Đang chờ kỹ thuật sửa chữa</span>'}
      `;
    } else {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
        <span class="badge bg-success p-2"><i class="bi bi-check2-all me-1"></i> Phiếu bảo hành đã hoàn tất</span>
      `;
    }
  }

  const modal = new bootstrap.Modal(document.getElementById('pbhDetailModal'));
  modal.show();
}

async function openModalXuatLinhKien(pbhId) {
  document.getElementById('xuatLkPbhId').value = pbhId;
  const select = document.getElementById('selectLinhKien');

  // Tải danh sách linh kiện từ DB
  select.innerHTML = '<option value="">-- Đang tải linh kiện... --</option>';

  const res = await api.get('/phu-kien'); // Hoặc endpoint linh kiện nếu có
  // Cung cấp các linh kiện mẫu
  const lkRes = await api.get('/san-pham'); // query linh kiện

  // Cho phép chọn các linh kiện có sẵn trong CSDL
  select.innerHTML = `
    <option value="">-- Chọn linh kiện cần thay --</option>
  `;

  // Mở modal xuất linh kiện
  const modal = new bootstrap.Modal(document.getElementById('modalXuatLinhKien'));
  modal.show();
}

async function handleXuatLinhKien(e) {
  e.preventDefault();
  const pbhId = document.getElementById('xuatLkPbhId').value;
  const linhKienId = document.getElementById('selectLinhKien').value;
  const soLuong = document.getElementById('inputLkSoLuong').value;
  const donGia = document.getElementById('inputLkDonGia').value;

  if (!linhKienId) {
    showToast('Vui lòng chọn linh kiện', 'warning');
    return;
  }

  const res = await api.post(`/bao-hanh/${pbhId}/linh-kien`, { linhKienId, soLuong, donGia });
  if (!res.success) {
    showToast(res.message || 'Lỗi khi xuất linh kiện', 'danger');
    return;
  }

  showToast('Xuất linh kiện thay thế thành công!', 'success');
  bootstrap.Modal.getInstance(document.getElementById('modalXuatLinhKien')).hide();
  await viewPbhDetail(pbhId);
}

async function handleHoanTatBaoHanh(pbhId) {
  if (!confirm('Xác nhận hoàn tất bảo hành và trả máy về trạng thái "Đã bán"?')) {
    return;
  }

  const res = await api.put(`/bao-hanh/${pbhId}/hoan-tat`, { trangThai: 'Da sua xong' });
  if (!res.success) {
    showToast(res.message || 'Lỗi khi hoàn tất bảo hành', 'danger');
    return;
  }

  showToast('Đã hoàn tất bảo hành và cập nhật trạng thái máy!', 'success');
  bootstrap.Modal.getInstance(document.getElementById('pbhDetailModal')).hide();
  await loadWarrantyList();
}

window.viewPbhDetail = viewPbhDetail;
window.openModalXuatLinhKien = openModalXuatLinhKien;
window.handleHoanTatBaoHanh = handleHoanTatBaoHanh;
