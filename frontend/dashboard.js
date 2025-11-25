const API_BASE_URL = 'https://health-sen.onrender.com';
const token = localStorage.getItem('token');

// ✅ Verificación de sesión
async function checkSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
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

// ✅ Tiempo real con SSE (filtrado por usuario)
function initLiveBPM() {
  // 🔑 withCredentials: true para enviar cookie/token
  const eventSource = new EventSource(`${API_BASE_URL}/api/heart/live`, { withCredentials: true });

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    document.getElementById('heartbeat').textContent = `${data.bpm} bpm`;

    const time = new Date(data.timestamp);
    document.getElementById('timestamp').textContent =
      `Última actualización: ${time.toLocaleString()}`;
  };

  eventSource.onerror = (err) => {
    console.error("Error en SSE:", err);
  };
}

initLiveBPM();

// ✅ Logout híbrido
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch(`${API_BASE_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include'
  });

  localStorage.removeItem('username');
  localStorage.removeItem('token');

  window.location.href = 'index.html';
});

// 🚀 Función de prueba: enviar BPM manualmente
async function sendBPM(bpm) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heart`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
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

// 🚀 Función de prueba: cargar historial del usuario
async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heart/history`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
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
