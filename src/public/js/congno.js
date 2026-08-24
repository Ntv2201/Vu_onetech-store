/**
 * Quản lý Công nợ Đa hình (Client-side JS)
 * Thành viên 3: Trương Thế An
 */

let dsCongNo = [];
let currentPaymentDebt = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDanhSachCongNo();
});

async function loadDanhSachCongNo() {
  const loaiDoiTuong = document.getElementById('filterLoaiDoiTuong')?.value;
  const trangThai = document.getElementById('filterTrangThai')?.value;

  const params = {};
  if (loaiDoiTuong) params.loaiDoiTuong = loaiDoiTuong;
  if (trangThai) params.trangThai = trangThai;

  const res = await api.get('/cong-no', params);
  const tbody = document.getElementById('tableCongNoBody');
  if (!tbody) return;

  if (!res.success || !res.data?.items || res.data.items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-3 d-block mb-1"></i> Không có khoản công nợ nào
        </td>
      </tr>
    `;
    updateStats(0, 0, 0, 0);
    return;
  }

  dsCongNo = res.data.items;
  renderTable(dsCongNo);
  computeStats(dsCongNo);
}

function renderTable(list) {
  const tbody = document.getElementById('tableCongNoBody');
  if (!tbody) return;

  tbody.innerHTML = list.map(cn => {
    const isKH = cn.loaiDoiTuong === 'KhachHang';
    const doiTuongBadge = isKH
      ? '<span class="badge bg-primary-subtle text-primary border border-primary"><i class="bi bi-person me-1"></i>Khách Hàng</span>'
      : '<span class="badge bg-warning-subtle text-warning border border-warning"><i class="bi bi-truck me-1"></i>Nhà Cung Cấp</span>';

    const tenDoiTuong = isKH
      ? (cn.khachHang ? `${cn.khachHang.hoTen} <small class="text-muted d-block">${cn.khachHang.sdt || ''}</small>` : 'Khách vãng lai')
      : (cn.nhaCungCap ? `${cn.nhaCungCap.tenNCC} <small class="text-muted d-block">${cn.nhaCungCap.sdt || ''}</small>` : 'NCC Chưa rõ');

    const chungTu = cn.hoaDon
      ? `<span class="font-monospace text-primary">HĐ: ${cn.hoaDon.soHD || cn.hoaDon._id?.slice(-6)}</span>`
      : (cn.phieuNhap ? `<span class="font-monospace text-warning">PN: ${cn.phieuNhap.maPN || cn.phieuNhap._id?.slice(-6)}</span>` : '---');

    const soConLai = (cn.soTienNo || 0) - (cn.soTienDaTra || 0);

    let statusBadge = '';
    if (cn.trangThai === 'Da tra het' || soConLai <= 0) {
      statusBadge = '<span class="badge bg-success">Đã trả hết</span>';
    } else if (cn.trangThai === 'Qua han') {
      statusBadge = '<span class="badge bg-danger">Quá hạn</span>';
    } else {
      statusBadge = '<span class="badge bg-warning text-dark">Còn nợ</span>';
    }

    const payButton = soConLai > 0
      ? `<button class="btn btn-sm btn-primary" onclick="openPaymentModal('${cn._id}')">
           <i class="bi bi-cash-coin me-1"></i> ${isKH ? 'Thu nợ' : 'Trả nợ'}
         </button>`
      : `<button class="btn btn-sm btn-outline-secondary" disabled>Đã xong</button>`;

    return `
      <tr>
        <td class="ps-3">${doiTuongBadge}</td>
        <td><div class="fw-semibold">${tenDoiTuong}</div></td>
        <td><small>${chungTu}</small></td>
        <td class="text-end fw-semibold">${formatCurrency(cn.soTienNo)}</td>
        <td class="text-end text-success">${formatCurrency(cn.soTienDaTra)}</td>
        <td class="text-end fw-bold text-danger">${formatCurrency(soConLai)}</td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">${payButton}</td>
      </tr>
    `;
  }).join('');
}

function computeStats(list) {
  let noKH = 0;
  let noNCC = 0;
  let daTra = 0;

  list.forEach(cn => {
    const conLai = Math.max(0, (cn.soTienNo || 0) - (cn.soTienDaTra || 0));
    daTra += (cn.soTienDaTra || 0);
    if (cn.loaiDoiTuong === 'KhachHang') {
      noKH += conLai;
    } else {
      noNCC += conLai;
    }
  });

  updateStats(noKH, noNCC, daTra, list.length);
}

function updateStats(noKH, noNCC, daTra, total) {
  if (document.getElementById('statNoKhachHang')) document.getElementById('statNoKhachHang').textContent = formatCurrency(noKH);
  if (document.getElementById('statNoNCC')) document.getElementById('statNoNCC').textContent = formatCurrency(noNCC);
  if (document.getElementById('statDaThanhToan')) document.getElementById('statDaThanhToan').textContent = formatCurrency(daTra);
  if (document.getElementById('statTotalRecords')) document.getElementById('statTotalRecords').textContent = total;
}

function resetFilters() {
  if (document.getElementById('filterLoaiDoiTuong')) document.getElementById('filterLoaiDoiTuong').value = '';
  if (document.getElementById('filterTrangThai')) document.getElementById('filterTrangThai').value = '';
  loadDanhSachCongNo();
}

/**
 * Thanh toán công nợ Modal
 */
function openPaymentModal(id) {
  const debt = dsCongNo.find(item => item._id === id);
  if (!debt) return;
  currentPaymentDebt = debt;

  const isKH = debt.loaiDoiTuong === 'KhachHang';
  const ten = isKH ? (debt.khachHang?.hoTen || 'Khách hàng') : (debt.nhaCungCap?.tenNCC || 'Nhà cung cấp');
  const conLai = Math.max(0, (debt.soTienNo || 0) - (debt.soTienDaTra || 0));

  document.getElementById('modalPaymentTitle').textContent = isKH ? 'Thu Nợ Khách Hàng (Tạo Phiếu Thu)' : 'Thanh Toán Nợ NCC (Tạo Phiếu Chi)';
  document.getElementById('paymentCongNoId').value = debt._id;
  document.getElementById('lblPaymentDoiTuong').textContent = `${ten} (${isKH ? 'Khách Hàng' : 'Nhà Cung Cấp'})`;
  document.getElementById('lblPaymentTongNo').textContent = formatCurrency(debt.soTienNo);
  document.getElementById('lblPaymentDaTra').textContent = formatCurrency(debt.soTienDaTra);
  document.getElementById('lblPaymentConLai').textContent = formatCurrency(conLai);

  document.getElementById('inputSoTienThanhToan').max = conLai;
  document.getElementById('inputSoTienThanhToan').value = conLai;
  document.getElementById('inputGhiChuThanhToan').value = isKH ? `Thu tiền nợ từ ${ten}` : `Trả tiền hàng nợ ${ten}`;

  const modal = new bootstrap.Modal(document.getElementById('modalThanhToanCongNo'));
  modal.show();
}

function fillAllRemainingDebt() {
  if (!currentPaymentDebt) return;
  const conLai = Math.max(0, (currentPaymentDebt.soTienNo || 0) - (currentPaymentDebt.soTienDaTra || 0));
  document.getElementById('inputSoTienThanhToan').value = conLai;
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('paymentCongNoId').value;
  const soTien = Number(document.getElementById('inputSoTienThanhToan').value);
  const hinhThuc = document.getElementById('inputHinhThucThanhToan').value;
  const ghiChu = document.getElementById('inputGhiChuThanhToan').value.trim();

  if (!id || soTien <= 0) {
    showToast('Vui lòng nhập số tiền thanh toán hợp lệ', 'danger');
    return;
  }

  const res = await api.post(`/cong-no/${id}/thanh-toan`, { soTien, hinhThuc, ghiChu });
  if (res.success) {
    showToast('Thanh toán công nợ thành công! Đã tự động hạch toán vào Sổ quỹ.', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modalThanhToanCongNo')).hide();
    loadDanhSachCongNo();
  } else {
    showToast(res.message || 'Lỗi khi thanh toán công nợ', 'danger');
  }
}
