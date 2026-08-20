/**
 * Middleware kiểm tra đăng nhập và phân quyền nhân viên
 */

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
  }

  req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
      }
      return res.redirect('/login');
    }

    const userRole = req.session.user.vaiTro;
    // Quản lý luôn có quyền cao nhất
    if (userRole === 'Quản lý' || roles.includes(userRole)) {
      return next();
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' });
    }

    return res.status(403).render('errors/403', {
      title: 'Truy cập bị từ chối',
      message: `Tài khoản với vai trò "${userRole}" không có quyền truy cập chức năng này.`,
      requiredRoles: roles
    });
  };
};

const attachUser = (req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.currentPath = req.path;
  res.locals.success_msg = req.flash ? req.flash('success_msg') : [];
  res.locals.error_msg = req.flash ? req.flash('error_msg') : [];
  next();
};

module.exports = {
  requireAuth,
  requireRole,
  attachUser
};
