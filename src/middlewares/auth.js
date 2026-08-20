/**
 * Middleware kiểm tra đăng nhập và phân quyền nhân viên cho RESTful API
 */

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Vui lòng đăng nhập để tiếp tục'
  });
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }

    const userRole = req.session.user.vaiTro;
    // Quản lý luôn có quyền cao nhất
    if (userRole === 'Quản lý' || roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Tài khoản với vai trò "${userRole}" không có quyền thực hiện chức năng này.`,
      requiredRoles: roles
    });
  };
};

const attachUser = (req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.currentPath = req.path;
  next();
};

module.exports = {
  requireAuth,
  requireRole,
  attachUser
};
