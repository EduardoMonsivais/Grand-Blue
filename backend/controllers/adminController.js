const User = require('../models/userModel');
const Heart = require('../models/HeartModel');

// 📌 Ver todos los usuarios y su último BPM
const getAllUsersPulse = async (req, res) => {
  try {
    const users = await User.find({});
    const result = [];

    for (const u of users) {
      // ✅ Buscar por userId en lugar de deviceId
      const lastPulse = await Heart.findOne({ userId: u._id }).sort({ timestamp: -1 });

      result.push({
        user: u.name,
        email: u.email,
        deviceId: u.deviceId, // se sigue mostrando el deviceId del usuario
        role: u.role,
        bpm: lastPulse ? lastPulse.bpm : null,
        timestamp: lastPulse ? lastPulse.timestamp : null
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Error en getAllUsersPulse:', err);
    res.status(500).json({ error: 'Error obteniendo pulsos' });
  }
};

// 📌 Cambiar rol de un usuario
const changeUserRole = async (req, res) => {
  const { email, role } = req.body;
  try {
    await User.updateOne({ email }, { $set: { role } });
    res.json({ message: `Rol de ${email} actualizado a ${role}` });
  } catch (err) {
    console.error('Error en changeUserRole:', err);
    res.status(500).json({ error: 'Error actualizando rol' });
  }
};

module.exports = { getAllUsersPulse, changeUserRole };
