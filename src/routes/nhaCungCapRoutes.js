const express = require('express');
const router = express.Router();
const nhaCungCapController = require('../controllers/nhaCungCapController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', nhaCungCapController.index);
router.get('/them-moi', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), nhaCungCapController.getCreate);
router.post('/them-moi', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), nhaCungCapController.postCreate);
router.get('/:id/chinh-sua', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), nhaCungCapController.getEdit);
router.post('/:id/chinh-sua', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), nhaCungCapController.postEdit);
router.post('/:id/xoa', requireRole('Quản lý'), nhaCungCapController.delete);

module.exports = router;
