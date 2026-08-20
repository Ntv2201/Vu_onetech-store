const express = require('express');
const router = express.Router();
const sanPhamController = require('../controllers/sanPhamController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', sanPhamController.index);
router.get('/them-moi', requireRole('Quản lý', 'Thủ kho'), sanPhamController.getCreate);
router.post('/them-moi', requireRole('Quản lý', 'Thủ kho'), sanPhamController.postCreate);
router.get('/:id/chinh-sua', requireRole('Quản lý', 'Thủ kho'), sanPhamController.getEdit);
router.post('/:id/chinh-sua', requireRole('Quản lý', 'Thủ kho'), sanPhamController.postEdit);
router.post('/:id/xoa', requireRole('Quản lý'), sanPhamController.delete);
router.get('/:id/chi-tiet', sanPhamController.getDetail);

module.exports = router;
