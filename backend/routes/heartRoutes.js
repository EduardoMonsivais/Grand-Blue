const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const {
  receiveBPM,
  sendLiveBPM,
  getHistory,
  getLatest
} = require('../controllers/heartController');

const router = express.Router();

router.post('/', verifyToken, receiveBPM);
router.get('/live', sendLiveBPM); // opcional: puedes protegerlo también
router.get('/history', verifyToken, getHistory);
router.get('/latest', verifyToken, getLatest);

module.exports = router;
