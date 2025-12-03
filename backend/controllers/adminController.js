const User = require('../models/userModel');
const Heart = require('../models/HeartModel');

// 📌 Ver todos los usuarios y su último BPM
const getAllUsersPulse = async (req, res) => {
  try {
    const users = await User.find({});
    const result = [];

    for (const u of users) {
      const lastPulse = await Heart.findOne({ deviceId: u.deviceId }).sort({ timestamp: -1 });
      result.push({
        user: u.name,
        email: u.email,
        deviceId: u.deviceId,
        role: u.role,
        bpm: lastPulse ? lastPulse.bpm : 'Sin datos',
        timestamp: lastPulse ? lastPulse.timestamp : null
      });
    }

    res.json(result);
  } catch (err) {
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
    res.status(500).json({ error: 'Error actualizando rol' });
  }
};

module.exports = { getAllUsersPulse, changeUserRole };
