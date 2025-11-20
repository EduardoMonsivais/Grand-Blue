const API_BASE_URL = 'https://health-sen.onrender.com';
let db;

const request = indexedDB.open('offlineDB', 1);

request.onupgradeneeded = event => {
  db = event.target.result;
  if (!db.objectStoreNames.contains('pendingUsers')) {
    db.createObjectStore('pendingUsers', { keyPath: 'email' });
  }
};

request.onsuccess = event => {
  db = event.target.result;
  if (navigator.onLine) syncPendingUsers();
};

request.onerror = () => {
  console.error('Error al abrir IndexedDB');
};

function saveUserOffline(userData) {
  const tx = db.transaction(['pendingUsers'], 'readwrite');
  const store = tx.objectStore('pendingUsers');
  store.put(userData);
}

async function sendToServer(userData, showMessage = true) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    const data = await res.json();
    if (res.ok) {
      if (showMessage) {
        const message = document.getElementById('message');
        message.style.color = 'green';
        message.textContent = data.message;
        setTimeout(() => {
          window.location.href = 'inicio.html';
        }, 1000);
      }
    } else {
      if (showMessage) {
        const message = document.getElementById('message');
        message.style.color = '#e74c3c';
        message.textContent = data.error;
      }
    }
  } catch (err) {
    if (showMessage) {
      const message = document.getElementById('message');
      message.style.color = '#e74c3c';
      message.textContent = 'Error del servidor. Intenta más tarde.';
    }
    saveUserOffline(userData);
  }
}

function syncPendingUsers() {
  const tx = db.transaction(['pendingUsers'], 'readonly');
  const store = tx.objectStore('pendingUsers');
  const getAll = store.getAll();

  getAll.onsuccess = () => {
    getAll.result.forEach(user => {
      sendToServer(user, false);
      const deleteTx = db.transaction(['pendingUsers'], 'readwrite');
      deleteTx.objectStore('pendingUsers').delete(user.email);
    });
  };
}

window.addEventListener('online', syncPendingUsers);

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('message');

  const userData = { name, email, password };

  if (!navigator.onLine) {
    saveUserOffline(userData);
    message.style.color = '#f39c12';
    message.textContent = 'Guardado localmente. Se enviará cuando haya conexión.';
  } else {
    sendToServer(userData);
  }
});
