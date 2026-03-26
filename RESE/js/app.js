// ============================================================
// App JS — Dashboard, Real-Time Polling, Notifications
// ============================================================

const API = 'api';
const POLL_INTERVAL = 4000;      // 4-second AJAX poll
const NOTIF_POLL    = 6000;      // 6-second notification poll

let currentFilter  = '';
let pollTimer      = null;
let notifTimer     = null;
let lastServerTime = null;        // used for delta polling
let cachedEvents   = [];          // in-memory event list

// ─── DOM refs ──────────────────────────────────────────────
const eventsArea     = document.getElementById('eventsArea');
const toastContainer = document.getElementById('toastContainer');
const bellBadge      = document.getElementById('bellBadge');
const notifList      = document.getElementById('notifList');
const notifDropdown  = document.getElementById('notifDropdown');
const bellWrap       = document.getElementById('bellWrap');

// ─── Init ──────────────────────────────────────────────────
(async function init() {
  // Check session
  try {
    const res  = await fetch(`${API}/session.php`);
    const data = await res.json();
    if (!data.loggedIn) { location.href = 'login.html'; return; }

    // Populate user chip
    const user = data.user;
    localStorage.setItem('user', JSON.stringify(user));
    document.getElementById('userName').textContent = user.username;
    const avatar = document.getElementById('userAvatar');
    avatar.style.background = user.avatar_color;
    avatar.textContent = user.username.charAt(0).toUpperCase();
  } catch {
    location.href = 'login.html';
    return;
  }

  // First full fetch
  await fetchEvents();

  // Start polling
  pollTimer  = setInterval(pollEvents, POLL_INTERVAL);
  notifTimer = setInterval(fetchNotifications, NOTIF_POLL);
  fetchNotifications();

  // Wire up UI
  wireFilters();
  wireModals();
  wireLogout();
  wireBell();
})();

// ─── Fetch all events ──────────────────────────────────────
async function fetchEvents() {
  try {
    let url = `${API}/get_events.php?`;
    if (currentFilter) url += `status=${currentFilter}&`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.success) {
      cachedEvents   = data.events;
      lastServerTime = data.server_time;
      renderEvents(cachedEvents);
    }
  } catch (err) {
    console.error('fetchEvents', err);
  }
}

// ─── Poll for updates (delta) ──────────────────────────────
async function pollEvents() {
  try {
    let url = `${API}/get_events.php?`;
    if (currentFilter) url += `status=${currentFilter}&`;
    // Always fetch all for status filter accuracy; use since for new events
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.success) return;

    const newEvents = data.events;
    // Detect changes
    if (JSON.stringify(newEvents) !== JSON.stringify(cachedEvents)) {
      cachedEvents   = newEvents;
      lastServerTime = data.server_time;
      renderEvents(cachedEvents);
    }
  } catch (err) {
    console.error('pollEvents', err);
  }
}

// ─── Render event cards ────────────────────────────────────
function renderEvents(events) {
  if (!events.length) {
    eventsArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📭</div>
        <h3>No events found</h3>
        <p>Create an event to get started.</p>
      </div>`;
    return;
  }

  const html = `<div class="events-grid">${events.map(ev => eventCardHTML(ev)).join('')}</div>`;
  eventsArea.innerHTML = html;

  // Attach update buttons
  document.querySelectorAll('.js-update-btn').forEach(btn => {
    btn.addEventListener('click', () => openUpdateModal(btn.dataset));
  });
}

function eventCardHTML(ev) {
  const date = new Date(ev.event_date);
  const dateStr = date.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

  const categoryIcons = { meeting:'🤝', workshop:'🛠️', webinar:'🎥', social:'🎉', other:'📌' };
  const icon = categoryIcons[ev.category] || '📌';

  return `
    <div class="card event-card">
      <span class="event-card__category">${icon} ${ev.category}</span>
      <span class="event-card__status event-card__status--${ev.status}">${ev.status}</span>
      <h3>${escapeHTML(ev.title)}</h3>
      <div class="event-card__meta">
        <span>📅 ${dateStr}</span>
        <span>🕐 ${timeStr}</span>
        ${ev.location ? `<span>📍 ${escapeHTML(ev.location)}</span>` : ''}
      </div>
      <p class="event-card__desc">${escapeHTML(ev.description || 'No description provided.')}</p>
      <div class="event-card__footer">
        <div class="event-card__creator">
          <span class="mini-avatar" style="background:${ev.avatar_color}">${ev.creator_name.charAt(0).toUpperCase()}</span>
          ${escapeHTML(ev.creator_name)}
        </div>
        <button class="btn btn--secondary btn--sm js-update-btn"
                data-id="${ev.id}" data-title="${escapeHTML(ev.title)}" data-status="${ev.status}">
          Update
        </button>
      </div>
    </div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Filters ───────────────────────────────────────────────
function wireFilters() {
  const btns = document.querySelectorAll('#statusFilters .filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      fetchEvents();
    });
  });
}

// ─── Modals ────────────────────────────────────────────────
function wireModals() {
  const createOverlay = document.getElementById('createModal');
  const updateOverlay = document.getElementById('updateModal');

  document.getElementById('openCreateModal').addEventListener('click',  () => createOverlay.classList.add('open'));
  document.getElementById('closeCreateModal').addEventListener('click', () => createOverlay.classList.remove('open'));
  document.getElementById('closeUpdateModal').addEventListener('click', () => updateOverlay.classList.remove('open'));

  // Close on overlay click
  createOverlay.addEventListener('click', e => { if(e.target === createOverlay) createOverlay.classList.remove('open'); });
  updateOverlay.addEventListener('click', e => { if(e.target === updateOverlay) updateOverlay.classList.remove('open'); });

  // Create event form
  document.getElementById('createEventForm').addEventListener('submit', handleCreateEvent);

  // Update event form
  document.getElementById('updateEventForm').addEventListener('submit', handleUpdateEvent);
}

async function handleCreateEvent(e) {
  e.preventDefault();
  const btn = document.getElementById('createBtn');
  btn.disabled = true;
  btn.textContent = 'Creating…';

  try {
    const res = await fetch(`${API}/create_event.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:       document.getElementById('evTitle').value.trim(),
        description: document.getElementById('evDesc').value.trim(),
        category:    document.getElementById('evCategory').value,
        event_date:  document.getElementById('evDate').value,
        location:    document.getElementById('evLocation').value.trim(),
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Event created successfully!', 'success');
      document.getElementById('createEventForm').reset();
      document.getElementById('createModal').classList.remove('open');
      fetchEvents();
    } else {
      showToast(data.message, 'error');
    }
  } catch {
    showToast('Network error', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Event';
  }
}

function openUpdateModal(dataset) {
  document.getElementById('upEventId').value    = dataset.id;
  document.getElementById('upEventTitle').textContent = dataset.title;
  document.getElementById('upStatus').value     = dataset.status;
  document.getElementById('upMessage').value    = '';
  document.getElementById('updateModal').classList.add('open');
}

async function handleUpdateEvent(e) {
  e.preventDefault();
  const btn = document.getElementById('updateBtn');
  btn.disabled = true;
  btn.textContent = 'Updating…';

  try {
    const res = await fetch(`${API}/update_event.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: document.getElementById('upEventId').value,
        status:   document.getElementById('upStatus').value,
        message:  document.getElementById('upMessage').value.trim(),
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Event status updated!', 'success');
      document.getElementById('updateModal').classList.remove('open');
      fetchEvents();
    } else {
      showToast(data.message, 'error');
    }
  } catch {
    showToast('Network error', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Status';
  }
}

// ─── Notifications ─────────────────────────────────────────
async function fetchNotifications() {
  try {
    const res  = await fetch(`${API}/get_notifications.php`);
    const data = await res.json();
    if (!data.success) return;

    // Badge
    if (data.unread_count > 0) {
      bellBadge.style.display = 'flex';
      bellBadge.textContent   = data.unread_count > 9 ? '9+' : data.unread_count;
    } else {
      bellBadge.style.display = 'none';
    }

    // List
    if (data.notifications.length === 0) {
      notifList.innerHTML = '<div class="notif-empty">No notifications yet</div>';
    } else {
      notifList.innerHTML = data.notifications.map(n => {
        const time = timeAgo(new Date(n.created_at));
        return `<div class="notif-item ${n.is_read == 0 ? 'unread' : ''}">
                  <div>${escapeHTML(n.message)}</div>
                  <div class="notif-item__time">${time}</div>
                </div>`;
      }).join('');
    }
  } catch (err) {
    console.error('fetchNotifications', err);
  }
}

function wireBell() {
  bellWrap.addEventListener('click', e => {
    e.stopPropagation();
    notifDropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => notifDropdown.classList.remove('open'));
  notifDropdown.addEventListener('click', e => e.stopPropagation());

  document.getElementById('markAllRead').addEventListener('click', async () => {
    await fetch(`${API}/mark_notifications_read.php`);
    bellBadge.style.display = 'none';
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  });
}

// ─── Toast ─────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = msg;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

// ─── Logout ────────────────────────────────────────────────
function wireLogout() {
  document.getElementById('logoutBtn').addEventListener('click', async e => {
    e.preventDefault();
    await fetch(`${API}/logout.php`);
    localStorage.removeItem('user');
    clearInterval(pollTimer);
    clearInterval(notifTimer);
    location.href = 'login.html';
  });
}

// ─── Helpers ───────────────────────────────────────────────
function timeAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return Math.floor(secs/60) + 'm ago';
  if (secs < 86400) return Math.floor(secs/3600) + 'h ago';
  return Math.floor(secs/86400) + 'd ago';
}
