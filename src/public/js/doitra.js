/**
 * Module Xử lý Logic Giao diện Đổi Trả Máy (Exchange & Return)
 * Thành viên 6: Tô Quốc Việt (Tuần 4 - 5)
 */

document.addEventListener('DOMContentLoaded', async () => {
  let currentPage = 1;
  let currentSearch = '';
  let currentLoai = 'All';
  let currentTrangThai = 'All';

  let validatedData = null; // Dữ liệu máy cũ & HĐ sau khi kiểm tra hợp lệ
  let allAvailableImeis = [];
  let allSanPhams = [];
  let allPhuKiens = [];
  let selectedPhuKienList = []; // Mảng phụ kiện mua kèm: [{ phuKienId, tenPK, soLuong, donGia }]
  let currentViewingDetailId = null;

  // DOM Elements - Danh sách
  const doiTraTableBody = document.getElementById('doiTraTableBody');
  const searchDoiTraInput = document.getElementById('searchDoiTraInput');
  const filterLoaiDoiTra = document.getElementById('filterLoaiDoiTra');
  const filterTrangThaiDoiTra = document.getElementById('filterTrangThaiDoiTra');
  const filterTuNgay = document.getElementById('filterTuNgay');
  const filterDenNgay = document.getElementById('filterDenNgay');
  const btnRefreshList = document.getElementById('btnRefreshList');
  const paginationContainer = document.getElementById('paginationContainer');
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationButtons = document.getElementById('paginationButtons');

  // Stats
  const statTotalDoiTra = document.getElementById('statTotalDoiTra');
  const statDoiMayCount = document.getElementById('statDoiMayCount');
  const statTraHangCount = document.getElementById('statTraHangCount');
  const statTotalThuThem = document.getElementById('statTotalThuThem');

  // Form Kiểm tra & Tạo mới
  const checkSoHDInput = document.getElementById('checkSoHDInput');
  const checkImeiInput = document.getElementById('checkImeiInput');
  const btnCheckCondition = document.getElementById('btnCheckCondition');
  const checkResultContainer = document.getElementById('checkResultContainer');

  const createDoiTraForm = document.getElementById('createDoiTraForm');
  const selectLoaiDoiTra = document.getElementById('selectLoaiDoiTra');
  const selectHinhThucThanhToan = document.getElementById('selectHinhThucThanhToan');
  const doiMaySection = document.getElementById('doiMaySection');
  const selectSanPhamMoi = document.getElementById('selectSanPhamMoi');
  const selectImeiMoi = document.getElementById('selectImeiMoi');

  // Phụ kiện đính kèm
  const selectPhuKienMoi = document.getElementById('selectPhuKienMoi');
  const inputSoLuongPhuKien = document.getElementById('inputSoLuongPhuKien');
  const btnAddPhuKien = document.getElementById('btnAddPhuKien');
  const selectedPhuKienContainer = document.getElementById('selectedPhuKienContainer');

  // Bảng tính
  const displayGiaMayCu = document.getElementById('displayGiaMayCu');
  const displayGiaMayMoi = document.getElementById('displayGiaMayMoi');
  const rowGiaMayMoi = document.getElementById('rowGiaMayMoi');
  const rowGiaPhuKien = document.getElementById('rowGiaPhuKien');
  const displayGiaPhuKien = document.getElementById('displayGiaPhuKien');
  const labelTienChenhLech = document.getElementById('labelTienChenhLech');
  const displayTienChenhLech = document.getElementById('displayTienChenhLech');
  const noteChenhLech = document.getElementById('noteChenhLech');
  const createLyDoInput = document.getElementById('createLyDoInput');
  const createGhiChuInput = document.getElementById('createGhiChuInput');
  const btnResetCreateForm = document.getElementById('btnResetCreateForm');

  // Tra cứu lịch sử IMEI
  const lookupImeiInput = document.getElementById('lookupImeiInput');
  const btnLookupImei = document.getElementById('btnLookupImei');
  const lookupResultContainer = document.getElementById('lookupResultContainer');

  // Modal & Nút Hủy
  let modalDetail = null;
  const modalDetailEl = document.getElementById('modalDoiTraDetail');
  const btnCancelDoiTraModal = document.getElementById('btnCancelDoiTraModal');
  if (modalDetailEl && window.bootstrap) {
    modalDetail = new bootstrap.Modal(modalDetailEl);
  }

  // Khởi chạy dữ liệu ban đầu
  await Promise.all([loadDoiTraList(), loadMasterData()]);

  // -------------------------------------------------------------
  // EVENT LISTENERS
  // -------------------------------------------------------------
  if (filterLoaiDoiTra) {
    filterLoaiDoiTra.addEventListener('change', (e) => {
      currentLoai = e.target.value;
      currentPage = 1;
      loadDoiTraList();
    });
  }

  if (filterTrangThaiDoiTra) {
    filterTrangThaiDoiTra.addEventListener('change', (e) => {
      currentTrangThai = e.target.value;
      currentPage = 1;
      loadDoiTraList();
    });
  }

  let searchTimeout = null;
  if (searchDoiTraInput) {
    searchDoiTraInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        loadDoiTraList();
      }, 350);
    });
  }

  if (filterTuNgay) filterTuNgay.addEventListener('change', () => { currentPage = 1; loadDoiTraList(); });
  if (filterDenNgay) filterDenNgay.addEventListener('change', () => { currentPage = 1; loadDoiTraList(); });

  if (btnRefreshList) {
    btnRefreshList.addEventListener('click', () => {
      loadDoiTraList();
      loadMasterData();
      showToast('Đã làm mới danh sách phiếu đổi trả', 'info');
    });
  }

  // 1. Kiểm tra điều kiện đổi trả
  if (btnCheckCondition) {
    btnCheckCondition.addEventListener('click', async () => {
      const soHD = checkSoHDInput?.value.trim();
      const imei = checkImeiInput?.value.trim();

      if (!soHD) {
        showToast('Vui lòng nhập số hóa đơn mua hàng', 'warning');
        if (checkSoHDInput) checkSoHDInput.focus();
        return;
      }
      if (!imei) {
        showToast('Vui lòng nhập số IMEI máy cũ', 'warning');
        if (checkImeiInput) checkImeiInput.focus();
        return;
      }

      btnCheckCondition.disabled = true;
      btnCheckCondition.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang kiểm tra...';

      try {
        const res = await api.post('/doi-tra/kiem-tra', { soHD, imei });
        const data = res.data || res;

        if (res.success && data.hopLe) {
          validatedData = data;
          renderCheckSuccess(data);
          createDoiTraForm.style.display = 'block';
          calculatePriceDifference();
          showToast('Máy đủ điều kiện đổi trả trong 30 ngày!', 'success');
        } else {
          validatedData = null;
          createDoiTraForm.style.display = 'none';
          renderCheckError(res.message || 'Không đủ điều kiện đổi trả');
        }
      } catch (err) {
        validatedData = null;
        createDoiTraForm.style.display = 'none';
        renderCheckError(err.message || 'Lỗi khi kiểm tra điều kiện đổi trả');
      } finally {
        btnCheckCondition.disabled = false;
        btnCheckCondition.innerHTML = '<i class="bi bi-search me-1"></i> Kiểm tra';
      }
    });
  }

  // 2. Chuyển đổi loại đổi trả (Đổi máy <-> Trả hàng)
  if (selectLoaiDoiTra) {
    selectLoaiDoiTra.addEventListener('change', () => {
      const loai = selectLoaiDoiTra.value;
      if (loai === 'Tra hang') {
        doiMaySection.style.display = 'none';
        selectImeiMoi.removeAttribute('required');
        if (rowGiaMayMoi) rowGiaMayMoi.style.display = 'none';
      } else {
        doiMaySection.style.display = 'block';
        selectImeiMoi.setAttribute('required', 'true');
        if (rowGiaMayMoi) rowGiaMayMoi.style.display = 'flex';
      }
      calculatePriceDifference();
    });
  }

  // 3. Lọc danh sách IMEI mới theo Model sản phẩm
  if (selectSanPhamMoi) {
    selectSanPhamMoi.addEventListener('change', () => {
      const spId = selectSanPhamMoi.value;
      populateImeiOptions(spId);
      calculatePriceDifference();
    });
  }

  if (selectImeiMoi) {
    selectImeiMoi.addEventListener('change', () => {
      calculatePriceDifference();
    });
  }

  // 4. Thêm phụ kiện đi kèm
  if (btnAddPhuKien) {
    btnAddPhuKien.addEventListener('click', () => {
      const pkId = selectPhuKienMoi?.value;
      const qty = parseInt(inputSoLuongPhuKien?.value, 10) || 1;

      if (!pkId) {
        showToast('Vui lòng chọn phụ kiện', 'warning');
        return;
      }

      const pkDoc = allPhuKiens.find(p => p._id === pkId);
      if (!pkDoc) return;

      if (pkDoc.soLuongTon < qty) {
        showToast(`Phụ kiện "${pkDoc.tenPK}" chỉ còn ${pkDoc.soLuongTon} cái trong kho`, 'warning');
        return;
      }

      const existingIndex = selectedPhuKienList.findIndex(p => p.phuKienId === pkId);
      if (existingIndex >= 0) {
        selectedPhuKienList[existingIndex].soLuong += qty;
      } else {
        selectedPhuKienList.push({
          phuKienId: pkDoc._id,
          tenPK: pkDoc.tenPK,
          soLuong: qty,
          donGia: pkDoc.giaBan || 0
        });
      }

      renderSelectedPhuKien();
      calculatePriceDifference();
      selectPhuKienMoi.value = '';
      if (inputSoLuongPhuKien) inputSoLuongPhuKien.value = '1';
    });
  }

  // 5. Reset form tạo mới
  if (btnResetCreateForm) {
    btnResetCreateForm.addEventListener('click', () => {
      resetCreateForm();
    });
  }

  // 6. Submit tạo phiếu đổi trả
  if (createDoiTraForm) {
    createDoiTraForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validatedData) {
        showToast('Vui lòng kiểm tra điều kiện Hóa đơn & IMEI trước', 'warning');
        return;
      }

      const soHD = checkSoHDInput.value.trim();
      const imeiCu = checkImeiInput.value.trim();
      const loaiDoiTra = selectLoaiDoiTra.value;
      const imeiMoi = loaiDoiTra === 'Doi máy' || loaiDoiTra === 'Doi may' ? selectImeiMoi.value : undefined;
      const hinhThuc = selectHinhThucThanhToan.value;
      const lyDo = createLyDoInput.value.trim();
      const ghiChu = createGhiChuInput.value.trim();

      if (loaiDoiTra === 'Doi may' && !imeiMoi) {
        showToast('Vui lòng chọn máy IMEI mới trong kho để đổi', 'warning');
        return;
      }
      if (!lyDo) {
        showToast('Vui lòng nhập lý do đổi trả hàng', 'warning');
        return;
      }

      try {
        const payload = {
          soHD,
          imeiCu,
          imeiMoi: imeiMoi || undefined,
          loaiDoiTra,
          danhSachPhuKien: selectedPhuKienList.map(pk => ({
            phuKien: pk.phuKienId,
            soLuong: pk.soLuong,
            donGia: pk.donGia
          })),
          hinhThuc,
          lyDo,
          ghiChu
        };

        const res = await api.post('/doi-tra', payload);
        if (res && res.success) {
          showToast('Lập phiếu đổi trả máy và xử lý tài chính thành công!', 'success');
          resetCreateForm();
          const listTabBtn = document.getElementById('tab-list-btn');
          if (listTabBtn) listTabBtn.click();
          loadDoiTraList();
          loadMasterData();
        } else {
          showToast(res.message || 'Lỗi khi lập phiếu đổi trả', 'danger');
        }
      } catch (err) {
        console.error('Lỗi tạo phiếu đổi trả:', err);
        showToast(err.message || 'Lỗi khi lập phiếu đổi trả', 'danger');
      }
    });
  }

  // 7. Xử lý Hủy / Thu hồi phiếu đổi trả (Chỉ dành cho Quản lý)
  if (btnCancelDoiTraModal) {
    btnCancelDoiTraModal.addEventListener('click', async () => {
      if (!currentViewingDetailId) return;

      const lyDoHuy = prompt('Nhập lý do Quản lý hủy / thu hồi phiếu đổi trả này:');
      if (lyDoHuy === null) return; // Khách bấm cancel
      if (!lyDoHuy.trim()) {
        showToast('Vui lòng nhập lý do hủy phiếu', 'warning');
        return;
      }

      btnCancelDoiTraModal.disabled = true;
      btnCancelDoiTraModal.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang hủy...';

      try {
        const res = await api.put(`/doi-tra/${currentViewingDetailId}/huy`, { lyDoHuy });
        if (res && res.success) {
          showToast('Đã hủy phiếu đổi trả và hoàn tác kho, sổ quỹ thành công!', 'success');
          if (modalDetail) modalDetail.hide();
          loadDoiTraList();
          loadMasterData();
        } else {
          showToast(res.message || 'Không thể hủy phiếu đổi trả', 'danger');
        }
      } catch (err) {
        showToast(err.message || 'Lỗi khi hủy phiếu đổi trả', 'danger');
      } finally {
        btnCancelDoiTraModal.disabled = false;
        btnCancelDoiTraModal.innerHTML = '<i class="bi bi-x-circle me-1"></i> Hủy / Thu Hồi Phiếu Đổi Trả (Quản lý)';
      }
    });
  }

  // 8. Tra cứu lịch sử IMEI
  if (btnLookupImei) {
    btnLookupImei.addEventListener('click', async () => {
      const imei = lookupImeiInput?.value.trim();
      if (!imei) {
        showToast('Vui lòng nhập số IMEI cần tra cứu', 'warning');
        return;
      }

      btnLookupImei.disabled = true;
      btnLookupImei.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang tra cứu...';

      try {
        const res = await api.get(`/doi-tra/lich-su-imei/${encodeURIComponent(imei)}`);
        const data = res.data || res;
        renderLookupResult(data);
      } catch (err) {
        if (lookupResultContainer) {
          lookupResultContainer.innerHTML = `
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-circle me-1"></i> Không thể tra cứu: ${err.message}
            </div>
          `;
        }
      } finally {
        btnLookupImei.disabled = false;
        btnLookupImei.innerHTML = '<i class="bi bi-search me-1"></i> Tra cứu lịch sử';
      }
    });
  }

  // -------------------------------------------------------------
  // HELPER FUNCTIONS
  // -------------------------------------------------------------

  function renderCheckSuccess(data) {
    const { hoaDon, mayCu, giaMayCu, soNgayDaMua, thoiHanConLai } = data;
    const kh = hoaDon.khachHang || {};
    const sp = mayCu && mayCu.sanPham ? mayCu.sanPham : {};

    checkResultContainer.style.display = 'block';
    checkResultContainer.innerHTML = `
      <div class="alert alert-success mb-0 border-success">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong class="text-success fs-6"><i class="bi bi-check-circle-fill me-1"></i> ĐỦ ĐIỀU KIỆN ĐỔI TRẢ TRONG 30 NGÀY</strong>
          <span class="badge bg-success">Còn ${thoiHanConLai} ngày hạn đổi trả</span>
        </div>
        <div class="row g-2 small">
          <div class="col-md-4">
            <strong>Khách hàng:</strong> ${escapeHtml(kh.hoTen || 'Khách vãng lai')} (${escapeHtml(kh.sdt || '')})
          </div>
          <div class="col-md-4">
            <strong>Model máy cũ:</strong> ${escapeHtml(sp.tenMay || 'Điện thoại')} - <span class="font-monospace">${escapeHtml(mayCu ? mayCu.imei : '')}</span>
          </div>
          <div class="col-md-4">
            <strong>Giá mua ban đầu:</strong> <span class="fw-bold text-primary">${(giaMayCu || 0).toLocaleString('vi-VN')} đ</span>
          </div>
          <div class="col-md-4">
            <strong>Số HĐ:</strong> <span class="font-monospace">${escapeHtml(hoaDon.soHD)}</span>
          </div>
          <div class="col-md-4">
            <strong>Ngày mua:</strong> ${new Date(hoaDon.ngayLap || hoaDon.createdAt).toLocaleDateString('vi-VN')} (${soNgayDaMua} ngày trước)
          </div>
          <div class="col-md-4">
            <strong>Trạng thái HĐ:</strong> <span class="badge bg-light text-dark border">${escapeHtml(hoaDon.trangThai)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderCheckError(message) {
    checkResultContainer.style.display = 'block';
    checkResultContainer.innerHTML = `
      <div class="alert alert-danger mb-0">
        <i class="bi bi-x-circle-fill me-1"></i> <strong>Không đủ điều kiện đổi trả:</strong> ${escapeHtml(message)}
      </div>
    `;
  }

  function renderSelectedPhuKien() {
    if (!selectedPhuKienContainer) return;
    if (selectedPhuKienList.length === 0) {
      selectedPhuKienContainer.innerHTML = '';
      if (rowGiaPhuKien) rowGiaPhuKien.style.display = 'none';
      return;
    }

    if (rowGiaPhuKien) rowGiaPhuKien.style.display = 'flex';

    selectedPhuKienContainer.innerHTML = `
      <div class="table-responsive mt-2">
        <table class="table table-sm table-bordered bg-white mb-0 small">
          <thead class="table-light">
            <tr>
              <th>Tên phụ kiện</th>
              <th class="text-center" style="width: 70px;">SL</th>
              <th class="text-end" style="width: 110px;">Đơn giá</th>
              <th class="text-end" style="width: 120px;">Thành tiền</th>
              <th class="text-center" style="width: 40px;"></th>
            </tr>
          </thead>
          <tbody>
            ${selectedPhuKienList.map((pk, idx) => `
              <tr>
                <td>${escapeHtml(pk.tenPK)}</td>
                <td class="text-center">${pk.soLuong}</td>
                <td class="text-end">${pk.donGia.toLocaleString('vi-VN')} đ</td>
                <td class="text-end fw-semibold">${(pk.donGia * pk.soLuong).toLocaleString('vi-VN')} đ</td>
                <td class="text-center">
                  <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="window.removeDoiTraPhuKien(${idx})">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  window.removeDoiTraPhuKien = (idx) => {
    selectedPhuKienList.splice(idx, 1);
    renderSelectedPhuKien();
    calculatePriceDifference();
  };

  function calculatePriceDifference() {
    if (!validatedData) return;

    const giaMayCu = validatedData.giaMayCu || 0;
    const loai = selectLoaiDoiTra.value;
    const tongTienPhuKien = selectedPhuKienList.reduce((sum, pk) => sum + (pk.donGia * pk.soLuong), 0);

    if (displayGiaMayCu) displayGiaMayCu.textContent = giaMayCu.toLocaleString('vi-VN') + ' đ';
    if (displayGiaPhuKien) displayGiaPhuKien.textContent = (tongTienPhuKien > 0 ? '+' : '') + tongTienPhuKien.toLocaleString('vi-VN') + ' đ';

    if (loai === 'Tra hang') {
      if (displayGiaMayMoi) displayGiaMayMoi.textContent = '0 đ';
      if (labelTienChenhLech) labelTienChenhLech.textContent = 'Số tiền hoàn trả khách (100%):';
      if (displayTienChenhLech) {
        displayTienChenhLech.textContent = giaMayCu.toLocaleString('vi-VN') + ' đ';
        displayTienChenhLech.className = 'font-monospace fs-5 text-danger';
      }
      if (noteChenhLech) noteChenhLech.textContent = 'Hệ thống sẽ tự động tạo một Phiếu Chi vào sổ quỹ để hoàn tiền cho khách.';
      return;
    }

    // Đổi máy
    const selectedImei = selectImeiMoi ? selectImeiMoi.value : '';
    const selectedMayDoc = allAvailableImeis.find(m => m.imei === selectedImei);
    let giaMayMoi = 0;

    if (selectedMayDoc) {
      giaMayMoi = (selectedMayDoc.sanPham && selectedMayDoc.sanPham.giaBan) ? selectedMayDoc.sanPham.giaBan : (selectedMayDoc.giaNhap * 1.15);
    }

    if (displayGiaMayMoi) displayGiaMayMoi.textContent = giaMayMoi.toLocaleString('vi-VN') + ' đ';

    const diff = (giaMayMoi + tongTienPhuKien) - giaMayCu;

    if (diff > 0) {
      if (labelTienChenhLech) labelTienChenhLech.textContent = 'Khách cần thanh toán thêm (Thu thêm):';
      if (displayTienChenhLech) {
        displayTienChenhLech.textContent = '+' + diff.toLocaleString('vi-VN') + ' đ';
        displayTienChenhLech.className = 'font-monospace fs-5 text-success';
      }
      if (noteChenhLech) noteChenhLech.textContent = 'Máy mới/phụ kiện giá cao hơn máy cũ -> Hệ thống sẽ tự động tạo Phiếu Thu tiền chênh lệch.';
    } else if (diff < 0) {
      if (labelTienChenhLech) labelTienChenhLech.textContent = 'Cửa hàng hoàn tiền thừa cho khách:';
      if (displayTienChenhLech) {
        displayTienChenhLech.textContent = '-' + Math.abs(diff).toLocaleString('vi-VN') + ' đ';
        displayTienChenhLech.className = 'font-monospace fs-5 text-danger';
      }
      if (noteChenhLech) noteChenhLech.textContent = 'Máy mới giá thấp hơn máy cũ -> Hệ thống sẽ tự động tạo Phiếu Chi hoàn trả tiền thừa.';
    } else {
      if (labelTienChenhLech) labelTienChenhLech.textContent = 'Đổi ngang giá:';
      if (displayTienChenhLech) {
        displayTienChenhLech.textContent = '0 đ';
        displayTienChenhLech.className = 'font-monospace fs-5 text-secondary';
      }
      if (noteChenhLech) noteChenhLech.textContent = 'Hai máy cùng giá trị niêm yết -> Không phát sinh thu/chi tài chính.';
    }
  }

  function resetCreateForm() {
    validatedData = null;
    selectedPhuKienList = [];
    if (checkSoHDInput) checkSoHDInput.value = '';
    if (checkImeiInput) checkImeiInput.value = '';
    if (checkResultContainer) {
      checkResultContainer.style.display = 'none';
      checkResultContainer.innerHTML = '';
    }
    if (createDoiTraForm) {
      createDoiTraForm.reset();
      createDoiTraForm.style.display = 'none';
    }
    if (doiMaySection) doiMaySection.style.display = 'block';
    renderSelectedPhuKien();
    populateImeiOptions();
  }

  /**
   * Tải danh mục sản phẩm, phụ kiện và các máy IMEI còn hàng
   */
  async function loadMasterData() {
    try {
      const [resSp, resMay, resPk] = await Promise.all([
        api.get('/san-pham'),
        api.get('/may-imei?trangThai=Con hang'),
        api.get('/phu-kien')
      ]);

      allSanPhams = resSp.data && Array.isArray(resSp.data.data) ? resSp.data.data : (Array.isArray(resSp.data) ? resSp.data : (resSp.sanPhams || []));
      allAvailableImeis = resMay.data && Array.isArray(resMay.data.data) ? resMay.data.data : (Array.isArray(resMay.data) ? resMay.data : (resMay.mayImeis || []));
      allPhuKiens = resPk.data && Array.isArray(resPk.data.data) ? resPk.data.data : (Array.isArray(resPk.data) ? resPk.data : (resPk.phuKiens || []));

      if (selectSanPhamMoi) {
        selectSanPhamMoi.innerHTML = '<option value="">-- Tất cả Model máy mới --</option>' +
          allSanPhams.map(sp => `<option value="${sp._id}">${escapeHtml(sp.tenMay)} (${(sp.giaBan || 0).toLocaleString('vi-VN')} đ)</option>`).join('');
      }

      if (selectPhuKienMoi) {
        selectPhuKienMoi.innerHTML = '<option value="">-- Chọn phụ kiện trong kho --</option>' +
          allPhuKiens.filter(p => p.soLuongTon > 0).map(p => `<option value="${p._id}">${escapeHtml(p.tenPK)} - ${(p.giaBan || 0).toLocaleString('vi-VN')} đ (Tồn: ${p.soLuongTon})</option>`).join('');
      }

      populateImeiOptions();
    } catch (err) {
      console.error('Lỗi khi tải master data:', err);
    }
  }

  function populateImeiOptions(filterSpId = '') {
    if (!selectImeiMoi) return;

    let filtered = allAvailableImeis;
    if (filterSpId) {
      filtered = allAvailableImeis.filter(m => (m.sanPham && (m.sanPham._id === filterSpId || m.sanPham === filterSpId)));
    }

    if (filtered.length === 0) {
      selectImeiMoi.innerHTML = '<option value="">-- Không có máy nào còn hàng --</option>';
      return;
    }

    selectImeiMoi.innerHTML = '<option value="">-- Chọn máy IMEI mới trong kho --</option>' +
      filtered.map(m => {
        const spName = m.sanPham ? m.sanPham.tenMay : 'Điện thoại';
        const price = (m.sanPham && m.sanPham.giaBan) ? m.sanPham.giaBan : m.giaNhap * 1.15;
        return `<option value="${m.imei}">${escapeHtml(spName)} [${m.imei}] - ${price.toLocaleString('vi-VN')} đ</option>`;
      }).join('');
  }

  /**
   * Tải danh sách phiếu đổi trả
   */
  async function loadDoiTraList() {
    if (!doiTraTableBody) return;
    try {
      doiTraTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
            Đang tải dữ liệu...
          </td>
        </tr>
      `;

      const params = { page: currentPage, limit: 10 };
      if (currentLoai !== 'All') params.loaiDoiTra = currentLoai;
      if (currentTrangThai !== 'All') params.trangThai = currentTrangThai;
      if (currentSearch) params.search = currentSearch;
      if (filterTuNgay && filterTuNgay.value) params.tuNgay = filterTuNgay.value;
      if (filterDenNgay && filterDenNgay.value) params.denNgay = filterDenNgay.value;

      const res = await api.get('/doi-tra', params);
      const list = res.phieuDoiTras || res.danhSach || (res.data && res.data.phieuDoiTras) || (Array.isArray(res.data) ? res.data : []);
      const pagination = res.pagination || (res.data && res.data.pagination) || {};

      renderTable(list);
      renderPagination(pagination);
      updateStats(list);
    } catch (err) {
      console.error('Lỗi tải danh sách đổi trả:', err);
      doiTraTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-4 text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i> Không thể tải danh sách phiếu đổi trả: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  function renderTable(list) {
    if (!list || list.length === 0) {
      doiTraTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
            Chưa có phiếu đổi trả nào phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    doiTraTableBody.innerHTML = list.map(item => {
      const maDTStr = item.maDT || `#${item._id.slice(-6).toUpperCase()}`;
      const soHDStr = item.hoaDon ? (item.hoaDon.soHD || item.hoaDon) : '<em class="text-muted">Chưa rõ HĐ</em>';
      const khName = item.khachHang ? escapeHtml(item.khachHang.hoTen) : (item.hoaDon && item.hoaDon.khachHang ? escapeHtml(item.hoaDon.khachHang.hoTen) : '<em class="text-muted">Khách vãng lai</em>');
      const loaiBadge = item.loaiDoiTra === 'Doi may'
        ? '<span class="badge bg-primary"><i class="bi bi-phone-flip me-1"></i>Đổi máy</span>'
        : '<span class="badge bg-warning text-dark"><i class="bi bi-arrow-return-left me-1"></i>Trả hàng</span>';

      const statusBadge = item.trangThai === 'Da huy'
        ? '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Đã hủy</span>'
        : '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Hoàn tất</span>';

      const imeiCuStr = `<span class="badge bg-danger-subtle text-danger font-monospace border border-danger-subtle">${escapeHtml(item.imeiCu || item.imei || '')}</span>`;
      const imeiMoiStr = item.imeiMoi
        ? `<span class="badge bg-success-subtle text-success font-monospace border border-success-subtle">${escapeHtml(item.imeiMoi)}</span>`
        : '<em class="text-muted">Không đổi máy</em>';

      let diffStr = '';
      if (item.tienChenhLech > 0) {
        diffStr = `<span class="fw-bold text-success">+${item.tienChenhLech.toLocaleString('vi-VN')} đ (Thu thêm)</span>`;
      } else if (item.tienChenhLech < 0) {
        diffStr = `<span class="fw-bold text-danger">-${Math.abs(item.tienChenhLech).toLocaleString('vi-VN')} đ (Hoàn lại)</span>`;
      } else {
        diffStr = `<span class="text-muted">0 đ (Ngang giá)</span>`;
      }

      const dateStr = new Date(item.ngayDoiTra || item.createdAt).toLocaleDateString('vi-VN');

      return `
        <tr>
          <td class="ps-3 font-monospace fw-semibold text-primary">${escapeHtml(maDTStr)}</td>
          <td class="font-monospace fw-semibold">${escapeHtml(soHDStr)}</td>
          <td>${khName}</td>
          <td>${loaiBadge}</td>
          <td>${imeiCuStr}</td>
          <td>${imeiMoiStr}</td>
          <td class="text-end">${diffStr}</td>
          <td>${statusBadge}</td>
          <td class="text-muted small">${dateStr}</td>
          <td class="text-end pe-3">
            <button type="button" class="btn btn-sm btn-outline-primary btn-view-detail" data-id="${item._id}" title="Xem chi tiết">
              <i class="bi bi-eye"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-view-detail').forEach(btn => {
      btn.addEventListener('click', () => viewDetail(btn.getAttribute('data-id')));
    });
  }

  async function viewDetail(id) {
    currentViewingDetailId = id;
    const content = document.getElementById('modalDoiTraDetailContent');
    if (content) {
      content.innerHTML = `
        <div class="text-center py-4">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      `;
    }
    if (btnCancelDoiTraModal) btnCancelDoiTraModal.style.display = 'none';
    if (modalDetail) modalDetail.show();

    try {
      const res = await api.get(`/doi-tra/${id}`);
      const data = res.data || res;
      const { phieuDoiTra, mayCu, mayMoi, hoaDon, phieuThu, phieuChi, phieuThuDaoNguoc, phieuChiDaoNguoc, danhSachPhuKien = [] } = data;

      if (!phieuDoiTra) {
        if (content) content.innerHTML = '<div class="alert alert-danger">Không tìm thấy thông tin phiếu đổi trả</div>';
        return;
      }

      // Kiểm tra quyền Quản lý để hiển thị nút Hủy phiếu
      const currentUser = api.getCurrentUser ? api.getCurrentUser() : null;
      const isManager = currentUser && (currentUser.vaiTro === 'Quản lý' || currentUser.role === 'Quản lý');
      if (btnCancelDoiTraModal) {
        if (isManager && phieuDoiTra.trangThai !== 'Da huy') {
          btnCancelDoiTraModal.style.display = 'inline-block';
        } else {
          btnCancelDoiTraModal.style.display = 'none';
        }
      }

      const kh = phieuDoiTra.khachHang || (hoaDon ? hoaDon.khachHang : {}) || {};
      const nv = phieuDoiTra.nhanVien || {};
      const spCu = mayCu && mayCu.sanPham ? mayCu.sanPham : {};
      const spMoi = mayMoi && mayMoi.sanPham ? mayMoi.sanPham : {};

      let phieuThuHtml = '';
      if (phieuThu) {
        phieuThuHtml = `
          <div class="alert alert-success mt-3 py-2">
            <i class="bi bi-cash-stack me-1"></i> <strong>Phiếu Thu chênh lệch:</strong> #${phieuThu._id.slice(-6).toUpperCase()} - 
            Số tiền: <strong>${(phieuThu.soTien || 0).toLocaleString('vi-VN')} đ</strong> 
            (${escapeHtml(phieuThu.hinhThuc || 'Tiền mặt')})
          </div>
        `;
      }

      let phieuChiHtml = '';
      if (phieuChi) {
        phieuChiHtml = `
          <div class="alert alert-danger mt-3 py-2">
            <i class="bi bi-cash-coin me-1"></i> <strong>Phiếu Chi hoàn tiền:</strong> #${phieuChi._id.slice(-6).toUpperCase()} - 
            Số tiền hoàn: <strong>${(phieuChi.soTien || 0).toLocaleString('vi-VN')} đ</strong> 
            (${escapeHtml(phieuChi.hinhThuc || 'Tiền mặt')})
          </div>
        `;
      }

      let phuKienHtml = '';
      if (danhSachPhuKien && danhSachPhuKien.length > 0) {
        phuKienHtml = `
          <div class="card p-3 mt-3 border bg-white">
            <h6 class="fw-bold text-info mb-2"><i class="bi bi-bag me-1"></i>Phụ Kiện Mua Kèm / Đổi Kèm</h6>
            <div class="table-responsive">
              <table class="table table-sm table-bordered mb-0 small">
                <thead class="table-light">
                  <tr>
                    <th>Tên phụ kiện</th>
                    <th class="text-center">Số lượng</th>
                    <th class="text-end">Đơn giá</th>
                    <th class="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${danhSachPhuKien.map(item => `
                    <tr>
                      <td>${escapeHtml(item.phuKien ? item.phuKien.tenPK : 'Phụ kiện')}</td>
                      <td class="text-center">${item.soLuong}</td>
                      <td class="text-end">${(item.donGia || 0).toLocaleString('vi-VN')} đ</td>
                      <td class="text-end fw-semibold">${((item.donGia || 0) * (item.soLuong || 1)).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      let cancelStatusHtml = '';
      if (phieuDoiTra.trangThai === 'Da huy') {
        cancelStatusHtml = `
          <div class="alert alert-danger mt-3">
            <h6 class="fw-bold mb-1"><i class="bi bi-exclamation-octagon-fill me-1"></i> PHIẾU ĐÃ BỊ HỦY / THU HỒI BỞI QUẢN LÝ</h6>
            <p class="mb-1 small"><strong>Lý do hủy:</strong> ${escapeHtml(phieuDoiTra.lyDoHuy || 'Không có lý do')}</p>
            <p class="mb-0 small"><strong>Thời gian hủy:</strong> ${new Date(phieuDoiTra.ngayHuy).toLocaleString('vi-VN')}</p>
            ${phieuThuDaoNguoc ? `<div class="small text-success mt-1">✓ Đã sinh Phiếu Thu đảo ngược: #${phieuThuDaoNguoc._id.slice(-6).toUpperCase()}</div>` : ''}
            ${phieuChiDaoNguoc ? `<div class="small text-danger mt-1">✓ Đã sinh Phiếu Chi đảo ngược: #${phieuChiDaoNguoc._id.slice(-6).toUpperCase()}</div>` : ''}
          </div>
        `;
      }

      if (content) {
        content.innerHTML = `
          <div class="row g-3">
            <div class="col-md-6">
              <div class="card p-3 bg-light border-0">
                <h6 class="fw-bold text-primary mb-2"><i class="bi bi-file-text me-1"></i>Thông Tin Giao Dịch Gốc</h6>
                <p class="mb-1"><strong>Số Hóa đơn:</strong> <span class="font-monospace">${escapeHtml(hoaDon ? hoaDon.soHD : 'Chưa rõ')}</span></p>
                <p class="mb-1"><strong>Khách hàng:</strong> ${escapeHtml(kh.hoTen || 'Khách vãng lai')} (${escapeHtml(kh.sdt || 'Không có SĐT')})</p>
                <p class="mb-0"><strong>Nhân viên lập:</strong> ${escapeHtml(nv.hoTen || 'Nhân viên')}</p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card p-3 bg-light border-0">
                <h6 class="fw-bold text-primary mb-2"><i class="bi bi-clock-history me-1"></i>Thông Tin Phiếu Đổi Trả</h6>
                <p class="mb-1"><strong>Mã phiếu:</strong> <span class="font-monospace">${escapeHtml(phieuDoiTra.maDT || phieuDoiTra._id)}</span></p>
                <p class="mb-1"><strong>Hình thức:</strong> <span class="badge bg-primary">${escapeHtml(phieuDoiTra.loaiDoiTra)}</span></p>
                <p class="mb-0"><strong>Ngày lập:</strong> ${new Date(phieuDoiTra.ngayDoiTra || phieuDoiTra.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </div>

          <div class="row g-3 mt-1">
            <div class="col-md-6">
              <div class="card p-3 border-danger border-start border-4">
                <h6 class="fw-bold text-danger mb-2"><i class="bi bi-phone me-1"></i>Máy Cũ Thu Hồi (Trạng thái: ${phieuDoiTra.trangThai === 'Da huy' ? 'Đã khôi phục Đã bán' : 'Lỗi'})</h6>
                <p class="mb-1"><strong>Model:</strong> ${escapeHtml(spCu.tenMay || 'Điện thoại')}</p>
                <p class="mb-1"><strong>IMEI cũ:</strong> <span class="font-monospace text-danger">${escapeHtml(phieuDoiTra.imeiCu)}</span></p>
                <p class="mb-0"><strong>Giá trị tính đổi:</strong> ${(phieuDoiTra.giaMayCu || 0).toLocaleString('vi-VN')} đ</p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card p-3 border-success border-start border-4">
                <h6 class="fw-bold text-success mb-2"><i class="bi bi-phone-flip me-1"></i>Máy Mới Bàn Giao (Trạng thái: ${phieuDoiTra.trangThai === 'Da huy' ? 'Đã hoàn về Còn hàng' : 'Đã bán'})</h6>
                ${phieuDoiTra.imeiMoi ? `
                  <p class="mb-1"><strong>Model:</strong> ${escapeHtml(spMoi.tenMay || 'Điện thoại')}</p>
                  <p class="mb-1"><strong>IMEI mới:</strong> <span class="font-monospace text-success">${escapeHtml(phieuDoiTra.imeiMoi)}</span></p>
                  <p class="mb-0"><strong>Giá bán máy mới:</strong> ${(phieuDoiTra.giaMayMoi || 0).toLocaleString('vi-VN')} đ</p>
                ` : `
                  <p class="text-muted mb-0 py-3">Khách hàng trả lại máy và nhận lại tiền (Không lấy máy mới)</p>
                `}
              </div>
            </div>
          </div>

          ${phuKienHtml}

          <div class="card p-3 mt-3 bg-light border">
            <div class="d-flex justify-content-between align-items-center">
              <strong>Chênh lệch thanh toán:</strong>
              <strong class="fs-5 ${phieuDoiTra.tienChenhLech > 0 ? 'text-success' : (phieuDoiTra.tienChenhLech < 0 ? 'text-danger' : 'text-secondary')}">
                ${phieuDoiTra.tienChenhLech > 0 ? '+' + phieuDoiTra.tienChenhLech.toLocaleString('vi-VN') + ' đ (Thu thêm)' : (phieuDoiTra.tienChenhLech < 0 ? '-' + Math.abs(phieuDoiTra.tienChenhLech).toLocaleString('vi-VN') + ' đ (Hoàn trả)' : '0 đ (Ngang giá)')}
              </strong>
            </div>
            <div class="small text-muted mt-2"><strong>Lý do đổi trả:</strong> ${escapeHtml(phieuDoiTra.lyDo || '')}</div>
            ${phieuDoiTra.ghiChu ? `<div class="small text-muted mt-1"><strong>Ghi chú:</strong> ${escapeHtml(phieuDoiTra.ghiChu)}</div>` : ''}
          </div>

          ${cancelStatusHtml}
          ${phieuThuHtml}
          ${phieuChiHtml}
        `;
      }
    } catch (err) {
      if (content) content.innerHTML = `<div class="alert alert-danger">Lỗi tải chi tiết: ${err.message}</div>`;
    }
  }

  function renderLookupResult(data) {
    if (!lookupResultContainer) return;
    const { imei, mayInfo, soLanDoiTra, lichSu = [] } = data;

    const sp = mayInfo && mayInfo.sanPham ? mayInfo.sanPham : {};

    let historyCards = '';
    if (lichSu.length === 0) {
      historyCards = `
        <div class="card p-4 text-center text-muted">
          <i class="bi bi-shield-check fs-2 text-success mb-2"></i>
          Không tìm thấy bất kỳ lịch sử đổi trả nào cho số IMEI <strong>${escapeHtml(imei)}</strong>.
        </div>
      `;
    } else {
      historyCards = `
        <h6 class="fw-bold mb-3"><i class="bi bi-clock-history me-1"></i>Tìm thấy ${soLanDoiTra} lần phát sinh đổi trả:</h6>
        <div class="row g-3">
          ${lichSu.map(h => `
            <div class="col-md-6">
              <div class="card-custom p-3 border">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="font-monospace text-primary">${escapeHtml(h.maDT || h._id)}</strong>
                  <span class="badge ${h.loaiDoiTra === 'Doi may' ? 'bg-primary' : 'bg-warning text-dark'}">${escapeHtml(h.loaiDoiTra)}</span>
                </div>
                <p class="mb-1 small"><strong>Hóa đơn liên quan:</strong> <span class="font-monospace">${escapeHtml(h.hoaDon ? (h.hoaDon.soHD || h.hoaDon) : '')}</span></p>
                <p class="mb-1 small"><strong>IMEI cũ:</strong> <span class="font-monospace text-danger">${escapeHtml(h.imeiCu || '')}</span></p>
                ${h.imeiMoi ? `<p class="mb-1 small"><strong>IMEI mới đổi:</strong> <span class="font-monospace text-success">${escapeHtml(h.imeiMoi)}</span></p>` : ''}
                <p class="mb-1 small"><strong>Chênh lệch tiền:</strong> ${(h.tienChenhLech || 0).toLocaleString('vi-VN')} đ</p>
                <p class="mb-1 small"><strong>Trạng thái:</strong> <span class="badge ${h.trangThai === 'Da huy' ? 'bg-danger' : 'bg-success'}">${escapeHtml(h.trangThai)}</span></p>
                <p class="mb-1 small"><strong>Lý do:</strong> ${escapeHtml(h.lyDo || '')}</p>
                <small class="text-muted d-block mt-2">Ngày thực hiện: ${new Date(h.ngayDoiTra || h.createdAt).toLocaleString('vi-VN')}</small>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    lookupResultContainer.innerHTML = `
      <div class="card-custom p-3 mb-4 bg-light">
        <div class="row g-2">
          <div class="col-md-4"><strong>Số IMEI:</strong> <span class="font-monospace text-primary fw-bold">${escapeHtml(imei)}</span></div>
          <div class="col-md-4"><strong>Model máy:</strong> ${escapeHtml(sp.tenMay || 'Chưa rõ')}</div>
          <div class="col-md-4"><strong>Trạng thái kho hiện tại:</strong> <span class="badge bg-secondary">${escapeHtml(mayInfo ? mayInfo.trangThai : 'Chưa nhập')}</span></div>
        </div>
      </div>
      ${historyCards}
    `;
  }

  function renderPagination(pagination) {
    if (!paginationContainer) return;
    if (!pagination || pagination.totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }

    paginationContainer.style.display = 'flex';
    if (paginationInfo) {
      paginationInfo.textContent = `Trang ${pagination.page} / ${pagination.totalPages} (Tổng cộng ${pagination.total} phiếu)`;
    }

    let html = '';
    if (pagination.page > 1) {
      html += `<button class="btn btn-outline-secondary" onclick="changeDoiTraPage(${pagination.page - 1})"><i class="bi bi-chevron-left"></i></button>`;
    }
    for (let i = 1; i <= pagination.totalPages; i++) {
      html += `<button class="btn ${i === pagination.page ? 'btn-primary' : 'btn-outline-secondary'}" onclick="changeDoiTraPage(${i})">${i}</button>`;
    }
    if (pagination.page < pagination.totalPages) {
      html += `<button class="btn btn-outline-secondary" onclick="changeDoiTraPage(${pagination.page + 1})"><i class="bi bi-chevron-right"></i></button>`;
    }
    if (paginationButtons) {
      paginationButtons.innerHTML = html;
    }
  }

  window.changeDoiTraPage = (page) => {
    currentPage = page;
    loadDoiTraList();
  };

  function updateStats(list) {
    if (!list) return;
    if (statTotalDoiTra) statTotalDoiTra.textContent = list.length;
    if (statDoiMayCount) statDoiMayCount.textContent = list.filter(i => i.loaiDoiTra === 'Doi may').length;
    if (statTraHangCount) statTraHangCount.textContent = list.filter(i => i.loaiDoiTra === 'Tra hang').length;

    const totalThuThem = list.filter(i => i.tienChenhLech > 0 && i.trangThai !== 'Da huy').reduce((sum, i) => sum + (i.tienChenhLech || 0), 0);
    if (statTotalThuThem) statTotalThuThem.textContent = totalThuThem.toLocaleString('vi-VN') + ' đ';
  }
});
