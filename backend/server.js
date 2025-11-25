require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const heartRoutes = require('./routes/heartRoutes');

const app = express();

// 🔍 Verifica que la URI esté definida
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI no está definido en el entorno");
  process.exit(1);
} else {
  console.log("✅ URI detectada:", process.env.MONGO_URI);
}

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// 📡 Rutas API primero
app.use('/api', authRoutes);
app.use('/api/heart', heartRoutes);

// 🛡️ Manejo de rutas API no encontradas (sin bloquear rutas válidas)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta API no encontrada' });
  }
  next();
});

// 🧭 Sirve el frontend si existe
const frontendPath = path.join(__dirname, 'frontend', 'index.html');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(path.join(__dirname, 'frontend')));
  app.get('*', (req, res) => {
    res.sendFile(frontendPath);
  });
}

// 🚀 Conexión a MongoDB Atlas 
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () =>
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ Error al conectar con MongoDB:', err.message);
    process.exit(1);
  });
