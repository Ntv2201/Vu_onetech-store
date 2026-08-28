---
name: onetech-frontend-ui
description: Hướng dẫn xây dựng giao diện người dùng (HTML5, Bootstrap 5, FontAwesome, JavaScript API helper, layout injection, phân quyền ẩn/hiện nút bấm và Debounce search) cho OneTech Store.
---

# ONETECH STORE - FRONTEND UI/UX DESIGN & CODE GUIDE

Tài liệu này định nghĩa các tiêu chuẩn xây dựng trang giao diện người dùng chuyên nghiệp, chuẩn mực và bảo mật trên toàn bộ hệ thống OneTech Store.

---

## 1. Cấu Trúc File Giao Diện

- Trang HTML đặt tại: `src/public/pages/[ten-module]/index.html`
- File JavaScript xử lý đặt tại: `src/public/js/[ten-module].js`
- CSS tùy chỉnh đặt tại: `src/public/css/style.css`

---

## 2. Mẫu Khung HTML Chuẩn (`index.html`)

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quản Lý Sản Phẩm - OneTech Store</title>
  <!-- Bootstrap 5 & FontAwesome -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body class="bg-light">

  <div class="d-flex" id="wrapper">
    <!-- Sidebar Container -->
    <div id="appSidebar"></div>

    <!-- Page Content -->
    <div id="page-content-wrapper" class="w-100">
      <!-- Navbar Container -->
      <div id="appNavbar"></div>

      <div class="container-fluid p-4">
        <!-- Header & Action Buttons -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0 fw-bold text-primary"><i class="fa-solid fa-boxes-stacked me-2"></i>Quản Lý Sản Phẩm</h4>
          <button id="btnThemSP" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalThemSP">
            <i class="fa-solid fa-plus me-1"></i> Thêm Sản Phẩm Mới
          </button>
        </div>

        <!-- Filter & Search Bar -->
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <input type="text" id="searchInput" class="form-control" placeholder="Tìm theo tên máy, mã sản phẩm...">
              </div>
              <div class="col-md-3">
                <select id="filterHang" class="form-select">
                  <option value="">Tất cả hãng sản xuất</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Table Data -->
        <div class="card shadow-sm border-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Mã SP</th>
                  <th>Tên Sản Phẩm</th>
                  <th>Hãng</th>
                  <th>Giá Bán</th>
                  <th>Trạng Thái</th>
                  <th class="text-end">Thao Tác</th>
                </tr>
              </thead>
              <tbody id="tableBody">
                <!-- Render qua JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/layout.js"></script>
  <script src="/js/sanpham.js"></script>
</body>
</html>
```

---

## 3. Mẫu JavaScript Chuẩn (`[ten-module].js`)

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inject Sidebar, Navbar & kiểm tra đăng nhập
  await injectCommonLayout();

  // 2. Lấy thông tin user hiện tại và phân quyền UI
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  applyRolePermissions(currentUser);

  // 3. Khởi tạo danh sách & sự kiện
  loadData();

  // 4. Tìm kiếm với Debounce (300ms)
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadData(), 300);
    });
  }
});

function applyRolePermissions(user) {
  // Ẩn nút Thêm sản phẩm nếu không phải Quản lý hoặc Thủ kho
  const btnThem = document.getElementById('btnThemSP');
  if (btnThem) {
    const hasPermission = ['Quản lý', 'Thủ kho'].includes(user.vaiTro);
    btnThem.style.display = hasPermission ? 'inline-block' : 'none';
  }
}

async function loadData() {
  const search = document.getElementById('searchInput')?.value || '';
  const hang = document.getElementById('filterHang')?.value || '';

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Đang tải dữ liệu...</td></tr>';

  try {
    const res = await api.get('/san-pham', { search, hang });
    if (res.success && res.data.items.length > 0) {
      renderTable(res.data.items);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Không tìm thấy sản phẩm nào phù hợp.</td></tr>';
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${error.message || 'Lỗi tải dữ liệu'}</td></tr>`;
  }
}

function renderTable(items) {
  const tbody = document.getElementById('tableBody');
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  const isManager = currentUser.vaiTro === 'Quản lý';

  tbody.innerHTML = items.map(sp => `
    <tr>
      <td class="fw-bold">${sp.maSP}</td>
      <td>${sp.tenMay}</td>
      <td><span class="badge bg-secondary">${sp.hang}</span></td>
      <td class="text-primary fw-bold">${(sp.giaBan || 0).toLocaleString('vi-VN')} đ</td>
      <td><span class="badge ${sp.trangThai === 'Kinh doanh' ? 'bg-success' : 'bg-danger'}">${sp.trangThai}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-info me-1" onclick="viewDetail('${sp._id}')"><i class="fa-solid fa-eye"></i></button>
        ${isManager ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${sp._id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}
```
