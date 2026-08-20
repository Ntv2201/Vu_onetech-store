// Client helper scripts
document.addEventListener('DOMContentLoaded', () => {
  // Tự động ẩn thông báo sau 4 giây
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 4000);
  });

  // Xác nhận trước khi xóa
  const deleteForms = document.querySelectorAll('form[action*="xoa"]');
  deleteForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này? Thao tác không thể hoàn tác!')) {
        e.preventDefault();
      }
    });
  });
});
