// ============================================================
// Auth JS — Login & Registration
// ============================================================

const API = 'api';

// ─── Toggle views ──────────────────────────────────────────
const loginView    = document.getElementById('loginView');
const registerView = document.getElementById('registerView');
const showRegister = document.getElementById('showRegister');
const showLogin    = document.getElementById('showLogin');

function toggleView(view) {
  if (view === 'register') {
    loginView.style.display = 'none';
    registerView.style.display = 'block';
  } else {
    loginView.style.display = 'block';
    registerView.style.display = 'none';
  }
}

showRegister.addEventListener('click', e => { e.preventDefault(); toggleView('register'); });
showLogin.addEventListener('click', e => { e.preventDefault(); toggleView('login'); });

// Check hash on load
if (location.hash === '#register') toggleView('register');

// ─── Error display ─────────────────────────────────────────
function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('show');
}
function clearError(el) {
  el.textContent = '';
  el.classList.remove('show');
}

// ─── Login ─────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  clearError(errEl);

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const res = await fetch(`${API}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      location.href = 'dashboard.html';
    } else {
      showError(errEl, data.message);
    }
  } catch {
    showError(errEl, 'Network error. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

// ─── Register ──────────────────────────────────────────────
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('registerError');
  clearError(errEl);

  const btn = document.getElementById('regBtn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const res = await fetch(`${API}/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('regUsername').value.trim(),
        email:    document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      location.href = 'dashboard.html';
    } else {
      showError(errEl, data.message);
    }
  } catch {
    showError(errEl, 'Network error. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});
