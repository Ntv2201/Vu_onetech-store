/**
 * Module Xử lý Bán hàng POS và Quản lý Hóa đơn phía Client (Nguyễn Quang Tuấn)
 * Cập nhật: Hỗ trợ Chế độ Toàn màn hình POS, Giữ đơn tạm (Multi-order tabs) & Mệnh giá tiền mặt nhanh
 */

// Quản lý nhiều đơn hàng giữ đơn tạm thời
let orderCarts = [
  {
    id: 1,
    name: 'Đơn 1',
    imeis: [], // [{ imei, tenMay, giaBan, mauSac, dungLuong }]
    phuKiens: [], // [{ _id, tenPK, giaBan, soLuong, soLuongTon }]
    customerType: 'guest',
    guestName: '',
    guestPhone: '',
    guestCccd: '',
    memberId: '',
    paymentMethod: 'Da thanh toan',
    ghiChu: '',
    appliedKhuyenMai: null,
    selectedPreOrder: null,
    tienKhachDua: 0
  }
];
let activeOrderIndex = 0;
let nextOrderId = 2;

// Con trỏ cart trỏ tới đơn hàng đang kích hoạt
let cart = orderCarts[0];
let selectedPreOrder = null;
let appliedKhuyenMai = null;

let allAvailableImeis = [];
let allPhuKiens = [];
let allSanPhams = [];
let allKhachHangs = [];

let preOrderModalInstance = null;

/**
 * Chuyển đổi hiển thị giữa Khách mới và Thành viên
 */
window.toggleCustomerType = function() {
  const type = document.querySelector('input[name="customerType"]:checked')?.value;
  const guestInputs = document.getElementById('guestCustomerInputs');
  const memberSelect = document.getElementById('memberCustomerSelect');
  
  if (type === 'guest') {
    guestInputs.classList.remove('d-none');
    memberSelect.classList.add('d-none');
    
    // Add required
    document.getElementById('inputGuestName').setAttribute('required', 'required');
    document.getElementById('inputGuestPhone').setAttribute('required', 'required');
    // Remove required from select
    document.getElementById('selectKhachHang').removeAttribute('required');
  } else {
    guestInputs.classList.add('d-none');
    memberSelect.classList.remove('d-none');
    
    // Remove required
    document.getElementById('inputGuestName').removeAttribute('required');
    document.getElementById('inputGuestPhone').removeAttribute('required');
    // Add required to select
    document.getElementById('selectKhachHang').setAttribute('required', 'required');
  }
};

/* =========================================================================
   CHỨC NĂNG 1: TOÀN MÀN HÌNH POS (FULLSCREEN POS)
========================================================================= */
function togglePosFullScreen(forceState) {
  const isCurrentlyFull = document.body.classList.contains('pos-fullscreen-active');
  const shouldBeFull = forceState !== undefined ? forceState : !isCurrentlyFull;

  if (shouldBeFull) {
    document.body.classList.add('pos-fullscreen-active');
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    showToast('Đã bật chế độ Toàn màn hình POS [F11 hoặc Esc]', 'info');
  } else {
    document.body.classList.remove('pos-fullscreen-active');
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
}
window.togglePosFullScreen = togglePosFullScreen;

/* =========================================================================
   CHỨC NĂNG 2: QUẢN LÝ NHIỀU ĐƠN HÀNG (MULTI-ORDER TABS / HOLD CARTS)
========================================================================= */
function syncCurrentOrderState() {
  if (!orderCarts[activeOrderIndex]) return;
  const current = orderCarts[activeOrderIndex];
  
  const customerType = document.querySelector('input[name="customerType"]:checked')?.value || 'guest';
  current.customerType = customerType;
  current.guestName = document.getElementById('inputGuestName')?.value || '';
  current.guestPhone = document.getElementById('inputGuestPhone')?.value || '';
  current.guestCccd = document.getElementById('inputGuestCccd')?.value || '';
  current.memberId = document.getElementById('selectKhachHang')?.value || '';
  current.paymentMethod = document.getElementById('selectPaymentMethod')?.value || 'Da thanh toan';
  current.ghiChu = document.getElementById('inputGhiChu')?.value || '';
  current.appliedKhuyenMai = appliedKhuyenMai;
  current.selectedPreOrder = selectedPreOrder;
}

function loadOrderStateToUI(index) {
  const order = orderCarts[index];
  if (!order) return;

  // 1. Loại khách hàng
  if (order.customerType === 'member') {
    const radioMember = document.getElementById('typeMember');
    if (radioMember) radioMember.checked = true;
  } else {
    const radioGuest = document.getElementById('typeGuest');
    if (radioGuest) radioGuest.checked = true;
  }
  window.toggleCustomerType();

  // 2. Điền thông tin khách
  const inputName = document.getElementById('inputGuestName');
  const inputPhone = document.getElementById('inputGuestPhone');
  const inputCccd = document.getElementById('inputGuestCccd');
  const selectKh = document.getElementById('selectKhachHang');
  if (inputName) inputName.value = order.guestName || '';
  if (inputPhone) inputPhone.value = order.guestPhone || '';
  if (inputCccd) inputCccd.value = order.guestCccd || '';
  if (selectKh) selectKh.value = order.memberId || '';

  // 3. Phương thức thanh toán & Ghi chú
  const selectPay = document.getElementById('selectPaymentMethod');
  const inputNote = document.getElementById('inputGhiChu');
  if (selectPay) selectPay.value = order.paymentMethod || 'Da thanh toan';
  if (inputNote) inputNote.value = order.ghiChu || '';

  // 4. Mã khuyến mãi
  const inputMaKM = document.getElementById('inputMaKM');
  const msgEl = document.getElementById('kmMessage');
  const btnApplyKM = document.getElementById('btnApplyKM');
  const btnRemoveKM = document.getElementById('btnRemoveKM');
  if (order.appliedKhuyenMai) {
    if (inputMaKM) {
      inputMaKM.value = order.appliedKhuyenMai.maKM;
      inputMaKM.disabled = true;
    }
    if (btnApplyKM) btnApplyKM.classList.add('d-none');
    if (btnRemoveKM) btnRemoveKM.classList.remove('d-none');
    if (msgEl) {
      msgEl.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-1"></i>Đã áp dụng: Giảm ${formatCurrency(order.appliedKhuyenMai.soTienGiam)}</span>`;
      msgEl.classList.remove('d-none');
    }
  } else {
    if (inputMaKM) {
      inputMaKM.value = '';
      inputMaKM.disabled = false;
    }
    if (btnApplyKM) btnApplyKM.classList.remove('d-none');
    if (btnRemoveKM) btnRemoveKM.classList.add('d-none');
    if (msgEl) {
      msgEl.innerHTML = '';
      msgEl.classList.add('d-none');
    }
  }

  // 5. Đơn đặt trước cọc
  const preDisplay = document.getElementById('preOrderDisplayArea');
  const btnClearPre = document.getElementById('btnClearPreOrder');
  if (order.selectedPreOrder) {
    if (preDisplay) {
      preDisplay.innerHTML = `
        <div class="fw-semibold text-primary font-monospace">${escapeHtml(order.selectedPreOrder.soDonDat)}</div>
        <div>Cọc: <strong class="text-danger">${formatCurrency(order.selectedPreOrder.soTienCoc)}</strong> | KH: ${escapeHtml(order.selectedPreOrder.khachHang?.hoTen || 'Vãng lai')}</div>
      `;
    }
    if (btnClearPre) btnClearPre.classList.remove('d-none');
  } else {
    if (preDisplay) preDisplay.innerHTML = `<em>Chưa liên kết đơn cọc</em>`;
    if (btnClearPre) btnClearPre.classList.add('d-none');
  }

  // 6. Tiền khách đưa
  const inputTienDua = document.getElementById('inputTienKhachDua');
  if (inputTienDua) {
    inputTienDua.value = order.tienKhachDua > 0 ? order.tienKhachDua.toLocaleString('vi-VN') : '';
  }
}

function renderOrderTabs() {
  const container = document.getElementById('posOrderTabsContainer');
  if (!container) return;

  container.innerHTML = orderCarts.map((o, idx) => {
    const itemCount = (o.imeis ? o.imeis.length : 0) + (o.phuKiens ? o.phuKiens.reduce((s, p) => s + p.soLuong, 0) : 0);
    const isActive = idx === activeOrderIndex;
    return `
      <div class="pos-order-tab-item ${isActive ? 'active' : ''}" onclick="switchOrderTab(${idx})">
        <span>${escapeHtml(o.name)}</span>
        <span class="badge-count">${itemCount}</span>
        ${orderCarts.length > 1 ? `
          <button type="button" class="btn-close-tab" onclick="closeOrderTab(${idx}, event)" title="Hủy đơn ${escapeHtml(o.name)}">&times;</button>
        ` : ''}
      </div>
    `;
  }).join('');
}
window.renderOrderTabs = renderOrderTabs;

function switchOrderTab(newIndex) {
  if (newIndex === activeOrderIndex || newIndex < 0 || newIndex >= orderCarts.length) return;
  syncCurrentOrderState();
  activeOrderIndex = newIndex;
  cart = orderCarts[activeOrderIndex];
  appliedKhuyenMai = cart.appliedKhuyenMai;
  selectedPreOrder = cart.selectedPreOrder;

  loadOrderStateToUI(activeOrderIndex);
  renderOrderTabs();
  renderCart();
  filterImeiDisplay();
}
window.switchOrderTab = switchOrderTab;

function addNewOrderTab() {
  if (orderCarts.length >= 6) {
    showToast('Chỉ có thể mở tối đa 6 đơn hàng tạm cùng lúc', 'warning');
    return;
  }
  syncCurrentOrderState();
  const newOrder = {
    id: nextOrderId,
    name: `Đơn ${nextOrderId}`,
    imeis: [],
    phuKiens: [],
    customerType: 'guest',
    guestName: '',
    guestPhone: '',
    guestCccd: '',
    memberId: '',
    paymentMethod: 'Da thanh toan',
    ghiChu: '',
    appliedKhuyenMai: null,
    selectedPreOrder: null,
    tienKhachDua: 0
  };
  nextOrderId++;
  orderCarts.push(newOrder);
  activeOrderIndex = orderCarts.length - 1;
  cart = orderCarts[activeOrderIndex];
  appliedKhuyenMai = null;
  selectedPreOrder = null;

  loadOrderStateToUI(activeOrderIndex);
  renderOrderTabs();
  renderCart();
  filterImeiDisplay();
  playBeep('success');
  showToast(`Đã mở ${newOrder.name} mới (Đơn trước đã được giữ lại)`, 'info');
}
window.addNewOrderTab = addNewOrderTab;

function holdCurrentOrder() {
  const current = orderCarts[activeOrderIndex];
  const itemCount = (current.imeis ? current.imeis.length : 0) + (current.phuKiens ? current.phuKiens.length : 0);
  if (itemCount === 0) {
    showToast('Đơn hiện tại đang trống, không cần lưu tạm!', 'warning');
    return;
  }
  addNewOrderTab();
}
window.holdCurrentOrder = holdCurrentOrder;

async function closeOrderTab(index, e) {
  if (e) e.stopPropagation();
  if (orderCarts.length <= 1) {
    showToast('Không thể xóa đơn hàng duy nhất!', 'warning');
    return;
  }
  const target = orderCarts[index];
  const itemCount = (target.imeis ? target.imeis.length : 0) + (target.phuKiens ? target.phuKiens.length : 0);
  if (itemCount > 0) {
    const ok = typeof showConfirm === 'function'
      ? await showConfirm({
          title: 'Hủy đơn hàng tạm',
          message: `Bạn có chắc chắn muốn hủy <strong>${escapeHtml(target.name)}</strong> đang có <strong>${itemCount}</strong> sản phẩm trong giỏ?`,
          confirmText: 'Hủy đơn',
          cancelText: 'Giữ lại',
          type: 'warning'
        })
      : confirm(`Bạn có chắc muốn hủy ${target.name} đang có ${itemCount} sản phẩm?`);
    if (!ok) return;
  }

  orderCarts.splice(index, 1);
  if (activeOrderIndex >= orderCarts.length) {
    activeOrderIndex = orderCarts.length - 1;
  }
  cart = orderCarts[activeOrderIndex];
  appliedKhuyenMai = cart.appliedKhuyenMai;
  selectedPreOrder = cart.selectedPreOrder;

  loadOrderStateToUI(activeOrderIndex);
  renderOrderTabs();
  renderCart();
  filterImeiDisplay();
  showToast('Đã đóng tab đơn hàng', 'info');
}
window.closeOrderTab = closeOrderTab;

/* =========================================================================
   CHỨC NĂNG 3: MỆNH GIÁ TIỀN MẶT NHANH & TÍNH TIỀN THỐI LẠI
========================================================================= */
function getGrandTotalAmount() {
  const grandEl = document.getElementById('totalGrandPrice');
  if (!grandEl) return 0;
  const rawText = grandEl.innerText || '0';
  return Number(rawText.replace(/\D/g, '')) || 0;
}

function handleTienKhachDuaInput(el) {
  if (!el) return;
  let rawVal = el.value.replace(/\D/g, '');
  if (!rawVal) {
    el.value = '';
    cart.tienKhachDua = 0;
  } else {
    const num = Number(rawVal);
    el.value = num.toLocaleString('vi-VN');
    cart.tienKhachDua = num;
  }
  updateChangeReturnUI();
}
window.handleTienKhachDuaInput = handleTienKhachDuaInput;

function setExactCash() {
  const thucThu = getGrandTotalAmount();
  const input = document.getElementById('inputTienKhachDua');
  if (input) {
    input.value = thucThu > 0 ? thucThu.toLocaleString('vi-VN') : '0';
  }
  cart.tienKhachDua = thucThu;
  updateChangeReturnUI();
}
window.setExactCash = setExactCash;

function addQuickCash(amount) {
  let current = cart.tienKhachDua || 0;
  current += amount;
  cart.tienKhachDua = current;
  const input = document.getElementById('inputTienKhachDua');
  if (input) {
    input.value = current.toLocaleString('vi-VN');
  }
  updateChangeReturnUI();
}
window.addQuickCash = addQuickCash;

function setQuickCash(amount) {
  cart.tienKhachDua = amount;
  const input = document.getElementById('inputTienKhachDua');
  if (input) {
    input.value = amount.toLocaleString('vi-VN');
  }
  updateChangeReturnUI();
}
window.setQuickCash = setQuickCash;

function updateChangeReturnUI() {
  const thucThu = getGrandTotalAmount();
  const tienKhachDua = cart.tienKhachDua || 0;
  const box = document.getElementById('boxChangeReturn');
  const label = document.getElementById('labelChangeReturn');
  const val = document.getElementById('valueChangeReturn');
  if (!box || !label || !val) return;

  if (tienKhachDua === 0) {
    box.className = 'change-return-box mt-1';
    label.innerHTML = '<i class="bi bi-arrow-return-right me-1"></i>Tiền thừa trả khách:';
    val.className = 'fw-bold font-monospace text-muted fs-6';
    val.innerText = '0 đ';
    return;
  }

  if (tienKhachDua >= thucThu) {
    const change = tienKhachDua - thucThu;
    box.className = 'change-return-box has-change mt-1';
    label.innerHTML = '<i class="bi bi-check-circle me-1 text-success"></i>Tiền thừa trả khách:';
    val.className = 'fw-bold font-monospace text-success fs-6';
    val.innerText = formatCurrency(change);
  } else {
    const missing = thucThu - tienKhachDua;
    box.className = 'change-return-box underpaid mt-1';
    label.innerHTML = '<i class="bi bi-exclamation-circle me-1 text-danger"></i>Khách còn thiếu:';
    val.className = 'fw-bold font-monospace text-danger fs-6';
    val.innerText = formatCurrency(missing);
  }
}
window.updateChangeReturnUI = updateChangeReturnUI;

/**
 * Hiệu ứng âm thanh POS khi quét mã vạch Barcode IMEI
 */
function playBeep(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'success') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Âm cao A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime); // Âm cảnh báo
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // AudioContext blocked before user interaction
  }
}

let barcodeBuffer = '';
let lastKeyTime = 0;

document.addEventListener('DOMContentLoaded', async () => {
  // Đăng ký phím tắt & quét barcode ngay lập tức
  initKeyboardShortcuts();

  try {
    await initPosPage();
    await initInvoiceListPage();
    await initReportsTab();
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu trang bán hàng POS:', err);
  }

  // Tự động focus ô tìm / quét IMEI khi vào trang
  const searchInput = document.getElementById('searchImeiInput');
  if (searchInput) searchInput.focus();
});

function switchToPosTab() {
  const posTabBtn = document.getElementById('tab-pos-tab');
  if (posTabBtn && !posTabBtn.classList.contains('active')) {
    const tabInstance = bootstrap.Tab.getOrCreateInstance(posTabBtn);
    if (tabInstance) tabInstance.show();
  }
}

function handleScanOrEnterImei(rawText) {
  if (!rawText) return;
  const keyword = rawText.trim();
  const searchInput = document.getElementById('searchImeiInput');

  // 1. Tìm chính xác IMEI
  let found = allAvailableImeis.find(m => m.imei.toLowerCase() === keyword.toLowerCase());

  // 2. Nếu không khớp chính xác, thử tìm máy duy nhất khớp một phần
  if (!found) {
    const inCartImeis = new Set(cart.imeis.map(m => m.imei));
    const candidates = allAvailableImeis.filter(m => {
      if (inCartImeis.has(m.imei)) return false;
      return m.imei.toLowerCase().includes(keyword.toLowerCase()) ||
             (m.sanPham && m.sanPham.tenMay.toLowerCase().includes(keyword.toLowerCase()));
    });
    if (candidates.length === 1) {
      found = candidates[0];
    }
  }

  if (found) {
    const alreadyInCart = cart.imeis.some(m => m.imei === found.imei);
    if (alreadyInCart) {
      playBeep('error');
      showToast(`Máy IMEI "${found.imei}" đã có trong giỏ hàng!`, 'warning');
    } else {
      addImeiToCart(found.imei);
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      filterImeiDisplay();
    }
  } else {
    playBeep('error');
    showToast(`Không tìm thấy máy IMEI "${keyword}" còn hàng trong kho!`, 'danger');
  }
}

/**
 * Mở Camera quét mã vạch IMEI / QR Code trực tiếp qua camera điện thoại / webcam
 */
function openImeiCameraScanner() {
  if (typeof openCameraScanner === 'function') {
    openCameraScanner({
      title: 'Quét Mã Vạch IMEI / Hộp Máy',
      onScan: (code) => {
        switchToPosTab();
        handleScanOrEnterImei(code);
      }
    });
  } else {
    alert('Thư viện Camera Scanner chưa sẵn sàng');
  }
}
window.openImeiCameraScanner = openImeiCameraScanner;

function initGlobalBarcodeListener() {
  document.addEventListener('keydown', (e) => {
    // Bỏ qua các phím chức năng hoặc tổ hợp phím
    if (e.key.startsWith('F') || e.key === 'Escape' || e.key === 'Tab' || e.ctrlKey || e.altKey) {
      return;
    }

    const now = Date.now();
    const timeDelta = now - lastKeyTime;
    lastKeyTime = now;

    if (e.key === 'Enter') {
      // Nếu máy quét mã vạch đẩy chuỗi ký tự nhanh (< 80ms) và kết thúc bằng Enter
      if (barcodeBuffer.length >= 4 && timeDelta < 80) {
        e.preventDefault();
        switchToPosTab();
        handleScanOrEnterImei(barcodeBuffer);
        barcodeBuffer = '';
        return;
      }
      barcodeBuffer = '';
    } else if (e.key.length === 1) {
      if (timeDelta > 80) {
        barcodeBuffer = '';
      }
      barcodeBuffer += e.key;
    }
  });
}

function shortcutAction(key) {
  if (key === 'F1' || key === '1') {
    switchToPosTab();
    const searchInput = document.getElementById('searchImeiInput');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  } else if (key === 'F2' || key === '2' || key === 'k' || key === 'K') {
    switchToPosTab();
    const selectKh = document.getElementById('selectKhachHang');
    if (selectKh) {
      selectKh.focus();
      selectKh.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else if (key === 'F3' || key === '3') {
    switchToPosTab();
    const filterSp = document.getElementById('filterPosSanPham');
    if (filterSp) {
      filterSp.focus();
      filterSp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else if (key === 'F4' || key === '4' || key === 's' || key === 'S') {
    switchToPosTab();
    const btnSubmit = document.getElementById('btnSubmitOrder');
    if (btnSubmit) {
      if (btnSubmit.disabled) {
        playBeep('error');
        showToast('Giỏ hàng đang trống! Vui lòng chọn máy IMEI trước [F1 / Alt+1]', 'warning');
      } else {
        btnSubmit.click();
      }
    }
  } else if (key === 'F7' || key === '7' || key === 'd' || key === 'D') {
    switchToPosTab();
    const btnOpen = document.getElementById('btnOpenPreOrderModal');
    if (btnOpen) btnOpen.click();
  } else if (key === 'F8' || key === '8' || key === 'x' || key === 'X') {
    switchToPosTab();
    const btnClear = document.getElementById('btnClearCart');
    if (btnClear) {
      if (cart.imeis.length === 0 && cart.phuKiens.length === 0) {
        showToast('Giỏ hàng hiện đang trống', 'info');
      } else {
        btnClear.click();
        playBeep('warning');
        showToast('Đã xóa sạch giỏ hàng [F8 / Alt+8]', 'info');
      }
    }
  } else if (key === 'F9' || key === '9' || key === 'p' || key === 'P') {
    const invoiceModal = document.getElementById('invoiceDetailModal');
    if (invoiceModal && invoiceModal.classList.contains('show')) {
      printInvoiceReceipt();
    } else {
      const btnPrint = document.getElementById('btnPrintInvoice');
      if (btnPrint) btnPrint.click();
    }
  } else if (key === 'Escape') {
    const shownModals = document.querySelectorAll('.modal.show');
    if (shownModals.length > 0) {
      shownModals.forEach(m => {
        const instance = bootstrap.Modal.getInstance(m);
        if (instance) instance.hide();
      });
    } else {
      const searchInput = document.getElementById('searchImeiInput');
      if (searchInput && document.activeElement === searchInput) {
        searchInput.value = '';
        filterImeiDisplay();
      }
    }
  }
}

function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Phím chức năng F1 -> F9 và F11
    if (['F1', 'F2', 'F3', 'F4', 'F7', 'F8', 'F9'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      shortcutAction(e.key);
      return;
    }
    if (e.key === 'F11') {
      e.preventDefault();
      e.stopPropagation();
      togglePosFullScreen();
      return;
    }
    // Phím Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      shortcutAction('Escape');
      return;
    }
  }, { capture: true });

  // Kích hoạt lắng nghe máy quét barcode
  initGlobalBarcodeListener();
}

async function initPosPage() {
  await loadPosData();
  initPreOrderModal();
  renderOrderTabs();
  renderCart();

  // Setup Mã Khuyến Mãi events
  const btnApplyKM = document.getElementById('btnApplyKM');
  const btnRemoveKM = document.getElementById('btnRemoveKM');
  const inputMaKM = document.getElementById('inputMaKM');
  
  if (btnApplyKM) {
    btnApplyKM.addEventListener('click', applyPromoCode);
  }
  if (btnRemoveKM) {
    btnRemoveKM.addEventListener('click', removePromoCode);
  }
  if (inputMaKM) {
    inputMaKM.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyPromoCode();
    });
  }

  // Lắng nghe đổi hình thức thanh toán (Ẩn/Hiện khối tính tiền mặt)
  const selectPay = document.getElementById('selectPaymentMethod');
  const cashArea = document.getElementById('cashPaymentArea');
  if (selectPay && cashArea) {
    selectPay.addEventListener('change', () => {
      if (selectPay.value === 'Da thanh toan') {
        cashArea.classList.remove('d-none');
      } else {
        cashArea.classList.add('d-none');
      }
    });
  }

  // Search & Filter IMEI (hỗ trợ nhập hoặc quét Barcode + Enter)
  const searchInput = document.getElementById('searchImeiInput');
  const filterSp = document.getElementById('filterPosSanPham');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => filterImeiDisplay(), 200));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleScanOrEnterImei(searchInput.value);
      }
    });
  }
  if (filterSp) {
    filterSp.addEventListener('change', () => filterImeiDisplay());
  }

  // Clear Cart
  const btnClear = document.getElementById('btnClearCart');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      cart.imeis = [];
      cart.phuKiens = [];
      cart.tienKhachDua = 0;
      const inputTienDua = document.getElementById('inputTienKhachDua');
      if (inputTienDua) inputTienDua.value = '';
      clearPreOrder();
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
    allAvailableImeis = Array.isArray(resImei.data) ? resImei.data : (resImei.data?.imeis || resImei.data?.data || []);
    allAvailableImeis.forEach(m => {
      if (m.sanPham && m.sanPham.dungLuong && !m.sanPham.tenMay.includes(m.sanPham.dungLuong)) {
        m.sanPham.tenMay = m.sanPham.tenMay + ' ' + m.sanPham.dungLuong;
      }
    });
  }
  if (resPk.success) {
    allPhuKiens = Array.isArray(resPk.data) ? resPk.data : (resPk.data?.phuKiens || resPk.data?.data || []);
  }
  if (resKh.success) {
    allKhachHangs = Array.isArray(resKh.data) ? resKh.data : (resKh.data?.khachHangs || resKh.data?.data || []);
    renderKhachHangOptions();
  }
  if (resSp.success) {
    allSanPhams = Array.isArray(resSp.data) ? resSp.data : (resSp.data?.sanPhams || resSp.data?.data || []);
    allSanPhams.forEach(sp => {
      if (sp.dungLuong && !sp.tenMay.includes(sp.dungLuong)) {
        sp.tenMay = sp.tenMay + ' ' + sp.dungLuong;
      }
    });
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

  const availablePks = allPhuKiens.filter(pk => pk.soLuongTon > 0);

  if (availablePks.length === 0) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-3 small">Không có phụ kiện nào còn hàng</div>`;
    return;
  }

  container.innerHTML = availablePks.map(pk => {
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

// ==================== KHUYEN MAI / PROMO CODE ==================== //
async function applyPromoCode() {
  const inputMaKM = document.getElementById('inputMaKM');
  const msgEl = document.getElementById('kmMessage');
  const maKM = inputMaKM.value.trim();
  
  if (!maKM) {
    showToast('Vui lòng nhập mã khuyến mãi', 'warning');
    return;
  }

  // Tính rawGrandTotal
  let totalMay = 0;
  cart.imeis.forEach(m => totalMay += m.giaBan);
  let totalPk = 0;
  cart.phuKiens.forEach(pk => totalPk += (pk.giaBan * pk.soLuong));
  const rawGrandTotal = totalMay + totalPk;

  try {
    const res = await api.post('/khuyen-mai/check', { maKM, tongTien: rawGrandTotal });
    if (res.success && res.data) {
      appliedKhuyenMai = {
        maKM: res.data.khuyenMai.maKM,
        soTienGiam: res.data.soTienGiam
      };
      
      document.getElementById('btnApplyKM').classList.add('d-none');
      document.getElementById('btnRemoveKM').classList.remove('d-none');
      inputMaKM.disabled = true;

      msgEl.classList.remove('d-none', 'text-danger');
      msgEl.classList.add('text-success');
      msgEl.innerHTML = `<i class="bi bi-check-circle"></i> Đã áp dụng mã <strong>${escapeHtml(appliedKhuyenMai.maKM)}</strong> (Giảm ${formatCurrency(appliedKhuyenMai.soTienGiam)})`;
      
      playBeep('success');
      renderCart();
    } else {
      msgEl.classList.remove('d-none', 'text-success');
      msgEl.classList.add('text-danger');
      msgEl.innerHTML = `<i class="bi bi-x-circle"></i> ${escapeHtml(res.message || 'Mã không hợp lệ')}`;
    }
  } catch (error) {
    console.error('Error applying KM:', error);
    showToast('Có lỗi xảy ra khi áp dụng mã', 'danger');
  }
}

function removePromoCode() {
  appliedKhuyenMai = null;
  const inputMaKM = document.getElementById('inputMaKM');
  const msgEl = document.getElementById('kmMessage');
  
  if (inputMaKM) {
    inputMaKM.value = '';
    inputMaKM.disabled = false;
  }
  document.getElementById('btnApplyKM').classList.remove('d-none');
  document.getElementById('btnRemoveKM').classList.add('d-none');
  if (msgEl) {
    msgEl.classList.add('d-none');
    msgEl.innerText = '';
  }
  
  renderCart();
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

  playBeep('success');
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
    playBeep('error');
    showToast(`Phụ kiện "${pk.tenPK}" đã hết hàng trong kho!`, 'danger');
    return;
  }

  const exist = cart.phuKiens.find(p => p._id === pkId);
  if (exist) {
    if (exist.soLuong >= pk.soLuongTon) {
      playBeep('error');
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

  playBeep('success');
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
    
    // Ẩn dòng trừ cọc & giảm giá nếu giỏ trống
    const depRow = document.getElementById('depositDeductionRow');
    if (depRow) depRow.classList.add('d-none');
    const discRow = document.getElementById('discountDeductionRow');
    if (discRow) discRow.classList.add('d-none');

    updateChangeReturnUI();
    renderOrderTabs();
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

  const rawGrandTotal = totalMay + totalPk;
  
  let discount = 0;
  if (appliedKhuyenMai) {
    discount = appliedKhuyenMai.soTienGiam;
    discount = Math.min(discount, rawGrandTotal);
  }

  // Hiển thị giảm giá
  const discountRow = document.getElementById('discountDeductionRow');
  const discountPriceEl = document.getElementById('discountDeductionPrice');
  if (discount > 0) {
    if (discountRow) discountRow.classList.remove('d-none');
    if (discountPriceEl) discountPriceEl.innerText = `-${formatCurrency(discount)}`;
  } else {
    if (discountRow) discountRow.classList.add('d-none');
  }

  // Tính cấn trừ tiền cọc (nếu có đơn đặt trước được liên kết)
  const depositRow = document.getElementById('depositDeductionRow');
  const depositPriceEl = document.getElementById('depositDeductionPrice');
  let tienCocDaTru = 0;
  if (selectedPreOrder && selectedPreOrder.soTienCoc > 0) {
    tienCocDaTru = Math.min(selectedPreOrder.soTienCoc, rawGrandTotal);
    if (depositRow) depositRow.classList.remove('d-none');
    if (depositPriceEl) depositPriceEl.innerText = `-${formatCurrency(tienCocDaTru)}`;
  } else {
    if (depositRow) depositRow.classList.add('d-none');
  }

  const finalPayment = Math.max(0, rawGrandTotal - tienCocDaTru - discount);
  document.getElementById('totalGrandPrice').innerText = formatCurrency(finalPayment);

  updateChangeReturnUI();
  renderOrderTabs();
}

/* =========================================================================
   PHÂN HỆ ĐƠN ĐẶT TRƯỚC (PRE-ORDER) & CẤN TRỪ TIỀN CỌC (TUẦN 3)
========================================================================= */

function initPreOrderModal() {
  const modalEl = document.getElementById('preOrderModal');
  if (modalEl) {
    preOrderModalInstance = new bootstrap.Modal(modalEl);
  }

  const btnOpen = document.getElementById('btnOpenPreOrderModal');
  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      loadPreOrders();
      if (preOrderModalInstance) preOrderModalInstance.show();
    });
  }

  const searchInput = document.getElementById('inputSearchPreOrder');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      loadPreOrders(searchInput.value);
    });
  }

  const btnClear = document.getElementById('btnClearPreOrder');
  if (btnClear) {
    btnClear.addEventListener('click', clearPreOrder);
  }
}

let availablePreOrders = [];

async function loadPreOrders(search = '') {
  const tbody = document.getElementById('preOrderTableBody');
  if (!tbody) return;

  const res = await api.get('/hoa-don/dat-truoc/tim-kiem', { search });
  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger small">${res.message || 'Lỗi tải đơn đặt'}</td></tr>`;
    return;
  }

  availablePreOrders = res.data || [];
  availablePreOrders.forEach(d => {
    if (d.sanPham && d.sanPham.dungLuong && !d.sanPham.tenMay.includes(d.sanPham.dungLuong)) {
      d.sanPham.tenMay = d.sanPham.tenMay + ' ' + d.sanPham.dungLuong;
    }
  });
  if (availablePreOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted small">Không tìm thấy đơn đặt hàng trước nào còn hiệu lực</td></tr>`;
    return;
  }

  tbody.innerHTML = availablePreOrders.map(d => {
    const kh = d.khachHang || {};
    const sp = d.sanPham || {};
    return `
      <tr>
        <td>
          <div class="fw-semibold small">${escapeHtml(kh.hoTen || 'Chưa rõ')}</div>
          <div class="text-muted" style="font-size: 0.7rem;">SĐT: ${escapeHtml(kh.sdt || '')}</div>
        </td>
        <td>
          <div class="fw-semibold small">${escapeHtml(sp.tenMay || 'Điện thoại')}</div>
          <div class="text-muted" style="font-size: 0.7rem;">Hãng: ${escapeHtml(sp.hang || '')}</div>
        </td>
        <td class="small">${formatDate(d.hanLay || d.createdAt)}</td>
        <td class="text-end fw-bold text-success small">${formatCurrency(d.soTienCoc || 0)}</td>
        <td><span class="badge bg-info text-dark" style="font-size: 0.7rem;">${escapeHtml(d.trangThai)}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-primary py-0 px-2" onclick="selectPreOrder('${d._id}')">
            <i class="bi bi-check2"></i> Chọn
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function selectPreOrder(id) {
  const preOrder = availablePreOrders.find(p => p._id === id);
  if (!preOrder) return;

  selectedPreOrder = preOrder;

  // Cập nhật giao diện thông tin đơn cọc
  const displayArea = document.getElementById('preOrderDisplayArea');
  const btnClear = document.getElementById('btnClearPreOrder');
  if (displayArea) {
    const kh = preOrder.khachHang || {};
    const sp = preOrder.sanPham || {};
    displayArea.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong class="text-dark">${escapeHtml(kh.hoTen || 'Khách cọc')}</strong> (${escapeHtml(kh.sdt || '')})<br>
          <span class="text-muted">Cọc SP: ${escapeHtml(sp.tenMay || '')}</span>
        </div>
        <span class="badge bg-success fs-6">${formatCurrency(preOrder.soTienCoc || 0)}</span>
      </div>
    `;
  }
  if (btnClear) btnClear.classList.remove('d-none');

  // Tự động chọn Khách hàng trên form nếu có
  if (preOrder.khachHang && preOrder.khachHang._id) {
    const selectKh = document.getElementById('selectKhachHang');
    if (selectKh) selectKh.value = preOrder.khachHang._id;
  }

  // Tự động lọc các máy IMEI thuộc đúng sản phẩm khách đã cọc
  if (preOrder.sanPham && preOrder.sanPham._id) {
    const filterSp = document.getElementById('filterPosSanPham');
    if (filterSp) {
      filterSp.value = preOrder.sanPham._id;
      filterImeiDisplay();
    }
  }

  if (preOrderModalInstance) preOrderModalInstance.hide();
  renderCart();
  showToast(`Đã áp dụng cấn trừ tiền cọc: ${formatCurrency(preOrder.soTienCoc)}`, 'success');
}

function clearPreOrder() {
  selectedPreOrder = null;
  const displayArea = document.getElementById('preOrderDisplayArea');
  const btnClear = document.getElementById('btnClearPreOrder');
  if (displayArea) {
    displayArea.innerHTML = `<em>Chưa liên kết đơn cọc</em>`;
  }
  if (btnClear) btnClear.classList.add('d-none');

  renderCart();
}

async function handleCreateOrder() {
  if (cart.imeis.length === 0 && cart.phuKiens.length === 0) {
    showToast('Giỏ hàng đang trống!', 'warning');
    return;
  }

  let khachHang = null;
  let guestName = '';
  let guestPhone = '';
  let guestCccd = '';

  const customerType = document.querySelector('input[name="customerType"]:checked')?.value;
  if (customerType === 'member') {
    khachHang = document.getElementById('selectKhachHang')?.value || null;
    if (!khachHang) {
      showToast('Vui lòng chọn Thành viên', 'warning');
      return;
    }
  } else {
    guestName = document.getElementById('inputGuestName')?.value.trim();
    guestPhone = document.getElementById('inputGuestPhone')?.value.trim();
    guestCccd = document.getElementById('inputGuestCccd')?.value.trim();
    if (!guestName || !guestPhone) {
      showToast('Vui lòng nhập Tên và Số điện thoại khách hàng', 'warning');
      return;
    }
  }
  const hinhThucThanhToan = document.getElementById('selectPaymentMethod')?.value || 'Da thanh toan';
  const ghiChu = document.getElementById('inputGhiChu')?.value || '';
  const maKM = appliedKhuyenMai ? appliedKhuyenMai.maKM : null;

  const payload = {
    khachHang,
    guestName,
    guestPhone,
    guestCccd,
    danhSachIMEI: cart.imeis.map(m => m.imei),
    danhSachPhuKien: cart.phuKiens.map(pk => ({
      phuKien: pk._id,
      soLuong: pk.soLuong,
      donGiaBan: pk.giaBan
    })),
    hinhThucThanhToan,
    ghiChu,
    maKM,
    donDatHangId: selectedPreOrder ? selectedPreOrder._id : null
  };

  const btn = document.getElementById('btnSubmitOrder');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Đang xử lý bán hàng...`;

  const res = await api.post('/hoa-don', payload);

  btn.disabled = false;
  btn.innerHTML = `<i class="bi bi-check-circle me-1"></i> HOÀN TẤT BÁN HÀNG & XUẤT KHO [F4]`;

  if (!res.success) {
    playBeep('error');
    showToast(res.message || 'Lỗi khi tạo hóa đơn', 'danger');
    return;
  }

  playBeep('success');
  showToast(res.message || 'Bán hàng thành công!', 'success');

  // Reset giỏ, giảm giá, đơn cọc và tiền khách đưa
  cart.imeis = [];
  cart.phuKiens = [];
  cart.tienKhachDua = 0;
  const inputTienDua = document.getElementById('inputTienKhachDua');
  if (inputTienDua) inputTienDua.value = '';
  appliedKhuyenMai = null;
  const inputMaKM = document.getElementById('inputMaKM');
  if (inputMaKM) inputMaKM.value = '';
  const msgEl = document.getElementById('kmMessage');
  if (msgEl) {
    msgEl.innerHTML = '';
    msgEl.classList.add('d-none');
  }
  
  const btnApplyKM = document.getElementById('btnApplyKM');
  if (btnApplyKM) btnApplyKM.classList.remove('d-none');
  const btnRemoveKM = document.getElementById('btnRemoveKM');
  if (btnRemoveKM) btnRemoveKM.classList.add('d-none');
  if (inputMaKM) inputMaKM.disabled = false;

  clearPreOrder();
  renderCart();

  // Reload data
  await loadPosData();
  await loadInvoiceList();
  await loadReportsData();

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

let allInvoicesData = [];
let invoiceCurrentPage = 1;
let invoicePageSize = 10;

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

  allInvoicesData = res.hoaDons || res.data || [];
  invoiceCurrentPage = 1;
  renderInvoiceTablePage();
}

function renderInvoiceTablePage() {
  const tbody = document.getElementById('tableInvoiceBody');
  const paginationContainer = document.getElementById('invoicePaginationContainer');
  if (!tbody) return;

  if (!allInvoicesData || allInvoicesData.length === 0) {
    tbody.innerHTML = DataTableHelper.renderEmptyState(7, {
      icon: 'bi-receipt',
      title: 'Không tìm thấy hóa đơn nào',
      message: 'Không có hóa đơn nào khớp với khoảng thời gian hoặc điều kiện lọc đã chọn.',
      resetText: 'Đặt lại bộ lọc tìm kiếm',
      onReset: () => {
        document.getElementById('filterInvSearch').value = '';
        document.getElementById('filterInvTuNgay').value = '';
        document.getElementById('filterInvDenNgay').value = '';
        document.getElementById('filterInvTrangThai').value = '';
        loadInvoiceList();
      }
    });
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  const totalItems = allInvoicesData.length;
  const totalPages = Math.ceil(totalItems / invoicePageSize) || 1;
  if (invoiceCurrentPage > totalPages) invoiceCurrentPage = totalPages;

  const startIdx = (invoiceCurrentPage - 1) * invoicePageSize;
  const pageItems = allInvoicesData.slice(startIdx, startIdx + invoicePageSize);

  tbody.innerHTML = pageItems.map(hd => {
    const khName = hd.khachHang ? hd.khachHang.hoTen : 'Khách vãng lai';
    const nvName = hd.nhanVien ? hd.nhanVien.hoTen : 'Hệ thống';
    const tienThucThu = hd.soTienThanhToan !== undefined ? hd.soTienThanhToan : (hd.tongTien - (hd.tienCocDaTru || 0) - (hd.soTienGiam || 0));
    return `
      <tr>
        <td class="fw-bold font-monospace text-primary">${hd.soHD}</td>
        <td>${escapeHtml(khName)}</td>
        <td>${escapeHtml(nvName)}</td>
        <td>${formatDate(hd.ngayLap)}</td>
        <td class="text-end fw-bold text-success">
          ${formatCurrency(tienThucThu)}
          ${(hd.tienCocDaTru > 0 || hd.soTienGiam > 0) ? `
            <div class="text-muted" style="font-size: 0.7rem;">
              (Gốc: ${formatCurrency(hd.tongTien)}${hd.soTienGiam > 0 ? ` - Giảm: ${formatCurrency(hd.soTienGiam)}` : ''}${hd.tienCocDaTru > 0 ? ` - Cọc: ${formatCurrency(hd.tienCocDaTru)}` : ''})
            </div>` : ''}
        </td>
        <td><span class="badge bg-success-subtle text-success border border-success-subtle">${escapeHtml(hd.trangThai)}</span></td>
        <td class="text-end pe-3">
          <button class="btn btn-sm btn-outline-primary" onclick="viewInvoiceDetail('${hd._id}')">
            <i class="bi bi-eye me-1"></i> Chi tiết / In
          </button>
        </td>
      </tr>
    `;
  }).join('');

  DataTableHelper.renderPagination('invoicePaginationContainer', {
    totalItems,
    currentPage: invoiceCurrentPage,
    pageSize: invoicePageSize,
    onPageChange: (newPage) => {
      invoiceCurrentPage = newPage;
      renderInvoiceTablePage();
    },
    onPageSizeChange: (newSize) => {
      invoicePageSize = newSize;
      invoiceCurrentPage = 1;
      renderInvoiceTablePage();
    }
  });
}

function exportInvoiceListExcel() {
  if (!allInvoicesData || allInvoicesData.length === 0) {
    showToast('Không có hóa đơn nào để xuất Excel', 'warning');
    return;
  }

  const columns = [
    { title: 'Số Hóa Đơn', key: 'soHD' },
    { title: 'Khách Hàng', render: (hd) => hd.khachHang ? hd.khachHang.hoTen : 'Khách vãng lai' },
    { title: 'Nhân Viên Lập', render: (hd) => hd.nhanVien ? hd.nhanVien.hoTen : 'Hệ thống' },
    { title: 'Ngày Lập', render: (hd) => formatDate(hd.ngayLap) },
    { title: 'Tổng Tiền Gốc (VNĐ)', key: 'tongTien' },
    { title: 'Đã Trừ Cọc (VNĐ)', render: (hd) => hd.tienCocDaTru || 0 },
    { title: 'Giảm Giá (VNĐ)', render: (hd) => hd.soTienGiam || 0 },
    { title: 'Thực Thu (VNĐ)', render: (hd) => hd.soTienThanhToan !== undefined ? hd.soTienThanhToan : (hd.tongTien - (hd.tienCocDaTru || 0) - (hd.soTienGiam || 0)) },
    { title: 'Trạng Thái', key: 'trangThai' }
  ];

  const nowStr = new Date().toISOString().slice(0, 10);
  DataTableHelper.exportToExcel(columns, allInvoicesData, `DanhSach_HoaDon_${nowStr}.csv`);
}
window.exportInvoiceListExcel = exportInvoiceListExcel;

async function viewInvoiceDetail(id) {
  const res = await api.get(`/hoa-don/${id}`);
  if (!res.success) {
    showToast(res.message || 'Không thể tải chi tiết hóa đơn', 'danger');
    return;
  }

  const { hoaDon, danhSachMay, danhSachPhuKien, phieuXuatKho } = res;
  if (danhSachMay) {
    danhSachMay.forEach(m => {
      if (m.sanPham && m.sanPham.dungLuong && !m.sanPham.tenMay.includes(m.sanPham.dungLuong)) {
        m.sanPham.tenMay = m.sanPham.tenMay + ' ' + m.sanPham.dungLuong;
      }
    });
  }
  const content = document.getElementById('invoiceDetailContent');
  if (!content) return;

  const kh = hoaDon.khachHang || {};
  const nv = hoaDon.nhanVien || {};
  const tienCocDaTru = hoaDon.tienCocDaTru || 0;
  const soTienGiam = hoaDon.soTienGiam || 0;
  const soTienThanhToan = hoaDon.soTienThanhToan !== undefined ? hoaDon.soTienThanhToan : (hoaDon.tongTien - tienCocDaTru - soTienGiam);

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
          ${hoaDon.donDatHang ? `<strong>Đơn đặt trước:</strong> <span class="badge bg-info text-dark">Đã cấn trừ cọc</span><br>` : ''}
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
      <div class="d-flex justify-content-between mb-1">
        <span class="text-muted">Tổng giá trị đơn hàng:</span>
        <span class="fw-semibold">${formatCurrency(hoaDon.tongTien)}</span>
      </div>
      ${soTienGiam > 0 ? `
        <div class="d-flex justify-content-between mb-1 text-warning">
          <span>Chiết khấu / Giảm giá:</span>
          <span class="fw-bold">-${formatCurrency(soTienGiam)}</span>
        </div>
      ` : ''}
      ${tienCocDaTru > 0 ? `
        <div class="d-flex justify-content-between mb-1 text-success">
          <span>Tiền cọc đã trừ (Đơn đặt trước):</span>
          <span class="fw-bold">-${formatCurrency(tienCocDaTru)}</span>
        </div>
      ` : ''}
      <hr class="my-2">
      <div class="fs-5 fw-bold text-danger">TỔNG TIỀN THỰC THU: ${formatCurrency(soTienThanhToan)}</div>
    </div>
  `;

  currentViewingInvoice = res;
  const modal = new bootstrap.Modal(document.getElementById('invoiceDetailModal'));
  modal.show();
}

let currentViewingInvoice = null;

/**
 * In Hóa đơn bán lẻ & Phiếu xuất kho chuẩn Thông tư 200/2014/TT-BTC & NĐ 123/2020/NĐ-CP
 */
function printInvoiceReceipt(invoiceData = null) {
  const data = invoiceData || currentViewingInvoice;
  if (!data || !data.hoaDon) {
    showToast('Chưa có dữ liệu hóa đơn để in!', 'warning');
    return;
  }

  const { hoaDon, danhSachMay = [], danhSachPhuKien = [] } = data;
  const kh = hoaDon.khachHang || {};
  const nv = hoaDon.nhanVien || {};
  const tienCocDaTru = hoaDon.tienCocDaTru || 0;
  const soTienGiam = hoaDon.soTienGiam || 0;
  const soTienThanhToan = hoaDon.soTienThanhToan !== undefined ? hoaDon.soTienThanhToan : (hoaDon.tongTien - tienCocDaTru - soTienGiam);

  if (typeof inHoaDonBanHangChuan === 'function') {
    inHoaDonBanHangChuan({
      soHD: hoaDon.soHD || hoaDon._id,
      ngayLap: hoaDon.ngayLap || hoaDon.createdAt,
      khachHang: kh,
      nhanVien: nv,
      danhSachMay: danhSachMay,
      danhSachPK: danhSachPhuKien,
      tienCocDaTru,
      soTienGiam,
      soTienThanhToan,
      tongTien: hoaDon.tongTien,
      hinhThucThanhToan: hoaDon.trangThai || 'Tiền mặt'
    });
  } else {
    window.print();
  }
}

/* =========================================================================
   TAB 3: BÁO CÁO DOANH SỐ & KPI NHÂN VIÊN (TUẦN 5-6 - NGUYỄN QUANG TUẤN)
========================================================================= */

async function initReportsTab() {
  const btnReload = document.getElementById('btnReloadStaffKpi');
  if (btnReload) {
    btnReload.addEventListener('click', loadReportsData);
  }

  // Load khi mở tab
  const reportsTabBtn = document.getElementById('tab-reports-tab');
  if (reportsTabBtn) {
    reportsTabBtn.addEventListener('shown.bs.tab', loadReportsData);
  }
}

async function loadReportsData() {
  await Promise.all([
    loadStaffKpi(),
    loadTopProducts()
  ]);
}

async function loadStaffKpi() {
  const tbody = document.getElementById('staffKpiTableBody');
  if (!tbody) return;

  const res = await api.get('/hoa-don/bao-cao/doanh-so-nhan-vien');
  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger small">${res.message || 'Lỗi tải KPI'}</td></tr>`;
    return;
  }

  const list = res.data || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted small">Chưa có dữ liệu bán hàng</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => `
    <tr>
      <td>
        <div class="fw-semibold small">${escapeHtml(item.hoTen)}</div>
        <div class="text-muted" style="font-size: 0.7rem;">@${escapeHtml(item.tenDangNhap)}</div>
      </td>
      <td><span class="badge bg-secondary-subtle text-secondary border" style="font-size: 0.7rem;">${escapeHtml(item.vaiTro)}</span></td>
      <td class="text-center fw-bold">${item.soHoaDon}</td>
      <td class="text-end fw-bold text-success">${formatCurrency(item.tongDoanhThu)}</td>
      <td class="text-end small text-muted">${formatCurrency(item.giaTriTrungBinh)}</td>
    </tr>
  `).join('');
}

async function loadTopProducts() {
  const tbody = document.getElementById('topProductsTableBody');
  if (!tbody) return;

  const res = await api.get('/hoa-don/bao-cao/top-san-pham');
  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger small">${res.message || 'Lỗi tải top SP'}</td></tr>`;
    return;
  }

  const list = res.data || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted small">Chưa có dữ liệu</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((item, idx) => `
    <tr>
      <td class="fw-bold text-muted">${idx + 1}</td>
      <td>
        <div class="fw-semibold small">${escapeHtml(item.tenMay)}</div>
        <span class="badge bg-light text-dark border" style="font-size: 0.65rem;">${escapeHtml(item.hang || '')}</span>
      </td>
      <td class="text-center fw-bold text-primary">${item.soLuongBan}</td>
      <td class="text-end fw-semibold small text-success">${formatCurrency(item.doanhThu)}</td>
    </tr>
  `).join('');
}

window.addImeiToCart = addImeiToCart;
window.removeImeiFromCart = removeImeiFromCart;
window.addPhuKienToCart = addPhuKienToCart;
window.changePhuKienQty = changePhuKienQty;
window.viewInvoiceDetail = viewInvoiceDetail;
window.printInvoiceReceipt = printInvoiceReceipt;
window.selectPreOrder = selectPreOrder;
window.loadReportsData = loadReportsData;
window.shortcutAction = shortcutAction;


// Lắng nghe sự kiện thêm khách hàng nhanh
document.addEventListener('DOMContentLoaded', () => {
  const btnSubmitQuickCustomer = document.getElementById('btnSubmitQuickCustomer');
  if (btnSubmitQuickCustomer) {
    btnSubmitQuickCustomer.addEventListener('click', async () => {
      const hoTen = document.getElementById('quickKhHoTen')?.value.trim();
      const sdt = document.getElementById('quickKhSdt')?.value.trim();
      const email = document.getElementById('quickKhEmail')?.value.trim();
      const diaChi = document.getElementById('quickKhDiaChi')?.value.trim();

      if (!hoTen) {
        showToast('Vui lòng nhập họ tên khách hàng', 'warning');
        return;
      }
      if (!sdt || !/^[0-9]{10}$/.test(sdt)) {
        showToast('Số điện thoại không hợp lệ (yêu cầu 10 chữ số)', 'warning');
        return;
      }

      const body = { hoTen, sdt, email, diaChi };
      const res = await api.post('/khach-hang', body);
      
      if (res.success && res.data) {
        showToast('Thêm khách hàng thành công', 'success');
        
        // Cập nhật lại dropdown và chọn khách hàng vừa tạo
        await loadCustomers(res.data._id);
        
        // Ẩn modal và reset form
        const modalEl = document.getElementById('quickCreateCustomerModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        document.getElementById('quickCreateCustomerForm')?.reset();
      } else {
        showToast(res.message || 'Lỗi khi thêm khách hàng', 'danger');
      }
    });
  }
});
