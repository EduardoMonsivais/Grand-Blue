const Heart = require('../models/HeartModel');

let lastHeartRate = { bpm: 0, timestamp: Date.now() };
let sseClients = [];

exports.receiveBPM = async (req, res) => {
  try {
    const { bpm } = req.body;

    if (!bpm) return res.status(400).json({ error: 'BPM es requerido' });

    // Guardar en BD
    const record = await Heart.create({ bpm });

    lastHeartRate = {
      bpm,
      timestamp: Date.now()
    };

    console.log("💓 Nuevo BPM recibido:", lastHeartRate);

    sseClients.forEach(client => {
      client.res.write(`data: ${JSON.stringify(lastHeartRate)}\n\n`);
    });

    return res.status(201).json({
      message: "BPM recibido",
      data: record
    });

  } catch (error) {
    console.error("Error en receiveBPM:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

exports.sendLiveBPM = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify(lastHeartRate)}\n\n`);

  const client = { id: Date.now(), res };
  sseClients.push(client);

  console.log("🟢 Cliente conectado a SSE");

  req.on("close", () => {
    console.log("🔴 Cliente desconectado de SSE");
    sseClients = sseClients.filter(c => c.id !== client.id);
  });
};

exports.getHistory = async (req, res) => {
  try {
    const history = await Heart.find()
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo historial" });
  }
};

// ✅ Nueva ruta para el dashboard
exports.getLatest = async (req, res) => {
  try {
    const latest = await Heart.findOne().sort({ timestamp: -1 });
    if (!latest) return res.status(404).json({ error: 'No hay datos' });
    res.json(latest);
  } catch (error) {
    console.error("Error en getLatest:", error);
    res.status(500).json({ error: "Error interno" });
  }
};
