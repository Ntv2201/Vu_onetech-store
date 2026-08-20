/**
 * Module xử lý dữ liệu cho Dashboard
 */

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

  // 1. Cập nhật thẻ thống kê
  document.getElementById('statTotalMayImei').textContent = stats.totalMayImei || 0;
  document.getElementById('statTotalSanPham').textContent = stats.totalSanPham || 0;
  document.getElementById('statImeiConHang').textContent = stats.imeiConHang || 0;
  document.getElementById('statImeiDaBan').textContent = stats.imeiDaBan || 0;
  document.getElementById('statImeiBaoHanh').textContent = stats.imeiBaoHanh || 0;
  document.getElementById('statTotalKhachHang').textContent = stats.totalKhachHang || 0;
  document.getElementById('statTotalNhaCungCap').textContent = stats.totalNhaCungCap || 0;
  document.getElementById('statTotalNhanVien').textContent = stats.totalNhanVien || 0;

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
