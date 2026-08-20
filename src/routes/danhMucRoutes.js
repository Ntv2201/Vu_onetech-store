const express = require('express');
const router = express.Router();
const danhMucController = require('../controllers/danhMucController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', danhMucController.index);
router.post('/them-moi', requireRole('Quản lý', 'Thủ kho'), danhMucController.postCreate);
router.post('/:id/chinh-sua', requireRole('Quản lý', 'Thủ kho'), danhMucController.postEdit);
router.post('/:id/xoa', requireRole('Quản lý'), danhMucController.delete);

module.exports = router;
