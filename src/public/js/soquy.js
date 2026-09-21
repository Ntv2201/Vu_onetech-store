/**
 * Sổ Quỹ & Quản lý Thu - Chi (Client-side JS)
 * Thành viên 5: Đinh Đức Vượng
 */

let currentView = 'tong-hop';
let soQuyData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSoQuy();
  loadDanhSachThu();
  loadDanhSachChi();
});

function switchView(view) {
  currentView = view;
  if (view === 'tong-hop') loadSoQuy();
  else if (view === 'phieu-thu') loadDanhSachThu();
  else if (view === 'phieu-chi') loadDanhSachChi();
}

function getFilterParams() {
  const tuNgay = document.getElementById('filterTuNgay')?.value;
  const denNgay = document.getElementById('filterDenNgay')?.value;
  const hinhThuc = document.getElementById('filterHinhThuc')?.value;
  const search = document.getElementById('filterSearch')?.value?.trim();

  const params = {};
  if (tuNgay) params.tuNgay = tuNgay;
  if (denNgay) params.denNgay = denNgay;
  if (hinhThuc) params.hinhThuc = hinhThuc;
  if (search) params.search = search;
  return params;
}

let searchDebounceTimer = null;
function onSearchInput() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    applyFilters();
  }, 300);
}

function applyFilters() {
  loadSoQuy();
  loadDanhSachThu();
  loadDanhSachChi();
}

function formatDateInput(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function setQuickDate(preset) {
  const tuInput = document.getElementById('filterTuNgay');
  const denInput = document.getElementById('filterDenNgay');
  if (!tuInput || !denInput) return;

  const now = new Date();

  if (preset === 'today') {
    const todayStr = formatDateInput(now);
    tuInput.value = todayStr;
    denInput.value = todayStr;
  } else if (preset === 'week') {
    const past = new Date();
    past.setDate(now.getDate() - 6);
    tuInput.value = formatDateInput(past);
    denInput.value = formatDateInput(now);
  } else if (preset === 'month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    tuInput.value = formatDateInput(firstDay);
    denInput.value = formatDateInput(now);
  } else if (preset === 'all') {
    tuInput.value = '';
    denInput.value = '';
  }

  // Cập nhật trạng thái active cho nút chọn nhanh
  document.querySelectorAll('.quick-date-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-preset') === preset);
  });

  applyFilters();
}

function onDateInputChange() {
  // Khi người dùng chỉnh ngày thủ công, bỏ trạng thái active của các nút chọn nhanh
  document.querySelectorAll('.quick-date-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  applyFilters();
}

function resetFilters() {
  if (document.getElementById('filterTuNgay')) document.getElementById('filterTuNgay').value = '';
  if (document.getElementById('filterDenNgay')) document.getElementById('filterDenNgay').value = '';
  if (document.getElementById('filterHinhThuc')) document.getElementById('filterHinhThuc').value = '';
  if (document.getElementById('filterSearch')) document.getElementById('filterSearch').value = '';
  
  document.querySelectorAll('.quick-date-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-preset') === 'all');
  });

  applyFilters();
}

/**
 * Tải dữ liệu báo cáo Sổ quỹ
 */
async function loadSoQuy() {
  const params = getFilterParams();
  const res = await api.get('/thanh-toan/so-quy', params);

  if (!res.success) {
    showToast(res.message || 'Không thể tải dữ liệu sổ quỹ', 'danger');
    return;
  }

  soQuyData = res.data;
  renderSoQuyStats(res.data);
  renderGiaoDichTable(res.data.giaoDichGanDay || []);
}

function renderSoQuyStats(data) {
  document.getElementById('statTongThu').textContent = formatCurrency(data.tongThu || 0);
  document.getElementById('statCountThu').textContent = data.soPhieuThu || 0;

  document.getElementById('statTongChi').textContent = formatCurrency(data.tongChi || 0);
  document.getElementById('statCountChi').textContent = data.soPhieuChi || 0;

  const tonQuyEl = document.getElementById('statTonQuy');
  tonQuyEl.textContent = formatCurrency(data.tonQuy || 0);
  if (data.tonQuy >= 0) {
    tonQuyEl.className = 'fw-bold text-primary mb-0';
  } else {
    tonQuyEl.className = 'fw-bold text-danger mb-0';
  }

  const tm = data.theoHinhThuc?.['Tien mat'] || { thu: 0, chi: 0, ton: 0 };
  const ck = data.theoHinhThuc?.['Chuyen khoan'] || { thu: 0, chi: 0, ton: 0 };
  const qt = data.theoHinhThuc?.['Quet the'] || { thu: 0, chi: 0, ton: 0 };
  const vd = data.theoHinhThuc?.['Vi dien tu'] || { thu: 0, chi: 0, ton: 0 };

  document.getElementById('statTienMat').textContent = formatCurrency(tm.ton);

  document.getElementById('bmTienMatTon').textContent = formatCurrency(tm.ton);
  document.getElementById('bmTienMatThu').textContent = formatCurrency(tm.thu);
  document.getElementById('bmTienMatChi').textContent = formatCurrency(tm.chi);

  document.getElementById('bmChuyenKhoanTon').textContent = formatCurrency(ck.ton);
  document.getElementById('bmChuyenKhoanThu').textContent = formatCurrency(ck.thu);
  document.getElementById('bmChuyenKhoanChi').textContent = formatCurrency(ck.chi);

  document.getElementById('bmQuetTheTon').textContent = formatCurrency(qt.ton);
  document.getElementById('bmQuetTheThu').textContent = formatCurrency(qt.thu);
  document.getElementById('bmQuetTheChi').textContent = formatCurrency(qt.chi);

  document.getElementById('bmViDienTuTon').textContent = formatCurrency(vd.ton);
  document.getElementById('bmViDienTuThu').textContent = formatCurrency(vd.thu);
  document.getElementById('bmViDienTuChi').textContent = formatCurrency(vd.chi);
}

function renderGiaoDichTable(list) {
  const tbody = document.getElementById('tableGiaoDichBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-3 d-block mb-1"></i> Chưa có biến động dòng tiền trong khoảng thời gian này
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const isThu = item.loai === 'THU';
    const badgeType = isThu ? '<span class="badge bg-success-subtle text-success fw-bold"><i class="bi bi-arrow-down-left"></i> THU</span>' : '<span class="badge bg-danger-subtle text-danger fw-bold"><i class="bi bi-arrow-up-right"></i> CHI</span>';
    const amountColor = isThu ? 'text-success' : 'text-danger';
    const amountPrefix = isThu ? '+' : '-';

    return `
      <tr>
        <td class="ps-3 small text-muted">${formatDateTime(item.ngay || item.createdAt)}</td>
        <td>${badgeType}</td>
        <td class="text-end fw-bold ${amountColor}">${amountPrefix}${formatCurrency(item.soTien)}</td>
        <td><span class="badge bg-light text-dark border">${item.hinhThuc}</span></td>
        <td><div class="fw-semibold text-truncate" style="max-width: 280px;" title="${escapeHtml(item.noiDung || '')}">${escapeHtml(item.noiDung || '---')}</div></td>
        <td><span class="badge bg-secondary-subtle text-dark">${escapeHtml(item.lienKet || '---')}</span></td>
        <td class="text-center text-nowrap">
          <div class="d-inline-flex justify-content-center align-items-center" style="gap: 6px;">
            <button class="btn-action btn-action-view" onclick="viewTransactionDetail('${item._id}', '${item.loai}')" title="Xem chi tiết">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn-action btn-action-print" onclick="inPhieuDirect('${item._id}', '${item.loai}')" title="In phiếu chứng từ chuẩn">
              <i class="bi bi-printer"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Tải danh sách Phiếu Thu
 */
async function loadDanhSachThu() {
  const params = getFilterParams();
  const res = await api.get('/thanh-toan/thu', params);
  const tbody = document.getElementById('tableThuBody');
  if (!tbody) return;

  if (!res.success || !res.data?.list || res.data.list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-3 d-block mb-1"></i> Không có phiếu thu nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = res.data.list.map(pt => {
    let lienKet = pt.chungTuLienQuan || 'Thu trực tiếp';
    if (pt.hoaDon) lienKet = `Hóa đơn: ${pt.hoaDon.soHD || pt.hoaDon._id}`;
    else if (pt.donDatHang) lienKet = `Đơn đặt: ${pt.donDatHang.maDonDat || pt.donDatHang._id}`;
    else if (pt.congNo) lienKet = `Công nợ: ${pt.congNo.maCN || pt.congNo._id}`;

    let thongTinBoSung = pt.nguoiNop ? `<div><small class="text-info"><i class="bi bi-person"></i> ${escapeHtml(pt.nguoiNop)}</small></div>` : '';

    return `
      <tr>
        <td class="ps-3">
          <div class="fw-bold font-monospace text-primary">PT-${pt._id.slice(-6).toUpperCase()}</div>
          <small class="text-muted">${formatDateTime(pt.ngayThu || pt.createdAt)}</small>
        </td>
        <td class="text-end fw-bold text-success">+${formatCurrency(pt.soTien)}</td>
        <td><span class="badge bg-success-subtle text-success">${pt.hinhThuc}</span></td>
        <td>
          <span class="badge bg-light text-dark border mb-1">${escapeHtml(lienKet)}</span>
          ${thongTinBoSung}
        </td>
        <td><div class="text-muted small text-truncate" style="max-width: 250px;">${escapeHtml(pt.ghiChu || '---')}</div></td>
        <td class="text-center text-nowrap">
          <div class="d-inline-flex justify-content-center align-items-center" style="gap: 6px;">
            <button class="btn-action btn-action-view" onclick="viewTransactionDetail('${pt._id}', 'THU')" title="Xem chi tiết phiếu thu">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn-action btn-action-print" onclick="inPhieuDirect('${pt._id}', 'THU')" title="In phiếu thu chuẩn">
              <i class="bi bi-printer"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Tải danh sách Phiếu Chi
 */
async function loadDanhSachChi() {
  const params = getFilterParams();
  const res = await api.get('/thanh-toan/chi', params);
  const tbody = document.getElementById('tableChiBody');
  if (!tbody) return;

  if (!res.success || !res.data?.list || res.data.list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-3 d-block mb-1"></i> Không có phiếu chi nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = res.data.list.map(pc => {
    let lienKet = pc.chungTuLienQuan || (pc.maDT ? `Đối tượng: ${pc.maDT}` : 'Chi trực tiếp');
    if (pc.phieuNhap) lienKet = `Phiếu nhập: ${pc.phieuNhap.soPN || pc.phieuNhap._id}`;
    else if (pc.donDatHang) lienKet = `Hoàn cọc đơn đặt: ${pc.donDatHang.maDonDat || pc.donDatHang._id}`;

    let thongTinBoSung = pc.nguoiNhan ? `<div><small class="text-info"><i class="bi bi-person"></i> ${escapeHtml(pc.nguoiNhan)}</small></div>` : '';

    return `
      <tr>
        <td class="ps-3">
          <div class="fw-bold font-monospace text-danger">PC-${pc._id.slice(-6).toUpperCase()}</div>
          <small class="text-muted">${formatDateTime(pc.ngayChi || pc.createdAt)}</small>
        </td>
        <td class="text-end fw-bold text-danger">-${formatCurrency(pc.soTien)}</td>
        <td><span class="badge bg-danger-subtle text-danger">${pc.hinhThuc}</span></td>
        <td>
          <span class="badge bg-light text-dark border mb-1">${escapeHtml(lienKet)}</span>
          ${thongTinBoSung}
        </td>
        <td><div class="text-muted small text-truncate" style="max-width: 250px;">${escapeHtml(pc.lyDo || '---')}</div></td>
        <td class="text-center text-nowrap">
          <div class="d-inline-flex justify-content-center align-items-center" style="gap: 6px;">
            <button class="btn-action btn-action-view" onclick="viewTransactionDetail('${pc._id}', 'CHI')" title="Xem chi tiết phiếu chi">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn-action btn-action-print" onclick="inPhieuDirect('${pc._id}', 'CHI')" title="In phiếu chi chuẩn">
              <i class="bi bi-printer"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateDocTienThu(rawVal) {
  const num = typeof parseCurrencyValue === 'function' ? parseCurrencyValue(rawVal) : Number(String(rawVal || '').replace(/\D/g, ''));
  const span = document.getElementById('spanDocTienThu');
  if (!span) return;
  if (!num || num <= 0) {
    span.textContent = 'Bằng chữ: Không đồng';
    span.className = 'text-muted';
  } else {
    const chu = typeof docSoTienBangChu === 'function' ? docSoTienBangChu(num) : '';
    span.textContent = 'Bằng chữ: ' + (chu || `${formatCurrency(num)}`);
    span.className = 'text-success fw-semibold';
  }
}

function updateDocTienChi(rawVal) {
  const num = typeof parseCurrencyValue === 'function' ? parseCurrencyValue(rawVal) : Number(String(rawVal || '').replace(/\D/g, ''));
  const span = document.getElementById('spanDocTienChi');
  if (span) {
    if (!num || num <= 0) {
      span.textContent = 'Bằng chữ: Không đồng';
      span.className = 'text-muted';
    } else {
      const chu = typeof docSoTienBangChu === 'function' ? docSoTienBangChu(num) : '';
      span.textContent = 'Bằng chữ: ' + (chu || `${formatCurrency(num)}`);
      span.className = 'text-danger fw-semibold';
    }
  }
  checkHanMucChi();
}

function getTonHienCoTheoHinhThuc(hinhThuc) {
  if (!soQuyData || !soQuyData.theoHinhThuc) return 0;
  return soQuyData.theoHinhThuc[hinhThuc]?.ton || 0;
}

function checkHanMucChi() {
  const hinhThuc = document.getElementById('inputChiHinhThuc')?.value || 'Tien mat';
  const tonHienCo = getTonHienCoTheoHinhThuc(hinhThuc);

  const labelEl = document.getElementById('labelTenHinhThucTon');
  const valEl = document.getElementById('valTonKenhHienCo');
  const alertEl = document.getElementById('alertChiAmQuy');
  const statusEl = document.getElementById('statusChiHopLe');
  const textAlertEl = document.getElementById('textChiAmQuyChiTiet');
  const textHopLeEl = document.getElementById('textChiHopLe');
  const inputSoTien = document.getElementById('inputChiSoTien');

  if (labelEl) {
    if (hinhThuc === 'Tien mat') labelEl.textContent = 'Tồn két tiền mặt hiện có:';
    else if (hinhThuc === 'Chuyen khoan') labelEl.textContent = 'Số dư tài khoản ngân hàng:';
    else if (hinhThuc === 'Quet the') labelEl.textContent = 'Số dư máy quẹt thẻ:';
    else if (hinhThuc === 'Vi dien tu') labelEl.textContent = 'Số dư ví điện tử:';
    else labelEl.textContent = `Số dư hiện có (${hinhThuc}):`;
  }

  if (valEl) {
    valEl.textContent = formatCurrency(tonHienCo);
    valEl.className = tonHienCo < 0 ? 'text-danger font-monospace fw-bold' : 'text-primary font-monospace fw-bold';
  }

  if (!alertEl || !statusEl || !inputSoTien) return;

  const rawVal = inputSoTien.value || '';
  const soTien = typeof parseCurrencyValue === 'function' ? parseCurrencyValue(rawVal) : Number(String(rawVal).replace(/\D/g, ''));

  if (soTien > 0) {
    if (soTien > tonHienCo) {
      const lech = soTien - tonHienCo;
      alertEl.classList.remove('d-none');
      statusEl.classList.add('d-none');
      inputSoTien.classList.add('is-invalid');
      if (textAlertEl) {
        textAlertEl.innerHTML = `Số tiền chi <strong>${formatCurrency(soTien)}</strong> vượt quá số dư hiện có (${formatCurrency(tonHienCo)}). Sau khi chi, quỹ sẽ bị <strong class="text-danger">ÂM -${formatCurrency(lech)}</strong>!`;
      }
    } else {
      const conLai = tonHienCo - soTien;
      alertEl.classList.add('d-none');
      statusEl.classList.remove('d-none');
      inputSoTien.classList.remove('is-invalid');
      if (textHopLeEl) {
        textHopLeEl.textContent = `Hợp lệ. Số dư dự kiến còn lại: ${formatCurrency(conLai)} (An toàn)`;
      }
    }
  } else {
    alertEl.classList.add('d-none');
    statusEl.classList.add('d-none');
    inputSoTien.classList.remove('is-invalid');
  }
}

function onChiHinhThucChange() {
  checkHanMucChi();
}
window.onChiHinhThucChange = onChiHinhThucChange;

function openCreateThuModal() {
  document.getElementById('formCreateThu').reset();
  updateDocTienThu(0);
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const inputNgay = document.getElementById('inputThuNgay');
  if (inputNgay) inputNgay.value = now.toISOString().slice(0, 16);

  const modal = new bootstrap.Modal(document.getElementById('modalCreateThu'));
  modal.show();
}

function openCreateChiModal() {
  document.getElementById('formCreateChi').reset();
  updateDocTienChi(0);
  checkHanMucChi();
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const inputNgay = document.getElementById('inputChiNgay');
  if (inputNgay) inputNgay.value = now.toISOString().slice(0, 16);

  const modal = new bootstrap.Modal(document.getElementById('modalCreateChi'));
  modal.show();
}

async function handleCreateThu(e) {
  e.preventDefault();
  const soTien = Number((document.getElementById('inputThuSoTien').value || '').replace(/[^\d]/g, ''));
  const hinhThuc = document.getElementById('inputThuHinhThuc').value;
  const ghiChu = document.getElementById('inputThuGhiChu').value.trim();
  const ngayThu = document.getElementById('inputThuNgay')?.value;
  const nguoiNop = document.getElementById('inputThuNguoiNop')?.value.trim();
  const chungTuLienQuan = document.getElementById('inputThuChungTu')?.value.trim();

  if (!soTien || soTien <= 0) {
    showToast('Vui lòng nhập số tiền hợp lệ (> 0 đ)', 'danger');
    return;
  }

  const res = await api.post('/thanh-toan/thu', { soTien, hinhThuc, ghiChu, ngayThu, nguoiNop, chungTuLienQuan });
  if (res.success) {
    showToast('Lập Phiếu Thu tiền thành công!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modalCreateThu')).hide();
    applyFilters();
  } else {
    showToast(res.message || 'Lỗi khi tạo phiếu thu', 'danger');
  }
}

async function handleCreateChi(e) {
  e.preventDefault();
  const soTien = Number((document.getElementById('inputChiSoTien').value || '').replace(/[^\d]/g, ''));
  const hinhThuc = document.getElementById('inputChiHinhThuc').value;
  const maDT = document.getElementById('inputChiMaDT').value.trim();
  const lyDo = document.getElementById('inputChiLyDo').value.trim();
  const ngayChi = document.getElementById('inputChiNgay')?.value;
  const nguoiNhan = document.getElementById('inputChiNguoiNhan')?.value.trim();
  const chungTuLienQuan = document.getElementById('inputChiChungTu')?.value.trim();

  if (!soTien || soTien <= 0) {
    showToast('Vui lòng nhập số tiền hợp lệ (> 0 đ)', 'danger');
    return;
  }

  // Cảnh báo an toàn khi chi vượt tồn két (Âm quỹ)
  const tonHienCo = getTonHienCoTheoHinhThuc(hinhThuc);
  if (soTien > tonHienCo) {
    const lech = soTien - tonHienCo;
    const tenHinhThuc = hinhThuc === 'Tien mat' ? 'tiền mặt trong két' : `quỹ ${hinhThuc}`;
    const isConfirm = await showConfirm({
      title: 'Cảnh Báo Xuất Chi Âm Quỹ',
      message: `Số tiền chi (${formatCurrency(soTien)}) lớn hơn số dư ${tenHinhThuc} hiện có (${formatCurrency(tonHienCo)}).\n\nSau khi xuất chi, quỹ sẽ bị ÂM (-${formatCurrency(lech)})!\n\nBạn có chắc chắn muốn tiếp tục xuất tiền chi này không?`,
      confirmText: 'Vẫn Tiếp Tục Chi',
      cancelText: 'Hủy Bỏ / Kiểm Tra Lại',
      type: 'danger'
    });
    if (!isConfirm) return;
  }

  const res = await api.post('/thanh-toan/chi', { soTien, hinhThuc, maDT, lyDo, ngayChi, nguoiNhan, chungTuLienQuan });
  if (res.success) {
    showToast('Lập Phiếu Chi tiền thành công!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modalCreateChi')).hide();
    applyFilters();
  } else {
    showToast(res.message || 'Lỗi khi tạo phiếu chi', 'danger');
  }
}

async function viewTransactionDetail(id, type) {
  const endpoint = type === 'THU' ? `/thanh-toan/thu/${id}` : `/thanh-toan/chi/${id}`;
  const res = await api.get(endpoint);

  if (!res.success || !res.data) {
    showToast(res.message || 'Không thể tải chi tiết chứng từ', 'danger');
    return;
  }

  const item = res.data;
  const isThu = type === 'THU';
  const title = isThu ? `PHIẾU THU TIỀN (PT-${item._id.slice(-6).toUpperCase()})` : `PHIẾU CHI TIỀN (PC-${item._id.slice(-6).toUpperCase()})`;
  document.getElementById('detailModalTitle').textContent = title;

  const html = `
    <div class="p-3 border rounded bg-light-subtle mb-3">
      <div class="text-center mb-3">
        <h5 class="fw-bold ${isThu ? 'text-success' : 'text-danger'} mb-1">${title}</h5>
        <div class="text-muted small">Ngày giao dịch: ${formatDateTime(item.ngayThu || item.ngayChi || item.createdAt)}</div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-6 text-muted">Số tiền:</div>
        <div class="col-6 text-end fw-bold fs-5 ${isThu ? 'text-success' : 'text-danger'}">${formatCurrency(item.soTien)}</div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-6 text-muted">Phương thức:</div>
        <div class="col-6 text-end fw-semibold">${item.hinhThuc}</div>
      </div>
      ${isThu ? `
        <div class="row g-2 mb-2">
          <div class="col-6 text-muted">Nội dung thu:</div>
          <div class="col-6 text-end">${escapeHtml(item.ghiChu || '---')}</div>
        </div>
        ${item.nguoiNop ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Người nộp:</div><div class="col-6 text-end">${escapeHtml(item.nguoiNop)}</div></div>` : ''}
        ${item.chungTuLienQuan ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Chứng từ liên quan:</div><div class="col-6 text-end">${escapeHtml(item.chungTuLienQuan)}</div></div>` : ''}
        ${item.hoaDon ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Hóa đơn:</div><div class="col-6 text-end font-monospace">${item.hoaDon.soHD || item.hoaDon._id}</div></div>` : ''}
        ${item.donDatHang ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Đơn đặt trước:</div><div class="col-6 text-end font-monospace">${item.donDatHang.maDonDat || item.donDatHang._id}</div></div>` : ''}
      ` : `
        <div class="row g-2 mb-2">
          <div class="col-6 text-muted">Lý do chi:</div>
          <div class="col-6 text-end">${escapeHtml(item.lyDo || '---')}</div>
        </div>
        ${item.nguoiNhan ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Người nhận:</div><div class="col-6 text-end">${escapeHtml(item.nguoiNhan)}</div></div>` : ''}
        ${item.chungTuLienQuan ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Chứng từ liên quan:</div><div class="col-6 text-end">${escapeHtml(item.chungTuLienQuan)}</div></div>` : ''}
        ${item.maDT ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Đối tượng nhận:</div><div class="col-6 text-end font-monospace">${escapeHtml(item.maDT)}</div></div>` : ''}
        ${item.phieuNhap ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Phiếu nhập kho:</div><div class="col-6 text-end font-monospace">${item.phieuNhap.soPN || item.phieuNhap._id}</div></div>` : ''}
        ${item.donDatHang ? `<div class="row g-2 mb-2"><div class="col-6 text-muted">Hoàn cọc đơn:</div><div class="col-6 text-end font-monospace">${item.donDatHang.maDonDat || item.donDatHang._id}</div></div>` : ''}
      `}
    </div>
  `;

  document.getElementById('detailModalBody').innerHTML = html;
  
  // Gán sự kiện in chuẩn Thông tư vào nút in của modal
  const btnPrintModal = document.getElementById('btnInPhieuModal') || document.querySelector('#modalDetail .modal-footer button.btn-primary');
  if (btnPrintModal) {
    btnPrintModal.onclick = () => inPhieuData(item, isThu);
  }

  const modal = new bootstrap.Modal(document.getElementById('modalDetail'));
  modal.show();
}

/**
 * Thực hiện in chứng từ phiếu thu/chi chuẩn mẫu Thông tư BTC
 */
function inPhieuData(item, isThu) {
  if (!item) return;
  if (isThu) {
    inPhieuThuChuan({
      soPhieu: 'PT-' + item._id.slice(-6).toUpperCase(),
      ngayThu: item.ngayThu || item.ngay || item.createdAt,
      soTien: item.soTien || 0,
      lyDo: item.ghiChu || item.noiDung || 'Thu tiền',
      hoTenNguoiNop: item.nguoiNop || item.hoaDon?.khachHang?.hoTen || 'Khách hàng',
      diaChi: item.hoaDon?.khachHang?.diaChi || '',
      kemTheo: item.chungTuLienQuan ? `Chứng từ: ${item.chungTuLienQuan}` : 'Hóa đơn / Phiếu thu'
    });
  } else {
    inPhieuChiChuan({
      soPhieu: 'PC-' + item._id.slice(-6).toUpperCase(),
      ngayChi: item.ngayChi || item.ngay || item.createdAt,
      soTien: item.soTien || 0,
      lyDo: item.lyDo || item.noiDung || 'Chi tiền',
      hoTenNguoiNhan: item.nguoiNhan || item.maDT || 'Đối tác / Người nhận',
      kemTheo: item.chungTuLienQuan ? `Chứng từ: ${item.chungTuLienQuan}` : 'Phiếu chi / Đề nghị thanh toán'
    });
  }
}

/**
 * Tải dữ liệu phiếu và gọi in trực tiếp từ bảng
 */
async function inPhieuDirect(id, type) {
  try {
    const isThu = type === 'THU';
    const endpoint = isThu ? `/thanh-toan/thu/${id}` : `/thanh-toan/chi/${id}`;
    const res = await api.get(endpoint);
    if (!res.success || !res.data) {
      return showToast('Không tìm thấy dữ liệu phiếu để in', 'danger');
    }
    inPhieuData(res.data, isThu);
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu in phiếu:', err);
    showToast('Lỗi khi chuẩn bị in phiếu', 'danger');
  }
}

/**
 * Xuất dữ liệu Sổ Quỹ ra Excel theo tab hiện tại (Tổng hợp dòng tiền, Phiếu thu, Phiếu chi)
 */
async function exportSoQuyExcel() {
  const now = new Date();
  const nowStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  try {
    if (currentView === 'tong-hop') {
      const params = getFilterParams();
      const res = await api.get('/thanh-toan/so-quy', params);
      const list = res.data?.giaoDichGanDay || [];
      if (list.length === 0) {
        return showToast('Không có giao dịch nào để xuất Excel', 'warning');
      }

      const columns = [
        { key: 'stt', title: 'STT' },
        { key: 'maGD', title: 'Mã Giao Dịch' },
        { key: 'ngayFormatted', title: 'Thời Gian' },
        { key: 'loai', title: 'Loại' },
        { key: 'soTienFormatted', title: 'Số Tiền' },
        { key: 'hinhThuc', title: 'Hình Thức' },
        { key: 'doiTuong', title: 'Người Nộp / Nhận' },
        { key: 'noiDung', title: 'Nội Dung / Lý Do' },
        { key: 'lienKet', title: 'Chứng Từ Liên Quan' }
      ];

      const rows = list.map((item, idx) => ({
        stt: idx + 1,
        maGD: (item.loai === 'THU' ? 'PT-' : 'PC-') + item._id.slice(-6).toUpperCase(),
        ngayFormatted: formatDateTime(item.ngay || item.createdAt),
        loai: item.loai === 'THU' ? 'THU' : 'CHI',
        soTienFormatted: (item.loai === 'THU' ? '+' : '-') + (item.soTien || 0).toLocaleString('vi-VN') + ' đ',
        hinhThuc: item.hinhThuc || '',
        doiTuong: item.nguoiNop || item.nguoiNhan || item.maDT || '',
        noiDung: item.noiDung || '',
        lienKet: item.lienKet || item.chungTuLienQuan || ''
      }));

      DataTableHelper.exportToExcel(columns, rows, `SoQuy_BienDongDongTien_${nowStr}.xls`);
      showToast('Đã xuất thành công file Excel Biến Động Dòng Tiền!', 'success');
    } else if (currentView === 'phieu-thu') {
      const res = await api.get('/thanh-toan/thu', { ...getFilterParams(), limit: 5000 });
      const list = res.data?.list || [];
      if (list.length === 0) {
        return showToast('Không có phiếu thu nào để xuất Excel', 'warning');
      }

      const columns = [
        { key: 'stt', title: 'STT' },
        { key: 'maPhieu', title: 'Mã Phiếu Thu' },
        { key: 'ngayFormatted', title: 'Thời Gian Thu' },
        { key: 'soTienFormatted', title: 'Số Tiền Thu' },
        { key: 'hinhThuc', title: 'Hình Thức' },
        { key: 'nguoiNop', title: 'Người Nộp' },
        { key: 'chungTu', title: 'Chứng Từ Gốc' },
        { key: 'ghiChu', title: 'Ghi Chú' }
      ];

      const rows = list.map((pt, idx) => ({
        stt: idx + 1,
        maPhieu: 'PT-' + pt._id.slice(-6).toUpperCase(),
        ngayFormatted: formatDateTime(pt.ngayThu || pt.createdAt),
        soTienFormatted: (pt.soTien || 0).toLocaleString('vi-VN') + ' đ',
        hinhThuc: pt.hinhThuc || '',
        nguoiNop: pt.nguoiNop || 'Khách hàng',
        chungTu: pt.chungTuLienQuan || (pt.hoaDon ? `HĐ: ${pt.hoaDon.soHD || pt.hoaDon._id}` : ''),
        ghiChu: pt.ghiChu || ''
      }));

      DataTableHelper.exportToExcel(columns, rows, `SoQuy_DanhSachPhieuThu_${nowStr}.xls`);
      showToast('Đã xuất thành công file Excel Phiếu Thu!', 'success');
    } else if (currentView === 'phieu-chi') {
      const res = await api.get('/thanh-toan/chi', { ...getFilterParams(), limit: 5000 });
      const list = res.data?.list || [];
      if (list.length === 0) {
        return showToast('Không có phiếu chi nào để xuất Excel', 'warning');
      }

      const columns = [
        { key: 'stt', title: 'STT' },
        { key: 'maPhieu', title: 'Mã Phiếu Chi' },
        { key: 'ngayFormatted', title: 'Thời Gian Chi' },
        { key: 'soTienFormatted', title: 'Số Tiền Chi' },
        { key: 'hinhThuc', title: 'Hình Thức' },
        { key: 'nguoiNhan', title: 'Người Nhận' },
        { key: 'maDT', title: 'Đối Tượng' },
        { key: 'chungTu', title: 'Chứng Từ Gốc' },
        { key: 'lyDo', title: 'Lý Do Chi' }
      ];

      const rows = list.map((pc, idx) => ({
        stt: idx + 1,
        maPhieu: 'PC-' + pc._id.slice(-6).toUpperCase(),
        ngayFormatted: formatDateTime(pc.ngayChi || pc.createdAt),
        soTienFormatted: (pc.soTien || 0).toLocaleString('vi-VN') + ' đ',
        hinhThuc: pc.hinhThuc || '',
        nguoiNhan: pc.nguoiNhan || 'Đối tác',
        maDT: pc.maDT || '',
        chungTu: pc.chungTuLienQuan || (pc.phieuNhap ? `PN: ${pc.phieuNhap.soPN || pc.phieuNhap._id}` : ''),
        lyDo: pc.lyDo || ''
      }));

      DataTableHelper.exportToExcel(columns, rows, `SoQuy_DanhSachPhieuChi_${nowStr}.xls`);
      showToast('Đã xuất thành công file Excel Phiếu Chi!', 'success');
    }
  } catch (err) {
    console.error('Lỗi xuất Excel:', err);
    showToast('Lỗi khi xuất file Excel', 'danger');
  }
}

window.exportSoQuyExcel = exportSoQuyExcel;
window.inPhieuDirect = inPhieuDirect;
window.inPhieuData = inPhieuData;

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
