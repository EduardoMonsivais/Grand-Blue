const Heart = require('../models/HeartModel');

let sseClients = [];

// 📥 Recibir BPM desde ESP32
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

    console.log("💓 Nuevo BPM recibido:", record);

    // 🔑 Notificar solo a los clientes SSE del mismo usuario
    sseClients
      .filter(c => c.userId.toString() === userId.toString())
      .forEach(client => {
        client.res.write(`data: ${JSON.stringify(record)}\n\n`);
      });

    return res.status(201).json({
      message: "BPM recibido",
      data: record
    });

  } catch (error) {
    console.error("❌ Error en receiveBPM:", error);
    res.status(500).json({ error: "Error interno al guardar BPM" });
  }
};

// 🔴 SSE por usuario
exports.sendLiveBPM = async (req, res) => {
  try {
    const userId = req.user.id; // viene del token

    // 🔧 Permitir SSE desde cualquier origen (CORS)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // 🔄 Enviar el último BPM al conectar
    const latest = await Heart.findOne({ userId }).sort({ timestamp: -1 });
    if (latest) {
      res.write(`data: ${JSON.stringify(latest)}\n\n`);
    }

    // 🧩 Registrar cliente SSE
    const client = { id: Date.now(), res, userId };
    sseClients.push(client);

    req.on("close", () => {
      sseClients = sseClients.filter(c => c.id !== client.id);
    });
  } catch (err) {
    console.error("❌ Error en sendLiveBPM:", err);
    res.status(500).end();
  }
};

// 📜 Historial privado por usuario
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
