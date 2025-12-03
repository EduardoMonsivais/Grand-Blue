function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol administrador' });
  }
  next();
}

module.exports = isAdmin;
