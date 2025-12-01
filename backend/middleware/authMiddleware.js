const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token =
    req.cookies.token ||
    (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]) ||
    req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = verifyToken;
