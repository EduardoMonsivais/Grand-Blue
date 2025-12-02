const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const {
  receiveBPM,
  receiveBPMFromDevice, // 👈 Nueva función para Arduino con deviceId
  sendLiveBPM,
  getHistory,
  getLatest
} = require('../controllers/heartController');

const router = express.Router();

// 📥 Guardar BPM (solo autenticados con token)
router.post('/', verifyToken, receiveBPM);

// 📥 Guardar BPM desde Arduino usando deviceId (sin token)
router.post('/device', receiveBPMFromDevice);

// 📡 SSE en vivo (solo autenticados, así se filtra por usuario)
router.get('/live', verifyToken, sendLiveBPM);

// 📜 Historial privado del usuario
router.get('/history', verifyToken, getHistory);

// 🕒 Último BPM del usuario
router.get('/latest', verifyToken, getLatest);

module.exports = router;
