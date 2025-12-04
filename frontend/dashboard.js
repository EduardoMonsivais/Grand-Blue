const API_BASE_URL = 'https://health-sen.onrender.com';
const token = localStorage.getItem('token');
const LOCALE = 'es-MX';
const TIMEZONE = 'America/Monterrey';
let bpmChartInstance = null;

function formatLocal(dateLike) {
  try {
    return new Date(dateLike).toLocaleString(LOCALE, { timeZone: TIMEZONE });
  } catch {
    return '';
  }
}

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

    if (data.deviceId) {
      localStorage.setItem('deviceId', data.deviceId);
    }

    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) welcomeEl.textContent = `Bienvenido, ${data.user} 👋`;

    const profileNameEl = document.getElementById('profileName');
    if (profileNameEl) profileNameEl.textContent = data.user;

    const adminMenuEl = document.getElementById('adminMenu');
    if (adminMenuEl) adminMenuEl.style.display = (data.role === 'admin') ? 'block' : 'none';

    const sideMenu = document.getElementById('sideMenu');
    const menuToggle = document.getElementById('menuToggle');
    if (sideMenu) sideMenu.style.display = 'block';
    if (menuToggle) menuToggle.style.display = 'block';

    // Limpiar menú
    document.querySelector('li[onclick*="settings"]')?.remove();
    document.querySelector('.extras')?.remove();

    if (data.role === 'admin') {
      // Remover texto "Tu ritmo cardíaco en tiempo real"
      const container = document.querySelector('.container');
      if (container) {
        const ps = container.querySelectorAll('p');
        for (const p of ps) {
          const text = (p.textContent || '').trim().toLowerCase();
          if (text.includes('tu ritmo cardíaco en tiempo real')) {
            p.remove();
            break;
          }
        }
      }

      // Ocultar cardio-box y timestamp
      const cardioBox = document.querySelector('.cardio-box');
      if (cardioBox) cardioBox.style.display = 'none';
      const timestampEl = document.getElementById('timestamp');
      if (timestampEl) timestampEl.style.display = 'none';

      // Ocultar historial y gráfica
      const historyEl = document.getElementById('historyList');
      if (historyEl) historyEl.style.display = 'none';
      const chartEl = document.getElementById('dailyChart');
      if (chartEl) chartEl.style.display = 'none';

      // Ocultar opciones del menú lateral
      const historyMenuItem = document.querySelector('li[onclick*="historyList"]');
      if (historyMenuItem) historyMenuItem.style.display = 'none';
      const chartMenuItem = document.querySelector('li[onclick*="dailyChart"]');
      if (chartMenuItem) chartMenuItem.style.display = 'none';

      // Mostrar panel admin
      const adminPanelEl = document.getElementById('adminPanel');
      if (adminPanelEl) adminPanelEl.style.display = 'block';

      await loadAdminPulses();
      showSection('adminPanel');
      return;
    }

    // Usuario normal
    showProfile();
    loadHistory();
    loadChart();
    initLiveBPM();

  } catch (err) {
    console.error('Error en checkSession:', err);
    window.location.replace('index.html');
  }
}
checkSession();

function initLiveBPM() {
  const heartbeatEl = document.getElementById('heartbeat');
  const timestampEl = document.getElementById('timestamp');
  const cardioBox = document.querySelector('.cardio-box');
  if (!heartbeatEl || !timestampEl || !cardioBox) return;

  const lastBPM = parseInt(localStorage.getItem('lastBPM'));
  const lastTime = localStorage.getItem('lastTimestamp');

  if (!isNaN(lastBPM) && lastTime) {
    heartbeatEl.textContent = `${lastBPM} bpm`;
    timestampEl.textContent = `Última actualización: ${formatLocal(lastTime)}`;
    cardioBox.style.backgroundColor = (lastBPM < 60 || lastBPM > 100) ? '#e74c3c' : '#1abc9c';
    cardioBox.style.boxShadow = (lastBPM < 60 || lastBPM > 100) ? '0 0 20px rgba(231, 76, 60, 0.8)' : 'none';
  } else {
    heartbeatEl.textContent = '-- bpm';
    timestampEl.textContent = '';
  }

  const eventSource = new EventSource(`${API_BASE_URL}/api/heart/live?token=${token}`);
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const bpm = parseInt(data.bpm);
    const time = data.timestamp;

    localStorage.setItem('lastBPM', bpm);
    localStorage.setItem('lastTimestamp', time);

    heartbeatEl.textContent = `${bpm} bpm`;
    timestampEl.textContent = `Última actualización: ${formatLocal(time)}`;
    cardioBox.style.backgroundColor = (bpm < 60 || bpm > 100) ? '#e74c3c' : '#1abc9c';
    cardioBox.style.boxShadow = (bpm < 60 || bpm > 100) ? '0 0 20px rgba(231, 76, 60, 0.8)' : 'none';
  };
  eventSource.onerror = (err) => {
    console.error('Error en SSE:', err);
    eventSource.close();
  };
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('deviceId');
  localStorage.removeItem('lastBPM');
  localStorage.removeItem('lastTimestamp');
  window.location.replace('index.html');
}

async function showProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const el = document.getElementById('profileInfo');
    if (el) el.innerHTML = `<p>Usuario: ${data.user}</p><p>Device ID: ${data.deviceId || '—'}</p>`;
  } catch (err) {
    console.error('Error mostrando perfil:', err);
  }
}

async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heart/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const history = await res.json();
    const lastTen = Array.isArray(history) ? history.slice(-10) : [];

    const list = document.getElementById('historyList');
    if (list) {
      list.innerHTML = lastTen.map(h =>
        `<li>${h.bpm} bpm - ${formatLocal(h.timestamp)}</li>`
      ).join('');
    }
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
      const date = new Date(h.timestamp).toLocaleDateString(LOCALE, { timeZone: TIMEZONE });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(h.bpm);
    });

    let labels = Object.keys(grouped);
    let data = labels.map(date => {
      const values = grouped[date];
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.round(avg);
    });

    if (labels.length > 10) {
      labels = labels.slice(-10);
      data = data.slice(-10);
    }

    const chartCanvas = document.getElementById('bpmChart');
    if (!chartCanvas) return;

    // Destruir instancia previa si existe (solución al error de Chart.js)
    if (bpmChartInstance) {
      bpmChartInstance.destroy();
    }

    bpmChartInstance = new Chart(chartCanvas, {
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
          pointRadius: 4
        }]
      },
      options: {
        scales: { y: { beginAtZero: true, suggestedMax: 120 } },
        plugins: { legend: { labels: { color: 'white' } } }
      }
    });
  } catch (err) {
    console.error('Error cargando gráfica:', err);
  }
}

async function loadAdminPulses() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/pulses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No autorizado o error al cargar pulsos');
    const data = await res.json();

    const table = document.getElementById('adminPulseTable');
    if (!table) return;

    table.innerHTML = data.map(u => `
      <tr>
        <td>${u.user}</td>
        <td>${u.email}</td>
        <td>${u.deviceId || '—'}</td>
        <td>${u.role}</td>
        <td>${(u.bpm !== null && u.bpm !== undefined) ? u.bpm : 'Sin datos'}</td>
        <td>${u.timestamp ? formatLocal(u.timestamp) : '—'}</td>
        <td>
          <button class="action-btn" onclick="toggleRole('${u.email}', '${u.role}')">
            Convertir a ${u.role === 'admin' ? 'usuario' : 'admin'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error cargando pulsos admin:', err);
  }
}

async function toggleRole(email, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/change-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email, role: newRole })
    });

    const result = await res.json();
    alert(result.message || 'Rol actualizado');
    loadAdminPulses();
  } catch (err) {
    console.error('Error cambiando rol:', err);
  }
}

function showSection(sectionId) {
  const sections = ['profileInfo', 'historyList', 'dailyChart', 'adminPanel'];
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

  const menu = document.getElementById('sideMenu');
  if (menu) menu.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const menu = document.getElementById('sideMenu');
      if (menu) menu.classList.toggle('active');
    });
  }
});
