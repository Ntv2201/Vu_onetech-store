const express = require('express');
const router = express.Router();
const nhaCungCapController = require('../controllers/nhaCungCapController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', nhaCungCapController.index);
router.get('/:id', nhaCungCapController.getDetail);
router.get('/:id/lich-su-nhap', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), nhaCungCapController.getLichSuNhap);
router.post('/', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), nhaCungCapController.postCreate);
router.put('/:id', requireRole('Quản lý', 'Thủ kho', 'Kế toán'), nhaCungCapController.postEdit);
router.delete('/:id', requireRole('Quản lý'), nhaCungCapController.delete);

module.exports = router;
