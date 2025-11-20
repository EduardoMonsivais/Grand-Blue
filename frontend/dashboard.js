const API_BASE_URL = 'https://health-sen.onrender.com';
const token = localStorage.getItem('token');

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

async function loadLastBPM() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heart/latest`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!res.ok) throw new Error("No se pudo obtener los datos");

    const data = await res.json();

    document.getElementById('heartbeat').textContent = `${data.bpm} bpm`;

    const time = new Date(data.timestamp);
    document.getElementById('timestamp').textContent =
      `Última actualización: ${time.toLocaleString()}`;

  } catch (err) {
    console.error("Error obteniendo BPM:", err);
  }
}

setInterval(loadLastBPM, 2000);
loadLastBPM();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch(`${API_BASE_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include'
  });

  localStorage.removeItem('username');
  localStorage.removeItem('token');

  window.location.href = 'index.html';
});
