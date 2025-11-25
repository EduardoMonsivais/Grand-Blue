const express = require('express');
const router = express.Router();
const { register, login, verifySession } = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifySession); 

router.get('/profile', verifyToken, (req, res) => {
  res.status(200).json({ message: `Hola ${req.user.name}, tu sesión está activa.` });
});

router.post('/logout', (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None"
  });
  res.json({ message: 'Sesión cerrada correctamente' });
});

module.exports = router;
