const API_BASE_URL = 'https://health-sen.onrender.com';
const token = localStorage.getItem('token');

// ✅ Verificación de sesión (cookie o token)
async function checkSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      credentials: 'include', // para web (cookies)
      headers: token ? { Authorization: `Bearer ${token}` } : {} // para móvil (token)
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

// ✅ Tiempo real con SSE
function initLiveBPM() {
  const eventSource = new EventSource(`${API_BASE_URL}/api/heart/live`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    document.getElementById('heartbeat').textContent = `${data.bpm} bpm`;

    const time = new Date(data.timestamp);
    document.getElementById('timestamp').textContent =
      `Última actualización: ${time.toLocaleString()}`;
  };

  eventSource.onerror = (err) => {
    console.error("Error en SSE:", err);
    // Si falla, puedes reconectar o mostrar un mensaje
  };
}

initLiveBPM();

// ✅ Logout híbrido
document.getElementById('logoutBtn').addEventListener('click', async () => {
  // Borra cookie en web
  await fetch(`${API_BASE_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include'
  });

  // Borra token en móvil
  localStorage.removeItem('username');
  localStorage.removeItem('token');

  window.location.href = 'index.html';
});
