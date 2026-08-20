/**
 * Module xử lý đăng nhập phía Client
 */

function fillCreds(u, p) {
  document.getElementById('inputUsername').value = u;
  document.getElementById('inputPassword').value = p;
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const loginAlertText = document.getElementById('loginAlertText');
  const btnSubmit = document.getElementById('btnSubmit');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const tenDangNhap = document.getElementById('inputUsername').value.trim();
      const matKhau = document.getElementById('inputPassword').value;

      if (!tenDangNhap || !matKhau) {
        showError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
        return;
      }

      // Đổi trạng thái nút bấm
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang xác thực...';
      hideError();

      const res = await api.post('/auth/login', { tenDangNhap, matKhau });

      if (res.success) {
        sessionStorage.setItem('user', JSON.stringify(res.user));
        const returnTo = sessionStorage.getItem('returnTo') || '/index.html';
        sessionStorage.removeItem('returnTo');
        window.location.href = returnTo;
      } else {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập hệ thống';
        showError(res.message || 'Đăng nhập không thành công');
      }
    });
  }

  function showError(msg) {
    if (loginAlert && loginAlertText) {
      loginAlertText.textContent = msg;
      loginAlert.classList.remove('d-none');
      loginAlert.classList.add('d-flex');
    }
  }

  function hideError() {
    if (loginAlert) {
      loginAlert.classList.add('d-none');
      loginAlert.classList.remove('d-flex');
    }
  }
});
