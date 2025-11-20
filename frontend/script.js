const API_BASE_URL = 'http://localhost:3000';

// 🔐 Verificar sesión al cargar la página
fetch(`${API_BASE_URL}/api/verify`, {
  method: 'GET',
  credentials: 'include'
})
  .then(async res => {
    if (!res.ok) return;
    const data = await res.json();
    if (data.authenticated) {
      window.location.href = 'dashboard.html';
    }
  })
  .catch(err => console.error('Error al verificar sesión:', err));

// 🧾 Manejar el envío del formulario de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('message');

  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      message.style.color = 'green';
      message.textContent = `Bienvenido, ${data.user}!`;
      localStorage.setItem('username', data.user);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      message.style.color = '#e74c3c';
      message.textContent = data.error;
    }
  } catch (err) {
    message.style.color = '#e74c3c';
    message.textContent = 'Error del servidor. Intenta más tarde.';
  }
});
