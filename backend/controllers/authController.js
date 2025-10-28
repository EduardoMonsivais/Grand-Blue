const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  console.log('Registro recibido:', req.body); 

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'El correo ya está registrado' });

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error en el registro:', error.message, error.stack); 
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
      { expiresIn: '2h' }
    );

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 2 * 60 * 60 * 1000
      })
      .status(200)
      .json({ message: 'Inicio de sesión exitoso', user: user.name });
  } catch (error) {
    console.error('Error en el login:', error.message, error.stack); 
    res.status(500).json({ error: 'Error del servidor durante el inicio de sesión' });
  }
};

module.exports = { register, login };
