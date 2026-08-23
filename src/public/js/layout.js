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
        <div class="sidebar-header">
          <a href="/index.html" class="sidebar-brand">
            <i class="bi bi-phone-vibrate"></i>
            <span>ONE TECH STORE</span>
          </a>
          <button class="sidebar-toggle-btn" id="btnCollapseSidebar" title="Thu/Mở thanh bên">
            <i class="bi bi-layout-sidebar-inset"></i>
          </button>
        </div>

        <div class="sidebar-nav">
          <div class="nav-category">Tổng quan</div>
          <a href="/index.html" class="sidebar-link" data-path="/index.html" data-label="Dashboard">
            <i class="bi bi-grid-1x2"></i>
            <span>Dashboard</span>
          </a>

          ${isSeller ? `
            <div class="nav-category">Bán hàng &amp; Hóa đơn</div>
            <a href="/ban-hang/index.html" class="sidebar-link" data-path="/ban-hang/" data-label="Bán hàng POS">
              <i class="bi bi-cart-check"></i>
              <span>Bán hàng POS &amp; Hóa đơn</span>
            </a>
          ` : ''}

          <div class="nav-category">Dịch vụ &amp; Bảo hành</div>
          <a href="/bao-hanh/index.html" class="sidebar-link" data-path="/bao-hanh/" data-label="Bảo hành">
            <i class="bi bi-shield-check"></i>
            <span>Tra cứu &amp; Bảo hành</span>
          </a>

          <div class="nav-category">Quản lý Hàng hóa</div>
          <a href="/san-pham/index.html" class="sidebar-link" data-path="/san-pham/" data-label="Sản phẩm">
            <i class="bi bi-phone"></i>
            <span>Sản phẩm</span>
          </a>
          <a href="/may-imei/index.html" class="sidebar-link" data-path="/may-imei/" data-label="Quản lý IMEI">
            <i class="bi bi-upc-scan"></i>
            <span>Quản lý IMEI/Máy</span>
          </a>
          <a href="/danh-muc/index.html" class="sidebar-link" data-path="/danh-muc/" data-label="Danh mục">
            <i class="bi bi-tags"></i>
            <span>Danh mục</span>
          </a>
          <a href="/phu-kien/index.html" class="sidebar-link" data-path="/phu-kien/" data-label="Phụ kiện">
            <i class="bi bi-headphones"></i>
            <span>Phụ kiện</span>
          </a>

          <div class="nav-category">Đối tác &amp; Khách hàng</div>
          <a href="/khach-hang/index.html" class="sidebar-link" data-path="/khach-hang/" data-label="Khách hàng">
            <i class="bi bi-people"></i>
            <span>Khách hàng</span>
          </a>
          <a href="/nha-cung-cap/index.html" class="sidebar-link" data-path="/nha-cung-cap/" data-label="Nhà cung cấp">
            <i class="bi bi-truck"></i>
            <span>Nhà cung cấp</span>
          </a>

          ${isManager ? `
            <div class="nav-category">Hệ thống</div>
            <a href="/nhan-vien/index.html" class="sidebar-link" data-path="/nhan-vien/" data-label="Nhân viên">
              <i class="bi bi-shield-lock"></i>
              <span>Nhân viên &amp; Phân quyền</span>
            </a>
          ` : ''}
        </div>

        <div class="sidebar-user">
          <div class="d-flex align-items-center gap-2 mb-2 user-profile-box">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 user-avatar" style="width: 36px; height: 36px; font-weight: 700;">
              ${user.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="overflow-hidden user-info">
              <div class="text-white small fw-bold text-truncate">${escapeHtml(user.hoTen)}</div>
              <div class="user-role-badge">${escapeHtml(user.vaiTro)}</div>
            </div>
          </div>
          <button id="btnLogout" class="btn btn-sm btn-logout w-100 mt-1" data-label="Đăng xuất" title="Đăng xuất">
            <i class="bi bi-box-arrow-right"></i> <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <!-- Overlay cho mobile -->
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
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

  // ── Sự kiện đăng xuất ──────────────────────────────────
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        await api.post('/auth/logout');
        window.location.href = '/login.html';
      }
    });
  }

  // ── Collapse sidebar trên desktop ──────────────────────
  const btnCollapse = document.getElementById('btnCollapseSidebar');
  const sidebar = document.querySelector('.app-sidebar');

  function updateCollapseIcon(isCollapsed) {
    if (!btnCollapse) return;
    const icon = btnCollapse.querySelector('i');
    if (icon) {
      icon.className = isCollapsed ? 'bi bi-layout-sidebar' : 'bi bi-layout-sidebar-inset';
    }
  }

  // Khôi phục trạng thái từ localStorage
  if (sidebar && localStorage.getItem('sidebarCollapsed') === 'true') {
    sidebar.classList.add('collapsed');
    updateCollapseIcon(true);
  }

  if (btnCollapse && sidebar) {
    btnCollapse.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isCollapsed = sidebar.classList.toggle('collapsed');
      updateCollapseIcon(isCollapsed);
      localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
  }

  // ── Toggle sidebar trên mobile (hamburger navbar) ──────
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function openMobileSidebar() {
    if (sidebar) sidebar.classList.add('show');
    if (overlay) overlay.classList.add('show');
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
  }

  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', openMobileSidebar);
  }

  // Đóng sidebar khi click overlay
  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  // Đóng sidebar khi click link trên mobile
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) closeMobileSidebar();
    });
  });
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
