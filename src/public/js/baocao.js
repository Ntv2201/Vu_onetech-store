let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
  // Điền danh sách năm
  const today = new Date();
  const currentYear = today.getFullYear();
  const namSelect = document.getElementById('filterNam');
  if (namSelect) {
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      namSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }
  }

  // Mặc định lọc tháng hiện tại
  const month = String(today.getMonth() + 1);
  const year = String(currentYear);
  
  if (document.getElementById('filterThang')) document.getElementById('filterThang').value = month;
  if (document.getElementById('filterNam')) document.getElementById('filterNam').value = year;
  
  loadAllReports();
});

function getFilterParams() {
  const thang = document.getElementById('filterThang')?.value;
  const nam = document.getElementById('filterNam')?.value;
  
  if (!thang || !nam) return {};
  
  const paddedMonth = thang.padStart(2, '0');
  const tuNgay = `${nam}-${paddedMonth}-01`;
  
  const denNgayDate = new Date(nam, thang, 0);
  const denNgay = `${nam}-${paddedMonth}-${String(denNgayDate.getDate()).padStart(2, '0')}`;
  
  return { tuNgay, denNgay };
}

async function loadAllReports() {
  await Promise.all([
    loadTongHopTaiChinh(),
    loadDoanhThuChart(),
    loadTopSanPham(),
    loadTonLauNgay(),
    loadSapHetHang()
  ]);
}

async function loadTongHopTaiChinh() {
  const params = getFilterParams();
  const res = await api.get('/bao-cao/doanh-thu', params);
  
  if (res.success && res.data && res.data.tongQuan) {
    const { tongDoanhThu, tongChiPhi, loiNhuanGop, tongSoHoaDon } = res.data.tongQuan;
    document.getElementById('tongDoanhThu').textContent = (tongDoanhThu || 0).toLocaleString('vi-VN') + ' đ';
    document.getElementById('tongChiPhi').textContent = (tongChiPhi || 0).toLocaleString('vi-VN') + ' đ';
    document.getElementById('loiNhuanGop').textContent = (loiNhuanGop || 0).toLocaleString('vi-VN') + ' đ';
    document.getElementById('tongDonHang').textContent = tongSoHoaDon || 0;
  }
}

async function loadDoanhThuChart() {
  const params = getFilterParams();
  params.nhom = document.getElementById('nhomDoanhThu').value;
  
  const res = await api.get('/bao-cao/doanh-thu', params);
  if (!res.success || !res.data || !res.data.bieuDo) return;
  
  const bieuDo = res.data.bieuDo;
  
  const ctx = document.getElementById('doanhThuChart').getContext('2d');
  
  if (myChart) {
    myChart.destroy();
  }
  
  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: bieuDo.labels,
      datasets: [
        {
          label: 'Doanh Thu',
          data: bieuDo.doanhThu,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Lợi Nhuận',
          data: bieuDo.loiNhuan,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              if (value >= 1000000) return (value / 1000000) + 'M';
              if (value >= 1000) return (value / 1000) + 'K';
              return value;
            }
          }
        }
      }
    }
  });
}

async function loadTopSanPham() {
  const params = getFilterParams();
  params.limit = 5;
  const res = await api.get('/bao-cao/top-san-pham', params);
  
  const listEl = document.getElementById('topSanPhamList');
  if (!res.success || !res.data || !res.data.topTheoDoanhThu || res.data.topTheoDoanhThu.length === 0) {
    listEl.innerHTML = '<li class="list-group-item text-center py-4 text-muted">Không có dữ liệu</li>';
    return;
  }
  
  let html = '';
  res.data.topTheoDoanhThu.forEach((item, index) => {
    const badgeColor = index === 0 ? 'bg-danger' : (index === 1 ? 'bg-warning' : (index === 2 ? 'bg-info' : 'bg-secondary'));
    html += `
      <li class="list-group-item d-flex justify-content-between align-items-center p-3">
        <div class="d-flex align-items-center gap-3">
          <span class="badge ${badgeColor} rounded-circle p-2" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;">${index + 1}</span>
          <div>
            <h6 class="mb-0 fw-semibold text-truncate" style="max-width: 200px;">${item.tenMay || item.tenSanPham}</h6>
            <small class="text-muted">Đã bán: ${item.soLuongBan} máy</small>
          </div>
        </div>
        <div class="fw-bold text-success">${item.doanhThu.toLocaleString('vi-VN')} đ</div>
      </li>
    `;
  });
  
  listEl.innerHTML = html;
}

async function loadTonLauNgay() {
  const res = await api.get('/bao-cao/ton-lau-ngay');
  const tbody = document.getElementById('tonLauNgayBody');
  const badge = document.getElementById('badgeTonLau');
  
  if (!res.success || !res.data || !res.data.danhSach) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Không tải được dữ liệu</td></tr>';
    badge.textContent = '0 máy';
    return;
  }
  
  badge.textContent = `${res.data.danhSach.length} máy`;
  
  if (res.data.danhSach.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-success"><i class="bi bi-check-circle fs-4 d-block mb-1"></i> Kho không có máy tồn kho quá hạn</td></tr>';
    return;
  }
  
  let html = '';
  res.data.danhSach.forEach(item => {
    html += `
      <tr>
        <td class="fw-bold">${item.imei}</td>
        <td>${item.tenMay}</td>
        <td>${item.hang || 'N/A'}</td>
        <td>${new Date(item.ngayNhap).toLocaleDateString('vi-VN')}</td>
        <td><span class="badge bg-danger rounded-pill px-2 py-1">${item.soNgayTon} ngày</span></td>
        <td class="text-end">${item.giaNhap.toLocaleString('vi-VN')} đ</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

async function loadSapHetHang() {
  const tbody = document.getElementById('sapHetHangBody');
  const badge = document.getElementById('badgeSapHetHang');
  if (!tbody) return;

  const res = await api.get('/bao-cao/sap-het-hang');
  if (!res.success || !res.data || !res.data.danhSach) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">Không tải được dữ liệu</td></tr>';
    if (badge) badge.textContent = '0 máy';
    return;
  }
  
  if (badge) badge.textContent = `${res.data.danhSach.length} máy`;
  
  if (res.data.danhSach.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-success"><i class="bi bi-check-circle fs-4 d-block mb-1"></i> Kho đang đầy đủ, không có sản phẩm sắp hết hàng</td></tr>';
    return;
  }
  
  let html = '';
  res.data.danhSach.forEach(item => {
    const badgeColor = item.trangThai === 'Hết hàng' ? 'bg-danger' : 'bg-warning text-dark';
    html += `
      <tr>
        <td class="fw-bold">${item.tenMay}</td>
        <td>${item.hang}</td>
        <td class="text-end">${item.giaBan.toLocaleString('vi-VN')} đ</td>
        <td>${item.tenKho}</td>
        <td class="text-center"><span class="badge rounded-pill ${item.soLuongTon <= 0 ? 'bg-danger' : 'bg-secondary'}">${item.soLuongTon}</span></td>
        <td><span class="badge ${badgeColor}">${item.trangThai}</span></td>
        <td class="text-end">
          <a href="/pages/nhap-kho/index.html?sanPhamId=${item.sanPhamId}" class="btn btn-sm btn-primary">
            <i class="bi bi-box-arrow-in-down me-1"></i>Nhập thêm
          </a>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

