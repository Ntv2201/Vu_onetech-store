const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middlewares/auth');

router.use(requireAuth);
router.get('/', dashboardController.index);

module.exports = router;
