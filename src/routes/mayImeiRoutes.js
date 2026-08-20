const express = require('express');
const router = express.Router();
const mayImeiController = require('../controllers/mayImeiController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', mayImeiController.index);
router.get('/them-moi', requireRole('Quản lý', 'Thủ kho'), mayImeiController.getCreate);
router.post('/them-moi', requireRole('Quản lý', 'Thủ kho'), mayImeiController.postCreate);
router.get('/:imei/chinh-sua', requireRole('Quản lý', 'Thủ kho', 'Kỹ thuật'), mayImeiController.getEdit);
router.post('/:imei/chinh-sua', requireRole('Quản lý', 'Thủ kho', 'Kỹ thuật'), mayImeiController.postEdit);
router.post('/:imei/xoa', requireRole('Quản lý'), mayImeiController.delete);

module.exports = router;
