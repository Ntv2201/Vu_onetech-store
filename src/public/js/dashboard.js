/**
 * Module xử lý dữ liệu cho Dashboard
 */

/**
 * Hiệu ứng đếm số từ 0 lên target
 * @param {string} elementId - ID phần tử cần cập nhật
 * @param {number} target - Số đích cần đếm tới
 * @param {number} duration - Thời gian animation (ms)
 */
function animateCount(elementId, target, duration = 800) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Easing: easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
});

/**
 * Render nút thao tác nhanh trên Dashboard theo vai trò người dùng
 */
function renderDashboardActions(user) {
  const container = document.getElementById('dashboardQuickActions');
  if (!container || !user) return;

  const role = user.vaiTro;
  let buttonsHtml = '';

  if (role === 'Quản lý') {
    buttonsHtml = `
      <a href="/ban-hang/index.html" class="btn btn-primary btn-sm">
        <i class="bi bi-cart-check me-1"></i> Bán hàng POS
      </a>
      <a href="/may-imei/form.html" class="btn btn-outline-primary btn-sm">
        <i class="bi bi-plus-circle me-1"></i> Nhập máy / IMEI
      </a>
      <a href="/bao-hanh/index.html" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-shield-check me-1"></i> Bảo hành
      </a>
    `;
  } else if (role === 'NV bán hàng') {
    buttonsHtml = `
      <a href="/ban-hang/index.html" class="btn btn-primary btn-sm">
        <i class="bi bi-cart-check me-1"></i> Bán hàng POS & Hóa đơn
      </a>
      <a href="/bao-hanh/index.html" class="btn btn-outline-primary btn-sm">
        <i class="bi bi-shield-check me-1"></i> Tra cứu & Tiếp nhận BH
      </a>
      <a href="/khach-hang/form.html" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-person-plus me-1"></i> Thêm Khách hàng
      </a>
    `;
  } else if (role === 'Thủ kho') {
    buttonsHtml = `
      <a href="/may-imei/form.html" class="btn btn-primary btn-sm">
        <i class="bi bi-plus-circle me-1"></i> Nhập máy / IMEI mới
      </a>
      <a href="/san-pham/form.html" class="btn btn-outline-primary btn-sm">
        <i class="bi bi-phone me-1"></i> Thêm Model SP
      </a>
      <a href="/phu-kien/index.html" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-headphones me-1"></i> Quản lý Phụ kiện
      </a>
    `;
  } else if (role === 'Thu ngân') {
    buttonsHtml = `
      <a href="/ban-hang/index.html" class="btn btn-primary btn-sm">
        <i class="bi bi-cart-check me-1"></i> Bán hàng POS & Hóa đơn
      </a>
      <a href="/khach-hang/form.html" class="btn btn-outline-primary btn-sm">
        <i class="bi bi-person-plus me-1"></i> Thêm Khách hàng
      </a>
    `;
  } else if (role === 'Kế toán') {
    buttonsHtml = `
      <a href="/ban-hang/index.html" class="btn btn-primary btn-sm">
        <i class="bi bi-receipt me-1"></i> Tra cứu Hóa đơn
      </a>
      <a href="/nha-cung-cap/index.html" class="btn btn-outline-primary btn-sm">
        <i class="bi bi-truck me-1"></i> Nhà cung cấp
      </a>
      <a href="/phu-kien/index.html" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-headphones me-1"></i> Phụ kiện
      </a>
    `;
  } else if (role === 'Kỹ thuật') {
    buttonsHtml = `
      <a href="/bao-hanh/index.html" class="btn btn-primary btn-sm">
        <i class="bi bi-shield-check me-1"></i> Tra cứu & Tiếp nhận BH
      </a>
      <a href="/may-imei/index.html" class="btn btn-outline-primary btn-sm">
        <i class="bi bi-upc-scan me-1"></i> Tra cứu Máy IMEI
      </a>
    `;
  }

  container.innerHTML = buttonsHtml;

  // Ẩn/hiện liên kết các thẻ phụ theo quyền
  const linkNhanVien = document.getElementById('linkNhanVien');
  if (linkNhanVien && role !== 'Quản lý') {
    linkNhanVien.style.display = 'none';
  }

  const linkNhaCungCap = document.getElementById('linkNhaCungCap');
  if (linkNhaCungCap && !['Quản lý', 'Thủ kho', 'Kế toán'].includes(role)) {
    linkNhaCungCap.style.display = 'none';
  }

  const linkKhachHang = document.getElementById('linkKhachHang');
  if (linkKhachHang && !['Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán'].includes(role)) {
    linkKhachHang.style.display = 'none';
  }
}

async function loadDashboardData() {
  const res = await api.get('/dashboard');
  if (!res.success) {
    showToast(res.message || 'Lỗi tải dữ liệu dashboard', 'danger');
    return;
  }

  const { stats, recentMayImei, recentSanPham } = res;

  // 1. Cập nhật thẻ thống kê với hiệu ứng đếm số
  animateCount('statTotalMayImei', stats.totalMayImei || 0);
  animateCount('statTotalSanPham', stats.totalSanPham || 0, 600);
  animateCount('statImeiConHang', stats.imeiConHang || 0, 900);
  animateCount('statImeiDaBan', stats.imeiDaBan || 0, 700);
  animateCount('statImeiBaoHanh', stats.imeiBaoHanh || 0, 750);
  animateCount('statTotalKhachHang', stats.totalKhachHang || 0, 650);
  animateCount('statTotalNhaCungCap', stats.totalNhaCungCap || 0, 600);
  animateCount('statTotalNhanVien', stats.totalNhanVien || 0, 600);

  // 2. Render nút thao tác nhanh theo vai trò
  if (currentUser) {
    renderDashboardActions(currentUser);
  } else {
    // Đợi layout nạp user nếu cần
    setTimeout(() => {
      if (currentUser) renderDashboardActions(currentUser);
    }, 150);
  }

  // 3. Render bảng IMEI mới nhất
  const tableRecentImei = document.getElementById('tableRecentImei');
  if (recentMayImei && recentMayImei.length > 0) {
    tableRecentImei.innerHTML = recentMayImei.map(item => {
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
            <span class="font-monospace fw-bold text-dark">${escapeHtml(item.imei)}</span>
            ${(item.mauSac || item.dungLuong) ? `<div class="small text-muted">${escapeHtml(item.mauSac || '')} ${escapeHtml(item.dungLuong || '')}</div>` : ''}
          </td>
          <td>${item.sanPham ? escapeHtml(item.sanPham.tenMay) : 'N/A'}</td>
          <td>${formatCurrency(item.giaNhap)}</td>
          <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        </tr>
      `;
    }).join('');
  } else {
    tableRecentImei.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Chưa có bản ghi IMEI nào</td></tr>';
  }

  // 4. Render bảng Sản phẩm mới nhất
  const tableRecentSanPham = document.getElementById('tableRecentSanPham');
  if (recentSanPham && recentSanPham.length > 0) {
    tableRecentSanPham.innerHTML = recentSanPham.map(sp => `
      <tr>
        <td>
          <div class="fw-semibold">${escapeHtml(sp.tenMay)}</div>
          <div class="small text-muted">BH ${sp.soThangBH || 12} tháng</div>
        </td>
        <td><span class="badge bg-light text-dark border">${escapeHtml(sp.hang || 'Khác')}</span></td>
        <td class="text-primary fw-bold">${formatCurrency(sp.giaBan)}</td>
      </tr>
    `).join('');
  } else {
    tableRecentSanPham.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">Chưa có sản phẩm nào</td></tr>';
  }
}
