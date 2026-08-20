const express = require('express');
const router = express.Router();
const mayImeiController = require('../controllers/mayImeiController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', mayImeiController.index);
router.get('/:imei', mayImeiController.getDetail);
router.post('/', requireRole('Quản lý', 'Thủ kho'), mayImeiController.postCreate);
router.put('/:imei', requireRole('Quản lý', 'Thủ kho', 'Kỹ thuật'), mayImeiController.postEdit);
router.delete('/:imei', requireRole('Quản lý'), mayImeiController.delete);

module.exports = router;
