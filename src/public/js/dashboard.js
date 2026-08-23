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


  // 2. Render bảng IMEI mới nhất
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

  // 3. Render bảng Sản phẩm mới nhất
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
