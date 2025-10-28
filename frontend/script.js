const API_BASE_URL = 'http://localhost:3000';

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
