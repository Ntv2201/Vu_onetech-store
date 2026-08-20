const express = require('express');
const router = express.Router();
const sanPhamController = require('../controllers/sanPhamController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', sanPhamController.index);
router.get('/:id', sanPhamController.getDetail);
router.post('/', requireRole('Quản lý', 'Thủ kho'), sanPhamController.postCreate);
router.put('/:id', requireRole('Quản lý', 'Thủ kho'), sanPhamController.postEdit);
router.delete('/:id', requireRole('Quản lý'), sanPhamController.delete);

module.exports = router;
