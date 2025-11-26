const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'El correo ya está registrado' });

    // 🔑 Hashear contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // 🔑 Generar token inmediatamente al registrarse
    const token = jwt.sign(
      { id: newUser._id, name: newUser.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 🔑 Guardar token en cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    // 🔑 Devolver token también en JSON
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser.name,
      token
    });
  } catch (error) {
    console.error("❌ Error en register:", error);
    res.status(500).json({ error: 'Error del servidor durante el registro' });
  }
};

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

    // ✅ Cookie para web
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    // ✅ Token en JSON para móvil
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user: user.name,
      token
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: 'Error del servidor durante el inicio de sesión' });
  }
};

const verifySession = (req, res) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ authenticated: true, user: decoded.name });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
};

module.exports = { register, login, verifySession };
