const express = require('express');
const router = express.Router();
const danhMucController = require('../controllers/danhMucController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', danhMucController.index);
router.post('/', requireRole('Quản lý', 'Thủ kho'), danhMucController.postCreate);
router.put('/:id', requireRole('Quản lý', 'Thủ kho'), danhMucController.postEdit);
router.delete('/:id', requireRole('Quản lý'), danhMucController.delete);

module.exports = router;
