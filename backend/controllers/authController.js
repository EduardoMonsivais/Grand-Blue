const User = require('../models/userModel'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
  const { name, email, password, deviceId } = req.body; // 👈 ahora también recibimos deviceId

  try {
    // Verificar si ya existe el correo
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'El correo ya está registrado' });

    // Verificar si ya existe el deviceId
    if (deviceId) {
      const existingDevice = await User.findOne({ deviceId });
      if (existingDevice) return res.status(400).json({ error: 'Este deviceId ya está vinculado a otro usuario' });
    }

    // Crear nuevo usuario con deviceId
    const newUser = new User({ name, email, password, deviceId });
    await newUser.save();

    // Generar token
    const token = jwt.sign(
      { id: newUser._id, name: newUser.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Guardar token en cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser.name,
      deviceId: newUser.deviceId, // 👈 devolvemos también el deviceId
      token
    });
  } catch (error) {
    console.error("❌ Error en register:", error);
    res.status(500).json({ error: 'Error del servidor durante el registro' });
  }
};

// 📌 Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Correo no encontrado' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user: user.name,
      deviceId: user.deviceId, // 👈 devolvemos también el deviceId
      token
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: 'Error del servidor durante el inicio de sesión' });
  }
};

// 📌 Verificar sesión
const verifySession = (req, res) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ authenticated: true, user: decoded.name });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
};

module.exports = { register, login, verifySession };
