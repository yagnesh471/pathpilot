const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const jobs = [
  'Frontend Developer', 'Data Scientist', 'Product Manager', 'DevOps Engineer',
  'Cybersecurity Analyst', 'AI Researcher', 'Cloud Architect', 'Blockchain Developer'
];

const qs = selector => document.querySelector(selector);
const qsa = selector => document.querySelectorAll(selector);

const getToken = () => localStorage.getItem('pp_token');
const getUser = () => JSON.parse(localStorage.getItem('pp_user') || 'null');

function saveAuth(data) {
  localStorage.setItem('pp_token', data.token);
  localStorage.setItem('pp_user', JSON.stringify(data.user));
}

function clearAuth() {
  localStorage.removeItem('pp_token');
  localStorage.removeItem('pp_user');
}

function showAuthMessage(message, type = 'error') {
  qs('#authMessage').innerHTML = message ? `<div class="${type === 'error' ? 'error-box' : 'success-box'}">${message}</div>` : '';
}

function initTheme() {
  const saved = localStorage.getItem('pp_theme') || 'bright';
  document.documentElement.dataset.theme = saved;
  qs('#themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'bright';
  const next = current === 'dark' ? 'bright' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('pp_theme', next);
  qs('#themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

function showApp() {
  const user = getUser();
  qs('#authPage').classList.add('hidden');
  qs('#appShell').classList.remove('hidden');
  qsa('.app-only').forEach(el => el.classList.remove('hidden'));
  qs('#userName').textContent = user?.name ? `Hi, ${user.name}` : '';
}

function showAuth() {
  qs('#authPage').classList.remove('hidden');
  qs('#appShell').classList.add('hidden');
  qsa('.app-only').forEach(el => el.classList.add('hidden'));
}

function switchAuthTab(mode) {
  const login = mode === 'login';
  qs('#loginTab').classList.toggle('active', login);
  qs('#signupTab').classList.toggle('active', !login);
  qs('#loginForm').classList.toggle('hidden', !login);
  qs('#signupForm').classList.toggle('hidden', login);
  showAuthMessage('');
}

function switchTab(tab) {
  qsa('.page').forEach(p => p.classList.remove('active'));
  qsa('.nav-tab').forEach(t => t.classList.remove('active'));
  qs(`#page-${tab}`).classList.add('active');
  qs(`#tab-${tab}`).classList.add('active');
  if (tab === 'history') renderHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setJob(name) { qs('#jobInput').value = name; qs('#jobInput').focus(); }

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      showAuth();
    }
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function handleLogin(e) {
  e.preventDefault();
  showAuthMessage('');
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: qs('#loginEmail').value.trim(),
        password: qs('#loginPassword').value
      })
    });
    saveAuth(data);
    showApp();
    switchTab('home');
  } catch (error) {
    showAuthMessage(`⚠️ ${error.message}`);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  showAuthMessage('');
  try {
    const data = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: qs('#signupName').value.trim(),
        email: qs('#signupEmail').value.trim(),
        password: qs('#signupPassword').value
      })
    });
    saveAuth(data);
    showApp();
    switchTab('home');
  } catch (error) {
    showAuthMessage(`⚠️ ${error.message}`);
  }
}

async function renderHistory() {
  const list = qs('#historyList');
  list.innerHTML = `<div class="history-empty"><span>⏳</span>Loading your history...</div>`;
  try {
    const data = await api('/history');
    const history = data.history || [];
    if (history.length === 0) {
      list.innerHTML = `<div class="history-empty"><span>🗂️</span>No searches yet.<br>Generate a roadmap to see it here.</div>`;
      return;
    }

    list.innerHTML = `<div class="history-list">
      ${history.map(item => `
        <div class="history-item" data-id="${item._id}">
          <div class="history-item-left">
            <div class="history-job">${escapeHtml(item.title || item.job)}</div>
            <div class="history-date">${formatDate(item.createdAt)}</div>
          </div>
          <div class="history-arrow">→</div>
        </div>`).join('')}
    </div>`;

    qsa('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = history.find(h => h._id === el.dataset.id);
        if (!item) return;
        qs('#jobInput').value = item.job;
        switchTab('home');
        renderRoadmap(item.roadmap);
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="error-box">⚠️ ${err.message}</div>`;
  }
}

async function clearHistory() {
  if (!confirm('Clear only your search history?')) return;
  try {
    await api('/history', { method: 'DELETE' });
    renderHistory();
  } catch (err) {
    qs('#historyList').innerHTML = `<div class="error-box">⚠️ ${err.message}</div>`;
  }
}

async function generateRoadmap() {
  const job = qs('#jobInput').value.trim();
  if (!job) { showError('Please enter a job title.'); return; }

  const btn = qs('#generateBtn');
  const loading = qs('#loading');
  const result = qs('#result');

  btn.disabled = true;
  result.classList.remove('active');
  result.innerHTML = '';
  loading.classList.add('active');
  qs('#loadingText').textContent = 'Building your roadmap...';

  try {
    const data = await api('/roadmap', { method: 'POST', body: JSON.stringify({ job }) });
    renderRoadmap(data.roadmap);
  } catch (err) {
    showError(`Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    loading.classList.remove('active');
  }
}

function showError(msg) {
  qs('#loading').classList.remove('active');
  qs('#generateBtn').disabled = false;
  const result = qs('#result');
  result.innerHTML = `<div class="error-box">⚠️ ${escapeHtml(msg)}</div>`;
  result.classList.add('active');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function pills(arr = []) {
  return `<div class="pill-list">${arr.map(i => `<span class="pill">${escapeHtml(i)}</span>`).join('')}</div>`;
}

function listItems(arr = []) {
  return `<ul>${arr.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

function renderRoadmap(r) {
  const result = qs('#result');
  result.innerHTML = `
    <div class="result-title">${escapeHtml(r.title)}</div>
    <div class="result-tagline">${escapeHtml(r.tagline)}</div>
    <div class="section"><div class="section-label">Overview</div><p>${escapeHtml(r.overview)}</p></div><hr>
    <div class="section"><div class="section-label">Foundational Skills</div>${pills(r.foundational_skills)}</div>
    <div class="section"><div class="section-label">Technical Skills</div>${pills(r.technical_skills)}</div>
    <div class="section"><div class="section-label">Tools & Technologies</div>${pills(r.tools_and_technologies)}</div><hr>
    <div class="section">
      <div class="section-label">Learning Timeline</div>
      <div class="timeline-grid">
        <div class="timeline-card"><div class="t-label">0 – 6 Months</div><p>${escapeHtml(r.timeline?.short_term)}</p></div>
        <div class="timeline-card"><div class="t-label">6 – 18 Months</div><p>${escapeHtml(r.timeline?.mid_term)}</p></div>
        <div class="timeline-card"><div class="t-label">18+ Months</div><p>${escapeHtml(r.timeline?.long_term)}</p></div>
      </div>
    </div><hr>
    <div class="section"><div class="section-label">Learning Resources</div>${listItems(r.learning_resources)}</div>
    <div class="section"><div class="section-label">Certifications</div>${listItems(r.certifications)}</div><hr>
    <div class="section"><div class="section-label">Career Progression</div>${listItems(r.career_progression)}</div>
    <div class="section"><div class="section-label">Soft Skills</div>${pills(r.soft_skills)}</div><hr>
    <div class="section"><div class="section-label">Salary Insight</div><p>${escapeHtml(r.salary_insight)}</p></div>
    <div class="section"><div class="section-label">Pro Tips</div>${listItems(r.tips)}</div>`;
  result.classList.add('active');
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function init() {
  initTheme();
  qs('#themeToggle').addEventListener('click', toggleTheme);
  qs('#loginTab').addEventListener('click', () => switchAuthTab('login'));
  qs('#signupTab').addEventListener('click', () => switchAuthTab('signup'));
  qs('#loginForm').addEventListener('submit', handleLogin);
  qs('#signupForm').addEventListener('submit', handleSignup);
  qs('#logoutBtn').addEventListener('click', () => { clearAuth(); showAuth(); });
  qs('#tab-home').addEventListener('click', () => switchTab('home'));
  qs('#tab-history').addEventListener('click', () => switchTab('history'));
  qs('#clearBtn').addEventListener('click', clearHistory);
  qs('#generateBtn').addEventListener('click', generateRoadmap);
  qs('#jobInput').addEventListener('keydown', e => { if (e.key === 'Enter') generateRoadmap(); });

  qs('#tagList').innerHTML = jobs.map(job => `<span class="tag">${job}</span>`).join('');
  qsa('.tag').forEach(tag => tag.addEventListener('click', () => setJob(tag.textContent)));

  if (getToken()) showApp(); else showAuth();
}

init();
