const Heart = require('../models/HeartModel');
const User = require('../models/userModel');

let sseClients = [];

// 📥 Recibir BPM desde ESP32 autenticado con token
exports.receiveBPM = async (req, res) => {
  try {
    const { bpm, timestamp } = req.body;
    const userId = req.user.id;

    if (!bpm) return res.status(400).json({ error: 'BPM es requerido' });

    const parsedTimestamp = timestamp
      ? isNaN(timestamp)
        ? new Date(timestamp)
        : new Date(Number(timestamp))
      : new Date();

    const record = await Heart.create({
      bpm,
      timestamp: parsedTimestamp,
      userId
    });

    console.log("💓 Nuevo BPM recibido (token):", record);

    // Notificar solo a clientes SSE del mismo usuario
    sseClients
      .filter(c => c.userId.toString() === userId.toString())
      .forEach(client => {
        console.log(`➡️ Enviando BPM ${record.bpm} al cliente ${client.id}`);
        client.res.write(`data: ${JSON.stringify(record)}\n\n`);
      });

    return res.status(201).json({ message: "BPM recibido", data: record });
  } catch (error) {
    console.error("❌ Error en receiveBPM:", error);
    res.status(500).json({ error: "Error interno al guardar BPM" });
  }
};

// 📥 Recibir BPM desde ESP32 usando deviceId (sin token)
exports.receiveBPMFromDevice = async (req, res) => {
  try {
    const { deviceId, bpm, timestamp } = req.body;

    if (!deviceId || !bpm) {
      return res.status(400).json({ error: 'deviceId y bpm son requeridos' });
    }

    // Buscar usuario vinculado al deviceId
    const user = await User.findOne({ deviceId });
    if (!user) {
      return res.status(404).json({ error: 'No se encontró usuario para este deviceId' });
    }

    const parsedTimestamp = timestamp
      ? isNaN(timestamp)
        ? new Date(timestamp)
        : new Date(Number(timestamp))
      : new Date();

    const record = await Heart.create({
      bpm,
      timestamp: parsedTimestamp,
      userId: user._id
    });

    console.log(`💓 BPM recibido de ${deviceId}:`, record);

    // Notificar solo a clientes SSE del mismo usuario
    sseClients
      .filter(c => c.userId.toString() === user._id.toString())
      .forEach(client => {
        console.log(`➡️ Enviando BPM ${record.bpm} al cliente ${client.id}`);
        client.res.write(`data: ${JSON.stringify(record)}\n\n`);
      });

    return res.status(201).json({ message: "BPM recibido", data: record });
  } catch (error) {
    console.error("❌ Error en receiveBPMFromDevice:", error);
    res.status(500).json({ error: "Error interno al guardar BPM" });
  }
};

// 📡 SSE en vivo por usuario autenticado
exports.sendLiveBPM = async (req, res) => {
  try {
    const userId = req.user.id;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Enviar último BPM al conectar
    const latest = await Heart.findOne({ userId }).sort({ timestamp: -1 });
    if (latest) {
      console.log(`📡 Enviando último BPM (${latest.bpm}) al nuevo cliente SSE`);
      res.write(`data: ${JSON.stringify(latest)}\n\n`);
    }

    // Registrar cliente SSE
    const client = { id: Date.now(), res, userId };
    sseClients.push(client);
    console.log(`✅ Cliente SSE conectado: ${client.id}, total: ${sseClients.length}`);

    req.on("close", () => {
      sseClients = sseClients.filter(c => c.id !== client.id);
      console.log(`❌ Cliente SSE desconectado: ${client.id}, total: ${sseClients.length}`);
    });
  } catch (err) {
    console.error("❌ Error en sendLiveBPM:", err);
    res.status(500).end();
  }
};

// 📜 Historial privado del usuario
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await Heart.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(history);
  } catch (error) {
    console.error("❌ Error en getHistory:", error);
    res.status(500).json({ error: "Error obteniendo historial" });
  }
};

// 🕒 Último BPM del usuario
exports.getLatest = async (req, res) => {
  try {
    const userId = req.user.id;
    const latest = await Heart.findOne({ userId }).sort({ timestamp: -1 });
    if (!latest) return res.status(404).json({ error: 'No hay datos' });
    res.json(latest);
  } catch (error) {
    console.error("❌ Error en getLatest:", error);
    res.status(500).json({ error: "Error interno al obtener BPM" });
  }
};
