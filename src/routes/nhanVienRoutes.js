const express = require('express');
const router = express.Router();
const nhanVienController = require('../controllers/nhanVienController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Chỉ Quản lý mới có quyền truy cập toàn bộ chức năng nhân viên
router.use(requireAuth);
router.use(requireRole('Quản lý'));

router.get('/', nhanVienController.index);
router.get('/:id', nhanVienController.getDetail);
router.post('/', nhanVienController.postCreate);
router.put('/:id', nhanVienController.postEdit);
router.delete('/:id', nhanVienController.delete);

module.exports = router;
