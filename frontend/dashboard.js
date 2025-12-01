const API_BASE_URL = 'https://health-sen.onrender.com';
const token = localStorage.getItem('token');

console.log("Token actual en localStorage:", token);

async function checkSession() {
  if (!token) {
    console.warn("No hay token en localStorage, redirigiendo...");
    window.location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Sesión no válida');

    const data = await res.json();
    document.getElementById('welcomeMessage').textContent =
      `Bienvenido, ${data.message.split(' ')[1]} 👋`;
  } catch (err) {
    console.error('Error en checkSession:', err);
    window.location.href = 'index.html';
  }
}

checkSession();

// ✅ Tiempo real con SSE (token en URL para móvil)
function initLiveBPM() {
  const eventSource = new EventSource(`${API_BASE_URL}/api/heart/live?token=${token}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    document.getElementById('heartbeat').textContent = `${data.bpm} bpm`;

    const time = new Date(data.timestamp);
    document.getElementById('timestamp').textContent =
      `Última actualización: ${time.toLocaleString()}`;
  };

  eventSource.onerror = (err) => {
    console.error("Error en SSE:", err);
    eventSource.close();
  };
}

initLiveBPM();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch(`${API_BASE_URL}/api/logout`, { method: 'POST' });
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

async function sendBPM(bpm) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ bpm })
    });

    const data = await res.json();
    console.log('Respuesta de /api/heart:', data);
    alert(`BPM enviado: ${bpm}`);
  } catch (err) {
    console.error('Error enviando BPM:', err);
  }
}

async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heart/history`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    const history = await res.json();
    console.log('Historial:', history);

    const list = document.getElementById('historyList');
    list.innerHTML = history.map(h =>
      `<li>${h.bpm} bpm - ${new Date(h.timestamp).toLocaleString()}</li>`
    ).join('');
  } catch (err) {
    console.error('Error cargando historial:', err);
  }
}
