/**
 * Nhập kho & Quản lý IMEI Hàng hóa (Client-side JS)
 * Thành viên 2: Phạm Đăng Tuân
 */

let dsNhaCungCap = [];
let dsSanPham = [];
let dsPhuKien = [];

document.addEventListener('DOMContentLoaded', () => {
  loadInitialData();
  loadDanhSachPhieuNhap();
});

async function loadInitialData() {
  const [resNCC, resSP, resPK] = await Promise.all([
    api.get('/nha-cung-cap?limit=100'),
    api.get('/san-pham?limit=100'),
    api.get('/phu-kien?limit=100')
  ]);

  if (resNCC.success) {
    dsNhaCungCap = Array.isArray(resNCC.data) ? resNCC.data : (resNCC.data?.list || resNCC.data?.nhaCungCaps || []);
    renderNccOptions();
  }
  if (resSP.success) {
    dsSanPham = Array.isArray(resSP.data) ? resSP.data : (resSP.data?.sanPhams || resSP.data?.list || []);
  }
  if (resPK.success) {
    dsPhuKien = Array.isArray(resPK.data) ? resPK.data : (resPK.data?.phuKiens || resPK.data?.list || []);
  }

  // Check URL cho trường hợp Nhập từ Đơn Đặt Hàng
  const urlParams = new URLSearchParams(window.location.search);
  const donId = urlParams.get('donDatHangId');
  if (donId) {
    await autoFillTuDonDatHang(donId);
  }
}

async function autoFillTuDonDatHang(donId) {
  try {
    const res = await api.get(`/don-dat-hang-ncc/${donId}`);
    if (res.success) {
      const don = res.data.donDatHangNCC || res.data;
      
      openCreateNhapKhoModal();
      
      document.getElementById('inputDonDatHang').value = don._id;
      document.getElementById('inputDonDatHangId').value = don._id;
      
      const nccSelect = document.getElementById('inputNCC');
      if (nccSelect && don.nhaCungCap) {
        nccSelect.value = don.nhaCungCap._id || don.nhaCungCap;
        // Khóa không cho đổi NCC
        nccSelect.disabled = true;
      }
      
      if (document.getElementById('inputTienChietKhau')) document.getElementById('inputTienChietKhau').value = don.chietKhau || 0;
      if (document.getElementById('inputPhiVanChuyen')) document.getElementById('inputPhiVanChuyen').value = don.phiVanChuyen || 0;
      if (document.getElementById('inputSdtNguoiGiao')) document.getElementById('inputSdtNguoiGiao').value = don.sdtNguoiGiao || '';
      if (document.getElementById('inputCccdNguoiGiao')) document.getElementById('inputCccdNguoiGiao').value = don.cccdNguoiGiao || '';
      
      api.showToast(`Đã tự động điền thông tin từ Đơn Đặt Hàng #${don._id}`, 'info');
    }
  } catch (error) {
    console.error('Lỗi load đơn đặt hàng:', error);
  }}

function renderNccOptions() {
  const filterSelect = document.getElementById('filterNCC');
  const inputSelect = document.getElementById('inputNCC');

  const options = dsNhaCungCap.map(ncc => `<option value="${ncc._id}">${escapeHtml(ncc.tenNCC)} (${ncc.sdt || 'N/A'})</option>`).join('');

  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">-- Tất cả Nhà Cung Cấp --</option>' + options;
  }
  if (inputSelect) {
    inputSelect.innerHTML = '<option value="">-- Chọn Nhà Cung Cấp --</option>' + options;
  }
}

/**
 * Tải danh sách phiếu nhập kho
 */
async function loadDanhSachPhieuNhap() {
  const ncc = document.getElementById('filterNCC')?.value;
  const tuNgay = document.getElementById('filterTuNgay')?.value;
  const denNgay = document.getElementById('filterDenNgay')?.value;

  const params = {};
  if (ncc) params.nhaCungCap = ncc;
  if (tuNgay) params.tuNgay = tuNgay;
  if (denNgay) params.denNgay = denNgay;

  const res = await api.get('/phieu-nhap', params);
  const tbody = document.getElementById('tablePhieuNhapBody');
  if (!tbody) return;

  if (!res.success || !res.data?.list || res.data.list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-3 d-block mb-1"></i> Không có phiếu nhập kho nào
        </td>
      </tr>
    `;
    updateStats(0, 0);
    return;
  }

  const list = res.data.list;
  let totalTien = 0;
  list.forEach(pn => totalTien += (pn.tongTien || 0));
  updateStats(list.length, totalTien);

  tbody.innerHTML = list.map(pn => `
    <tr>
      <td class="ps-3">
        <div class="fw-bold font-monospace text-primary">${pn.maPN || ('PN-' + pn._id.slice(-6).toUpperCase())}</div>
      </td>
      <td>
        <div class="fw-semibold">${pn.nhaCungCap ? pn.nhaCungCap.tenNCC : 'NCC Không xác định'}</div>
        <small class="text-muted">${pn.nhaCungCap?.sdt || ''}</small>
      </td>
      <td>
        <div>${pn.nhanVien ? pn.nhanVien.hoTen : 'Hệ thống'}</div>
        <small class="text-muted">${pn.nhanVien?.vaiTro || ''}</small>
      </td>
      <td><small class="text-muted">${formatDate(pn.ngayNhap || pn.createdAt)}</small></td>
      <td class="text-end fw-bold text-success">${formatCurrency(pn.tongTien)}</td>
      <td><div class="text-muted small text-truncate" style="max-width: 200px;">${pn.ghiChu || '---'}</div></td>
      <td class="text-center">
        <button class="btn-action btn-action-view" onclick="viewDetailPhieuNhap('${pn._id}')" title="Xem chi tiết phiếu nhập">
          <i class="bi bi-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function updateStats(totalPN, totalGiaTri) {
  if (document.getElementById('statTotalPhieuNhap')) document.getElementById('statTotalPhieuNhap').textContent = totalPN;
  if (document.getElementById('statTotalGiaTriNhap')) document.getElementById('statTotalGiaTriNhap').textContent = formatCurrency(totalGiaTri);
  if (document.getElementById('statTotalNCC')) document.getElementById('statTotalNCC').textContent = dsNhaCungCap.length;
}

function resetFilters() {
  if (document.getElementById('filterNCC')) document.getElementById('filterNCC').value = '';
  if (document.getElementById('filterTuNgay')) document.getElementById('filterTuNgay').value = '';
  if (document.getElementById('filterDenNgay')) document.getElementById('filterDenNgay').value = '';
  loadDanhSachPhieuNhap();
}

/**
 * Modal lập phiếu nhập
 */
async function openCreateNhapKhoModal() {
  document.getElementById('formCreateNhapKho').reset();
  const nccSelect = document.getElementById('inputNCC');
  if (nccSelect) nccSelect.disabled = false;
  document.getElementById('mayRowsContainer').innerHTML = '';
  document.getElementById('phuKienRowsContainer').innerHTML = '';
  if (dsSanPham.length === 0 || dsNhaCungCap.length === 0 || dsPhuKien.length === 0) {
    await loadInitialData();
  }
  addMayRow(); // Thêm sẵn 1 dòng máy
  recalcTotalPreview();
  const modal = new bootstrap.Modal(document.getElementById('modalCreateNhapKho'));
  modal.show();
}

let rowMayCounter = 0;
function addMayRow(defaultSP = '', defaultMau = '', defaultDL = '', defaultGia = '', defaultImei = '') {
  rowMayCounter++;
  const container = document.getElementById('mayRowsContainer');
  const spOptions = dsSanPham.map(sp => 
    `<option value="${sp._id}" data-gia="${sp.giaGoc || 0}" data-dl="${escapeHtml(sp.dungLuong || '')}" ${sp._id === defaultSP ? 'selected' : ''}>${escapeHtml(sp.tenMay)}</option>`
  ).join('');

  const formattedGia = defaultGia ? (typeof defaultGia === 'number' || /^\d+$/.test(String(defaultGia).trim()) ? String(defaultGia).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : defaultGia) : '';

  const rowHtml = `
    <div class="row g-2 align-items-end p-2 bg-light rounded border" id="mayRow_${rowMayCounter}">
      <div class="col-12 col-md-3">
        <label class="form-label small fw-semibold">Model Sản phẩm</label>
        <select class="form-select form-select-sm select-may-sp" onchange="autoFillGiaNhap(this)">
          <option value="">-- Chọn máy --</option>
          ${spOptions}
        </select>
      </div>
      <div class="col-6 col-md-2">
        <label class="form-label small fw-semibold">Màu sắc</label>
        <input type="text" class="form-control form-control-sm input-may-mau" placeholder="VD: Titan Tự Nhiên" value="${escapeHtml(defaultMau)}">
      </div>
      <div class="col-6 col-md-2">
        <label class="form-label small fw-semibold">Dung lượng</label>
        <input type="text" class="form-control form-control-sm input-may-dl" placeholder="VD: 256GB" value="${escapeHtml(defaultDL)}">
      </div>
      <div class="col-6 col-md-2">
        <label class="form-label small fw-semibold">Giá nhập (VNĐ)</label>
        <input type="text" class="form-control form-control-sm format-currency input-may-gia" placeholder="0" oninput="maskCurrencyInput(this); recalcTotalPreview()" value="${escapeHtml(formattedGia)}">
      </div>
      <div class="col-12 col-md-3">
        <label class="form-label small fw-semibold">Mã IMEI</label>
        <input type="text" class="form-control form-control-sm input-may-imei" placeholder="Quét hoặc nhập mã..." value="${escapeHtml(defaultImei)}">
      </div>
      <div class="col-12 col-md-1 text-end">
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeRow('mayRow_${rowMayCounter}')">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', rowHtml);
  recalcTotalPreview();
}

function autoFillGiaNhap(selectEl) {
  if (!selectEl) return;
  const opt = selectEl.options[selectEl.selectedIndex];
  if (opt && opt.value) {
    const giaGoc = parseFloat(opt.getAttribute('data-gia')) || 0;
    const dungLuong = opt.getAttribute('data-dl') || '';
    
    const row = selectEl.closest('.row');
    if (row) {
      const inputGia = row.querySelector('.input-may-gia');
      const inputDL = row.querySelector('.input-may-dl');
      
      if (inputGia && giaGoc > 0) {
        // Format bằng dấu chấm phân cách hàng nghìn (VD: 20.000.000)
        inputGia.value = String(giaGoc).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }
      if (inputDL) {
        inputDL.value = dungLuong;
      }
      
      if (typeof recalcTotalPreview === 'function') {
        recalcTotalPreview();
      }
    }
  }
}

// LOGIC NHẬP HÀNG LOẠT IMEI
function openBulkImportModal() {
  const bulkInputSP = document.getElementById('bulkInputSP');
  bulkInputSP.innerHTML = '<option value="">-- Chọn máy --</option>' + dsSanPham.map(sp => 
    `<option value="${sp._id}" data-gia="${sp.giaGoc || 0}" data-dl="${escapeHtml(sp.dungLuong || '')}">${escapeHtml(sp.tenMay)}</option>`
  ).join('');
  document.getElementById('bulkInputMau').value = '';
  document.getElementById('bulkInputDL').value = '';
  document.getElementById('bulkInputGia').value = '';
  document.getElementById('bulkInputImeis').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('modalBulkImport'));
  modal.show();
}

/**
 * Mở camera quét liên tục mã IMEI vào ô nhập hàng loạt
 */
function openNhapKhoCameraScanner() {
  if (typeof openCameraScanner === 'function') {
    openCameraScanner({
      title: 'Quét Mã Vạch Hộp Máy Nhập Kho',
      continuous: true,
      onScan: (code) => {
        const textarea = document.getElementById('bulkInputImeis');
        if (textarea) {
          const currentVal = textarea.value.trim();
          const existingList = currentVal ? currentVal.split(/[\n,]+/).map(s => s.trim()) : [];
          if (existingList.includes(code)) {
            if (typeof api !== 'undefined' && api.showToast) {
              api.showToast(`Mã IMEI ${code} đã có trong danh sách!`, 'warning');
            }
            return;
          }
          textarea.value = currentVal ? `${currentVal}\n${code}` : code;
          if (typeof api !== 'undefined' && api.showToast) {
            api.showToast(`Đã quét thêm IMEI: ${code}`, 'success');
          }
        }
      }
    });
  } else {
    alert('Thư viện Camera Scanner chưa sẵn sàng');
  }
}
window.openNhapKhoCameraScanner = openNhapKhoCameraScanner;

function autoFillBulkGiaNhap(selectEl) {
  if (!selectEl) return;
  const opt = selectEl.options[selectEl.selectedIndex];
  if (opt && opt.value) {
    const giaGoc = parseFloat(opt.getAttribute('data-gia')) || 0;
    const dungLuong = opt.getAttribute('data-dl') || '';
    
    const inputGia = document.getElementById('bulkInputGia');
    const inputDL = document.getElementById('bulkInputDL');
    
    if (inputGia) {
      // bulkInputGia is type="number" so we set raw number, not formatted string
      inputGia.value = giaGoc > 0 ? giaGoc : '';
    }
    if (inputDL) {
      inputDL.value = dungLuong;
    }
  }
}

function processBulkImport() {
  const maSP = document.getElementById('bulkInputSP').value;
  const mauSac = document.getElementById('bulkInputMau').value;
  const dungLuong = document.getElementById('bulkInputDL').value;
  const giaNhap = document.getElementById('bulkInputGia').value;
  const rawText = document.getElementById('bulkInputImeis').value;
  
  if (!maSP) return api.showToast('Vui lòng chọn Model máy chung', 'warning');
  if (!giaNhap || Number(giaNhap) <= 0) return api.showToast('Vui lòng nhập giá nhập', 'warning');
  if (!rawText.trim()) return api.showToast('Vui lòng nhập ít nhất 1 IMEI', 'warning');
  
  // Tách IMEI bằng dấu phẩy hoặc xuống dòng
  const imeis = rawText.split(/[\n,]+/).map(i => i.trim()).filter(i => i.length > 0);
  if (imeis.length === 0) return api.showToast('Không tìm thấy IMEI hợp lệ', 'warning');
  
  bootstrap.Modal.getInstance(document.getElementById('modalBulkImport')).hide();
  
  // Tạo hàng loạt dòng máy
  imeis.forEach(imei => {
    addMayRow(maSP, mauSac, dungLuong, giaNhap, imei);
  });
  
  api.showToast(`Đã tạo thành công ${imeis.length} dòng máy!`, 'success');
}

let rowPkCounter = 0;
function addPhuKienRow() {
  rowPkCounter++;
  const container = document.getElementById('phuKienRowsContainer');
  const pkOptions = dsPhuKien.map(pk => `<option value="${pk._id}">${escapeHtml(pk.tenPK || pk.tenPhuKien)} (Tồn: ${pk.soLuongTon})</option>`).join('');

  const rowHtml = `
    <div class="row g-2 align-items-end p-2 bg-light rounded border" id="pkRow_${rowPkCounter}">
      <div class="col-12 col-md-4">
        <label class="form-label small fw-semibold">Tên Phụ Kiện</label>
        <select class="form-select form-select-sm select-pk">
          <option value="">-- Chọn phụ kiện --</option>
          ${pkOptions}
        </select>
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label small fw-semibold">Giá nhập (VNĐ)</label>
        <input type="text" class="form-control form-control-sm format-currency input-pk-gia" placeholder="0" oninput="maskCurrencyInput(this); recalcTotalPreview()">
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label small fw-semibold">Số lượng nhập</label>
        <input type="number" class="form-control form-control-sm input-pk-sl" placeholder="1" min="1" value="1" oninput="recalcTotalPreview()">
      </div>
      <div class="col-12 col-md-2 text-end">
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeRow('pkRow_${rowPkCounter}')">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeRow(rowId) {
  const el = document.getElementById(rowId);
  if (el) {
    el.remove();
    recalcTotalPreview();
  }
}

function recalcTotalPreview() {
  let total = 0;
  document.querySelectorAll('#mayRowsContainer .input-may-gia').forEach(inp => {
    total += parseCurrencyValue(inp.value);
  });
  document.querySelectorAll('#phuKienRowsContainer > div').forEach(row => {
    const gia = parseCurrencyValue(row.querySelector('.input-pk-gia')?.value);
    const sl = Number(row.querySelector('.input-pk-sl')?.value) || 0;
    total += (gia * sl);
  });
  document.getElementById('lblTongTienDuTinh').textContent = formatCurrency(total);
}

async function handleCreatePhieuNhap(e) {
  e.preventDefault();
  const maNCC = document.getElementById('inputNCC').value;
  if (!maNCC) {
    return api.showToast('Vui lòng chọn Nhà Cung Cấp', 'warning');
  }
  
  const hinhThucThanhToan = document.getElementById('inputHinhThuc').value;
  const ghiChu = document.getElementById('inputGhiChu').value.trim();
  const donDatHangNCC = document.getElementById('inputDonDatHangId')?.value || undefined;
  const tienChietKhau = parseCurrencyValue(document.getElementById('inputTienChietKhau')?.value || '0');
  const phiVanChuyen = parseCurrencyValue(document.getElementById('inputPhiVanChuyen')?.value || '0');
  const tenNguoiGiao = document.getElementById('inputTenNguoiGiao')?.value.trim();
  const sdtNguoiGiao = document.getElementById('inputSdtNguoiGiao')?.value.trim();
  const cccdNguoiGiao = document.getElementById('inputCccdNguoiGiao')?.value.trim();

  const danhSachMay = [];
  document.querySelectorAll('#mayRowsContainer > div').forEach(row => {
    const maSP = row.querySelector('.select-may-sp')?.value;
    const mauSac = row.querySelector('.input-may-mau')?.value.trim();
    const dungLuong = row.querySelector('.input-may-dl')?.value.trim();
    const giaNhap = parseCurrencyValue(row.querySelector('.input-may-gia')?.value);
    const imei = row.querySelector('.input-may-imei')?.value.trim();

    if (maSP && imei && giaNhap > 0) {
      danhSachMay.push({ maSP, mauSac, dungLuong, giaNhap, imei });
    }
  });

  const danhSachPhuKien = [];
  document.querySelectorAll('#phuKienRowsContainer > div').forEach(row => {
    const maPK = row.querySelector('.select-pk')?.value;
    const giaNhap = parseCurrencyValue(row.querySelector('.input-pk-gia')?.value);
    const soLuong = Number(row.querySelector('.input-pk-sl')?.value);

    if (maPK && giaNhap > 0 && soLuong > 0) {
      danhSachPhuKien.push({ maPK, giaNhap, soLuong });
    }
  });

  if (danhSachMay.length === 0 && danhSachPhuKien.length === 0) {
    showToast('Vui lòng nhập ít nhất 1 máy IMEI hoặc 1 phụ kiện', 'danger');
    return;
  }

  const payload = {
    maNCC,
    hinhThucThanhToan,
    ghiChu,
    donDatHangNCC,
    tienChietKhau,
    phiVanChuyen,
    tenNguoiGiao,
    sdtNguoiGiao,
    cccdNguoiGiao,
    danhSachMay,
    danhSachPhuKien
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (typeof setButtonLoading === 'function') {
    setButtonLoading(submitBtn, true, 'Đang ghi sổ nhập kho...');
  }

  try {
    const res = await api.post('/phieu-nhap', payload);
    if (res.success) {
      showToast('Tạo phiếu nhập kho thành công!', 'success');
      const modalEl = document.getElementById('modalCreateNhapKho');
      if (modalEl) {
        const inst = bootstrap.Modal.getInstance(modalEl);
        if (inst) inst.hide();
      }
      loadDanhSachPhieuNhap();
    } else {
      showToast(res.message || 'Lỗi khi tạo phiếu nhập', 'danger');
    }
  } catch (err) {
    showToast(err.message || 'Lỗi kết nối máy chủ', 'danger');
  } finally {
    if (typeof setButtonLoading === 'function') {
      setButtonLoading(submitBtn, false);
    }
  }
}

/**
 * Xem chi tiết Phiếu Nhập
 */
async function viewDetailPhieuNhap(id) {
  const res = await api.get(`/phieu-nhap/${id}`);
  if (!res.success || !res.data) {
    showToast(res.message || 'Không thể tải chi tiết phiếu nhập', 'danger');
    return;
  }

  const { phieuNhap, chiTiet } = res.data;
  document.getElementById('modalDetailTitle').textContent = `PHIẾU NHẬP KHO (${phieuNhap.maPN || phieuNhap._id})`;

  const html = `
    <div class="p-3 border rounded bg-light-subtle mb-3">
      <div class="row g-2 mb-2">
        <div class="col-6 text-muted">Nhà Cung Cấp:</div>
        <div class="col-6 text-end fw-bold">${phieuNhap.nhaCungCap?.tenNCC || '---'}</div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-6 text-muted">Người lập phiếu:</div>
        <div class="col-6 text-end">${phieuNhap.nhanVien?.hoTen || '---'} (${phieuNhap.nhanVien?.vaiTro || ''})</div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-6 text-muted">Ngày nhập kho:</div>
        <div class="col-6 text-end">${formatDateTime(phieuNhap.ngayNhap || phieuNhap.createdAt)}</div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-6 text-muted">Tổng giá trị:</div>
        <div class="col-6 text-end fw-bold text-danger fs-5">${formatCurrency(phieuNhap.tongTien)}</div>
      </div>
      <div class="row g-2">
        <div class="col-6 text-muted">Ghi chú:</div>
        <div class="col-6 text-end">${phieuNhap.ghiChu || '---'}</div>
      </div>
    </div>

    <h6 class="fw-bold mb-2 text-primary"><i class="bi bi-upc-scan me-1"></i> Danh sách Máy IMEI vật lý đã nhập</h6>
    <div class="table-responsive">
      <table class="table table-sm table-bordered align-middle">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Sản Phẩm</th>
            <th>Số IMEI</th>
            <th class="text-end">Đơn Giá Nhập</th>
          </tr>
        </thead>
        <tbody>
          ${chiTiet && chiTiet.length > 0 ? chiTiet.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td class="fw-semibold">${item.sanPham?.tenMay || '---'}</td>
              <td class="font-monospace text-primary">${item.imei}</td>
              <td class="text-end fw-bold text-success">${formatCurrency(item.donGiaNhap)}</td>
            </tr>
          `).join('') : '<tr><td colspan="4" class="text-center text-muted">Không có máy IMEI nào trong phiếu này</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('modalDetailContent').innerHTML = html;

  // Gán sự kiện in chuẩn Thông tư 200
  const btnPrintPN = document.querySelector('#modalDetailPhieuNhap .modal-footer button.btn-outline-primary') || document.querySelector('#modalDetailPhieuNhap button[onclick*="print"]');
  if (btnPrintPN) {
    btnPrintPN.onclick = () => {
      inPhieuNhapKhoChuan({
        maPN: phieuNhap.maPN || phieuNhap._id,
        ngayNhap: phieuNhap.ngayNhap || phieuNhap.createdAt,
        tenNCC: phieuNhap.nhaCungCap?.tenNCC || 'Nhà cung cấp',
        diaChiNCC: phieuNhap.nhaCungCap?.diaChi || '',
        nhanVien: phieuNhap.nhanVien?.hoTen || 'Thủ kho',
        danhSachChiTiet: chiTiet || [],
        tongTien: phieuNhap.tongTien || 0,
        ghiChu: phieuNhap.ghiChu || ''
      });
    };
  }

  const modal = new bootstrap.Modal(document.getElementById('modalDetailPhieuNhap'));
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

/**
 * Tìm kiếm sản phẩm khớp nhất trong dsSanPham theo tên/model
 */
function findMatchingSanPham(targetName) {
  if (!targetName || !Array.isArray(dsSanPham) || dsSanPham.length === 0) return null;
  const raw = String(targetName).trim().toLowerCase();
  
  // 1. Khớp chính xác hoàn toàn (case-insensitive)
  let found = dsSanPham.find(sp => sp.tenMay && sp.tenMay.trim().toLowerCase() === raw);
  if (found) return found;

  // 2. Tên trong hệ thống chứa tên tìm kiếm hoặc ngược lại
  found = dsSanPham.find(sp => {
    const dbName = (sp.tenMay || '').toLowerCase();
    return dbName.includes(raw) || raw.includes(dbName);
  });
  if (found) return found;

  // 3. Khớp tất cả các từ khóa chính (e.g. "iPhone 15 Pro Max", "S24 Ultra")
  const keywords = raw.split(/\s+/).filter(w => w.length > 1);
  if (keywords.length > 0) {
    found = dsSanPham.find(sp => {
      const dbName = (sp.tenMay || '').toLowerCase();
      return keywords.every(k => dbName.includes(k));
    });
    if (found) return found;
  }

  return null;
}

/**
 * Xóa dòng máy trống ban đầu nếu chưa nhập gì
 */
function cleanEmptyFirstMayRow() {
  const rows = document.querySelectorAll('#mayRowsContainer > div');
  if (rows.length === 1) {
    const spVal = rows[0].querySelector('.select-may-sp')?.value;
    const imeiVal = rows[0].querySelector('.input-may-imei')?.value?.trim();
    if (!spVal && !imeiVal) {
      rows[0].remove();
    }
  }
}

/**
 * Bộ phân tích dữ liệu Workbook Excel / CSV thông minh
 */
function parseExcelWorkbookData(workbook) {
  const ignoreKeywords = new Set([
    'STT', 'MAMAY', 'TENMAY', 'SANPHAM', 'IMEI', 'MAIMEI', 'SERIAL', 'SERIALNUMBER',
    'DESCRIPTION', 'NOTE', 'GHICHU', 'STATUS', 'TRANGTHAI', 'PRICE', 'GIANHAP', 'GIABAN',
    'SOLUONG', 'QUANTITY', 'NHACUNGCAP', 'SUPPLIER', 'PHONENUMBER', 'DIENTHOAI', 'DANHSACH', 'TENMODEL'
  ]);

  let multiProductRows = [];
  let fallbackImeis = [];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows || rows.length < 2) return;

    // Quét tìm dòng tiêu đề
    let headerRowIdx = -1;
    let colImei = -1;
    let colModel = -1;
    let colColor = -1;
    let colDL = -1;
    let colGia = -1;

    for (let r = 0; r < Math.min(6, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      
      const foundImei = row.findIndex(c => /(imei|serial|mã imei|số imei)/i.test(String(c).trim()));
      if (foundImei !== -1) {
        headerRowIdx = r;
        colImei = foundImei;
        colModel = row.findIndex(c => /(model|tên model|tên máy|ten may|tên sản phẩm|ten san pham|sản phẩm|san pham)/i.test(String(c).trim()));
        colColor = row.findIndex(c => /(màu sắc|mau sac|màu|mau|color)/i.test(String(c).trim()));
        colDL = row.findIndex(c => /(dung lượng|dung luong|bộ nhớ|bo nho|storage|rom|ram)/i.test(String(c).trim()));
        colGia = row.findIndex(c => /(giá nhập|gia nhap|giá gốc|gia goc|đơn giá|don gia|giá|gia|price|cost)/i.test(String(c).trim()));
        break;
      }
    }

    if (colImei !== -1 && colModel !== -1 && headerRowIdx !== -1) {
      // Nhận diện bảng chứa nhiều Model khác nhau
      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;

        let imeiRaw = String(row[colImei] || '').trim().replace(/\s+/g, '');
        if (/^[0-9]+(\.[0-9]+)?[eE]\+[0-9]+$/.test(imeiRaw)) {
          try { imeiRaw = BigInt(Math.round(Number(imeiRaw))).toString(); } catch(e) {}
        }
        imeiRaw = imeiRaw.replace(/[^a-zA-Z0-9]/g, '');

        if (/^[a-zA-Z0-9]{8,20}$/.test(imeiRaw) && /\d/.test(imeiRaw) && !ignoreKeywords.has(imeiRaw.toUpperCase())) {
          const modelRaw = colModel !== -1 ? String(row[colModel] || '').trim() : '';
          const colorRaw = colColor !== -1 ? String(row[colColor] || '').trim() : '';
          const dlRaw = colDL !== -1 ? String(row[colDL] || '').trim() : '';
          let giaRaw = colGia !== -1 ? parseCurrencyValue(row[colGia]) : 0;

          const matchedSP = findMatchingSanPham(modelRaw);
          multiProductRows.push({
            imei: imeiRaw,
            modelName: modelRaw,
            maSP: matchedSP ? matchedSP._id : '',
            tenMay: matchedSP ? matchedSP.tenMay : modelRaw,
            mauSac: colorRaw || (matchedSP ? matchedSP.mauSac || '' : ''),
            dungLuong: dlRaw || (matchedSP ? matchedSP.dungLuong || '' : ''),
            giaNhap: giaRaw || (matchedSP ? matchedSP.giaGoc || 0 : 0)
          });
        }
      }
    } else {
      // Fallback: Quét toàn bộ ô để lấy danh sách IMEI
      rows.forEach(row => {
        if (!Array.isArray(row)) return;
        row.forEach(cell => {
          if (cell == null) return;
          let cellClean = String(cell).trim().replace(/\s+/g, '');
          if (/^[0-9]+(\.[0-9]+)?[eE]\+[0-9]+$/.test(cellClean)) {
            try { cellClean = BigInt(Math.round(Number(cellClean))).toString(); } catch(e) {}
          }
          cellClean = cellClean.replace(/[^a-zA-Z0-9]/g, '');
          if (/^[a-zA-Z0-9]{8,20}$/.test(cellClean) && /\d/.test(cellClean) && !ignoreKeywords.has(cellClean.toUpperCase())) {
            fallbackImeis.push(cellClean);
          }
        });
      });
    }
  });

  if (multiProductRows.length > 0) {
    const seen = new Set();
    const uniqueRows = multiProductRows.filter(item => {
      if (seen.has(item.imei)) return false;
      seen.add(item.imei);
      return true;
    });
    return { isMulti: true, rows: uniqueRows };
  }

  const uniqueImeis = [...new Set(fallbackImeis)];
  return { isMulti: false, imeis: uniqueImeis };
}

/**
 * Xử lý tải File Excel trực tiếp từ phần "1. Danh Sách Máy Theo IMEI (Vật lý)"
 */
async function handleExcelMultiMayUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    showToast('Thư viện SheetJS chưa sẵn sàng. Vui lòng làm mới trang!', 'danger');
    return;
  }

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const result = parseExcelWorkbookData(workbook);
    const safeFileName = typeof escapeHtml === 'function' ? escapeHtml(file.name) : file.name;

    if (result.isMulti && result.rows.length > 0) {
      cleanEmptyFirstMayRow();
      result.rows.forEach(r => {
        addMayRow(r.maSP, r.mauSac, r.dungLuong, r.giaNhap, r.imei);
      });
      recalcTotalPreview();

      const matchedCount = result.rows.filter(r => Boolean(r.maSP)).length;
      showToast(`Đã nạp thành công ${result.rows.length} máy (${matchedCount} máy khớp sẵn Model trong hệ thống) từ file "${safeFileName}"!`, 'success');
    } else if (!result.isMulti && result.imeis && result.imeis.length > 0) {
      // Mở modal nhập hàng loạt và điền sẵn danh sách IMEI
      openBulkImportModal();
      const textarea = document.getElementById('bulkInputImeis');
      if (textarea) textarea.value = result.imeis.join('\n');
      showToast(`Đã nhận diện ${result.imeis.length} mã IMEI từ file "${safeFileName}". Vui lòng chọn Model máy chung!`, 'info');
    } else {
      showToast(`Không tìm thấy dữ liệu máy hoặc IMEI hợp lệ trong file "${safeFileName}"`, 'warning');
    }
  } catch (err) {
    console.error('Lỗi khi đọc file Excel:', err);
    showToast(`Lỗi đọc file Excel: ${err.message || 'File không đúng định dạng'}`, 'danger');
  } finally {
    event.target.value = '';
  }
}
window.handleExcelMultiMayUpload = handleExcelMultiMayUpload;

/**
 * Đọc file Excel (.xlsx, .xls, .csv) trong modal Nhập Hàng Loạt (Hỗ trợ thông minh cả đa model)
 */
async function handleExcelNhapKhoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    showToast('Thư viện SheetJS chưa được tải. Vui lòng làm mới trang!', 'danger');
    return;
  }

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const result = parseExcelWorkbookData(workbook);
    const safeFileName = typeof escapeHtml === 'function' ? escapeHtml(file.name) : file.name;

    // Nếu file chứa bảng đa Model: Tự động bung vào form chính
    if (result.isMulti && result.rows.length > 0) {
      const modalEl = document.getElementById('modalBulkImport');
      if (modalEl) {
        const inst = bootstrap.Modal.getInstance(modalEl);
        if (inst) inst.hide();
      }

      cleanEmptyFirstMayRow();
      result.rows.forEach(r => {
        addMayRow(r.maSP, r.mauSac, r.dungLuong, r.giaNhap, r.imei);
      });
      recalcTotalPreview();

      const matchedCount = result.rows.filter(r => Boolean(r.maSP)).length;
      showToast(`Phát hiện file đa Model! Đã nạp thành công ${result.rows.length} máy (${matchedCount} máy khớp Model) vào phiếu nhập!`, 'success');
      return;
    }

    // Nếu là file chỉ có danh sách IMEI
    const uniqueImeis = result.imeis || [];
    if (uniqueImeis.length === 0) {
      showToast(`Không tìm thấy mã IMEI hợp lệ nào trong file "${safeFileName}"`, 'warning');
      return;
    }

    const textarea = document.getElementById('bulkInputImeis');
    if (textarea) {
      const currentVal = textarea.value.trim();
      const existingList = currentVal ? currentVal.split(/[\n,;\t\r]+/).map(s => s.trim()).filter(Boolean) : [];
      const newlyAdded = uniqueImeis.filter(x => !existingList.includes(x)).length;
      const duplicateCount = uniqueImeis.length - newlyAdded;
      const combined = [...new Set([...existingList, ...uniqueImeis])];
      textarea.value = combined.join('\n');

      if (newlyAdded === 0) {
        showToast(`Tất cả ${uniqueImeis.length} mã IMEI trong file "${safeFileName}" đã tồn tại trong danh sách!`, 'info');
      } else {
        let msg = `Đã đọc và nạp thành công ${newlyAdded} mã IMEI mới từ file "${safeFileName}"!`;
        if (duplicateCount > 0) {
          msg += ` (Bỏ qua ${duplicateCount} mã đã trùng)`;
        }
        showToast(msg, 'success');
      }
    }
  } catch (err) {
    console.error('Lỗi khi đọc file Excel:', err);
    showToast(`Lỗi đọc file Excel: ${err.message || 'File không đúng định dạng'}`, 'danger');
  } finally {
    event.target.value = '';
  }
}
window.handleExcelNhapKhoUpload = handleExcelNhapKhoUpload;

