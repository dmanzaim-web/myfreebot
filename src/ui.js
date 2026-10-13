"use strict";

const { getAiChatAndBuilderScripts } = require("./uiAiChat");

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
      font-size: 13.5px;
      font-weight: 600;
      padding: 9px 18px;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      text-decoration: none;
      white-space: nowrap;
      user-select: none;
    }

    button:focus-visible, .btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    button:active, .btn:active {
      transform: translateY(1px) scale(0.985);
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff6a00 0%, #ff8533 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 2px 10px rgba(255, 106, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #ff7a1a 0%, #ff944d 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(255, 106, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }

    .btn-secondary {
      background: #141924;
      color: #f1f5f9;
      border: 1px solid #232c3f;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .btn-secondary:hover {
      background: #1c2333;
      border-color: #35435e;
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.12);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.28);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.22);
      border-color: rgba(239, 68, 68, 0.45);
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 3px 12px rgba(239, 68, 68, 0.22);
    }

    .btn-success {
      background: rgba(16, 185, 129, 0.12);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.28);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .btn-success:hover {
      background: rgba(16, 185, 129, 0.22);
      border-color: rgba(16, 185, 129, 0.45);
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 3px 12px rgba(16, 185, 129, 0.22);
    }

    .btn-sm {
      padding: 6px 13px;
      font-size: 12.5px;
      border-radius: 7px;
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

    /* Access Code Box */
    .key-box {
      background: #090d15;
      border: 1px solid rgba(255, 106, 0, 0.35);
      border-radius: 10px;
      padding: 14px 18px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #ff9e42;
      user-select: all;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.4);
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

    /* Audit Table & Protection Styling */
    .audit-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .audit-table th, .audit-table td {
      padding: 11px 14px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
    }
    .audit-table th {
      color: var(--text-dim);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      background: #090c13;
    }
    .audit-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .protection-card {
      background: #0f131d;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
    }

    .live-stat-box {
      background: #080b12;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .live-stat-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    /* ---------------- Server AI Chat Styles ---------------- */
    .ai-chat-layout {
      display: grid;
      grid-template-columns: 260px 1fr 280px;
      gap: 16px;
      height: calc(100vh - 120px);
      min-height: 600px;
      background: #07090f;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      margin-top: 10px;
    }
    @media (max-width: 1100px) {
      .ai-chat-layout {
        grid-template-columns: 240px 1fr;
      }
      .ai-context-drawer {
        display: none !important;
      }
    }
    @media (max-width: 768px) {
      .ai-chat-layout {
        grid-template-columns: 1fr;
        height: auto;
      }
      .ai-sidebar {
        display: none;
      }
    }

    .ai-sidebar {
      background: #0c0f17;
      border-right: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      padding: 16px;
      gap: 14px;
      overflow-y: auto;
    }
    .ai-conv-item {
      padding: 10px 12px;
      border-radius: 8px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      transition: all 0.15s;
    }
    .ai-conv-item:hover {
      background: #141a26;
      color: var(--text);
    }
    .ai-conv-item.active {
      background: #182030;
      border-color: #2b3952;
      color: #ff9e42;
      font-weight: 600;
    }

    .ai-main-chat {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #090c12;
      position: relative;
      overflow: hidden;
    }
    .ai-chat-header {
      padding: 14px 20px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0c0f17;
    }
    .ai-messages-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .ai-message {
      display: flex;
      gap: 14px;
      max-width: 900px;
      width: 100%;
      margin: 0 auto;
    }
    .ai-message.user {
      justify-content: flex-end;
    }
    .ai-message.user .ai-bubble {
      background: #182030;
      border: 1px solid #2a3750;
      border-radius: 14px 14px 2px 14px;
      padding: 14px 18px;
      max-width: 80%;
      color: #f8fafc;
    }
    .ai-message.assistant .ai-bubble {
      background: #0e121a;
      border: 1px solid var(--card-border);
      border-radius: 14px 14px 14px 2px;
      padding: 18px 22px;
      width: 100%;
      color: var(--text);
      line-height: 1.65;
    }

    .ai-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ff6a00, #ff9e00);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 800;
      color: #08090c;
      flex-shrink: 0;
      box-shadow: 0 0 14px var(--accent-glow);
    }

    .ai-context-drawer {
      background: #0c0f17;
      border-left: 1px solid var(--card-border);
      padding: 18px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Action Proposal Card */
    .action-proposal-card {
      background: #0d121c;
      border: 1px solid rgba(255, 106, 0, 0.35);
      border-radius: 12px;
      padding: 16px;
      margin: 14px 0;
      box-shadow: 0 4px 20px rgba(255, 106, 0, 0.08);
    }
    .action-proposal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .action-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    /* Code Block Card */
    .code-block-card {
      background: #05070a;
      border: 1px solid #1c2434;
      border-radius: 10px;
      margin: 12px 0;
      overflow: hidden;
    }
    .code-block-header {
      background: #0b0e14;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1c2434;
    }
    .code-lang-tag {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: #ff9e42;
      font-weight: 700;
    }
    .code-pre {
      padding: 14px;
      margin: 0;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      color: #e2e8f0;
    }
    .inline-code {
      background: #141a24;
      border: 1px solid #232c3d;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      color: #ff9e42;
    }
    .ai-blockquote {
      border-left: 3px solid var(--accent);
      padding: 8px 14px;
      background: rgba(255, 106, 0, 0.05);
      border-radius: 0 8px 8px 0;
      margin: 10px 0;
      font-style: italic;
      color: #cbd5e1;
    }

    /* Markdown Table Card */
    .ai-table-card {
      margin: 12px 0;
      border: 1px solid #1c2434;
      border-radius: 8px;
      overflow-x: auto;
      background: #070a10;
    }
    .ai-markdown-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .ai-markdown-table th {
      background: #0f1522;
      color: #ff9e42;
      padding: 10px 14px;
      border-bottom: 1px solid #1f293d;
      font-weight: 700;
    }
    .ai-markdown-table td {
      padding: 8px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
    }
    .ai-markdown-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    /* Input Box */
    .ai-input-wrapper {
      padding: 16px 20px;
      background: #0c0f17;
      border-top: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .prompt-pills-bar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
    }
    .prompt-pills-bar::-webkit-scrollbar { display: none; }
    .prompt-pill {
      background: #141924;
      border: 1px solid #222b3a;
      color: var(--text-muted);
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }
    .prompt-pill:hover {
      background: #1e2637;
      color: #ffffff;
      border-color: #374762;
    }

    /* Bot Builder Agent Cards */
    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .agent-card {
      background: #0e121a;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.2s;
    }
    .agent-card:hover {
      border-color: #2e3a50;
      background: #121824;
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
          <a class="nav-link" id="nav-ai-assistant" onclick="navigateTo('ai-assistant')">🤖 AI Assistant</a>
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
      auditLogs: [],
      keys: JSON.parse(localStorage.getItem('mcfbot_keys') || '[]'),
      sseSource: null,
      autoScrollLogs: true,
      logsFilter: 'ALL',
      logsSearch: '',
      // Server AI Chat state
      aiConversations: [],
      activeAiConvId: null,
      aiChatMode: 'chat', // 'chat' | 'agent'
      aiContextDrawerOpen: true,
      aiGenerating: false,
      aiSearchQuery: '',
      // Bot Builder state
      builderTasks: [],
      builderAgents: {},
      builderEvidence: [],
      builderReports: [],
      builderSettings: {},
      builderCurrentPlan: null
    };

    function saveKeys() {
      localStorage.setItem('mcfbot_keys', JSON.stringify(state.keys));
    }

    function getKeyForServer(serverId) {
      const match = state.keys.find(k => k.serverId === serverId);
      return match ? (match.sessionToken || match.code || match.key) : '';
    }

    function getAuthHeaders(serverId) {
      const match = state.keys.find(k => k.serverId === serverId) || {};
      const token = match.sessionToken || '';
      const code = match.code || match.key || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['X-Session-Token'] = token;
      if (code) {
        headers['X-Access-Code'] = code;
        headers['X-Server-Key'] = code;
      }
      return headers;
    }

    function addKeyForServer(serverId, key, name, code = null, sessionToken = null, role = 'owner', isOwner = true) {
      const existing = state.keys.find(k => k.serverId === serverId);
      if (existing) {
        if (key) existing.key = key;
        if (code) existing.code = code;
        if (name) existing.name = name;
        if (sessionToken) existing.sessionToken = sessionToken;
        if (role) existing.role = role;
        if (typeof isOwner === 'boolean') existing.isOwner = isOwner;
      } else {
        state.keys.push({ serverId, key, code: code || key, name, sessionToken, role, isOwner });
      }
      saveKeys();
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
      else if (view === 'ai-assistant') loadGlobalAiAssistant();
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
        const keyList = [];
        state.keys.forEach(k => {
          if (k.sessionToken) keyList.push(k.sessionToken);
          if (k.code) keyList.push(k.code);
          if (k.key && k.key !== k.code && k.key !== k.sessionToken) keyList.push(k.key);
        });

        const res = await fetch('/api/servers', {
          headers: {
            'X-Server-Keys': JSON.stringify(keyList),
            'X-Access-Codes': JSON.stringify(keyList)
          }
        });
        const data = await res.json();
        state.servers = data.servers || [];

        // Sync access codes and roles to local storage
        state.servers.forEach(s => {
          const entry = state.keys.find(k => k.serverId === s.id);
          if (entry) {
            if (s.accessCode) entry.code = s.accessCode;
            if (s.role) entry.role = s.role;
            if (typeof s.isOwner === 'boolean') entry.isOwner = s.isOwner;
          }
        });
        saveKeys();

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
            <div class="server-title-row" style="flex-wrap: wrap; gap: 8px;">
              <span class="server-name">\${escapeHtml(s.name)}</span>
              <span class="status-badge \${status}">\${status.replace(/_/g, ' ')}</span>
              \${s.isProtected ? '<span class="status-badge" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px;">🔒 Protected</span>' : '<span class="status-badge" style="background: rgba(100, 116, 139, 0.15); border: 1px solid rgba(100, 116, 139, 0.3); color: #94a3b8; font-size: 11px;">🔓 Unprotected</span>'}
              \${s.role === 'member' ? '<span class="status-badge" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 11px;">👤 Member</span>' : '<span class="status-badge" style="background: rgba(255, 106, 0, 0.15); border: 1px solid rgba(255, 106, 0, 0.3); color: #ff9e42; font-size: 11px;">👑 Owner</span>'}
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
      try {
        await fetch(\`/api/servers/\${serverId}/bot/\${action}\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId)
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
          <div class="card" style="max-width: 480px; margin: 40px auto; text-align: center;">
            <h3 style="font-size: 18px; margin-bottom: 8px;">Access Code Required</h3>
            <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 18px;">Please enter your Server Access Code to view this dashboard.</p>
            <input id="prompt-key" placeholder="e.g. MYSERVER-4827" style="text-transform: uppercase; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 600; letter-spacing: 1px; margin-bottom: 14px;" oninput="this.value = this.value.toUpperCase()">
            <button class="btn btn-primary" onclick="submitPromptKey('\${serverId}')">Access Server</button>
          </div>
        \`;
        return;
      }

      try {
        const res = await fetch(\`/api/servers/\${serverId}\`, {
          headers: getAuthHeaders(serverId)
        });
        if (res.status === 403) {
          main.innerHTML = \`<div class="card" style="text-align: center; padding: 40px; color: var(--offline);">403 Forbidden: Invalid Server Access Code or Session</div>\`;
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

    function submitPromptKey(serverId) {
      const input = document.getElementById('prompt-key');
      const code = input ? input.value.trim().toUpperCase() : '';
      if (!code) return;
      addKeyForServer(serverId, code, 'Server', code);
      loadServerDetail(serverId);
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
            <div style="font-family: monospace; font-size: 13px; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span>\${escapeHtml(s.host)}:\${s.port} &middot; Bot: <strong>\${escapeHtml(bot.username)}</strong></span>
              \${s.isProtected ? '<span class="status-badge" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px;">🔒 Protected</span>' : '<span class="status-badge" style="background: rgba(100, 116, 139, 0.15); border: 1px solid rgba(100, 116, 139, 0.3); color: #94a3b8; font-size: 11px;">🔓 Unprotected</span>'}
              \${s.isOwner ? '<span class="status-badge" style="background: rgba(255, 106, 0, 0.15); border: 1px solid rgba(255, 106, 0, 0.3); color: #ff9e42; font-size: 11px;">👑 Server Owner</span>' : '<span class="status-badge" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 11px;">👤 Authorized Member</span>'}
            </div>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <button class="btn btn-secondary btn-sm" onclick="showServerKeyModal('\${s.id}')">
              \${s.isOwner ? '🔑 View Access Code' : '🔒 Protection Info'}
            </button>
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
          <button class="tab-btn \${state.activeTab === 'ai-chat' ? 'active' : ''}" onclick="switchDetailTab('ai-chat')" style="color: #ff9e42; font-weight: 700;">💬 Server AI Chat</button>
          <button class="tab-btn \${state.activeTab === 'botbuilder' ? 'active' : ''}" onclick="switchDetailTab('botbuilder')" style="color: #38bdf8; font-weight: 700;">🤖 Bot Builder</button>
          <button class="tab-btn \${state.activeTab === 'console' ? 'active' : ''}" onclick="switchDetailTab('console')">Console Logs</button>
          <button class="tab-btn \${state.activeTab === 'chat' ? 'active' : ''}" onclick="switchDetailTab('chat')">Live Chat</button>
          <button class="tab-btn \${state.activeTab === 'commands' ? 'active' : ''}" onclick="switchDetailTab('commands')">Commands</button>
          <button class="tab-btn \${state.activeTab === 'antiafk' ? 'active' : ''}" onclick="switchDetailTab('antiafk')">Anti-AFK</button>
          <button class="tab-btn \${state.activeTab === 'autologin' ? 'active' : ''}" onclick="switchDetailTab('autologin')">Authentication</button>
          <button class="tab-btn \${state.activeTab === 'automation' ? 'active' : ''}" onclick="switchDetailTab('automation')">Automation</button>
          <button class="tab-btn \${state.activeTab === 'schedules' ? 'active' : ''}" onclick="switchDetailTab('schedules')">Schedules</button>
          <button class="tab-btn \${state.activeTab === 'players' ? 'active' : ''}" onclick="switchDetailTab('players')">Players</button>
          <button class="tab-btn \${state.activeTab === 'backups' ? 'active' : ''}" onclick="switchDetailTab('backups')">Backups</button>
          <button class="tab-btn \${state.activeTab === 'security' ? 'active' : ''}" onclick="switchDetailTab('security')">🔒 Security & Protection</button>
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
      } else if (state.activeTab === 'security') {
        loadAuditLogsForServer(s.id);
      } else if (state.activeTab === 'ai-chat') {
        loadServerAiChatData(s.id);
      } else if (state.activeTab === 'botbuilder') {
        loadBotBuilderData(s.id);
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
        case 'ai-chat':
          return renderServerAiChatTab();
        case 'botbuilder':
          return renderBotBuilderTab();
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

        case 'security':
          const isOwner = Boolean(s.isOwner || s.role === 'owner');
          return \`
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                  <div>
                    <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">🔒 Server Security & Protection</h3>
                    <p style="color: var(--text-muted); font-size: 13.5px;">
                      Manage platform access passwords, verify server protection status, and review security audit logs.
                    </p>
                  </div>
                  <div>
                    \${s.isProtected ? \`
                      <span class="status-badge ONLINE" style="font-size: 13px; padding: 6px 14px;">🔒 Server Protected</span>
                    \` : \`
                      <span class="status-badge OFFLINE" style="font-size: 13px; padding: 6px 14px;">🔓 Unprotected Server</span>
                    \`}
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 20px;">
                  <div style="background: #0d111a; border: 1px solid var(--card-border); border-radius: 10px; padding: 16px;">
                    <div style="font-size: 11.5px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 4px;">Protection Status</div>
                    <div style="font-size: 15px; font-weight: 700; color: \${s.isProtected ? 'var(--online)' : 'var(--text-muted)'};">
                      \${s.isProtected ? '🔒 Enabled (Password Required)' : '🔓 Disabled (No Password)'}
                    </div>
                    <div style="font-size: 12px; color: var(--text-dim); margin-top: 4px;">
                      \${s.isProtected ? 'Server Access Password is active. Others cannot add without permission.' : 'Server can be added by anyone who knows the address.'}
                    </div>
                  </div>

                  <div style="background: #0d111a; border: 1px solid var(--card-border); border-radius: 10px; padding: 16px;">
                    <div style="font-size: 11.5px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 4px;">Your Access Role</div>
                    <div style="font-size: 15px; font-weight: 700; color: \${isOwner ? 'var(--accent)' : '#38bdf8'};">
                      \${isOwner ? '👑 Server Owner' : '👤 Authorized Member'}
                    </div>
                    <div style="font-size: 12px; color: var(--text-dim); margin-top: 4px;">
                      \${isOwner ? 'Full administrative rights & secret credentials' : 'Bot management & realtime monitoring access'}
                    </div>
                  </div>

                  <div style="background: #0d111a; border: 1px solid var(--card-border); border-radius: 10px; padding: 16px;">
                    <div style="font-size: 11.5px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 4px;">Brute-Force Shield</div>
                    <div style="font-size: 15px; font-weight: 700; color: #34d399;">
                      🛡️ Protected (5-Attempt Threshold)
                    </div>
                    <div style="font-size: 12px; color: var(--text-dim); margin-top: 4px;">
                      15-minute temporary lockout on failed password attempts
                    </div>
                  </div>
                </div>

                \${isOwner ? \`
                  <div style="border-top: 1px solid var(--card-border); padding-top: 20px;">
                    <h4 style="font-size: 15px; margin-bottom: 12px;">Owner Protection Settings</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                      \${s.isProtected ? \`
                        <button class="btn btn-secondary btn-sm" onclick="showChangeServerPasswordModal('\${s.id}')">
                          🔑 Change Password
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="handleRegenerateServerPassword('\${s.id}')">
                          🔄 Regenerate Password
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="handleDisableProtection('\${s.id}')">
                          🔓 Disable Protection
                        </button>
                      \` : \`
                        <button class="btn btn-primary btn-sm" onclick="showEnableProtectionModal('\${s.id}')">
                          🔒 Enable Password Protection
                        </button>
                      \`}
                    </div>
                  </div>
                \` : \`
                  <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 14px; font-size: 13px; color: #bae6fd;">
                    ℹ️ <strong>Member Access:</strong> You are viewing this server as an Authorized Member. Protection settings, password modification, and deletion are restricted to the Server Owner.
                  </div>
                \`}
              </div>

              \${isOwner && s.accessCode ? \`
                <div class="card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                    <div>
                      <h3 style="font-size: 16px; font-weight: 700;">🔑 Server Access Code (Owner Login)</h3>
                      <p style="color: var(--text-muted); font-size: 13px;">
                        Your short memorable login code to access this server instantly without a password.
                      </p>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="handleRegenerateCode('\${s.id}')">
                      Regenerate Code
                    </button>
                  </div>
                  <div class="key-box">
                    <span id="displayed-access-code">\${escapeHtml(s.accessCode)}</span>
                    <button class="btn btn-secondary btn-sm" onclick="copyText('\${escapeHtml(s.accessCode)}')">Copy Code</button>
                  </div>
                </div>
              \` : ''}

              \${isOwner ? \`
                <div class="card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                      <h3 style="font-size: 16px; font-weight: 700;">📋 Security & Access Audit Log</h3>
                      <p style="color: var(--text-muted); font-size: 13px;">Recent security events, password modifications, and verified logins.</p>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="loadAuditLogsForServer('\${s.id}')">🔄 Refresh Logs</button>
                  </div>

                  <div id="audit-logs-container" style="overflow-x: auto;">
                    <div style="color: var(--text-dim); text-align: center; padding: 24px;">Loading audit events...</div>
                  </div>
                </div>
              \` : ''}
            </div>
          \`;

        case 'danger':
          const canDelete = Boolean(s.isOwner || s.role === 'owner');
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
                    <div style="font-size: 12px; color: var(--text-dim);">
                      \${canDelete ? 'Deletes server, bot runtime, logs, workflows, and removes access.' : '🔒 Only the Server Owner can delete this server. (Restricted for members)'}
                    </div>
                  </div>
                  \${canDelete ? \`
                    <button class="btn btn-danger btn-sm" onclick="deleteServerConfirm()">Delete Server</button>
                  \` : \`
                    <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.5; cursor: not-allowed;">Delete Restricted</button>
                  \`}
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
      } else if (msg.type === 'builder_task_progress') {
        const t = msg.data;
        if (!Array.isArray(state.builderTasks)) state.builderTasks = [];
        const idx = state.builderTasks.findIndex(x => x.id === t.id);
        if (idx >= 0) state.builderTasks[idx] = t;
        else state.builderTasks.unshift(t);
        if (state.activeTab === 'botbuilder') updateLiveBuilderTaskUi(t);
      }
    }

    // ---------------- Actions ----------------
    async function serverBotAction(action) {
      const serverId = state.activeServer?.id;
      try {
        await fetch(\`/api/servers/\${serverId}/bot/\${action}\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId)
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
      await fetch(\`/api/servers/\${serverId}/bot/chat\`, {
        method: 'POST',
        headers: getAuthHeaders(serverId),
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
      try {
        const res = await fetch(\`/api/servers/\${serverId}/bot/command\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
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
        headers: getAuthHeaders(serverId),
        body: JSON.stringify(payload)
      });
      alert('Anti-AFK settings updated!');
    }

    async function saveAutoLoginConfig(e) {
      e.preventDefault();
      const serverId = state.activeServer?.id;

      const payload = {
        autoLogin: {
          enabled: document.getElementById('login-enabled').checked,
          command: document.getElementById('login-cmd').value.trim(),
          password: document.getElementById('login-password').value,
          trigger: document.getElementById('login-trigger').value
        }
      };

      const res = await fetch(\`/api/servers/\${serverId}/bot/config\`, {
        method: 'PATCH',
        headers: getAuthHeaders(serverId),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to save auto-login settings');
        return;
      }
      alert('Authentication settings saved successfully!');
    }

    async function deleteServerConfirm() {
      const conf = confirm('Are you completely sure you want to delete this server? This will stop the bot and wipe all logs and workflows.');
      if (!conf) return;

      const serverId = state.activeServer?.id;
      const res = await fetch(\`/api/servers/\${serverId}\`, {
        method: 'DELETE',
        headers: getAuthHeaders(serverId)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to delete server');
        return;
      }

      state.keys = state.keys.filter(k => k.serverId !== serverId);
      saveKeys();
      navigateTo('dashboard');
    }

    // ---------------- Security Audit Logs & Management ----------------
    async function loadAuditLogsForServer(serverId) {
      const container = document.getElementById('audit-logs-container');
      if (!container) return;

      try {
        const res = await fetch(\`/api/servers/\${serverId}/audit-logs\`, {
          headers: getAuthHeaders(serverId)
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.logs) || data.logs.length === 0) {
          container.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 24px;">No security audit events recorded yet.</div>';
          return;
        }

        container.innerHTML = \`
          <table class="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Details</th>
                <th>Role</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              \${data.logs.map(log => \`
                <tr>
                  <td style="color: var(--text-dim); font-size: 12px; white-space: nowrap;">\${new Date(log.timestamp).toLocaleString()}</td>
                  <td><strong style="color: \${log.action.includes('FAIL') ? '#f87171' : log.action.includes('PROTECTION') ? '#34d399' : '#38bdf8'};">\${escapeHtml(log.action)}</strong></td>
                  <td style="color: var(--text-muted);">\${escapeHtml(log.details)}</td>
                  <td><span class="status-badge" style="font-size: 11px; padding: 2px 7px;">\${escapeHtml(log.role)}</span></td>
                  <td style="font-family: monospace; font-size: 12px; color: var(--text-dim);">\${escapeHtml(log.ip)}</td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        \`;
      } catch (err) {
        container.innerHTML = \`<div style="color: var(--offline); padding: 16px;">Failed to load audit logs: \${err.message}</div>\`;
      }
    }

    function showChangeServerPasswordModal(serverId) {
      const modal = document.getElementById('modal-container');
      modal.innerHTML = \`
        <div class="modal-overlay" onclick="closeModalOnBackdrop(event)">
          <div class="modal" style="max-width: 480px;">
            <div class="modal-header">
              <div class="modal-title">🔑 Change Server Access Password</div>
              <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <form onsubmit="handleChangePasswordSubmit(event, '\${serverId}')">
              <div class="modal-body">
                <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.5;">
                  Update the platform password that protects this server.
                </p>
                <div>
                  <label>Current Password</label>
                  <input type="password" id="chg-curr-pwd" placeholder="Enter current password" required>
                </div>
                <div>
                  <label>New Password (min 4 characters)</label>
                  <input type="password" id="chg-new-pwd" placeholder="Enter new password" required>
                </div>
                <div>
                  <label>Confirm New Password</label>
                  <input type="password" id="chg-confirm-pwd" placeholder="Confirm new password" required>
                </div>
                <div style="font-size: 12px; color: #ff9e42; background: rgba(255, 106, 0, 0.1); padding: 10px; border-radius: 6px; border: 1px solid rgba(255, 106, 0, 0.2);">
                  ⚠️ <strong>Note:</strong> Changing the password will immediately revoke all active member sessions.
                </div>
                <div id="chg-pwd-error" style="color: var(--offline); font-size: 13px; display: none;"></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="chg-pwd-btn">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      \`;
    }

    async function handleChangePasswordSubmit(e, serverId) {
      e.preventDefault();
      const currentPassword = document.getElementById('chg-curr-pwd').value;
      const newPassword = document.getElementById('chg-new-pwd').value;
      const confirmNewPassword = document.getElementById('chg-confirm-pwd').value;
      const errBox = document.getElementById('chg-pwd-error');
      const btn = document.getElementById('chg-pwd-btn');

      if (newPassword !== confirmNewPassword) {
        errBox.textContent = 'New passwords do not match.';
        errBox.style.display = 'block';
        return;
      }
      if (newPassword.length < 4) {
        errBox.textContent = 'Password must be at least 4 characters.';
        errBox.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Updating...';
      errBox.style.display = 'none';

      try {
        const res = await fetch(\`/api/servers/\${serverId}/protection/change-password\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
        });
        const data = await res.json();
        if (!data.success) {
          errBox.textContent = data.message || 'Failed to change password';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Update Password';
          return;
        }
        alert('Server access password changed successfully!');
        closeModal();
        loadServerDetail(serverId);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Update Password';
      }
    }

    async function handleDisableProtection(serverId) {
      const confirmed = confirm("Are you sure you want to disable password protection?\\n\\nWithout protection, any user on the platform can add this server using its IP and port.");
      if (!confirmed) return;

      try {
        const res = await fetch(\`/api/servers/\${serverId}/protection/disable\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId)
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.message || 'Failed to disable protection');
          return;
        }
        alert('Server password protection disabled.');
        loadServerDetail(serverId);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    function showEnableProtectionModal(serverId) {
      const modal = document.getElementById('modal-container');
      modal.innerHTML = \`
        <div class="modal-overlay" onclick="closeModalOnBackdrop(event)">
          <div class="modal" style="max-width: 480px;">
            <div class="modal-header">
              <div class="modal-title">🔒 Enable Password Protection</div>
              <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <form onsubmit="handleEnableProtectionSubmit(event, '\${serverId}')">
              <div class="modal-body">
                <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.5;">
                  Protect your server with a platform access password so other users cannot add or access it without your permission.
                </p>
                <div>
                  <label>Server Access Password (min 4 chars)</label>
                  <input type="password" id="en-new-pwd" placeholder="Enter password" required>
                </div>
                <div>
                  <label>Confirm Password</label>
                  <input type="password" id="en-confirm-pwd" placeholder="Confirm password" required>
                </div>
                <div style="font-size: 12px; color: #ff9e42; background: rgba(255, 106, 0, 0.1); padding: 10px; border-radius: 6px; border: 1px solid rgba(255, 106, 0, 0.2);">
                  💡 <strong>Note:</strong> This password protects your server inside this platform. It is not your Minecraft server password.
                </div>
                <div id="en-pwd-error" style="color: var(--offline); font-size: 13px; display: none;"></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="en-pwd-btn">Create Protection</button>
              </div>
            </form>
          </div>
        </div>
      \`;
    }

    async function handleEnableProtectionSubmit(e, serverId) {
      e.preventDefault();
      const password = document.getElementById('en-new-pwd').value;
      const confirmPassword = document.getElementById('en-confirm-pwd').value;
      const errBox = document.getElementById('en-pwd-error');
      const btn = document.getElementById('en-pwd-btn');

      if (password !== confirmPassword) {
        errBox.textContent = 'Passwords do not match.';
        errBox.style.display = 'block';
        return;
      }
      if (password.length < 4) {
        errBox.textContent = 'Password must be at least 4 characters.';
        errBox.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Enabling...';
      errBox.style.display = 'none';

      try {
        const res = await fetch(\`/api/servers/\${serverId}/protection/enable\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({ password, confirmPassword })
        });
        const data = await res.json();
        if (!data.success) {
          errBox.textContent = data.message || 'Failed to enable protection';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Create Protection';
          return;
        }
        alert('Server protection enabled successfully! 🔒 Server Protected (Server Access Password: Enabled)');
        closeModal();
        loadServerDetail(serverId);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Create Protection';
      }
    }

    async function handleRegenerateServerPassword(serverId) {
      const confirmed = confirm("Are you sure you want to regenerate the server password?\\n\\nA new secure random password will be created, and all existing member sessions will be invalidated immediately.");
      if (!confirmed) return;

      try {
        const res = await fetch(\`/api/servers/\${serverId}/protection/regenerate-password\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId)
        });
        const data = await res.json();
        if (!data.success || !data.generatedPassword) {
          alert(data.message || 'Failed to regenerate password');
          return;
        }

        const modal = document.getElementById('modal-container');
        modal.innerHTML = \`
          <div class="modal-overlay" onclick="closeModalOnBackdrop(event)">
            <div class="modal" style="max-width: 500px;">
              <div class="modal-header">
                <div class="modal-title" style="color: var(--online);">🎉 New Server Password Generated</div>
                <button class="modal-close" onclick="closeModal()">✕</button>
              </div>
              <div class="modal-body">
                <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.5;">
                  A new secure password has been generated for your server. Save this password now. (It will not be displayed again once you close this window).
                </p>
                <div>
                  <label>Generated Server Password</label>
                  <div class="key-box">
                    <span id="gen-pwd-text">\${escapeHtml(data.generatedPassword)}</span>
                    <button class="btn btn-secondary btn-sm" onclick="copyText('\${escapeHtml(data.generatedPassword)}')">Copy</button>
                  </div>
                </div>
                <div style="font-size: 12px; color: #ff9e42; background: rgba(255, 106, 0, 0.1); padding: 10px; border-radius: 6px; border: 1px solid rgba(255, 106, 0, 0.2);">
                  🔒 <strong>Status:</strong> Server Protected (Server Access Password: Enabled). All previous member sessions have been invalidated.
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal(); loadServerDetail('\${serverId}')">Done</button>
              </div>
            </div>
          </div>
        \`;
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    // ---------------- Console Logs ----------------
    async function loadLogsForServer() {
      const serverId = state.activeServer?.id;

      try {
        const res = await fetch(\`/api/servers/\${serverId}/logs\`, {
          headers: getAuthHeaders(serverId)
        });
        const d = await res.json();
        state.logs = d.logs || [];
        renderAllLogs();
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
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
          <div class="modal" style="max-width: 620px;">
            <div class="modal-header">
              <div class="modal-title">⚡ Add Minecraft Server (No Login)</div>
              <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <div>
                <label>Server Name</label>
                <input id="add-name" placeholder="e.g. My Survival SMP" required>
              </div>

              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                <div>
                  <label>IP / Domain</label>
                  <input id="add-host" value="\${escapeHtml(prefillHost)}" placeholder="play.myserver.com or heartly.aternos.me" required>
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
                    <option value="java" selected>Java Edition</option>
                    <option value="bedrock">Bedrock Edition</option>
                    <option value="auto">Auto Detect</option>
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

              <div id="add-test-error" style="color: var(--offline); font-size: 13px; display: none;"></div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" id="add-test-btn" onclick="executeTestAndCheckServer()">
                  📡 Test Connection
                </button>
              </div>

              <!-- Step 2 Container: Connection Results & Protection Options -->
              <div id="add-step2-container" style="display: none; margin-top: 8px;"></div>
            </div>
          </div>
        </div>
      \`;
    }

    async function executeTestAndCheckServer() {
      const name = document.getElementById('add-name').value.trim();
      const host = document.getElementById('add-host').value.trim();
      const port = document.getElementById('add-port').value.trim();
      const errBox = document.getElementById('add-test-error');
      const testBtn = document.getElementById('add-test-btn');
      const step2Box = document.getElementById('add-step2-container');

      if (!host) {
        errBox.textContent = 'Please enter a valid server IP or domain address.';
        errBox.style.display = 'block';
        return;
      }
      if (!name) {
        errBox.textContent = 'Please enter a name for this server.';
        errBox.style.display = 'block';
        return;
      }

      errBox.style.display = 'none';
      testBtn.disabled = true;
      testBtn.textContent = 'Testing Connection & Inspecting...';

      try {
        const res = await fetch('/api/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port })
        });
        const data = await res.json();
        renderStep2ProtectionFlow(data);
      } catch (err) {
        errBox.textContent = 'Connection test failed: ' + err.message;
        errBox.style.display = 'block';
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = '📡 Retest Connection';
      }
    }

    function renderStep2ProtectionFlow(pingData) {
      const step2Box = document.getElementById('add-step2-container');
      if (!step2Box) return;
      step2Box.style.display = 'block';

      const statusBadge = pingData.online
        ? \`<div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #34d399; font-size: 14px;">🟢 Server Online & Reachable!</strong>
              <span style="font-family: monospace; color: #34d399; font-weight: 700;">\${pingData.latency}ms ping</span>
            </div>
            <div style="display: flex; gap: 14px; font-size: 12.5px; color: var(--text-muted); margin-top: 6px; flex-wrap: wrap;">
              <span>Version: <strong style="color: var(--text);">\${escapeHtml(pingData.version?.name || 'Java')}</strong></span>
              <span>Players: <strong style="color: var(--text);">\${pingData.players?.online || 0} / \${pingData.players?.max || 0}</strong></span>
              <span>Target: <strong style="color: var(--text); font-family: monospace;">\${escapeHtml(pingData.resolvedHost)}:\${pingData.resolvedPort}</strong></span>
            </div>
          </div>\`
        : \`<div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="color: #fbbf24; font-size: 13.5px;">
              <strong>🟡 Minecraft Server Currently Offline</strong>
              <div style="font-size: 12px; margin-top: 4px;">Target: \${escapeHtml(pingData.resolvedHost)}:\${pingData.resolvedPort}. myfreebot will register this server and auto-reconnect 24/7 the moment it boots online.</div>
            </div>
          </div>\`;

      // ---------------- CASE 1: Server already registered AND protected ----------------
      if (pingData.isRegistered && pingData.isProtected) {
        step2Box.innerHTML = \`
          \${statusBadge}
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.28); border-radius: 10px; padding: 18px;">
            <div style="font-size: 16px; font-weight: 700; color: #fca5a5; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              🔒 Protected Server
            </div>
            <div style="font-size: 13.5px; font-weight: 600; margin-bottom: 4px;">
              This server is protected by its owner.
            </div>
            <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.5;">
              Enter the Server Access Password to continue adding this server to your dashboard as an authorized member.
            </p>

            <div>
              <label>Server Access Password</label>
              <input type="password" id="join-server-pwd" placeholder="Enter server access password" required>
            </div>

            <div id="unlock-pwd-error" style="color: var(--offline); font-size: 12.5px; margin-top: 8px; display: none;"></div>

            <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="button" class="btn btn-primary" id="unlock-submit-btn" onclick="executeUnlockProtectedServer('\${pingData.serverId || ''}', '\${pingData.resolvedHost}', \${pingData.resolvedPort})">
                Unlock & Continue ➔
              </button>
            </div>
          </div>
        \`;
        return;
      }

      // ---------------- CASE 2: Server already registered AND unprotected ----------------
      if (pingData.isRegistered && !pingData.isProtected) {
        step2Box.innerHTML = \`
          \${statusBadge}
          <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 18px;">
            <div style="font-size: 16px; font-weight: 700; color: #38bdf8; margin-bottom: 4px;">
              ℹ️ Server Found on Platform
            </div>
            <div style="font-size: 13.5px; font-weight: 600; margin-bottom: 4px;">
              This server is already registered on the platform.
            </div>
            <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5;">
              This server has no access password protection. You can add it to your dashboard to monitor and run your bot.
            </p>
            <div style="background: rgba(56, 189, 248, 0.12); padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #bae6fd; margin-bottom: 14px;">
              🛡️ <strong>Access Notice:</strong> You will connect with <strong>Authorized Member / Bot Access</strong>. You cannot delete the original server or alter owner administrative secrets.
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="button" class="btn btn-primary" id="join-unprotected-btn" onclick="executeJoinUnprotectedServer('\${pingData.serverId || ''}', '\${pingData.resolvedHost}', \${pingData.resolvedPort})">
                Connect to Server as Member ➔
              </button>
            </div>
          </div>
        \`;
        return;
      }

      // ---------------- CASE 3: Server is NOT registered on platform ----------------
      step2Box.innerHTML = \`
        \${statusBadge}
        <div style="background: #0d111a; border: 1px solid var(--card-border); border-radius: 10px; padding: 18px;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            🛡️ Protect Your Server
          </div>
          <div style="font-size: 13.5px; font-weight: 600; color: var(--text); margin-bottom: 2px;">
            Do you want to protect this server?
          </div>
          <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.5;">
            Add a password to prevent other users from adding or accessing this server through the platform.
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;">
            <label style="display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: #080a0f; border: 1px solid var(--card-border); border-radius: 8px; cursor: pointer;">
              <input type="radio" name="add-protect-choice" value="no" checked onchange="toggleAddProtectionFields(false)" style="margin-top: 3px; width: auto;">
              <div>
                <strong style="font-size: 13.5px;">No Password</strong>
                <div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">The server will not be protected. Any user can try to add the server using IP and Port, according to platform permissions.</div>
              </div>
            </label>

            <label style="display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: #080a0f; border: 1px solid var(--card-border); border-radius: 8px; cursor: pointer;">
              <input type="radio" name="add-protect-choice" value="yes" onchange="toggleAddProtectionFields(true)" style="margin-top: 3px; width: auto;">
              <div>
                <strong style="font-size: 13.5px;">Protect With Password</strong>
                <div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">Add a password to prevent other users from adding or accessing this server through the platform.</div>
              </div>
            </label>
          </div>

          <div id="add-protection-inputs" style="display: none; flex-direction: column; gap: 10px; background: #121824; padding: 14px; border-radius: 8px; border: 1px solid #232c3f; margin-bottom: 14px;">
            <div>
              <label>Server Access Password</label>
              <input type="password" id="new-server-pwd" placeholder="Choose a password (min 4 characters)">
            </div>
            <div>
              <label>Confirm Password</label>
              <input type="password" id="new-server-confirm-pwd" placeholder="Confirm password">
            </div>
            <div style="font-size: 12px; color: #ff9e42; background: rgba(255, 106, 0, 0.1); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255, 106, 0, 0.2);">
              💡 <strong>Important:</strong> This password protects your server inside this platform. It is not your Minecraft server password.
            </div>
          </div>

          <div id="new-server-error" style="color: var(--offline); font-size: 12.5px; margin-bottom: 10px; display: none;"></div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="button" class="btn btn-primary" id="add-create-final-btn" onclick="executeCreateNewServer()">
              Add Server (No Protection)
            </button>
          </div>
        </div>
      \`;
    }

    function toggleAddProtectionFields(show) {
      const el = document.getElementById('add-protection-inputs');
      const btn = document.getElementById('add-create-final-btn');
      if (el) el.style.display = show ? 'flex' : 'none';
      if (btn) btn.textContent = show ? 'Create Protection & Add Server' : 'Add Server (No Protection)';
    }

    async function executeCreateNewServer() {
      const name = document.getElementById('add-name').value.trim();
      const host = document.getElementById('add-host').value.trim();
      const port = document.getElementById('add-port').value.trim();
      const edition = document.getElementById('add-edition').value;
      const version = document.getElementById('add-version').value.trim();
      const botUsername = document.getElementById('add-bot-name').value.trim();
      const persistent247 = document.getElementById('add-persistent').checked;
      const protectChoices = document.getElementsByName('add-protect-choice');
      let protectServer = false;
      for (const r of protectChoices) {
        if (r.checked && r.value === 'yes') protectServer = true;
      }

      const pwdInput = document.getElementById('new-server-pwd');
      const pwdConfirmInput = document.getElementById('new-server-confirm-pwd');
      const errBox = document.getElementById('new-server-error');
      const btn = document.getElementById('add-create-final-btn');

      let serverPassword = '';
      if (protectServer) {
        serverPassword = pwdInput ? pwdInput.value : '';
        const confirmPwd = pwdConfirmInput ? pwdConfirmInput.value : '';
        if (!serverPassword || serverPassword.length < 4) {
          errBox.textContent = 'Server password must be at least 4 characters.';
          errBox.style.display = 'block';
          return;
        }
        if (serverPassword !== confirmPwd) {
          errBox.textContent = 'Passwords do not match.';
          errBox.style.display = 'block';
          return;
        }
      }

      errBox.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Creating Server & Registering...';

      try {
        const res = await fetch('/api/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            host,
            port,
            edition,
            version,
            botUsername,
            persistent247,
            protectServer,
            serverPassword
          })
        });
        const data = await res.json();
        if (!data.success) {
          errBox.textContent = data.message || 'Failed to create server';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = protectServer ? 'Create Protection & Add Server' : 'Add Server';
          return;
        }

        const accessCode = data.accessCode || data.accessKey;
        addKeyForServer(data.server.id, data.accessKey, data.server.name, accessCode, data.sessionToken, 'owner', true);
        showServerReadyModal(data.server, accessCode, protectServer);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = protectServer ? 'Create Protection & Add Server' : 'Add Server';
      }
    }

    async function executeUnlockProtectedServer(serverId, host, port) {
      const pwdInput = document.getElementById('join-server-pwd');
      const errBox = document.getElementById('unlock-pwd-error');
      const btn = document.getElementById('unlock-submit-btn');
      const password = pwdInput ? pwdInput.value.trim() : '';

      if (!password) {
        errBox.textContent = 'Enter the server access password to continue.';
        errBox.style.display = 'block';
        return;
      }

      errBox.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Verifying Password...';

      try {
        const verifyRes = await fetch('/api/servers/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverId, host, port, password })
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success || !verifyData.verified) {
          errBox.textContent = verifyData.message || 'Invalid Server Password';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Unlock & Continue ➔';
          return;
        }

        // Connect with verified sessionToken
        const name = document.getElementById('add-name').value.trim();
        const edition = document.getElementById('add-edition').value;
        const version = document.getElementById('add-version').value.trim();
        const botUsername = document.getElementById('add-bot-name').value.trim();
        const persistent247 = document.getElementById('add-persistent').checked;

        const addRes = await fetch('/api/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            host,
            port,
            edition,
            version,
            botUsername,
            persistent247,
            sessionToken: verifyData.sessionToken
          })
        });
        const addData = await addRes.json();
        if (!addData.success) {
          errBox.textContent = addData.message || 'Failed to connect to server';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Unlock & Continue ➔';
          return;
        }

        addKeyForServer(addData.server.id, verifyData.sessionToken, addData.server.name, null, verifyData.sessionToken, 'member', false);
        closeModal();
        navigateTo('server-detail', addData.server.id);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Unlock & Continue ➔';
      }
    }

    async function executeJoinUnprotectedServer(serverId, host, port) {
      const name = document.getElementById('add-name').value.trim();
      const edition = document.getElementById('add-edition').value;
      const version = document.getElementById('add-version').value.trim();
      const botUsername = document.getElementById('add-bot-name').value.trim();
      const persistent247 = document.getElementById('add-persistent').checked;
      const btn = document.getElementById('join-unprotected-btn');

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Connecting...';
      }

      try {
        const res = await fetch('/api/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            host,
            port,
            edition,
            version,
            botUsername,
            persistent247
          })
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.message || 'Failed to connect to server');
          if (btn) btn.disabled = false;
          return;
        }

        addKeyForServer(data.server.id, data.sessionToken, data.server.name, null, data.sessionToken, 'member', false);
        closeModal();
        navigateTo('server-detail', data.server.id);
      } catch (err) {
        alert('Error: ' + err.message);
        if (btn) btn.disabled = false;
      }
    }

    function showServerReadyModal(server, accessCode, isProtected = false) {
      const modal = document.getElementById('modal-container');
      modal.innerHTML = \`
        <div class="modal-overlay">
          <div class="modal" style="max-width: 520px;">
            <div class="modal-header">
              <div class="modal-title" style="color: var(--online);">🎉 Your Server Is Ready!</div>
            </div>
            <div class="modal-body">
              <div style="margin-bottom: 10px;">
                \${isProtected ? \`
                  <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #34d399; font-weight: 600;">
                    🔒 Server Protected &middot; Server Access Password: Enabled
                  </div>
                \` : \`
                  <div style="background: rgba(100, 116, 139, 0.12); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #cbd5e1;">
                    🔓 Server Active (No Password Protection)
                  </div>
                \`}
              </div>

              <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.6;">
                Save your <strong>Access Code</strong> below. You can use it to log into your server dashboard instantly from any device.
              </p>

              <div>
                <label style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;">
                  Your Access Code
                </label>
                <div class="key-box">
                  <span id="created-key-text">\${escapeHtml(accessCode)}</span>
                  <button class="btn btn-secondary btn-sm" onclick="copyText('\${escapeHtml(accessCode)}')">Copy</button>
                </div>
              </div>

              <div style="background: rgba(255, 106, 0, 0.1); border: 1px solid rgba(255, 106, 0, 0.25); border-radius: 8px; padding: 12px; font-size: 12.5px; color: #ff9e42; line-height: 1.5;">
                💡 <strong>Access Code vs Server Password:</strong><br>
                &bull; <strong>Access Code:</strong> Your quick personal code to log into your dashboard.<br>
                &bull; <strong>Server Password:</strong> Protects your server from being added or controlled by other platform users.
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="downloadAccessKeyFile('\${escapeHtml(server.name)}', '\${escapeHtml(accessCode)}')">Download Key File</button>
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
          <div class="modal" style="max-width: 480px;">
            <div class="modal-header">
              <div class="modal-title">🔑 Access by Key</div>
              <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <form onsubmit="handleImportKey(event)">
              <div class="modal-body">
                <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.5;">
                  Enter your short Server Access Code to manage your bot and server instantly.
                </p>
                <div>
                  <label>Enter Access Code</label>
                  <input id="import-key-input" placeholder="e.g. MYSERVER-4827" style="text-transform: uppercase; font-family: 'JetBrains Mono', monospace; font-size: 15px; letter-spacing: 1px; font-weight: 600;" oninput="this.value = this.value.toUpperCase()" required autofocus>
                </div>
                <div id="import-error" style="color: var(--offline); font-size: 13px; display: none;"></div>
                <div id="import-welcome" style="color: var(--online); font-size: 14px; font-weight: 700; display: none; padding: 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;"></div>
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
      const welcomeBox = document.getElementById('import-welcome');
      const btn = document.getElementById('import-btn');
      const code = input.value.trim().toUpperCase();
      if (!code) return;

      errBox.style.display = 'none';
      if (welcomeBox) welcomeBox.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Verifying...';

      try {
        const res = await fetch('/api/servers/verify-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: code, accessKey: code })
        });
        const data = await res.json();
        if (!data.success) {
          errBox.textContent = data.message || 'Invalid Access Code. Please check the code and try again.';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Import Server';
          return;
        }

        const accessCode = data.server.accessCode || code;
        addKeyForServer(data.server.id, accessCode, data.server.name, accessCode);

        // Friendly Welcome back message
        if (welcomeBox) {
          welcomeBox.textContent = \`Welcome back, \${data.server.name || accessCode}!\`;
          welcomeBox.style.display = 'block';
        }

        setTimeout(() => {
          closeModal();
          navigateTo('server-detail', data.server.id);
        }, 500);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Import Server';
      }
    }

    function showServerKeyModal(serverId) {
      const server = state.servers.find(s => s.id === serverId) || state.activeServer || {};
      const code = server.accessCode || getKeyForServer(serverId);
      const modal = document.getElementById('modal-container');
      modal.innerHTML = \`
        <div class="modal-overlay" onclick="closeModalOnBackdrop(event)">
          <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
              <div class="modal-title">🔑 Server Access Code</div>
              <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.5;">
                Use this simple code to access and manage your server from any browser or device without a password.
              </p>
              <div>
                <label style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;">Access Code</label>
                <div class="key-box">
                  <span id="displayed-access-code">\${escapeHtml(code || 'Code unavailable')}</span>
                  <button class="btn btn-secondary btn-sm" onclick="copyText('\${escapeHtml(code)}')">Copy</button>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 14px; border-top: 1px solid var(--card-border);">
                <div>
                  <div style="font-size: 13px; font-weight: 600;">Regenerate Access Code</div>
                  <div style="font-size: 11.5px; color: var(--text-dim);">Old code will be invalidated immediately.</div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="handleRegenerateCode('\${serverId}')">Regenerate</button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" onclick="closeModal()">Done</button>
            </div>
          </div>
        </div>
      \`;
    }

    async function handleRegenerateCode(serverId) {
      const confirmed = confirm("Are you sure you want to regenerate your Access Code?\\n\\nThe previous code will stop working immediately, and you must use the new code to log in.");
      if (!confirmed) return;

      const currentKey = getKeyForServer(serverId);
      try {
        const res = await fetch(\`/api/servers/\${serverId}/regenerate-code\`, {
          method: 'POST',
          headers: { 'X-Server-Key': currentKey, 'X-Access-Code': currentKey }
        });
        const data = await res.json();
        if (data.success && data.accessCode) {
          addKeyForServer(serverId, data.accessCode, state.activeServer?.name, data.accessCode);
          if (state.activeServer) state.activeServer.accessCode = data.accessCode;
          const displayEl = document.getElementById('displayed-access-code');
          if (displayEl) displayEl.textContent = data.accessCode;
          alert(\`New Access Code generated: \${data.accessCode}\`);
        } else {
          alert(data.message || 'Failed to regenerate code');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
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

    function downloadAccessKeyFile(serverName, code) {
      const text = \`myfreebot Server Access Code\\n========================\\nServer: \${serverName}\\nAccess Code: \${code}\\nDate: \${new Date().toISOString()}\\n\\nUse this short code to access your server dashboard without login at anytime.\\n\`;
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
