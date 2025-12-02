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

    const profileNameEl = document.getElementById('profileName');
    if (profileNameEl) profileNameEl.textContent = data.user;

    showProfile();
    loadHistory();
    loadChart();
  } catch (err) {
    console.error('Error en checkSession:', err);
    window.location.replace('index.html');
  }
}
checkSession();

// 📡 SSE para BPM en tiempo real con alerta
function initLiveBPM() {
  const eventSource = new EventSource(`${API_BASE_URL}/api/heart/live?token=${token}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const bpm = data.bpm;

    document.getElementById('heartbeat').textContent = `${bpm} bpm`;
    document.getElementById('timestamp').textContent =
      `Última actualización: ${new Date(data.timestamp).toLocaleString()}`;

    // 🚨 Alerta si el ritmo está fuera de rango
    const cardioBox = document.querySelector('.cardio-box');
    if (bpm < 60 || bpm > 100) {
      cardioBox.style.backgroundColor = '#e74c3c'; // rojo alerta
      cardioBox.style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.8)';
    } else {
      cardioBox.style.backgroundColor = '#1abc9c'; // verde normal
      cardioBox.style.boxShadow = 'none';
    }
  };

  eventSource.onerror = (err) => {
    console.error("Error en SSE:", err);
    eventSource.close();
  };
}
initLiveBPM();

// 📌 Logout (solo menú lateral)
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('deviceId');
  window.location.replace('index.html');
}

// 📌 Mostrar perfil
async function showProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    document.getElementById('profileInfo').innerHTML =
      `<p>Usuario: ${data.user}</p><p>Device ID: ${data.deviceId}</p>`;
  } catch (err) {
    console.error('Error mostrando perfil:', err);
  }
}

// 📌 Historial (solo últimos 10 registros)
async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heart/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const history = await res.json();

    // Tomamos solo los últimos 10 registros
    const lastTen = history.slice(-10);

    const list = document.getElementById('historyList');
    list.innerHTML = lastTen.map(h =>
      `<li>${h.bpm} bpm - ${new Date(h.timestamp).toLocaleString()}</li>`
    ).join('');
  } catch (err) {
    console.error('Error cargando historial:', err);
  }
}

// 📌 Gráfica diaria (solo últimos 10 días)
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

    let labels = Object.keys(grouped);
    let data = labels.map(date => {
      const values = grouped[date];
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.round(avg);
    });

    // 🚦 Solo últimos 10 días
    if (labels.length > 10) {
      labels = labels.slice(-10);
      data = data.slice(-10);
    }

    const bgColors = data.map(bpm =>
      bpm < 60 || bpm > 100 ? 'rgba(231, 76, 60, 1)' : 'rgba(46, 204, 113, 1)'
    );

    new Chart(document.getElementById('bpmChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Promedio BPM',
          data,
          borderColor: 'rgba(52, 152, 219, 1)',
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: bgColors
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 120
          }
        },
        plugins: {
          legend: {
            labels: {
              color: 'white'
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Error cargando gráfica:', err);
  }
}

// 📌 Mostrar solo una sección a la vez con animación
function showSection(sectionId) {
  const sections = ['profileInfo', 'historyList', 'dailyChart'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.style.display = 'none';
    }
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.style.display = 'block';
    setTimeout(() => target.classList.add('active'), 10);
  }

  // 👇 Cerrar menú automáticamente al seleccionar
  const menu = document.getElementById('sideMenu');
  if (menu) menu.classList.remove('active');
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
