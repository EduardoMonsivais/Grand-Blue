const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const {
  receiveBPM,           // flujo con token
  receiveBPMFromDevice, // flujo con deviceId (Arduino/ESP32)
  sendLiveBPM,          // SSE en vivo
  getHistory,           // historial del usuario
  getLatest             // último BPM
} = require('../controllers/heartController');

const router = express.Router();

// 📥 Guardar BPM (solo autenticados con token)
router.post('/', verifyToken, receiveBPM);

// 📥 Guardar BPM desde Arduino usando deviceId (sin token)
router.post('/device', receiveBPMFromDevice);

// 📡 SSE en vivo (solo autenticados, filtra por usuario)
router.get('/live', verifyToken, sendLiveBPM);

// 📜 Historial privado del usuario
router.get('/history', verifyToken, getHistory);

// 🕒 Último BPM del usuario
router.get('/latest', verifyToken, getLatest);

module.exports = router;
