const express = require('express');
const router = express.Router();
const CongNoController = require('../controllers/CongNoController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('Kế toán', 'Thu ngân'), CongNoController.layDanhSach);
router.get('/:id', requireAuth, requireRole('Kế toán', 'Thu ngân'), CongNoController.layChiTiet);
router.post('/:id/thanh-toan', requireAuth, requireRole('Kế toán', 'Thu ngân'), CongNoController.thanhToan);

module.exports = router;