const API_BASE_URL = 'https://health-sen.onrender.com';
const token = localStorage.getItem('token');

console.log("Token actual en localStorage:", token);

async function checkSession() {
  if (!token) {
    console.warn("No hay token en localStorage, redirigiendo...");
    window.location.replace('index.html');
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
    window.location.replace('index.html');
  }
}

checkSession();

// ✅ Tiempo real con SSE
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

// ✅ Logout desde botón principal
document.getElementById('logoutBtn').addEventListener('click', logout);

// ✅ Logout desde menú lateral
function logout() {
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  window.location.replace('index.html');
}

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

async function loadChart() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heart/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const history = await res.json();

    const grouped = {};
    history.forEach(h => {
      const date = new Date(h.timestamp).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(h.bpm);
    });

    const labels = Object.keys(grouped);
    const data = labels.map(date => {
      const values = grouped[date];
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.round(avg);
    });

    const bgColors = data.map(bpm =>
      bpm < 60 || bpm > 100 ? 'rgba(231, 76, 60, 0.7)' : 'rgba(46, 204, 113, 0.7)'
    );

    new Chart(document.getElementById('bpmChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Promedio BPM',
          data,
          backgroundColor: bgColors
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  } catch (err) {
    console.error('Error cargando gráfica:', err);
  }
}

async function showProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    document.getElementById('profileInfo').innerHTML =
      `<p>Usuario: ${data.message}</p>`;
  } catch (err) {
    console.error('Error mostrando perfil:', err);
  }
}

// ✅ Mostrar solo una sección a la vez
function showSection(sectionId) {
  const sections = ['profileInfo', 'historyList', 'dailyChart'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === sectionId ? 'block' : 'none';
  });
}

// ✅ Activar menú hamburguesa sin errores
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const menu = document.getElementById('sideMenu');
      menu.classList.toggle('active');
    });
  }
});
