const express = require('express');
const {
  receiveBPM,
  sendLiveBPM,
  getHistory,
  getLatest
} = require('../controllers/heartController');

const router = express.Router();

router.post('/', receiveBPM);

router.get('/live', sendLiveBPM);

router.get('/history', getHistory);

router.get('/latest', getLatest);

module.exports = router;
