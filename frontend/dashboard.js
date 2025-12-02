const API_BASE_URL = 'https://health-sen.onrender.com';
const token = localStorage.getItem('token');

// 📌 Verificar sesión y guardar deviceId automáticamente
async function checkSession() {
  if (!token) {
    window.location.replace('index.html');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Sesión no válida');

    const data = await res.json();

    // Guardamos automáticamente el deviceId
    if (data.deviceId) {
      localStorage.setItem('deviceId', data.deviceId);
    }

    document.getElementById('welcomeMessage').textContent =
      `Bienvenido, ${data.user} 👋`;

    showProfile();
    loadHistory();
    loadChart();
  } catch (err) {
    console.error('Error en checkSession:', err);
    window.location.replace('index.html');
  }
}
checkSession();

// 📡 SSE para BPM en tiempo real
function initLiveBPM() {
  const eventSource = new EventSource(`${API_BASE_URL}/api/heart/live?token=${token}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    document.getElementById('heartbeat').textContent = `${data.bpm} bpm`;
    document.getElementById('timestamp').textContent =
      `Última actualización: ${new Date(data.timestamp).toLocaleString()}`;
  };

  eventSource.onerror = (err) => {
    console.error("Error en SSE:", err);
    eventSource.close();
  };
}
initLiveBPM();

// 📌 Logout
document.getElementById('logoutBtn').addEventListener('click', logout);
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('deviceId');
  window.location.replace('index.html');
}

// 📌 Mostrar perfil
async function showProfile() {
  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  document.getElementById('profileInfo').innerHTML =
    `<p>Usuario: ${data.user}</p><p>Device ID: ${data.deviceId}</p>`;
}

// 📌 Historial
async function loadHistory() {
  const res = await fetch(`${API_BASE_URL}/api/heart/history`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const history = await res.json();
  const list = document.getElementById('historyList');
  list.innerHTML = history.map(h =>
    `<li>${h.bpm} bpm - ${new Date(h.timestamp).toLocaleString()}</li>`
  ).join('');
}

// 📌 Gráfica diaria
async function loadChart() {
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
      scales: { y: { beginAtZero: true } }
    }
  });
}

// 📌 Mostrar solo una sección a la vez
function showSection(sectionId) {
  const sections = ['profileInfo', 'historyList', 'dailyChart'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === sectionId ? 'block' : 'none';
  });
}

// 📌 Menú hamburguesa
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const menu = document.getElementById('sideMenu');
      menu.classList.toggle('active');
    });
  }
});
