/**
 * Module Xử lý Bán hàng POS và Quản lý Hóa đơn phía Client (Nguyễn Quang Tuấn)
 */

let cart = {
  imeis: [], // [{ imei, tenMay, giaBan, mauSac, dungLuong }]
  phuKiens: [] // [{ _id, tenPK, giaBan, soLuong, soLuongTon }]
};

let allAvailableImeis = [];
let allPhuKiens = [];
let allSanPhams = [];
let allKhachHangs = [];

document.addEventListener('DOMContentLoaded', async () => {
  await initPosPage();
  await initInvoiceListPage();
});

async function initPosPage() {
  await loadPosData();
  renderCart();

  // Search & Filter IMEI
  const searchInput = document.getElementById('searchImeiInput');
  const filterSp = document.getElementById('filterPosSanPham');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterImeiDisplay());
  }
  if (filterSp) {
    filterSp.addEventListener('change', () => filterImeiDisplay());
  }

  // Clear Cart
  const btnClear = document.getElementById('btnClearCart');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      cart = { imeis: [], phuKiens: [] };
      renderCart();
      filterImeiDisplay();
    });
  }

  // Submit Order
  const btnSubmit = document.getElementById('btnSubmitOrder');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', handleCreateOrder);
  }
}

async function loadPosData() {
  const [resImei, resPk, resKh, resSp] = await Promise.all([
    api.get('/may-imei', { trangThai: 'Con hang' }),
    api.get('/phu-kien'),
    api.get('/khach-hang'),
    api.get('/san-pham')
  ]);

  if (resImei.success) {
    allAvailableImeis = resImei.data || [];
  }
  if (resPk.success) {
    allPhuKiens = resPk.data || [];
  }
  if (resKh.success) {
    allKhachHangs = resKh.data || [];
    renderKhachHangOptions();
  }
  if (resSp.success) {
    allSanPhams = resSp.data || [];
    renderSanPhamOptions();
  }

  filterImeiDisplay();
  renderPhuKienList();
}

function renderSanPhamOptions() {
  const select = document.getElementById('filterPosSanPham');
  if (!select) return;
  select.innerHTML = '<option value="">-- Tất cả Model máy --</option>' +
    allSanPhams.map(sp => `<option value="${sp._id}">${escapeHtml(sp.tenMay)}</option>`).join('');
}

function renderKhachHangOptions() {
  const select = document.getElementById('selectKhachHang');
  if (!select) return;
  select.innerHTML = '<option value="">-- Khách vãng lai (Không lưu) --</option>' +
    allKhachHangs.map(kh => `<option value="${kh._id}">${escapeHtml(kh.hoTen)} - ${escapeHtml(kh.sdt || '')}</option>`).join('');
}

function filterImeiDisplay() {
  const container = document.getElementById('availableImeiList');
  if (!container) return;

  const keyword = document.getElementById('searchImeiInput')?.value.trim().toLowerCase() || '';
  const spFilter = document.getElementById('filterPosSanPham')?.value || '';

  // Loại trừ các IMEI đã cho vào giỏ
  const inCartImeis = new Set(cart.imeis.map(m => m.imei));

  const filtered = allAvailableImeis.filter(m => {
    if (inCartImeis.has(m.imei)) return false;
    const matchImei = m.imei.toLowerCase().includes(keyword);
    const matchName = m.sanPham && m.sanPham.tenMay.toLowerCase().includes(keyword);
    const matchSp = !spFilter || (m.sanPham && m.sanPham._id === spFilter);
    return (matchImei || matchName) && matchSp;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-4 small">Không tìm thấy máy IMEI phù hợp còn hàng</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => {
    const tenMay = m.sanPham ? m.sanPham.tenMay : 'Điện thoại';
    const giaBan = m.sanPham ? m.sanPham.giaBan : m.giaNhap * 1.15;
    return `
      <div class="col-md-6 col-12">
        <div class="pos-product-item" onclick="addImeiToCart('${m.imei}')">
          <div class="fw-semibold text-truncate small">${escapeHtml(tenMay)}</div>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <span class="badge bg-light text-dark border font-monospace" style="font-size: 0.75rem;">${m.imei}</span>
            <span class="text-primary fw-bold small">${formatCurrency(giaBan)}</span>
          </div>
          <div class="text-muted" style="font-size: 0.7rem;">Màu: ${escapeHtml(m.mauSac || 'Tiêu chuẩn')} | ${escapeHtml(m.dungLuong || '')}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPhuKienList() {
  const container = document.getElementById('availablePhuKienList');
  if (!container) return;

  if (allPhuKiens.length === 0) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-3 small">Không có phụ kiện nào</div>`;
    return;
  }

  container.innerHTML = allPhuKiens.map(pk => {
    return `
      <div class="col-md-6 col-12">
        <div class="pos-product-item" onclick="addPhuKienToCart('${pk._id}')">
          <div class="fw-semibold text-truncate small">${escapeHtml(pk.tenPK)}</div>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <span class="text-muted small" style="font-size: 0.75rem;">Tồn: <strong class="${pk.soLuongTon > 0 ? 'text-success' : 'text-danger'}">${pk.soLuongTon}</strong></span>
            <span class="text-primary fw-bold small">${formatCurrency(pk.giaBan)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function addImeiToCart(imei) {
  const may = allAvailableImeis.find(m => m.imei === imei);
  if (!may) return;

  cart.imeis.push({
    imei: may.imei,
    tenMay: may.sanPham ? may.sanPham.tenMay : 'Điện thoại',
    giaBan: may.sanPham ? may.sanPham.giaBan : may.giaNhap * 1.15,
    mauSac: may.mauSac,
    dungLuong: may.dungLuong
  });

  renderCart();
  filterImeiDisplay();
  showToast(`Đã thêm máy IMEI ${imei} vào giỏ`, 'success');
}

function removeImeiFromCart(imei) {
  cart.imeis = cart.imeis.filter(m => m.imei !== imei);
  renderCart();
  filterImeiDisplay();
}

function addPhuKienToCart(pkId) {
  const pk = allPhuKiens.find(p => p._id === pkId);
  if (!pk) return;

  if (pk.soLuongTon <= 0) {
    showToast(`Phụ kiện "${pk.tenPK}" đã hết hàng trong kho!`, 'danger');
    return;
  }

  const exist = cart.phuKiens.find(p => p._id === pkId);
  if (exist) {
    if (exist.soLuong >= pk.soLuongTon) {
      showToast(`Không thể thêm! Tồn kho chỉ còn ${pk.soLuongTon}`, 'warning');
      return;
    }
    exist.soLuong += 1;
  } else {
    cart.phuKiens.push({
      _id: pk._id,
      tenPK: pk.tenPK,
      giaBan: pk.giaBan,
      soLuong: 1,
      soLuongTon: pk.soLuongTon
    });
  }

  renderCart();
  showToast(`Đã thêm phụ kiện "${pk.tenPK}"`, 'success');
}

function changePhuKienQty(pkId, delta) {
  const exist = cart.phuKiens.find(p => p._id === pkId);
  if (!exist) return;

  exist.soLuong += delta;
  if (exist.soLuong <= 0) {
    cart.phuKiens = cart.phuKiens.filter(p => p._id !== pkId);
  } else if (exist.soLuong > exist.soLuongTon) {
    exist.soLuong = exist.soLuongTon;
    showToast(`Số lượng tối đa còn trong kho: ${exist.soLuongTon}`, 'warning');
  }

  renderCart();
}

function renderCart() {
  const tbody = document.getElementById('cartTableBody');
  const btnSubmit = document.getElementById('btnSubmitOrder');
  if (!tbody) return;

  const hasItems = cart.imeis.length > 0 || cart.phuKiens.length > 0;
  if (btnSubmit) btnSubmit.disabled = !hasItems;

  if (!hasItems) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4 small">Chưa có sản phẩm nào được chọn</td></tr>`;
    document.getElementById('totalMachinePrice').innerText = '0 đ';
    document.getElementById('totalAccessoryPrice').innerText = '0 đ';
    document.getElementById('totalGrandPrice').innerText = '0 đ';
    return;
  }

  let html = '';
  let totalMay = 0;
  let totalPk = 0;

  // Render Máy IMEI
  cart.imeis.forEach(m => {
    totalMay += m.giaBan;
    html += `
      <tr>
        <td>
          <div class="fw-semibold small">${escapeHtml(m.tenMay)}</div>
          <span class="badge bg-primary-subtle text-primary font-monospace" style="font-size: 0.7rem;">IMEI: ${m.imei}</span>
        </td>
        <td class="text-center small">1</td>
        <td class="text-end fw-semibold small">${formatCurrency(m.giaBan)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-link text-danger p-0" onclick="removeImeiFromCart('${m.imei}')" title="Xóa">
            <i class="bi bi-x-circle"></i>
          </button>
        </td>
      </tr>
    `;
  });

  // Render Phụ kiện
  cart.phuKiens.forEach(pk => {
    const subtotal = pk.giaBan * pk.soLuong;
    totalPk += subtotal;
    html += `
      <tr>
        <td>
          <div class="fw-semibold small">${escapeHtml(pk.tenPK)}</div>
          <span class="text-muted" style="font-size: 0.7rem;">Phụ kiện</span>
        </td>
        <td class="text-center">
          <div class="d-flex align-items-center justify-content-center gap-1">
            <button class="btn btn-sm btn-light p-0 px-1" onclick="changePhuKienQty('${pk._id}', -1)">-</button>
            <span class="small fw-bold">${pk.soLuong}</span>
            <button class="btn btn-sm btn-light p-0 px-1" onclick="changePhuKienQty('${pk._id}', 1)">+</button>
          </div>
        </td>
        <td class="text-end fw-semibold small">${formatCurrency(subtotal)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-link text-danger p-0" onclick="changePhuKienQty('${pk._id}', -999)" title="Xóa">
            <i class="bi bi-x-circle"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  document.getElementById('totalMachinePrice').innerText = formatCurrency(totalMay);
  document.getElementById('totalAccessoryPrice').innerText = formatCurrency(totalPk);
  document.getElementById('totalGrandPrice').innerText = formatCurrency(totalMay + totalPk);
}

async function handleCreateOrder() {
  if (cart.imeis.length === 0 && cart.phuKiens.length === 0) {
    showToast('Giỏ hàng đang trống!', 'warning');
    return;
  }

  const khachHang = document.getElementById('selectKhachHang')?.value || null;
  const hinhThucThanhToan = document.getElementById('selectPaymentMethod')?.value || 'Da thanh toan';
  const ghiChu = document.getElementById('inputGhiChu')?.value || '';

  const payload = {
    khachHang,
    danhSachIMEI: cart.imeis.map(m => m.imei),
    danhSachPhuKien: cart.phuKiens.map(pk => ({
      phuKien: pk._id,
      soLuong: pk.soLuong,
      donGiaBan: pk.giaBan
    })),
    hinhThucThanhToan,
    ghiChu
  };

  const btn = document.getElementById('btnSubmitOrder');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Đang xử lý bán hàng...`;

  const res = await api.post('/hoa-don', payload);

  btn.disabled = false;
  btn.innerHTML = `<i class="bi bi-check-circle me-1"></i> HOÀN TẤT BÁN HÀNG & XUẤT KHO`;

  if (!res.success) {
    showToast(res.message || 'Lỗi khi tạo hóa đơn', 'danger');
    return;
  }

  showToast(res.message || 'Bán hàng thành công!', 'success');

  // Reset giỏ
  cart = { imeis: [], phuKiens: [] };
  renderCart();

  // Reload data
  await loadPosData();
  await loadInvoiceList();

  // Mở modal xem và in hóa đơn
  if (res.data && res.data.hoaDon) {
    viewInvoiceDetail(res.data.hoaDon._id);
  }
}

/* =========================================================================
   TAB 2: QUẢN LÝ DANH SÁCH HÓA ĐƠN
========================================================================= */

async function initInvoiceListPage() {
  const form = document.getElementById('filterInvoiceForm');
  const btnReset = document.getElementById('btnResetInvFilter');

  await loadInvoiceList();

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      loadInvoiceList();
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filterInvSearch').value = '';
      document.getElementById('filterInvTuNgay').value = '';
      document.getElementById('filterInvDenNgay').value = '';
      document.getElementById('filterInvTrangThai').value = '';
      loadInvoiceList();
    });
  }
}

async function loadInvoiceList() {
  const tbody = document.getElementById('tableInvoiceBody');
  if (!tbody) return;

  const search = document.getElementById('filterInvSearch')?.value.trim() || '';
  const tuNgay = document.getElementById('filterInvTuNgay')?.value || '';
  const denNgay = document.getElementById('filterInvDenNgay')?.value || '';
  const trangThai = document.getElementById('filterInvTrangThai')?.value || '';

  const res = await api.get('/hoa-don', { search, tuNgay, denNgay, trangThai });
  if (!res.success) {
    showToast(res.message || 'Không thể tải danh sách hóa đơn', 'danger');
    return;
  }

  const hoaDons = res.hoaDons || res.data || [];
  if (hoaDons.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">Không tìm thấy hóa đơn nào</td></tr>`;
    return;
  }

  tbody.innerHTML = hoaDons.map(hd => {
    const khName = hd.khachHang ? hd.khachHang.hoTen : 'Khách vãng lai';
    const nvName = hd.nhanVien ? hd.nhanVien.hoTen : 'Hệ thống';
    return `
      <tr>
        <td class="fw-bold font-monospace text-primary">${hd.soHD}</td>
        <td>${escapeHtml(khName)}</td>
        <td>${escapeHtml(nvName)}</td>
        <td>${formatDate(hd.ngayLap)}</td>
        <td class="text-end fw-bold text-success">${formatCurrency(hd.tongTien)}</td>
        <td><span class="badge bg-success">${escapeHtml(hd.trangThai)}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" onclick="viewInvoiceDetail('${hd._id}')">
            <i class="bi bi-eye me-1"></i> Chi tiết / In
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function viewInvoiceDetail(id) {
  const res = await api.get(`/hoa-don/${id}`);
  if (!res.success) {
    showToast(res.message || 'Không thể tải chi tiết hóa đơn', 'danger');
    return;
  }

  const { hoaDon, danhSachMay, danhSachPhuKien, phieuXuatKho } = res;
  const content = document.getElementById('invoiceDetailContent');
  if (!content) return;

  const kh = hoaDon.khachHang || {};
  const nv = hoaDon.nhanVien || {};

  content.innerHTML = `
    <div class="p-3 border rounded mb-3 bg-light">
      <div class="row">
        <div class="col-sm-6">
          <h5 class="fw-bold text-primary mb-1">ONE TECH STORE</h5>
          <p class="small text-muted mb-0">Hệ thống phân phối điện thoại chính hãng theo IMEI</p>
          <p class="small text-muted mb-0">Hotline: 1900 6868</p>
        </div>
        <div class="col-sm-6 text-sm-end">
          <h5 class="fw-bold mb-1 font-monospace">HÓA ĐƠN: ${hoaDon.soHD}</h5>
          <p class="small text-muted mb-0">Ngày lập: ${formatDate(hoaDon.ngayLap)}</p>
          <p class="small text-muted mb-0">Nhân viên: <strong>${escapeHtml(nv.hoTen || '')}</strong></p>
        </div>
      </div>
      <hr>
      <div class="row small">
        <div class="col-sm-6">
          <strong>Khách hàng:</strong> ${escapeHtml(kh.hoTen || 'Khách vãng lai')}<br>
          <strong>SĐT:</strong> ${escapeHtml(kh.sdt || 'Chưa có')}<br>
          <strong>Địa chỉ:</strong> ${escapeHtml(kh.diaChi || 'Chưa có')}
        </div>
        <div class="col-sm-6 text-sm-end">
          <strong>Hình thức:</strong> <span class="badge bg-success">${escapeHtml(hoaDon.trangThai)}</span><br>
          ${phieuXuatKho ? `<strong>Phiếu xuất kho:</strong> <span class="badge bg-secondary">Đã xuất tự động</span><br>` : ''}
          ${hoaDon.ghiChu ? `<strong>Ghi chú:</strong> ${escapeHtml(hoaDon.ghiChu)}` : ''}
        </div>
      </div>
    </div>

    <h6 class="fw-bold mb-2">1. Danh sách Máy theo IMEI vật lý</h6>
    <div class="table-responsive mb-3">
      <table class="table table-bordered table-sm mb-0">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Tên máy / Model</th>
            <th>Số IMEI</th>
            <th>Màu / Dung lượng</th>
            <th class="text-end">Đơn giá</th>
          </tr>
        </thead>
        <tbody>
          ${danhSachMay && danhSachMay.length > 0 ? danhSachMay.map((m, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td class="fw-semibold">${escapeHtml(m.sanPham ? m.sanPham.tenMay : 'Điện thoại')}</td>
              <td class="font-monospace text-primary">${m.imei}</td>
              <td>${escapeHtml(m.mauSac || '')} ${escapeHtml(m.dungLuong || '')}</td>
              <td class="text-end fw-semibold">${formatCurrency(m.donGiaBan)}</td>
            </tr>
          `).join('') : `<tr><td colspan="5" class="text-center text-muted small">Không có máy IMEI nào</td></tr>`}
        </tbody>
      </table>
    </div>

    <h6 class="fw-bold mb-2">2. Danh sách Phụ kiện kèm theo</h6>
    <div class="table-responsive mb-3">
      <table class="table table-bordered table-sm mb-0">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Tên phụ kiện</th>
            <th class="text-center">Số lượng</th>
            <th class="text-end">Đơn giá</th>
            <th class="text-end">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${danhSachPhuKien && danhSachPhuKien.length > 0 ? danhSachPhuKien.map((pk, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td class="fw-semibold">${escapeHtml(pk.phuKien ? pk.phuKien.tenPK : 'Phụ kiện')}</td>
              <td class="text-center">${pk.soLuong}</td>
              <td class="text-end">${formatCurrency(pk.donGiaBan)}</td>
              <td class="text-end fw-semibold">${formatCurrency(pk.donGiaBan * pk.soLuong)}</td>
            </tr>
          `).join('') : `<tr><td colspan="5" class="text-center text-muted small">Không có phụ kiện nào</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="bg-light p-3 rounded text-end">
      <div class="fs-5 fw-bold text-danger">TỔNG TIỀN THANH TOÁN: ${formatCurrency(hoaDon.tongTien)}</div>
    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById('invoiceDetailModal'));
  modal.show();
}

window.addImeiToCart = addImeiToCart;
window.removeImeiFromCart = removeImeiFromCart;
window.addPhuKienToCart = addPhuKienToCart;
window.changePhuKienQty = changePhuKienQty;
window.viewInvoiceDetail = viewInvoiceDetail;
