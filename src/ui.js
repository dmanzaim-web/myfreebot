"use strict";

function renderApp() {
  return `<!doctype html>
<html lang="en" dir="ltr" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>myfreebot — Minecraft Player Bot 24/7</title>
  <meta name="description" content="myfreebot — Run and manage Minecraft Player Bots 24/7 without creating an account. True backend server runtime with auto-reconnect, anti-AFK, and visual automation.">
  <meta property="og:title" content="myfreebot — Minecraft Player Bot 24/7">
  <meta property="og:description" content="myfreebot — Run and manage Minecraft Player Bots 24/7 without creating an account.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #08090c;
      --card-bg: #10141d;
      --card-border: #1e2535;
      --card-hover: #161c28;
      --accent: #ff6a00;
      --accent-hover: #ff7f1f;
      --accent-glow: rgba(255, 106, 0, 0.25);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --online: #10b981;
      --offline: #ef4444;
      --warning: #f59e0b;
      --info: #38bdf8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
      overflow-x: hidden;
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0b0d13; }
    ::-webkit-scrollbar-thumb { background: #263045; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }

    /* Layout */
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* Header */
    header {
      background: rgba(16, 20, 29, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 12px 24px;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #ff6a00, #ff9e00);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 20px;
      color: #08090c;
      box-shadow: 0 0 20px var(--accent-glow);
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-badge {
      background: rgba(255, 106, 0, 0.15);
      border: 1px solid rgba(255, 106, 0, 0.3);
      color: #ff9e42;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .nav-link {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s;
    }

    .nav-link:hover, .nav-link.active {
      color: var(--text);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Buttons */
    button, .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      text-decoration: none;
      white-space: nowrap;
    }

    .btn-primary {
      background: var(--accent);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 2px 12px var(--accent-glow);
    }

    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 18px var(--accent-glow);
    }

    .btn-secondary {
      background: #161c28;
      color: var(--text);
      border: 1px solid var(--card-border);
    }

    .btn-secondary:hover {
      background: #1e2638;
      border-color: #2e3b52;
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
    }

    .btn-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .btn-success:hover {
      background: rgba(16, 185, 129, 0.25);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 6px;
    }

    /* Main Content Area */
    main {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 32px 24px;
    }

    /* Hero Section */
    .hero {
      text-align: center;
      padding: 60px 20px 40px;
      max-width: 900px;
      margin: 0 auto;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 106, 0, 0.1);
      border: 1px solid rgba(255, 106, 0, 0.25);
      color: #ff9e42;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 30px;
      margin-bottom: 24px;
    }

    .hero h1 {
      font-size: clamp(36px, 6vw, 56px);
      font-weight: 800;
      letter-spacing: -1.5px;
      line-height: 1.1;
      margin-bottom: 20px;
    }

    .hero h1 span {
      background: linear-gradient(135deg, #ffffff 30%, #ff8533 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero p {
      font-size: clamp(16px, 2vw, 19px);
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 36px;
    }

    .hero-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-subtext {
      margin-top: 14px;
      font-size: 13px;
      color: var(--text-dim);
    }

    /* Cards */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 24px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      border-color: #2a344a;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin: 60px 0;
    }

    .feature-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(255, 106, 0, 0.1);
      border: 1px solid rgba(255, 106, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      font-size: 20px;
    }

    .feature-title {
      font-size: 18px;
      font-weight: 700;
    }

    .feature-desc {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Live Ping Tester */
    .ping-tester-card {
      background: linear-gradient(180deg, #121722 0%, #0d111a 100%);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 32px;
      max-width: 800px;
      margin: 40px auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    }

    .tester-inputs {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 12px;
      margin-top: 16px;
    }

    /* Inputs */
    input, select, textarea {
      width: 100%;
      background: #090c12;
      border: 1px solid var(--card-border);
      color: var(--text);
      font-family: inherit;
      font-size: 14px;
      padding: 12px 14px;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus, select:focus, textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      display: block;
      margin-bottom: 6px;
    }

    /* Server Card (Horizontal Premium) */
    .server-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      margin-bottom: 16px;
      transition: all 0.2s ease;
    }

    .server-card:hover {
      border-color: #2a354c;
      background: var(--card-hover);
    }

    .server-info-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .server-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .server-name {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    .server-address {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text-muted);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.ONLINE {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }

    .status-badge.CONNECTING, .status-badge.AUTHENTICATING {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
    }

    .status-badge.WAITING_FOR_SERVER, .status-badge.RECONNECTING {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
    }

    .status-badge.OFFLINE, .status-badge.STOPPED {
      background: rgba(100, 116, 139, 0.15);
      border: 1px solid rgba(100, 116, 139, 0.3);
      color: #94a3b8;
    }

    .status-badge.ERROR {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .server-stats-grid {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }

    .server-actions-col {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
    }

    .modal {
      background: #11151f;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 700;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-dim);
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #0d1017;
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 600;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.04);
    }

    .tab-btn.active {
      color: var(--accent);
      background: rgba(255, 106, 0, 0.1);
      border: 1px solid rgba(255, 106, 0, 0.2);
    }

    /* Terminal Console */
    .console-box {
      background: #06070a;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      color: #cbd5e1;
      height: 480px;
      overflow-y: auto;
      padding: 14px;
      line-height: 1.6;
    }

    .console-line {
      display: block;
      margin-bottom: 2px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .console-line.INFO { color: #cbd5e1; }
    .console-line.WARNING { color: #f59e0b; }
    .console-line.ERROR { color: #f87171; }
    .console-line.CONNECTION { color: #38bdf8; }
    .console-line.COMMAND { color: #a78bfa; }
    .console-line.AUTOMATION { color: #34d399; }
    .console-line.SECURITY { color: #fb7185; }

    /* Chat Messages */
    .chat-container {
      background: #090c12;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      height: 380px;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .chat-msg {
      background: #121724;
      border: 1px solid #1e2638;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13.5px;
    }

    .chat-sender {
      font-weight: 700;
      color: var(--accent);
      margin-right: 6px;
    }

    .chat-time {
      font-size: 11px;
      color: var(--text-dim);
      float: right;
    }

    /* Key Banner */
    .key-box {
      background: #0a0d14;
      border: 1px dashed var(--accent);
      border-radius: 10px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #ff9e42;
      word-break: break-all;
      user-select: all;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    /* Offline Banner */
    .offline-notice {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 10px;
      padding: 14px 18px;
      color: #fbbf24;
      font-size: 13.5px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .server-card {
        flex-direction: column;
        align-items: stretch;
      }
      .server-stats-grid {
        flex-wrap: wrap;
      }
      .server-actions-col {
        justify-content: flex-end;
      }
      .tester-inputs {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app-container">
    <!-- Header -->
    <header>
      <div class="header-content">
        <a href="#/" class="brand" onclick="navigateTo('home')">
          <div class="brand-logo">M</div>
          <div class="brand-title">
            myfreebot
            <span class="brand-badge">24/7 Platform</span>
          </div>
        </a>

        <nav class="nav-links">
          <a class="nav-link" id="nav-home" onclick="navigateTo('home')">Home</a>
          <a class="nav-link" id="nav-dashboard" onclick="navigateTo('dashboard')">Dashboard</a>
          <a class="nav-link" id="nav-docs" onclick="navigateTo('docs')">Documentation</a>
          <a class="nav-link" id="nav-status" onclick="navigateTo('status')">Status</a>
        </nav>

        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" onclick="showImportKeyModal()">
            🔑 Access by Key
          </button>
          <button class="btn btn-primary" onclick="showAddServerModal()">
            + Add Server
          </button>
        </div>
      </div>
    </header>

    <!-- Main Dynamic Content Container -->
    <main id="app-view">
      <!-- Injected via JavaScript router -->
    </main>

    <!-- Footer -->
    <footer style="border-top: 1px solid var(--card-border); padding: 24px; text-align: center; color: var(--text-dim); font-size: 13px;">
      <div style="max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: gap: 12px;">
        <div><strong>myfreebot</strong> — Minecraft Player Bots 24/7. No login required.</div>
        <div>Anonymous Server Access Layer &middot; Persistent Backend Runtime</div>
      </div>
    </footer>
  </div>

  <!-- Global Modals Container -->
  <div id="modal-container"></div>

  <!-- Client Application Script -->
  <script>
    // ---------------- State Management ----------------
    const state = {
      view: 'home', // 'home' | 'dashboard' | 'server-detail' | 'docs' | 'status'
      activeServerId: null,
      activeTab: 'overview',
      servers: [],
      activeBot: null,
      logs: [],
      chat: [],
      players: [],
      activities: [],
      workflows: [],
      schedules: [],
      backups: [],
      keys: JSON.parse(localStorage.getItem('mcfbot_keys') || '[]'),
      sseSource: null,
      autoScrollLogs: true,
      logsFilter: 'ALL',
      logsSearch: ''
    };

    function saveKeys() {
      localStorage.setItem('mcfbot_keys', JSON.stringify(state.keys));
    }

    function getKeyForServer(serverId) {
      const match = state.keys.find(k => k.serverId === serverId);
      return match ? match.key : '';
    }

    function addKeyForServer(serverId, key, name) {
      if (!state.keys.some(k => k.serverId === serverId)) {
        state.keys.push({ serverId, key, name });
        saveKeys();
      }
    }

    // ---------------- Router & Navigation ----------------
    function navigateTo(view, serverId = null) {
      state.view = view;
      if (serverId) state.activeServerId = serverId;

      document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
      const activeNav = document.getElementById('nav-' + (view === 'server-detail' ? 'dashboard' : view));
      if (activeNav) activeNav.classList.add('active');

      if (view === 'home') renderHomeView();
      else if (view === 'dashboard') loadDashboard();
      else if (view === 'server-detail') loadServerDetail(state.activeServerId);
      else if (view === 'docs') renderDocsView();
      else if (view === 'status') renderStatusView();
    }

    // ---------------- Home View ----------------
    function renderHomeView() {
      const main = document.getElementById('app-view');
      main.innerHTML = \`
        <section class="hero">
          <div class="hero-badge">⚡ 24/7 Persistent Minecraft Player Bot</div>
          <h1>Your Minecraft Player Bot<br><span>Online 24/7 Without Login</span></h1>
          <p>Run real Minecraft Player Bots continuously on our dedicated backend runtime. Automatically reconnects when servers restart. No account required.</p>
          <div class="hero-actions">
            <button class="btn btn-primary" style="font-size: 16px; padding: 14px 28px;" onclick="showAddServerModal()">
              + Add Server Now
            </button>
            <button class="btn btn-secondary" style="font-size: 16px; padding: 14px 24px;" onclick="navigateTo('dashboard')">
              Open Dashboard
            </button>
          </div>
          <div class="hero-subtext">No email &middot; No password &middot; Instant Server Access Key</div>
        </section>

        <!-- Live Server Connection Tester -->
        <div class="ping-tester-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="font-size: 18px; font-weight: 700;">📡 Live Minecraft Server Connection Tester</h3>
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Real TCP Protocol SLP Handshake</span>
          </div>
          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 16px;">Test if your Minecraft server is reachable and inspect latency, version, and player counts before launching your bot.</p>

          <form onsubmit="testConnectionFromHome(event)" class="tester-inputs">
            <div>
              <label>Minecraft Server Address</label>
              <input id="home-test-host" placeholder="play.example.com or heartly.aternos.me" required>
            </div>
            <div>
              <label>Port</label>
              <input id="home-test-port" type="number" value="25565" required>
            </div>
            <div style="align-self: flex-end;">
              <button type="submit" class="btn btn-primary" id="home-test-btn" style="height: 44px;">
                Test Connection
              </button>
            </div>
          </form>

          <div id="home-test-result" style="margin-top: 18px; display: none;"></div>
        </div>

        <!-- 4 Core Features Grid -->
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <div class="feature-title">24/7 Backend Runtime</div>
            <div class="feature-desc">Never runs in the browser. You can close your tabs, shutdown your PC, and your bot stays actively connected to Minecraft on the server.</div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <div class="feature-title">Smart Auto-Reconnect</div>
            <div class="feature-desc">If your Minecraft server goes offline, myfreebot doesn't quit. It patiently waits and re-establishes connection the exact second the server boots up.</div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🛡️</div>
            <div class="feature-title">Anti-AFK & Automation</div>
            <div class="feature-desc">Prevent kicks with micro-movements, random jump patterns, and customizable workflows triggered by chat, health, or player joins.</div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔑</div>
            <div class="feature-title">Zero-Login Access Key</div>
            <div class="feature-desc">No accounts or passwords to leak. Your server is secured with a cryptographically generated Access Key that grants instant management access.</div>
          </div>
        </div>
      \`;
    }

    // ---------------- Live Ping Tester ----------------
    async function testConnectionFromHome(e) {
      e.preventDefault();
      const host = document.getElementById('home-test-host').value.trim();
      const port = document.getElementById('home-test-port').value.trim();
      const btn = document.getElementById('home-test-btn');
      const resultDiv = document.getElementById('home-test-result');

      btn.disabled = true;
      btn.textContent = 'Resolving & Pinging...';
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<div style="color: var(--info); font-size: 13.5px;">Testing real connection via Minecraft Server List Ping protocol...</div>';

      try {
        const res = await fetch('/api/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port })
        });
        const data = await res.json();

        if (data.online) {
          resultDiv.innerHTML = \`
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 700; color: #34d399; font-size: 16px;">🟢 Server Online & Reachable!</span>
                <span style="font-weight: 700; font-family: monospace; color: #34d399;">\${data.latency}ms ping</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; font-size: 13px; margin-top: 10px;">
                <div><span style="color: var(--text-dim);">Version:</span> <strong>\${data.version?.name || 'Java'}</strong></div>
                <div><span style="color: var(--text-dim);">Players:</span> <strong>\${data.players?.online || 0} / \${data.players?.max || 0}</strong></div>
                <div><span style="color: var(--text-dim);">Resolved Host:</span> <strong>\${data.host}:\${data.port}</strong></div>
              </div>
              \${data.motd ? \`<div style="margin-top: 10px; font-size: 12px; color: var(--text-muted); font-family: monospace; background: #07090f; padding: 8px; border-radius: 6px;">\${data.motd}</div>\` : ''}
              <button class="btn btn-primary btn-sm" style="margin-top: 14px;" onclick="showAddServerModal('\${host}', '\${port}')">
                Add This Server to myfreebot ➔
              </button>
            </div>
          \`;
        } else {
          resultDiv.innerHTML = \`
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 16px;">
              <div style="font-weight: 700; color: #f87171; font-size: 15px; margin-bottom: 6px;">🔴 Server Offline or Unreachable</div>
              <div style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">\${data.error || 'Connection failed'}</div>
              <div style="font-size: 12px; color: var(--text-dim); margin-top: 6px;">myfreebot will support auto-reconnecting to this server once it starts!</div>
            </div>
          \`;
        }
      } catch (err) {
        resultDiv.innerHTML = \`<div style="color: var(--offline); font-size: 13px;">Error communicating with API: \${err.message}</div>\`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Test Connection';
      }
    }

    // ---------------- Dashboard View ----------------
    async function loadDashboard() {
      const main = document.getElementById('app-view');
      main.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-muted);">Loading your servers...</div>';

      try {
        const keyList = state.keys.map(k => k.key);
        const res = await fetch('/api/servers', {
          headers: {
            'X-Server-Keys': JSON.stringify(keyList)
          }
        });
        const data = await res.json();
        state.servers = data.servers || [];

        renderDashboard();
      } catch (err) {
        main.innerHTML = \`<div style="color: var(--offline); padding: 40px; text-align: center;">Failed to load servers: \${err.message}</div>\`;
      }
    }

    function renderDashboard() {
      const main = document.getElementById('app-view');

      if (state.servers.length === 0) {
        main.innerHTML = \`
          <div style="text-align: center; padding: 80px 20px; max-width: 600px; margin: 0 auto;">
            <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
            <h2 style="font-size: 26px; font-weight: 800; margin-bottom: 10px;">No Servers Yet</h2>
            <p style="color: var(--text-muted); margin-bottom: 28px; line-height: 1.6;">
              Add your first Minecraft server and start your 24/7 bot. No account or email registration required.
            </p>
            <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
              <button class="btn btn-primary" style="font-size: 15px; padding: 12px 24px;" onclick="showAddServerModal()">
                + Add Your First Server
              </button>
              <button class="btn btn-secondary" style="font-size: 15px; padding: 12px 20px;" onclick="showImportKeyModal()">
                Import Server by Key
              </button>
            </div>
          </div>
        \`;
        return;
      }

      main.innerHTML = \`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h1 style="font-size: 28px; font-weight: 800;">My Minecraft Servers</h1>
            <p style="color: var(--text-muted); font-size: 14px;">Managing \${state.servers.length} server\${state.servers.length === 1 ? '' : 's'} with 24/7 backend bot runtime.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary btn-sm" onclick="showImportKeyModal()">Import Key</button>
            <button class="btn btn-primary" onclick="showAddServerModal()">+ Add Server</button>
          </div>
        </div>

        <div id="servers-container">
          \${state.servers.map(server => renderServerCard(server)).join('')}
        </div>
      \`;
    }

    function renderServerCard(s) {
      const bot = s.bot || {};
      const status = bot.status || 'OFFLINE';
      const isOnline = status === 'ONLINE';
      const isWaiting = status === 'WAITING_FOR_SERVER' || status === 'RECONNECTING';

      return \`
        <div class="server-card">
          <div class="server-info-col">
            <div class="server-title-row">
              <span class="server-name">\${escapeHtml(s.name)}</span>
              <span class="status-badge \${status}">\${status.replace(/_/g, ' ')}</span>
            </div>
            <div class="server-address">\${escapeHtml(s.host)}:\${s.port} &middot; Bot: <strong>\${escapeHtml(bot.username || 'Bot')}</strong></div>
          </div>

          <div class="server-stats-grid">
            <div class="stat-item">
              <span class="stat-label">Server</span>
              <span class="stat-value" style="color: \${s.status === 'ONLINE' ? 'var(--online)' : 'var(--offline)'}">
                \${s.status === 'ONLINE' ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Uptime</span>
              <span class="stat-value">\${bot.uptime ? formatSeconds(bot.uptime) : '—'}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Coords</span>
              <span class="stat-value">\${bot.position ? \`X:\${bot.position.x} Y:\${bot.position.y}\` : '—'}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Reconnects</span>
              <span class="stat-value">\${bot.reconnectAttempts || 0}</span>
            </div>
          </div>

          <div class="server-actions-col">
            \${isOnline ? \`
              <button class="btn btn-danger btn-sm" onclick="quickServerAction('\${s.id}', 'stop')">Stop Bot</button>
              <button class="btn btn-secondary btn-sm" onclick="quickServerAction('\${s.id}', 'restart')">Restart</button>
            \` : \`
              <button class="btn btn-success btn-sm" onclick="quickServerAction('\${s.id}', 'start')">Start Bot</button>
            \`}
            <button class="btn btn-primary btn-sm" onclick="navigateTo('server-detail', '\${s.id}')">
              Manage Dashboard ➔
            </button>
          </div>
        </div>
      \`;
    }

    async function quickServerAction(serverId, action) {
      const key = getKeyForServer(serverId);
      try {
        await fetch(\`/api/servers/\${serverId}/bot/\${action}\`, {
          method: 'POST',
          headers: { 'X-Server-Key': key }
        });
        loadDashboard();
      } catch (err) {
        alert('Action failed: ' + err.message);
      }
    }

    // ---------------- Server Detail View ----------------
    async function loadServerDetail(serverId) {
      const main = document.getElementById('app-view');
      main.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-muted);">Loading server details...</div>';

      const key = getKeyForServer(serverId);
      if (!key) {
        main.innerHTML = \`
          <div class="card" style="max-width: 500px; margin: 40px auto; text-align: center;">
            <h3>Access Key Required</h3>
            <p style="color: var(--text-muted); margin: 12px 0 20px;">Please enter the Server Access Key to view this dashboard.</p>
            <input id="prompt-key" placeholder="mcf_sec_..." style="margin-bottom: 14px;">
            <button class="btn btn-primary" onclick="submitPromptKey('\${serverId}')">Access Server</button>
          </div>
        \`;
        return;
      }

      try {
        const res = await fetch(\`/api/servers/\${serverId}\`, {
          headers: { 'X-Server-Key': key }
        });
        if (res.status === 403) {
          main.innerHTML = \`<div class="card" style="text-align: center; padding: 40px; color: var(--offline);">403 Forbidden: Invalid Server Access Key</div>\`;
          return;
        }

        const data = await res.json();
        state.activeServer = data.server;
        state.activeBot = data.bot;
        state.workflows = data.workflows || [];
        state.schedules = data.schedules || [];

        initSSE(serverId, key);
        renderServerDetail();
      } catch (err) {
        main.innerHTML = \`<div style="color: var(--offline); padding: 40px;">Failed to load server: \${err.message}</div>\`;
      }
    }

    function renderServerDetail() {
      const main = document.getElementById('app-view');
      const s = state.activeServer;
      const bot = state.activeBot || {};
      const status = bot.status || 'OFFLINE';
      const isServerOffline = s.status === 'OFFLINE' || status === 'WAITING_FOR_SERVER';

      main.innerHTML = \`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <a onclick="navigateTo('dashboard')" style="color: var(--text-dim); cursor: pointer; text-decoration: none;">&larr; Servers</a>
              <h1 style="font-size: 24px; font-weight: 800;">\${escapeHtml(s.name)}</h1>
              <span class="status-badge \${status}" id="live-badge">\${status.replace(/_/g, ' ')}</span>
            </div>
            <div style="font-family: monospace; font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              \${escapeHtml(s.host)}:\${s.port} &middot; Bot: <strong>\${escapeHtml(bot.username)}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary btn-sm" onclick="showServerKeyModal('\${s.id}')">🔑 View Access Key</button>
            <button class="btn btn-success btn-sm" onclick="serverBotAction('start')">Start Bot</button>
            <button class="btn btn-danger btn-sm" onclick="serverBotAction('stop')">Stop Bot</button>
            <button class="btn btn-secondary btn-sm" onclick="serverBotAction('restart')">Restart</button>
          </div>
        </div>

        \${isServerOffline ? \`
          <div class="offline-notice">
            <span style="font-size: 20px;">⚠️</span>
            <div>
              <strong>Minecraft server is currently offline.</strong>
              <div>myfreebot backend runtime remains active and will automatically reconnect the bot the moment the server comes back online.</div>
            </div>
          </div>
        \` : ''}

        <!-- Tabs Navigation -->
        <div class="tabs-nav">
          <button class="tab-btn \${state.activeTab === 'overview' ? 'active' : ''}" onclick="switchDetailTab('overview')">Overview</button>
          <button class="tab-btn \${state.activeTab === 'console' ? 'active' : ''}" onclick="switchDetailTab('console')">Console Logs</button>
          <button class="tab-btn \${state.activeTab === 'chat' ? 'active' : ''}" onclick="switchDetailTab('chat')">Live Chat</button>
          <button class="tab-btn \${state.activeTab === 'commands' ? 'active' : ''}" onclick="switchDetailTab('commands')">Commands</button>
          <button class="tab-btn \${state.activeTab === 'antiafk' ? 'active' : ''}" onclick="switchDetailTab('antiafk')">Anti-AFK</button>
          <button class="tab-btn \${state.activeTab === 'autologin' ? 'active' : ''}" onclick="switchDetailTab('autologin')">Authentication</button>
          <button class="tab-btn \${state.activeTab === 'automation' ? 'active' : ''}" onclick="switchDetailTab('automation')">Automation</button>
          <button class="tab-btn \${state.activeTab === 'schedules' ? 'active' : ''}" onclick="switchDetailTab('schedules')">Schedules</button>
          <button class="tab-btn \${state.activeTab === 'players' ? 'active' : ''}" onclick="switchDetailTab('players')">Players</button>
          <button class="tab-btn \${state.activeTab === 'backups' ? 'active' : ''}" onclick="switchDetailTab('backups')">Backups</button>
          <button class="tab-btn \${state.activeTab === 'danger' ? 'active' : ''}" onclick="switchDetailTab('danger')">Danger Zone</button>
        </div>

        <div id="tab-content">
          \${renderActiveTabContent()}
        </div>
      \`;

      if (state.activeTab === 'console') {
        loadLogsForServer();
      } else if (state.activeTab === 'chat') {
        loadChatForServer();
      }
    }

    function switchDetailTab(tab) {
      state.activeTab = tab;
      renderServerDetail();
    }

    function renderActiveTabContent() {
      const s = state.activeServer;
      const bot = state.activeBot || {};

      switch (state.activeTab) {
        case 'overview':
          return \`
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
              <div class="card">
                <h3 style="margin-bottom: 16px;">🤖 Bot Status</h3>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                  <div>
                    <span style="color: var(--text-dim); font-size: 12px; font-weight: 600;">HEALTH</span>
                    <div style="height: 10px; background: #1e2638; border-radius: 5px; overflow: hidden; margin-top: 4px;">
                      <div style="width: \${(bot.health || 20) * 5}%; height: 100%; background: #ef4444;"></div>
                    </div>
                    <span style="font-size: 12px; color: var(--text-muted);">\${bot.health || 20} / 20 HP</span>
                  </div>

                  <div>
                    <span style="color: var(--text-dim); font-size: 12px; font-weight: 600;">FOOD</span>
                    <div style="height: 10px; background: #1e2638; border-radius: 5px; overflow: hidden; margin-top: 4px;">
                      <div style="width: \${(bot.food || 20) * 5}%; height: 100%; background: #f59e0b;"></div>
                    </div>
                    <span style="font-size: 12px; color: var(--text-muted);">\${bot.food || 20} / 20</span>
                  </div>

                  <div>
                    <span style="color: var(--text-dim); font-size: 12px; font-weight: 600;">POSITION IN MINECRAFT</span>
                    <div style="font-family: monospace; font-size: 15px; font-weight: 700; margin-top: 4px;">
                      \${bot.position ? \`X: \${bot.position.x} | Y: \${bot.position.y} | Z: \${bot.position.z}\` : 'Position unavailable'}
                    </div>
                  </div>
                </div>
              </div>

              <div class="card">
                <h3 style="margin-bottom: 16px;">⏱️ Uptime & Metrics</h3>
                <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Uptime:</span>
                    <strong>\${bot.uptime ? formatSeconds(bot.uptime) : '0s'}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Reconnect Attempts:</span>
                    <strong>\${bot.reconnectAttempts || 0}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">24/7 Persistent Mode:</span>
                    <strong style="color: var(--online);">ENABLED (Active)</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Server Latency:</span>
                    <strong>\${s.ping ? s.ping + 'ms' : 'Measured on connect'}</strong>
                  </div>
                </div>
              </div>

              <div class="card">
                <h3 style="margin-bottom: 16px;">⚡ Quick Chat / Command</h3>
                <form onsubmit="handleQuickCommand(event)" style="display: flex; gap: 8px;">
                  <input id="quick-cmd" placeholder="e.g. /say Hello from myfreebot" required>
                  <button type="submit" class="btn btn-primary btn-sm">Send</button>
                </form>
                <div style="margin-top: 14px; display: flex; gap: 6px; flex-wrap: wrap;">
                  <button class="btn btn-secondary btn-sm" onclick="sendPresetCmd('/list')">/list</button>
                  <button class="btn btn-secondary btn-sm" onclick="sendPresetCmd('/afk')">/afk</button>
                  <button class="btn btn-secondary btn-sm" onclick="sendPresetCmd('/help')">/help</button>
                  <button class="btn btn-secondary btn-sm" onclick="sendPresetCmd('/time query daytime')">/time</button>
                </div>
              </div>
            </div>
          \`;

        case 'console':
          return \`
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input id="console-search" placeholder="Search logs..." oninput="handleLogSearch(this.value)" style="width: 220px; padding: 6px 10px; font-size: 13px;">
                  <select onchange="handleLogCategory(this.value)" style="width: 140px; padding: 6px 10px; font-size: 13px;">
                    <option value="ALL">All Categories</option>
                    <option value="CONNECTION">Connection</option>
                    <option value="COMMAND">Command</option>
                    <option value="CHAT">Chat</option>
                    <option value="AUTOMATION">Automation</option>
                    <option value="SECURITY">Security</option>
                    <option value="ERROR">Errors</option>
                  </select>
                </div>

                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" onclick="toggleAutoScroll()">
                    Auto-Scroll: \${state.autoScrollLogs ? 'ON' : 'OFF'}
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="downloadLogs()">
                    Download Logs
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="clearLogs()">
                    Clear
                  </button>
                </div>
              </div>

              <div class="console-box" id="console-logs-container">
                <div style="color: var(--text-dim);">Connecting to real-time console stream...</div>
              </div>
            </div>
          \`;

        case 'chat':
          return \`
            <div class="card">
              <h3 style="margin-bottom: 14px;">💬 Minecraft In-Game Chat Feed</h3>
              <div class="chat-container" id="chat-messages-container">
                <div style="color: var(--text-dim); text-align: center; margin-top: 40px;">No chat messages received yet.</div>
              </div>

              <form onsubmit="handleSendChat(event)" style="display: flex; gap: 8px; margin-top: 14px;">
                <input id="chat-input" placeholder="Type a chat message to send in Minecraft..." required>
                <button type="submit" class="btn btn-primary">Send to Minecraft</button>
              </form>
            </div>
          \`;

        case 'commands':
          return \`
            <div class="card">
              <h3 style="margin-bottom: 12px;">⌨️ In-Game Minecraft Commands</h3>
              <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 16px;">
                Execute commands directly from the bot's Minecraft player session. (Requires player permissions on the server).
              </p>

              <form onsubmit="handleRunCommand(event)" style="display: flex; gap: 8px; margin-bottom: 20px;">
                <input id="cmd-input" placeholder="/gamemode creative or /give @p diamond" required>
                <button type="submit" class="btn btn-primary">Run Command</button>
              </form>

              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                <div class="card" style="padding: 12px; cursor: pointer;" onclick="sendPresetCmd('/list')">
                  <strong>/list</strong><br><span style="font-size: 12px; color: var(--text-dim);">Show online players</span>
                </div>
                <div class="card" style="padding: 12px; cursor: pointer;" onclick="sendPresetCmd('/spawn')">
                  <strong>/spawn</strong><br><span style="font-size: 12px; color: var(--text-dim);">Teleport to spawn</span>
                </div>
                <div class="card" style="padding: 12px; cursor: pointer;" onclick="sendPresetCmd('/tpa')">
                  <strong>/tpa</strong><br><span style="font-size: 12px; color: var(--text-dim);">Teleport request</span>
                </div>
                <div class="card" style="padding: 12px; cursor: pointer;" onclick="sendPresetCmd('/home')">
                  <strong>/home</strong><br><span style="font-size: 12px; color: var(--text-dim);">Teleport home</span>
                </div>
              </div>
            </div>
          \`;

        case 'antiafk':
          const antiAfk = bot.config?.antiAfk || {};
          return \`
            <div class="card">
              <h3 style="margin-bottom: 14px;">🛡️ Anti-AFK Engine Configuration</h3>
              <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 20px;">
                Keep the player bot from being kicked by the server's idle timer.
              </p>

              <form onsubmit="saveAntiAfkConfig(event)" style="display: flex; flex-direction: column; gap: 16px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                  <input type="checkbox" id="afk-enabled" \${antiAfk.enabled ? 'checked' : ''} style="width: auto;">
                  <span>Enable Anti-AFK Engine</span>
                </label>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="afk-look" \${antiAfk.lookAround ? 'checked' : ''} style="width: auto;">
                    <span>Random Look Around</span>
                  </label>

                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="afk-jump" \${antiAfk.randomJump ? 'checked' : ''} style="width: auto;">
                    <span>Random Jump Bursts</span>
                  </label>

                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="afk-sneak" \${antiAfk.sneak ? 'checked' : ''} style="width: auto;">
                    <span>Permanent Sneak / Crouch</span>
                  </label>

                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="afk-walk" \${antiAfk.walk ? 'checked' : ''} style="width: auto;">
                    <span>Micro Steps Forward/Back</span>
                  </label>
                </div>

                <button type="submit" class="btn btn-primary" style="align-self: flex-start; margin-top: 10px;">
                  Save Anti-AFK Settings
                </button>
              </form>
            </div>
          \`;

        case 'autologin':
          const autoLogin = bot.config?.autoLogin || {};
          return \`
            <div class="card">
              <h3 style="margin-bottom: 12px;">🔒 Server Authentication & Auto-Login</h3>
              <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 20px;">
                For cracked/offline servers that use auth plugins (e.g. AuthMe, LoginSecurity). Passwords are encrypted with AES-256-GCM and never exposed.
              </p>

              <form onsubmit="saveAutoLoginConfig(event)" style="display: flex; flex-direction: column; gap: 16px; max-width: 500px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                  <input type="checkbox" id="login-enabled" \${autoLogin.enabled ? 'checked' : ''} style="width: auto;">
                  <span>Enable Automatic In-Game Login</span>
                </label>

                <div>
                  <label>Login Command Template</label>
                  <input id="login-cmd" value="\${escapeHtml(autoLogin.command || '/login {password}')}" placeholder="/login {password}">
                  <span style="font-size: 11px; color: var(--text-dim);">{password} will be automatically substituted</span>
                </div>

                <div>
                  <label>Set / Update Server Password</label>
                  <input id="login-password" type="password" placeholder="Enter password (leave blank to keep current)">
                </div>

                <div>
                  <label>Trigger</label>
                  <select id="login-trigger">
                    <option value="prompt" \${autoLogin.trigger === 'prompt' ? 'selected' : ''}>On Server Chat Prompt (/login detect)</option>
                    <option value="on_join" \${autoLogin.trigger === 'on_join' ? 'selected' : ''}>Immediately After Joining (3s delay)</option>
                  </select>
                </div>

                <button type="submit" class="btn btn-primary" style="align-self: flex-start; margin-top: 8px;">
                  Save Authentication Settings
                </button>
              </form>
            </div>
          \`;

        case 'automation':
          return \`
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <h3>⚡ Workflows & Automation Engine</h3>
                  <p style="color: var(--text-muted); font-size: 13px;">Automate responses when events happen in Minecraft. Runs 24/7 on backend.</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showAddWorkflowModal()">+ New Workflow</button>
              </div>

              <div id="workflows-list" style="display: flex; flex-direction: column; gap: 12px;">
                \${state.workflows.length ? state.workflows.map(w => \`
                  <div class="card" style="padding: 16px; background: #0b0e16; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>\${escapeHtml(w.name)}</strong>
                      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        Trigger: <span style="color: var(--accent);">\${w.trigger}</span> &middot; Executions: \${w.runCount || 0}
                      </div>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deleteWorkflow('\${w.id}')">Delete</button>
                  </div>
                \`).join('') : '<div style="color: var(--text-dim); text-align: center; padding: 30px;">No workflows configured yet.</div>'}
              </div>
            </div>
          \`;

        case 'schedules':
          return \`
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <h3>⏱️ Backend Task Scheduler</h3>
                  <p style="color: var(--text-muted); font-size: 13px;">Execute periodic actions every X minutes on backend runtime.</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showAddScheduleModal()">+ Add Schedule</button>
              </div>

              <div id="schedules-list" style="display: flex; flex-direction: column; gap: 12px;">
                \${state.schedules.length ? state.schedules.map(sc => \`
                  <div class="card" style="padding: 16px; background: #0b0e16; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>\${escapeHtml(sc.name)}</strong>
                      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        Every \${sc.intervalMinutes} min &middot; Action: \${sc.actionType} ("\${escapeHtml(sc.actionPayload)}")
                      </div>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deleteSchedule('\${sc.id}')">Delete</button>
                  </div>
                \`).join('') : '<div style="color: var(--text-dim); text-align: center; padding: 30px;">No scheduled tasks yet.</div>'}
              </div>
            </div>
          \`;

        case 'players':
          return \`
            <div class="card">
              <h3 style="margin-bottom: 14px;">👥 Online Players & Watchlist</h3>
              <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 20px;">
                Players currently detected in the Minecraft tablist.
              </p>

              <div id="players-list-box" style="display: flex; flex-wrap: wrap; gap: 8px;">
                \${state.players.length ? state.players.map(p => \`
                  <div style="background: #161c28; border: 1px solid var(--card-border); padding: 8px 14px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                    <span>👤</span>
                    <strong>\${escapeHtml(p.username)}</strong>
                    <span style="font-size: 11px; color: var(--text-dim);">\${p.ping}ms</span>
                  </div>
                \`).join('') : '<div style="color: var(--text-dim);">Bot must be ONLINE in server to see players.</div>'}
              </div>
            </div>
          \`;

        case 'backups':
          return \`
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <h3>💾 Server Backups</h3>
                  <p style="color: var(--text-muted); font-size: 13px;">Save and restore your complete bot, anti-AFK, and workflow configurations.</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="createBackupNow()">Create Backup</button>
              </div>

              <div id="backups-list">
                <div style="color: var(--text-dim); text-align: center; padding: 20px;">Click 'Create Backup' to take a snapshot.</div>
              </div>
            </div>
          \`;

        case 'danger':
          return \`
            <div class="card" style="border-color: rgba(239, 68, 68, 0.3);">
              <h3 style="color: #f87171; margin-bottom: 12px;">⚠️ Danger Zone</h3>
              <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 24px;">
                Irreversible administrative actions for this server.
              </p>

              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #161016; border-radius: 8px;">
                  <div>
                    <strong>Stop Bot Runtime</strong>
                    <div style="font-size: 12px; color: var(--text-dim);">Disconnects bot and disables auto-reconnect until restarted.</div>
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="serverBotAction('stop')">Stop Bot</button>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #161016; border-radius: 8px;">
                  <div>
                    <strong>Reset Bot Configuration</strong>
                    <div style="font-size: 12px; color: var(--text-dim);">Restores default Anti-AFK and cleans settings.</div>
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="resetServerConfig()">Reset Settings</button>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #200f12; border-radius: 8px;">
                  <div>
                    <strong style="color: #ef4444;">Delete Server Completely</strong>
                    <div style="font-size: 12px; color: var(--text-dim);">Deletes server, bot runtime, logs, workflows, and removes access.</div>
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="deleteServerConfirm()">Delete Server</button>
                </div>
              </div>
            </div>
          \`;

        default:
          return '<div>Unknown tab</div>';
      }
    }

    // ---------------- Real-time SSE Stream ----------------
    function initSSE(serverId, accessKey) {
      if (state.sseSource) {
        state.sseSource.close();
      }

      state.sseSource = new EventSource(\`/api/stream?serverId=\${serverId}&key=\${encodeURIComponent(accessKey)}\`);

      state.sseSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleLiveEvent(payload);
        } catch {}
      };

      state.sseSource.onerror = () => {
        // Automatically attempts reconnect
      };
    }

    function handleLiveEvent(msg) {
      if (msg.type === 'bot_status') {
        state.activeBot = { ...state.activeBot, ...msg.data };
        const badge = document.getElementById('live-badge');
        if (badge) {
          badge.className = 'status-badge ' + (msg.data.status || 'OFFLINE');
          badge.textContent = (msg.data.status || 'OFFLINE').replace(/_/g, ' ');
        }
      } else if (msg.type === 'log') {
        state.logs.push(msg.data);
        appendConsoleLog(msg.data);
      } else if (msg.type === 'chat') {
        state.chat.push(msg.data);
        appendChatMessage(msg.data);
      } else if (msg.type === 'player_update') {
        state.players = msg.data.players || [];
        const box = document.getElementById('players-list-box');
        if (box && state.players.length) {
          box.innerHTML = state.players.map(p => \`
            <div style="background: #161c28; border: 1px solid var(--card-border); padding: 8px 14px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 8px;">
              <span>👤</span>
              <strong>\${escapeHtml(p.username)}</strong>
              <span style="font-size: 11px; color: var(--text-dim);">\${p.ping}ms</span>
            </div>
          \`).join('');
        }
      }
    }

    // ---------------- Actions ----------------
    async function serverBotAction(action) {
      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);
      try {
        await fetch(\`/api/servers/\${serverId}/bot/\${action}\`, {
          method: 'POST',
          headers: { 'X-Server-Key': key }
        });
      } catch (err) {
        alert('Action error: ' + err.message);
      }
    }

    async function handleSendChat(e) {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const msg = input.value.trim();
      if (!msg) return;
      input.value = '';

      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);
      await fetch(\`/api/servers/\${serverId}/bot/chat\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Server-Key': key },
        body: JSON.stringify({ message: msg })
      });
    }

    async function handleRunCommand(e) {
      e.preventDefault();
      const input = document.getElementById('cmd-input');
      const cmd = input.value.trim();
      if (!cmd) return;
      input.value = '';

      sendPresetCmd(cmd);
    }

    async function handleQuickCommand(e) {
      e.preventDefault();
      const input = document.getElementById('quick-cmd');
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      sendPresetCmd(val);
    }

    async function sendPresetCmd(cmd) {
      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);
      try {
        const res = await fetch(\`/api/servers/\${serverId}/bot/command\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Server-Key': key },
          body: JSON.stringify({ command: cmd })
        });
        const d = await res.json();
        if (!d.success) alert(d.message);
      } catch (err) {
        alert('Command error: ' + err.message);
      }
    }

    async function saveAntiAfkConfig(e) {
      e.preventDefault();
      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);

      const payload = {
        antiAfk: {
          enabled: document.getElementById('afk-enabled').checked,
          lookAround: document.getElementById('afk-look').checked,
          randomJump: document.getElementById('afk-jump').checked,
          sneak: document.getElementById('afk-sneak').checked,
          walk: document.getElementById('afk-walk').checked
        }
      };

      await fetch(\`/api/servers/\${serverId}/bot/config\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Server-Key': key },
        body: JSON.stringify(payload)
      });
      alert('Anti-AFK settings updated!');
    }

    async function saveAutoLoginConfig(e) {
      e.preventDefault();
      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);

      const payload = {
        autoLogin: {
          enabled: document.getElementById('login-enabled').checked,
          command: document.getElementById('login-cmd').value.trim(),
          password: document.getElementById('login-password').value,
          trigger: document.getElementById('login-trigger').value
        }
      };

      await fetch(\`/api/servers/\${serverId}/bot/config\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Server-Key': key },
        body: JSON.stringify(payload)
      });
      alert('Authentication settings saved successfully!');
    }

    async function deleteServerConfirm() {
      const conf = confirm('Are you completely sure you want to delete this server? This will stop the bot and wipe all logs and workflows.');
      if (!conf) return;

      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);

      await fetch(\`/api/servers/\${serverId}\`, {
        method: 'DELETE',
        headers: { 'X-Server-Key': key }
      });

      state.keys = state.keys.filter(k => k.serverId !== serverId);
      saveKeys();
      navigateTo('dashboard');
    }

    // ---------------- Console Logs ----------------
    async function loadLogsForServer() {
      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);

      try {
        const res = await fetch(\`/api/servers/\${serverId}/logs\`, {
          headers: { 'X-Server-Key': key }
        });
        const d = await res.json();
        state.logs = d.logs || [];
        renderAllLogs();
      } catch {}
    }

    function renderAllLogs() {
      const container = document.getElementById('console-logs-container');
      if (!container) return;

      let filtered = state.logs;
      if (state.logsFilter !== 'ALL') {
        filtered = filtered.filter(l => l.category === state.logsFilter || l.level === state.logsFilter);
      }
      if (state.logsSearch) {
        const q = state.logsSearch.toLowerCase();
        filtered = filtered.filter(l => l.message.toLowerCase().includes(q));
      }

      container.innerHTML = filtered.map(l => formatLogLine(l)).join('');
      if (state.autoScrollLogs) container.scrollTop = container.scrollHeight;
    }

    function formatLogLine(l) {
      const time = new Date(l.timestamp).toLocaleTimeString();
      return \`<span class="console-line \${l.level} \${l.category}">[\${time}] [\${l.category}] \${escapeHtml(l.message)}</span>\`;
    }

    function appendConsoleLog(logItem) {
      const container = document.getElementById('console-logs-container');
      if (!container) return;

      if (state.logsFilter !== 'ALL' && logItem.category !== state.logsFilter && logItem.level !== state.logsFilter) return;
      if (state.logsSearch && !logItem.message.toLowerCase().includes(state.logsSearch.toLowerCase())) return;

      container.innerHTML += formatLogLine(logItem);
      if (state.autoScrollLogs) container.scrollTop = container.scrollHeight;
    }

    function toggleAutoScroll() {
      state.autoScrollLogs = !state.autoScrollLogs;
      renderServerDetail();
    }

    function handleLogSearch(val) {
      state.logsSearch = val;
      renderAllLogs();
    }

    function handleLogCategory(cat) {
      state.logsFilter = cat;
      renderAllLogs();
    }

    function downloadLogs() {
      const text = state.logs.map(l => \`[\${new Date(l.timestamp).toISOString()}] [\${l.level}] [\${l.category}] \${l.message}\`).join('\\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = \`mcfbot_logs_\${state.activeServer?.id || 'server'}.txt\`;
      a.click();
    }

    async function clearLogs() {
      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);
      await fetch(\`/api/servers/\${serverId}/logs\`, {
        method: 'DELETE',
        headers: { 'X-Server-Key': key }
      });
      state.logs = [];
      renderAllLogs();
    }

    // ---------------- Chat Feed ----------------
    async function loadChatForServer() {
      const serverId = state.activeServer?.id;
      const key = getKeyForServer(serverId);

      try {
        const res = await fetch(\`/api/servers/\${serverId}/chat\`, {
          headers: { 'X-Server-Key': key }
        });
        const d = await res.json();
        state.chat = d.chat || [];
        const box = document.getElementById('chat-messages-container');
        if (box) {
          if (state.chat.length === 0) {
            box.innerHTML = '<div style="color: var(--text-dim); text-align: center; margin-top: 40px;">No chat messages received yet.</div>';
          } else {
            box.innerHTML = state.chat.map(c => renderChatBubble(c)).join('');
            box.scrollTop = box.scrollHeight;
          }
        }
      } catch {}
    }

    function appendChatMessage(c) {
      const box = document.getElementById('chat-messages-container');
      if (!box) return;
      box.innerHTML += renderChatBubble(c);
      box.scrollTop = box.scrollHeight;
    }

    function renderChatBubble(c) {
      const time = new Date(c.timestamp).toLocaleTimeString();
      return \`
        <div class="chat-msg">
          <span class="chat-time">\${time}</span>
          <span class="chat-sender">\${escapeHtml(c.sender)}:</span>
          <span>\${escapeHtml(c.message)}</span>
        </div>
      \`;
    }

    // ---------------- Modals ----------------
    function showAddServerModal(prefillHost = '', prefillPort = '25565') {
      const modal = document.getElementById('modal-container');
      modal.innerHTML = \`
        <div class="modal-overlay" onclick="closeModalOnBackdrop(event)">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">⚡ Add Minecraft Server (No Login)</div>
              <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <form onsubmit="handleAddServerSubmit(event)">
              <div class="modal-body">
                <div>
                  <label>Server Name</label>
                  <input id="add-name" placeholder="e.g. My Survival SMP" required>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                  <div>
                    <label>Server Address</label>
                    <input id="add-host" value="\${escapeHtml(prefillHost)}" placeholder="play.myserver.com" required>
                  </div>
                  <div>
                    <label>Port</label>
                    <input id="add-port" type="number" value="\${escapeHtml(prefillPort)}" required>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div>
                    <label>Edition</label>
                    <select id="add-edition">
                      <option value="java">Java Edition (Mineflayer)</option>
                    </select>
                  </div>
                  <div>
                    <label>Minecraft Version</label>
                    <input id="add-version" placeholder="auto (or 1.20.4, 1.21)" value="auto">
                  </div>
                </div>

                <div style="background: #0d111a; border: 1px solid var(--card-border); border-radius: 10px; padding: 14px;">
                  <div style="font-weight: 700; margin-bottom: 8px; font-size: 14px;">🤖 Bot Initial Profile</div>
                  <div>
                    <label>Player Bot Username</label>
                    <input id="add-bot-name" placeholder="myfreebot_Player" value="MFB_\${Math.random().toString(36).slice(2, 6).toUpperCase()}" required>
                  </div>
                  <label style="display: flex; align-items: center; gap: 8px; margin-top: 12px; cursor: pointer;">
                    <input type="checkbox" id="add-persistent" checked style="width: auto;">
                    <span style="font-size: 13px;">Enable 24/7 Persistent Mode (Auto-reconnects when server returns)</span>
                  </label>
                </div>

                <div id="add-error" style="color: var(--offline); font-size: 13px; display: none;"></div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="add-submit-btn">Add Server & Create Key</button>
              </div>
            </form>
          </div>
        </div>
      \`;
    }

    async function handleAddServerSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('add-submit-btn');
      const errBox = document.getElementById('add-error');
      btn.disabled = true;
      btn.textContent = 'Creating Server & Key...';
      errBox.style.display = 'none';

      const payload = {
        name: document.getElementById('add-name').value.trim(),
        host: document.getElementById('add-host').value.trim(),
        port: document.getElementById('add-port').value.trim(),
        edition: document.getElementById('add-edition').value,
        version: document.getElementById('add-version').value.trim(),
        botUsername: document.getElementById('add-bot-name').value.trim(),
        persistent247: document.getElementById('add-persistent').checked
      };

      try {
        const res = await fetch('/api/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
          errBox.textContent = data.message || 'Failed to create server';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Add Server';
          return;
        }

        // Save access key to localStorage
        addKeyForServer(data.server.id, data.accessKey, data.server.name);

        // Show Success Access Key Modal
        showServerReadyModal(data.server, data.accessKey);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Add Server';
      }
    }

    function showServerReadyModal(server, accessKey) {
      const modal = document.getElementById('modal-container');
      modal.innerHTML = \`
        <div class="modal-overlay">
          <div class="modal" style="max-width: 550px;">
            <div class="modal-header">
              <div class="modal-title" style="color: var(--online);">🎉 Your Server Is Ready!</div>
            </div>
            <div class="modal-body">
              <p style="font-size: 14px; color: var(--text-muted);">
                Save your <strong>Server Access Key</strong> below. You can use it to manage your server from any device without creating an account.
              </p>

              <div class="key-box">
                <span id="created-key-text">\${escapeHtml(accessKey)}</span>
                <button class="btn btn-secondary btn-sm" onclick="copyText('\${accessKey}')">Copy</button>
              </div>

              <div style="background: rgba(255, 106, 0, 0.1); border: 1px solid rgba(255, 106, 0, 0.25); border-radius: 8px; padding: 12px; font-size: 12.5px; color: #ff9e42;">
                ⚠️ <strong>Do not lose this key:</strong> Without login, this key is the only credential to access your server dashboard.
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="downloadAccessKeyFile('\${server.name}', '\${accessKey}')">Download Key File</button>
              <button class="btn btn-primary" onclick="closeModal(); navigateTo('server-detail', '\${server.id}')">Open Dashboard ➔</button>
            </div>
          </div>
        </div>
      \`;
    }

    function showImportKeyModal() {
      const modal = document.getElementById('modal-container');
      modal.innerHTML = \`
        <div class="modal-overlay" onclick="closeModalOnBackdrop(event)">
          <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
              <div class="modal-title">🔑 Import Server by Key</div>
              <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <form onsubmit="handleImportKey(event)">
              <div class="modal-body">
                <p style="font-size: 13.5px; color: var(--text-muted);">
                  Paste a Server Access Key from an existing myfreebot server to manage it on this device.
                </p>
                <div>
                  <label>Server Access Key</label>
                  <input id="import-key-input" placeholder="mcf_sec_..." required>
                </div>
                <div id="import-error" style="color: var(--offline); font-size: 13px; display: none;"></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="import-btn">Import Server</button>
              </div>
            </form>
          </div>
        </div>
      \`;
    }

    async function handleImportKey(e) {
      e.preventDefault();
      const input = document.getElementById('import-key-input');
      const errBox = document.getElementById('import-error');
      const key = input.value.trim();
      if (!key) return;

      errBox.style.display = 'none';

      try {
        const res = await fetch('/api/servers/verify-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessKey: key })
        });
        const data = await res.json();
        if (!data.success) {
          errBox.textContent = 'Invalid Server Access Key';
          errBox.style.display = 'block';
          return;
        }

        addKeyForServer(data.server.id, key, data.server.name);
        closeModal();
        navigateTo('server-detail', data.server.id);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
      }
    }

    function showServerKeyModal(serverId) {
      const key = getKeyForServer(serverId);
      const modal = document.getElementById('modal-container');
      modal.innerHTML = \`
        <div class="modal-overlay" onclick="closeModalOnBackdrop(event)">
          <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
              <div class="modal-title">🔑 Server Access Key</div>
              <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size: 13.5px; color: var(--text-muted);">
                Keep this key safe. Anyone with this key can manage this server and bot.
              </p>
              <div class="key-box">
                <span>\${escapeHtml(key || 'Key not stored in browser')}</span>
                <button class="btn btn-secondary btn-sm" onclick="copyText('\${key}')">Copy</button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" onclick="closeModal()">Done</button>
            </div>
          </div>
        </div>
      \`;
    }

    function closeModal() {
      document.getElementById('modal-container').innerHTML = '';
    }

    function closeModalOnBackdrop(e) {
      if (e.target.classList.contains('modal-overlay')) closeModal();
    }

    function copyText(txt) {
      navigator.clipboard.writeText(txt);
      alert('Copied to clipboard!');
    }

    function downloadAccessKeyFile(serverName, key) {
      const text = \`myfreebot Server Access Key\\n========================\\nServer: \${serverName}\\nAccess Key: \${key}\\nDate: \${new Date().toISOString()}\\n\\nUse this key to access your server dashboard without login at anytime.\\n\`;
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = \`myfreebot_access_\${serverName.replace(/\\s+/g, '_')}.txt\`;
      a.click();
    }

    // ---------------- Utilities ----------------
    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatSeconds(sec) {
      const s = Number(sec) || 0;
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const rem = s % 60;
      if (h > 0) return \`\${h}h \${m}m\`;
      if (m > 0) return \`\${m}m \${rem}s\`;
      return \`\${rem}s\`;
    }

    // Docs & Status
    function renderDocsView() {
      const main = document.getElementById('app-view');
      main.innerHTML = \`
        <div class="card" style="max-width: 800px; margin: 0 auto;">
          <h2 style="font-size: 24px; margin-bottom: 12px;">Documentation & Quick Start</h2>
          <p style="color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            myfreebot connects a real Minecraft player client to your server to keep it active, chunk-loaded, and prevent shutdowns.
          </p>

          <h3 style="font-size: 16px; margin: 20px 0 8px;">1. Aternos Setup</h3>
          <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.6;">
            Enable <strong>Cracked</strong> mode on your Aternos server options. If your server is on a modern version (1.20+), install ViaVersion/ViaBackwards to allow multi-version bot handshakes.
          </p>

          <h3 style="font-size: 16px; margin: 20px 0 8px;">2. 24/7 Persistent Mode</h3>
          <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.6;">
            When enabled, myfreebot maintains an active listener. If the Minecraft server closes, myfreebot detects it, changes status to "Waiting for Server", and automatically rejoins the moment the server boots back online.
          </p>
        </div>
      \`;
    }

    function renderStatusView() {
      const main = document.getElementById('app-view');
      main.innerHTML = \`
        <div class="card" style="max-width: 700px; margin: 0 auto; text-align: center; padding: 40px;">
          <h2 style="font-size: 24px; margin-bottom: 12px;">Platform Runtime Status</h2>
          <div style="font-size: 18px; color: var(--online); font-weight: 700; margin-bottom: 20px;">🟢 All Systems Operational</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; text-align: left; max-width: 400px; margin: 0 auto; font-size: 14px;">
            <div><span style="color: var(--text-dim);">Backend Runtime:</span> <strong>Node.js 22</strong></div>
            <div><span style="color: var(--text-dim);">SLP Protocol Engine:</span> <strong>Active</strong></div>
            <div><span style="color: var(--text-dim);">SSE Stream Gateway:</span> <strong>Connected</strong></div>
            <div><span style="color: var(--text-dim);">Encryption Layer:</span> <strong>AES-256-GCM</strong></div>
          </div>
        </div>
      \`;
    }

    // Auto-boot router
    window.addEventListener('DOMContentLoaded', () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash && (hash === 'dashboard' || hash === 'docs' || hash === 'status')) {
        navigateTo(hash);
      } else {
        navigateTo('home');
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { renderApp };
