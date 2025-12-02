const express = require('express');
const router = express.Router();
const { register, login, verifySession } = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

// 📌 Registro y login
router.post('/register', register);
router.post('/login', login);

// 📌 Verificar sesión (para index.js)
router.get('/verify', verifySession);

// 📌 Perfil protegido (para dashboard.js)
router.get('/profile', verifyToken, (req, res) => {
  res.status(200).json({ message: `Hola ${req.user.name}, tu sesión está activa.` });
});

// 📌 Logout
router.post('/logout', (req, res) => { 
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None"
  });
  res.json({ message: 'Sesión cerrada correctamente' });
});

module.exports = router;
