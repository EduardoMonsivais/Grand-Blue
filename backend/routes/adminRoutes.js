const express = require('express');
const router = express.Router();
const { getAllUsersPulse, changeUserRole } = require('../controllers/adminController');

// 📌 Ruta para obtener todos los usuarios y su último BPM
router.get('/pulses', getAllUsersPulse);

// 📌 Ruta para cambiar rol de usuario
router.post('/change-role', changeUserRole);

module.exports = router;
