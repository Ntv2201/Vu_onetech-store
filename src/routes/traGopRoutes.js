const express = require('express');
const router = express.Router();
const TraGopController = require('../controllers/TraGopController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.post('/', requireAuth, requireRole('Kế toán', 'Thu ngân', 'Bán hàng'), TraGopController.taoHopDong);
router.get('/', requireAuth, requireRole('Kế toán', 'Thu ngân'), TraGopController.layDanhSach);
router.get('/:id', requireAuth, requireRole('Kế toán', 'Thu ngân'), TraGopController.layChiTiet);
router.get('/:id/lich-thu', requireAuth, requireRole('Kế toán', 'Thu ngân'), TraGopController.layLichThu);
router.post('/:id/thu-ky', requireAuth, requireRole('Kế toán', 'Thu ngân'), TraGopController.thuTienKy);

module.exports = router;
