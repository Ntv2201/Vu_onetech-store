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

  const params = {};
  if (tuNgay) params.tuNgay = tuNgay;
  if (denNgay) params.denNgay = denNgay;
  if (hinhThuc) params.hinhThuc = hinhThuc;
  return params;
}

function applyFilters() {
  loadSoQuy();
  loadDanhSachThu();
  loadDanhSachChi();
}

function resetFilters() {
  if (document.getElementById('filterTuNgay')) document.getElementById('filterTuNgay').value = '';
  if (document.getElementById('filterDenNgay')) document.getElementById('filterDenNgay').value = '';
  if (document.getElementById('filterHinhThuc')) document.getElementById('filterHinhThuc').value = '';
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
        <td class="text-center">
          <button class="btn-action btn-action-view" onclick="viewTransactionDetail('${item._id}', '${item.loai}')" title="Xem chi tiết">
            <i class="bi bi-eye"></i>
          </button>
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
        <td class="text-center">
          <button class="btn-action btn-action-view" onclick="viewTransactionDetail('${pt._id}', 'THU')" title="Xem chi tiết phiếu thu">
            <i class="bi bi-receipt"></i>
          </button>
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
        <td class="text-center">
          <button class="btn-action btn-action-view" onclick="viewTransactionDetail('${pc._id}', 'CHI')" title="Xem chi tiết phiếu chi">
            <i class="bi bi-receipt"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateThuModal() {
  document.getElementById('formCreateThu').reset();
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const inputNgay = document.getElementById('inputThuNgay');
  if (inputNgay) inputNgay.value = now.toISOString().slice(0, 16);

  const modal = new bootstrap.Modal(document.getElementById('modalCreateThu'));
  modal.show();
}

function openCreateChiModal() {
  document.getElementById('formCreateChi').reset();
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
  const btnPrintModal = document.querySelector('#modalDetail .modal-footer button.btn-outline-primary');
  if (btnPrintModal) {
    btnPrintModal.onclick = () => {
      if (isThu) {
        inPhieuThuChuan({
          soPhieu: 'PT-' + item._id.slice(-6).toUpperCase(),
          ngayThu: item.ngayThu || item.createdAt,
          soTien: item.soTien,
          lyDo: item.ghiChu || 'Thu tiền',
          hoTenNguoiNop: item.nguoiNop || item.hoaDon?.khachHang?.hoTen || 'Khách hàng',
          diaChi: item.hoaDon?.khachHang?.diaChi || ''
        });
      } else {
        inPhieuChiChuan({
          soPhieu: 'PC-' + item._id.slice(-6).toUpperCase(),
          ngayChi: item.ngayChi || item.createdAt,
          soTien: item.soTien,
          lyDo: item.lyDo || 'Chi tiền',
          hoTenNguoiNhan: item.nguoiNhan || item.maDT || 'Đối tác / Nhà cung cấp'
        });
      }
    };
  }

  const modal = new bootstrap.Modal(document.getElementById('modalDetail'));
  modal.show();
}

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
