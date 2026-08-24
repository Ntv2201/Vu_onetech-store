/**
 * Module dựng Layout chung (Sidebar, Header, Phân quyền Menu, Kiểm tra Đăng nhập)
 */

let currentUser = null;

/**
 * Định nghĩa cấu trúc Menu và Ma trận Phân quyền 6 Vai trò
 * - Quản lý: Toàn quyền
 * - NV bán hàng: POS & HĐ, Bảo hành (tiếp nhận/tra cứu), Sản phẩm, Khách hàng
 * - Thủ kho: Sản phẩm, Quản lý IMEI, Danh mục, Phụ kiện, Nhà cung cấp
 * - Thu ngân: POS & HĐ, Sản phẩm, Khách hàng
 * - Kế toán: POS & HĐ (xem/tra cứu), Sản phẩm, Phụ kiện, Khách hàng, Nhà cung cấp
 * - Kỹ thuật: Tra cứu & Bảo hành, Sản phẩm, Quản lý IMEI (tra cứu/sửa trạng thái)
 */
const MENU_SCHEMA = [
  {
    category: 'Tổng quan',
    items: [
      {
        path: '/index.html',
        dataPath: '/index.html',
        label: 'Dashboard',
        shortLabel: 'Dashboard',
        icon: 'bi-grid-1x2',
        roles: ['Quản lý', 'Thủ kho', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Kỹ thuật']
      }
    ]
  },
  {
    category: 'Bán hàng & Hóa đơn',
    items: [
      {
        path: '/ban-hang/index.html',
        dataPath: '/ban-hang/',
        label: 'Bán hàng POS & Hóa đơn',
        shortLabel: 'Bán hàng POS',
        icon: 'bi-cart-check',
        roles: ['Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán']
      },
      {
        path: '/dat-truoc/index.html',
        dataPath: '/dat-truoc/',
        label: 'Đặt hàng trước & Cọc',
        shortLabel: 'Đặt trước (Pre-order)',
        icon: 'bi-bookmark-star',
        roles: ['Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán']
      }
    ]
  },
  {
    category: 'Tài chính & Sổ quỹ',
    items: [
      {
        path: '/so-quy/index.html',
        dataPath: '/so-quy/',
        label: 'Thu - Chi & Sổ quỹ',
        shortLabel: 'Sổ quỹ',
        icon: 'bi-wallet2',
        roles: ['Quản lý', 'Thu ngân', 'Kế toán']
      }
    ]
  },
  {
    category: 'Dịch vụ & Bảo hành',
    items: [
      {
        path: '/bao-hanh/index.html',
        dataPath: '/bao-hanh/',
        label: 'Tra cứu & Bảo hành',
        shortLabel: 'Bảo hành',
        icon: 'bi-shield-check',
        roles: ['Quản lý', 'NV bán hàng', 'Kỹ thuật']
      }
    ]
  },
  {
    category: 'Quản lý Hàng hóa',
    items: [
      {
        path: '/san-pham/index.html',
        dataPath: '/san-pham/',
        label: 'Sản phẩm',
        shortLabel: 'Sản phẩm',
        icon: 'bi-phone',
        roles: ['Quản lý', 'Thủ kho', 'NV bán hàng', 'Thu ngân', 'Kế toán', 'Kỹ thuật']
      },
      {
        path: '/may-imei/index.html',
        dataPath: '/may-imei/',
        label: 'Quản lý IMEI/Máy',
        shortLabel: 'Quản lý IMEI',
        icon: 'bi-upc-scan',
        roles: ['Quản lý', 'Thủ kho', 'Kỹ thuật']
      },
      {
        path: '/danh-muc/index.html',
        dataPath: '/danh-muc/',
        label: 'Danh mục',
        shortLabel: 'Danh mục',
        icon: 'bi-tags',
        roles: ['Quản lý', 'Thủ kho']
      },
      {
        path: '/phu-kien/index.html',
        dataPath: '/phu-kien/',
        label: 'Phụ kiện',
        shortLabel: 'Phụ kiện',
        icon: 'bi-headphones',
        roles: ['Quản lý', 'Thủ kho', 'Kế toán']
      }
    ]
  },
  {
    category: 'Đối tác & Khách hàng',
    items: [
      {
        path: '/khach-hang/index.html',
        dataPath: '/khach-hang/',
        label: 'Khách hàng',
        shortLabel: 'Khách hàng',
        icon: 'bi-people',
        roles: ['Quản lý', 'NV bán hàng', 'Thu ngân', 'Kế toán']
      },
      {
        path: '/nha-cung-cap/index.html',
        dataPath: '/nha-cung-cap/',
        label: 'Nhà cung cấp',
        shortLabel: 'Nhà cung cấp',
        icon: 'bi-truck',
        roles: ['Quản lý', 'Thủ kho', 'Kế toán']
      }
    ]
  },
  {
    category: 'Hệ thống',
    items: [
      {
        path: '/nhan-vien/index.html',
        dataPath: '/nhan-vien/',
        label: 'Nhân viên & Phân quyền',
        shortLabel: 'Nhân viên',
        icon: 'bi-shield-lock',
        roles: ['Quản lý']
      }
    ]
  }
];

function getRoleBadgeClass(vaiTro) {
  switch (vaiTro) {
    case 'Quản lý': return 'role-quanly';
    case 'Thủ kho': return 'role-thukho';
    case 'NV bán hàng': return 'role-banhang';
    case 'Thu ngân': return 'role-thungan';
    case 'Kế toán': return 'role-ketoan';
    case 'Kỹ thuật': return 'role-kythuat';
    default: return '';
  }
}

/**
 * Kiểm tra quyền truy cập trực tiếp URL của người dùng
 */
function checkPageAccess(user) {
  const currentPath = window.location.pathname;
  if (currentPath === '/' || currentPath === '/index.html' || currentPath.includes('login.html') || currentPath.includes('404.html')) {
    return true;
  }

  let matchedItem = null;
  for (const cat of MENU_SCHEMA) {
    for (const item of cat.items) {
      if (currentPath.includes(item.dataPath)) {
        matchedItem = item;
        break;
      }
    }
    if (matchedItem) break;
  }

  if (matchedItem && !matchedItem.roles.includes(user.vaiTro)) {
    alert(`Tài khoản vai trò "${user.vaiTro}" không có quyền truy cập trang này! Hệ thống sẽ chuyển hướng về Trang chủ.`);
    window.location.href = '/index.html';
    return false;
  }

  return true;
}

/**
 * Tự động ẩn các nút hành động (Thêm/Sửa/Xóa) trên trang nếu vai trò không có quyền
 */
function applyRoleElementPermissions(user) {
  if (!user) return;

  // 1. Quét các phần tử có data-roles
  document.querySelectorAll('[data-roles], [data-allow-roles]').forEach(el => {
    const rolesAttr = el.getAttribute('data-roles') || el.getAttribute('data-allow-roles') || '';
    const allowedRoles = rolesAttr.split(',').map(r => r.trim());
    if (!allowedRoles.includes(user.vaiTro)) {
      el.style.display = 'none';
      el.classList.add('d-none');
    }
  });

  // 2. Ẩn nút tạo mới trên Header trang tĩnh nếu không có quyền tạo
  const path = window.location.pathname;
  const btnCreate = document.getElementById('btnCreateContainer') || document.getElementById('btnThemMoi');
  
  if (btnCreate) {
    if (path.includes('/san-pham/') && !['Quản lý', 'Thủ kho'].includes(user.vaiTro)) {
      btnCreate.style.display = 'none';
    } else if (path.includes('/danh-muc/') && !['Quản lý', 'Thủ kho'].includes(user.vaiTro)) {
      btnCreate.style.display = 'none';
    } else if (path.includes('/phu-kien/') && !['Quản lý', 'Thủ kho'].includes(user.vaiTro)) {
      btnCreate.style.display = 'none';
    } else if (path.includes('/may-imei/') && !['Quản lý', 'Thủ kho'].includes(user.vaiTro)) {
      btnCreate.style.display = 'none';
    } else if (path.includes('/khach-hang/') && !['Quản lý', 'NV bán hàng', 'Thu ngân'].includes(user.vaiTro)) {
      btnCreate.style.display = 'none';
    } else if (path.includes('/nha-cung-cap/') && !['Quản lý', 'Thủ kho', 'Kế toán'].includes(user.vaiTro)) {
      btnCreate.style.display = 'none';
    } else if (path.includes('/nhan-vien/') && !['Quản lý'].includes(user.vaiTro)) {
      btnCreate.style.display = 'none';
    }
  }
}

async function initLayout() {
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

  // 2. Kiểm tra quyền truy cập trang hiện tại
  if (!checkPageAccess(currentUser)) {
    return;
  }

  // 3. Chèn Sidebar & Navbar vào trang theo đúng quyền
  renderSidebarAndNavbar(currentUser);

  // 4. Highlight menu hiện tại
  highlightCurrentMenu();

  // 5. Ẩn các nút hành động vượt quyền trên trang
  applyRoleElementPermissions(currentUser);
}

function renderSidebarAndNavbar(user) {
  // Lọc Menu theo vai trò
  const filteredNav = MENU_SCHEMA.map(cat => {
    const allowedItems = cat.items.filter(item => item.roles.includes(user.vaiTro));
    return {
      category: cat.category,
      items: allowedItems
    };
  }).filter(cat => cat.items.length > 0);

  const roleClass = getRoleBadgeClass(user.vaiTro);

  // Render Sidebar
  const sidebarContainer = document.getElementById('appSidebar');
  if (sidebarContainer) {
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
          ${filteredNav.map(cat => `
            <div class="nav-category">${escapeHtml(cat.category)}</div>
            ${cat.items.map(item => `
              <a href="${item.path}" class="sidebar-link" data-path="${item.dataPath}" data-label="${escapeHtml(item.shortLabel || item.label)}">
                <i class="bi ${item.icon}"></i>
                <span>${escapeHtml(item.label)}</span>
              </a>
            `).join('')}
          `).join('')}
        </div>

        <div class="sidebar-user">
          <div class="d-flex align-items-center gap-2 mb-2 user-profile-box">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 user-avatar" style="width: 36px; height: 36px; font-weight: 700;">
              ${user.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="overflow-hidden user-info">
              <div class="text-white small fw-bold text-truncate">${escapeHtml(user.hoTen)}</div>
              <div class="user-role-badge ${roleClass}">${escapeHtml(user.vaiTro)}</div>
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
          <span class="text-muted small fw-medium d-none d-md-inline">Hệ thống Quản lý Bán hàng theo từng IMEI/Serial</span>
        </div>

        <div class="d-flex align-items-center gap-3">
          <div class="text-end d-none d-sm-block">
            <div class="fw-semibold small">${escapeHtml(user.hoTen)}</div>
            <div class="user-role-badge ${roleClass}" style="font-size: 0.68rem; padding: 0.1rem 0.45rem;">${escapeHtml(user.vaiTro)}</div>
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
