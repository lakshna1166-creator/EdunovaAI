export const renderInteractiveDashboard = (schemaSql = "") => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduMind AI - Backend API Explorer & Control Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0B0F19;
      --bg-card: #111827;
      --bg-input: #1F2937;
      --border: #374151;
      --primary: #3B82F6;
      --primary-hover: #2563EB;
      --teacher: #0D9488;
      --accent: #8B5CF6;
      --text-main: #F9FAFB;
      --text-muted: #9CA3AF;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-dark);
      color: var(--text-main);
      line-height: 1.5;
      padding: 24px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header Banner */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%);
      border: 1px solid #312E81;
      border-radius: 20px;
      padding: 28px 36px;
      margin-bottom: 28px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-badge {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .header p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34D399;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 0.88rem;
      font-weight: 600;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #34D399;
      border-radius: 50%;
      box-shadow: 0 0 10px #34D399;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.95rem;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: var(--bg-card);
      color: #60A5FA;
      border: 1px solid #2563EB;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    /* Grid Layout */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 860px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Forms */
    .form-group {
      margin-bottom: 14px;
    }

    label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    input, select, textarea {
      width: 100%;
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 14px;
      color: var(--text-main);
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: border 0.2s;
    }

    input:focus, select:focus, textarea:focus {
      border-color: var(--primary);
    }

    .btn {
      background: var(--primary);
      color: #FFF;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn:hover {
      background: var(--primary-hover);
    }

    .btn-teacher {
      background: var(--teacher);
    }

    .btn-secondary {
      background: #374151;
      color: #E5E7EB;
    }

    .btn-secondary:hover {
      background: #4B5563;
    }

    /* Response Console */
    pre, code {
      font-family: 'JetBrains Mono', monospace;
    }

    .console-box {
      background: #030712;
      border: 1px solid #1F2937;
      border-radius: 12px;
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
      font-size: 0.85rem;
      color: #38BDF8;
    }

    /* Endpoints list */
    .endpoint-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 10px;
    }

    .endpoint-method {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
    }

    .method-get { background: #064E3B; color: #34D399; }
    .method-post { background: #1E3A8A; color: #60A5FA; }
    .method-put { background: #78350F; color: #FBBF24; }

    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88rem;
      margin-left: 12px;
    }

    .token-bar {
      background: #1E1B4B;
      border: 1px solid #4338CA;
      padding: 14px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .token-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      color: #A5B4FC;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="header-title">
        <div class="logo-badge">🧠</div>
        <div>
          <h1>EduNovaAI Backend Control Center</h1>
          <p>Express 5 + Argon2 + JWT + Supabase PostgreSQL API Engine</p>
        </div>
      </div>
      <div class="status-pill">
        <div class="status-dot"></div>
        <span>Backend Online (Port 5000)</span>
      </div>
    </header>

    <!-- Global Active Token Bar -->
    <div class="token-bar">
      <span style="font-weight: 700; font-size: 0.85rem; color: #E0E7FF;">🔑 ACTIVE JWT:</span>
      <span id="activeTokenDisplay" class="token-text">No active token. Please login or register below.</span>
      <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="clearToken()">Clear</button>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn active" onclick="showTab('tab-tester')">⚡ Interactive API Explorer</button>
      <button class="tab-btn" onclick="showTab('tab-sql')">🗄️ Supabase SQL Schema</button>
      <button class="tab-btn" onclick="showTab('tab-env')">⚙️ Environment Variables (.env)</button>
      <button class="tab-btn" onclick="showTab('tab-docs')">📖 API Route Directory</button>
    </div>

    <!-- TAB 1: INTERACTIVE API EXPLORER -->
    <div id="tab-tester" class="tab-content active">
      <div class="grid-2">
        <!-- Auth & Action Panel -->
        <div>
          <!-- Quick Register / Login Form -->
          <div class="card">
            <div class="card-title">🔐 Student Authentication (Argon2 + JWT)</div>

            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="authName" value="Alex Rivera" placeholder="Alex Rivera">
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="authEmail" value="alex@student.edu" placeholder="alex@student.edu">
            </div>

            <div class="form-group">
              <label>Password</label>
              <input type="password" id="authPassword" value="EduNova@2026!" placeholder="Password">
            </div>

            <div style="display: flex; gap: 10px; margin-top: 18px;">
              <button class="btn" onclick="handleRegister()">Register Student (Argon2)</button>
              <button class="btn btn-secondary" onclick="handleLogin()">Login (JWT)</button>
            </div>
          </div>

          <!-- Quick Test Actions -->
          <div class="card">
            <div class="card-title">🧪 1-Click Student API Tests</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button class="btn btn-secondary" style="justify-content: flex-start;" onclick="runApiTest('GET', '/api/test-supabase')">
                <span class="endpoint-method method-get">GET</span> /api/test-supabase (DB Health)
              </button>
              <button class="btn btn-secondary" style="justify-content: flex-start;" onclick="runApiTest('GET', '/api/auth/me', true)">
                <span class="endpoint-method method-get">GET</span> /api/auth/me (Current Student)
              </button>
              <button class="btn btn-secondary" style="justify-content: flex-start;" onclick="runApiTest('GET', '/api/student/dashboard', true)">
                <span class="endpoint-method method-get">GET</span> /api/student/dashboard (Personal Dashboard)
              </button>
              <button class="btn btn-secondary" style="justify-content: flex-start;" onclick="runApiTest('GET', '/api/student/progress', true)">
                <span class="endpoint-method method-get">GET</span> /api/student/progress (Isolated Progress)
              </button>
              <button class="btn btn-secondary" style="justify-content: flex-start;" onclick="runApiTest('GET', '/api/student/history', true)">
                <span class="endpoint-method method-get">GET</span> /api/student/history (Personal Learning History)
              </button>
              <button class="btn btn-secondary" style="justify-content: flex-start;" onclick="testSocraticChat()">
                <span class="endpoint-method method-post">POST</span> /api/ai/chat (Socratic AI Tutor)
              </button>
              <button class="btn btn-secondary" style="justify-content: flex-start;" onclick="testQuizSubmit()">
                <span class="endpoint-method method-post">POST</span> /api/quiz/submit (Auto-Grade + Misconceptions)
              </button>
            </div>
          </div>
        </div>

        <!-- Live JSON Output Console -->
        <div>
          <div class="card" style="height: 100%; display: flex; flex-direction: column;">
            <div class="card-title" style="justify-content: space-between;">
              <span>📡 Live Response Console</span>
              <span id="responseStatus" style="font-size: 0.8rem; color: #10B981;">Ready</span>
            </div>
            <pre id="outputConsole" class="console-box" style="flex: 1; min-height: 450px;">// Click any action on the left to see live backend JSON responses here.</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: SUPABASE SQL SCHEMA -->
    <div id="tab-sql" class="tab-content">
      <div class="card">
        <div class="card-title" style="justify-content: space-between;">
          <span>🗄️ PostgreSQL Database Schema for Supabase</span>
          <button class="btn" onclick="copySchema()">📋 Copy Full SQL</button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">
          To set up your database in Supabase:
          1. Go to your <a href="https://supabase.com/dashboard" target="_blank" style="color: #60A5FA;">Supabase Dashboard</a> -> <b>SQL Editor</b>.<br>
          2. Click <b>New query</b>, paste the SQL below, and click <b>Run</b>.
        </p>
        <pre id="sqlContent" class="console-box" style="max-height: 600px; color: #A7F3D0;">${schemaSql.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
      </div>
    </div>

    <!-- TAB 3: ENVIRONMENT CONFIGURATION -->
    <div id="tab-env" class="tab-content">
      <div class="card">
        <div class="card-title">⚙️ What to Add in Backend .env File</div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
          Create a file named <code>.env</code> inside the <code>Backend/</code> directory with the following variables:
        </p>
        <pre class="console-box" style="color: #FDE047;">
# Server Port
PORT=5000

# Supabase Project URL (From Supabase Dashboard -> Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Secret / Service Role Key (From Supabase Dashboard -> Settings -> API)
SUPABASE_SECRET_KEY=sb_secret_your_secret_key_here

# JWT Authentication Secret Key (Used for Argon2 user session tokens)
JWT_SECRET=edumind_ai_hackathon_super_secret_jwt_key_2026
        </pre>
      </div>
    </div>

    <!-- TAB 4: API DIRECTORY -->
    <div id="tab-docs" class="tab-content">
      <div class="card">
        <div class="card-title">📖 Complete API Endpoint Directory</div>
        
        <h3 style="font-size: 1rem; color: #60A5FA; margin: 16px 0 10px;">Auth Routes (/api/auth)</h3>
        <div class="endpoint-item">
          <div><span class="endpoint-method method-post">POST</span><span class="endpoint-path">/api/auth/register</span></div>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Register a student with Argon2 and direct JWT authentication</span>
        </div>
        <div class="endpoint-item">
          <div><span class="endpoint-method method-post">POST</span><span class="endpoint-path">/api/auth/login</span></div>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Verify password & generate 7-day JWT</span>
        </div>
        <div class="endpoint-item">
          <div><span class="endpoint-method method-get">GET</span><span class="endpoint-path">/api/auth/me</span></div>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Get current profile (JWT required)</span>
        </div>

        <h3 style="font-size: 1rem; color: #34D399; margin: 20px 0 10px;">Student Routes (/api/student)</h3>
        <div class="endpoint-item">
          <div><span class="endpoint-method method-get">GET</span><span class="endpoint-path">/api/student/dashboard</span></div>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Streak, active courses, cognitive pace</span>
        </div>
        <div class="endpoint-item">
          <div><span class="endpoint-method method-get">GET</span><span class="endpoint-path">/api/student/profile</span></div>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Learning DNA & cognitive profile</span>
        </div>
        <div class="endpoint-item">
          <div><span class="endpoint-method method-get">GET</span><span class="endpoint-path">/api/student/goals</span></div>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Smart study planner items</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    let savedToken = localStorage.getItem('edumind_jwt') || '';
    if (savedToken) {
      document.getElementById('activeTokenDisplay').textContent = savedToken.substring(0, 35) + '...';
    }

    function showTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }

    function setToken(token) {
      savedToken = token;
      localStorage.setItem('edumind_jwt', token);
      document.getElementById('activeTokenDisplay').textContent = token ? token.substring(0, 35) + '...' : 'No active token.';
    }

    function clearToken() {
      setToken('');
      logOutput({ message: "JWT Token cleared." });
    }

    function logOutput(data, status = 200) {
      const consoleEl = document.getElementById('outputConsole');
      const statusEl = document.getElementById('responseStatus');
      statusEl.textContent = status ? 'HTTP ' + status : 'Done';
      statusEl.style.color = status >= 200 && status < 300 ? '#10B981' : '#EF4444';
      consoleEl.textContent = JSON.stringify(data, null, 2);
    }

    async function handleRegister() {
      const name = document.getElementById('authName').value;
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.token) setToken(data.token);
        logOutput(data, res.status);
      } catch (err) {
        logOutput({ error: err.message }, 500);
      }
    }

    async function handleLogin() {
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) setToken(data.token);
        logOutput(data, res.status);
      } catch (err) {
        logOutput({ error: err.message }, 500);
      }
    }

    async function runApiTest(method, endpoint, useAuth = false) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (useAuth && savedToken) {
          headers['Authorization'] = 'Bearer ' + savedToken;
        }

        const res = await fetch(endpoint, { method, headers });
        const data = await res.json();
        logOutput(data, res.status);
      } catch (err) {
        logOutput({ error: err.message }, 500);
      }
    }

    async function testSocraticChat() {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (savedToken) headers['Authorization'] = 'Bearer ' + savedToken;

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: "Is error divided in equal fractions to all neurons in backprop?",
            topic: "Backpropagation & Neural Networks",
            tutorMode: "socratic"
          })
        });
        const data = await res.json();
        logOutput(data, res.status);
      } catch (err) {
        logOutput({ error: err.message }, 500);
      }
    }

    async function testQuizSubmit() {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (savedToken) headers['Authorization'] = 'Bearer ' + savedToken;

        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            answers: {
              "77777777-7777-7777-7777-777777777771": 0,
              "77777777-7777-7777-7777-777777777772": 0,
              "77777777-7777-7777-7777-777777777773": 0
            }
          })
        });
        const data = await res.json();
        logOutput(data, res.status);
      } catch (err) {
        logOutput({ error: err.message }, 500);
      }
    }

    function copySchema() {
      const sql = document.getElementById('sqlContent').textContent;
      navigator.clipboard.writeText(sql).then(() => {
        alert("Supabase SQL Schema copied to clipboard! You can now paste it in the Supabase SQL Editor.");
      });
    }
  </script>
</body>
</html>`;
};
