const API_BASE_URL = 'http://localhost:3000'; 

async function checkSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await res.json();
    console.log('Respuesta de /api/profile:', res.status, data);

    if (res.ok) {
      document.getElementById('welcomeMessage').textContent = `Bienvenido, ${data.message.split(' ')[1]} 👋`;
    } else {
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.error('Error en checkSession:', err);
    window.location.href = 'index.html';
  }
}

checkSession();

function simulateHeartbeat() {
  const bpm = Math.floor(Math.random() * (100 - 65 + 1)) + 65;
  document.getElementById('heartbeat').textContent = `${bpm} bpm`;

  const now = new Date();
  document.getElementById('timestamp').textContent =
    `Última actualización: ${now.toLocaleTimeString()}`;
}

setInterval(simulateHeartbeat, 3000);
simulateHeartbeat();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch(`${API_BASE_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include'
  });

  localStorage.removeItem('username');
  window.location.href = 'index.html';
});
