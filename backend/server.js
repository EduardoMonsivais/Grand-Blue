require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const heartRoutes = require('./routes/heartRoutes'); 

const app = express();

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI no está definido en el entorno");
  process.exit(1);
} else {
  console.log("✅ URI detectada:", process.env.MONGO_URI);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api', authRoutes);
app.use('/api/heart', heartRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    app.listen(3000, () =>
      console.log('🚀 Servidor corriendo en http://localhost:3000')
    );
  })
  .catch(err => {
    console.error('❌ Error al conectar con MongoDB:', err.message);
    process.exit(1);
  });
