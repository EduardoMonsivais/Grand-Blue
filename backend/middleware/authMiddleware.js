const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

async function verifyToken(req, res, next) {
  const token =
    req.cookies.token ||
    (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]) ||
    req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la BD para tener todos los datos
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Guardamos datos completos en req.user
    req.user = {
      id: user._id,
      name: user.name,
      deviceId: user.deviceId
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = verifyToken;
