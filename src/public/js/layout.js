/**
 * Module dựng Layout chung (Sidebar, Header, Phân quyền Menu, Kiểm tra Đăng nhập)
 */

let currentUser = null;

async function initLayout() {
  // Không chạy kiểm tra session trên trang đăng nhập
  const path = window.location.pathname;
  if (path.includes('login.html') || path === '/login') {
    return;
  }

  // 1. Kiểm tra phiên đăng nhập
  const res = await api.get('/auth/me');
  const user = res.user || (res.data && res.data.user) || (res.data && res.data.hoTen ? res.data : null);

  if (!res.success || !user) {
    sessionStorage.setItem('returnTo', window.location.pathname + window.location.search);
    window.location.href = '/login.html';
    return;
  }

  currentUser = user;

  // 2. Chèn Sidebar & Navbar vào trang
  renderSidebarAndNavbar(currentUser);

  // 3. Highlight menu hiện tại
  highlightCurrentMenu();
}

function renderSidebarAndNavbar(user) {
  const currentPath = window.location.pathname;

  // Render Sidebar
  const sidebarContainer = document.getElementById('appSidebar');
  if (sidebarContainer) {
    const isManager = user.vaiTro === 'Quản lý';
    const isSeller = ['Quản lý', 'NV bán hàng', 'Thu ngân'].includes(user.vaiTro);

    sidebarContainer.innerHTML = `
      <aside class="app-sidebar">
        <a href="/index.html" class="sidebar-brand">
          <i class="bi bi-phone-vibrate"></i>
          <span>ONE TECH STORE</span>
        </a>

        <div class="sidebar-nav">
          <div class="nav-category">Tổng quan</div>
          <a href="/index.html" class="sidebar-link" data-path="/index.html">
            <i class="bi bi-grid-1x2"></i>
            <span>Dashboard</span>
          </a>

          ${isSeller ? `
            <div class="nav-category">Bán hàng & Hóa đơn</div>
            <a href="/ban-hang/index.html" class="sidebar-link" data-path="/ban-hang/">
              <i class="bi bi-cart-check"></i>
              <span>Bán hàng POS & Hóa đơn</span>
            </a>
          ` : ''}

          <div class="nav-category">Dịch vụ & Bảo hành</div>
          <a href="/bao-hanh/index.html" class="sidebar-link" data-path="/bao-hanh/">
            <i class="bi bi-shield-check"></i>
            <span>Tra cứu & Bảo hành</span>
          </a>

          <div class="nav-category">Quản lý Hàng hóa</div>
          <a href="/san-pham/index.html" class="sidebar-link" data-path="/san-pham/">
            <i class="bi bi-phone"></i>
            <span>Sản phẩm</span>
          </a>
          <a href="/may-imei/index.html" class="sidebar-link" data-path="/may-imei/">
            <i class="bi bi-upc-scan"></i>
            <span>Quản lý IMEI/Máy</span>
          </a>
          <a href="/danh-muc/index.html" class="sidebar-link" data-path="/danh-muc/">
            <i class="bi bi-tags"></i>
            <span>Danh mục</span>
          </a>
          <a href="/phu-kien/index.html" class="sidebar-link" data-path="/phu-kien/">
            <i class="bi bi-headphones"></i>
            <span>Phụ kiện</span>
          </a>

          <div class="nav-category">Đối tác & Khách hàng</div>
          <a href="/khach-hang/index.html" class="sidebar-link" data-path="/khach-hang/">
            <i class="bi bi-people"></i>
            <span>Khách hàng</span>
          </a>
          <a href="/nha-cung-cap/index.html" class="sidebar-link" data-path="/nha-cung-cap/">
            <i class="bi bi-truck"></i>
            <span>Nhà cung cấp</span>
          </a>

          ${isManager ? `
            <div class="nav-category">Hệ thống</div>
            <a href="/nhan-vien/index.html" class="sidebar-link" data-path="/nhan-vien/">
              <i class="bi bi-shield-lock"></i>
              <span>Nhân viên & Phân quyền</span>
            </a>
          ` : ''}
        </div>

        <div class="sidebar-user">
          <div class="d-flex align-items-center gap-2 mb-2">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; font-weight: 600;">
              ${user.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="overflow-hidden">
              <div class="text-white small fw-bold text-truncate">${escapeHtml(user.hoTen)}</div>
              <div class="user-role-badge">${escapeHtml(user.vaiTro)}</div>
            </div>
          </div>
          <button id="btnLogout" class="btn btn-sm btn-outline-danger w-100 mt-1">
            <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
          </button>
        </div>
      </aside>
    `;
  }

  // Render Navbar
  const navbarContainer = document.getElementById('appNavbar');
  if (navbarContainer) {
    navbarContainer.innerHTML = `
      <header class="app-navbar">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-light d-lg-none" type="button" id="btnToggleSidebar">
            <i class="bi bi-list fs-5"></i>
          </button>
          <span class="text-muted small fw-medium">Hệ thống Quản lý Bán hàng theo từng IMEI/Serial</span>
        </div>

        <div class="d-flex align-items-center gap-3">
          <div class="text-end d-none d-sm-block">
            <div class="fw-semibold small">${escapeHtml(user.hoTen)}</div>
            <div class="text-muted" style="font-size: 0.75rem;">@${escapeHtml(user.tenDangNhap)}</div>
          </div>
        </div>
      </header>
    `;
  }

  // Gắn sự kiện đăng xuất
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        await api.post('/auth/logout');
        window.location.href = '/login.html';
      }
    });
  }

  // Gắn sự kiện bật tắt sidebar mobile
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      const sidebar = document.querySelector('.app-sidebar');
      if (sidebar) sidebar.classList.toggle('show');
    });
  }
}

function highlightCurrentMenu() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.sidebar-link');
  
  links.forEach(link => {
    const dataPath = link.getAttribute('data-path');
    if (dataPath) {
      if (dataPath === '/index.html' && (currentPath === '/' || currentPath === '/index.html')) {
        link.classList.add('active');
      } else if (dataPath !== '/index.html' && currentPath.includes(dataPath)) {
        link.classList.add('active');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', initLayout);
