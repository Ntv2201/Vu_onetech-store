const express = require('express');
const router = express.Router();
const nhanVienController = require('../controllers/nhanVienController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Toàn bộ chức năng quản lý tài khoản nhân viên chỉ dành cho vai trò "Quản lý"
router.use(requireAuth);
router.use(requireRole('Quản lý'));

router.get('/', nhanVienController.index);
router.get('/them-moi', nhanVienController.getCreate);
router.post('/them-moi', nhanVienController.postCreate);
router.get('/:id/chinh-sua', nhanVienController.getEdit);
router.post('/:id/chinh-sua', nhanVienController.postEdit);
router.post('/:id/xoa', nhanVienController.delete);

module.exports = router;
