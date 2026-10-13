"use strict";

function getAiChatAndBuilderScripts() {
  return `
    // ---------------- Markdown & Code Syntax Formatter ----------------
    function formatMarkdown(text) {
      if (!text) return '';
      let str = escapeHtml(text);

      // Code blocks: \`\`\`lang ... \`\`\`
      str = str.replace(/\`\`\`([a-zA-Z0-9_\\-\\+]*)\\n([\\s\\S]*?)\`\`\`/g, (match, lang, code) => {
        const l = (lang || 'code').toUpperCase();
        const rawUnescaped = code
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        return \`<div class="code-block-card">
          <div class="code-block-header">
            <span class="code-lang-tag">\${l}</span>
            <button class="btn btn-secondary btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="copyRawCode(this)">📋 Copy Code</button>
          </div>
          <pre class="code-pre"><code>\${code}</code></pre>
          <textarea class="raw-code-store" style="display:none;">\${escapeHtml(rawUnescaped)}</textarea>
        </div>\`;
      });

      // Inline code
      str = str.replace(/\`([^\`]+)\`/g, '<code class="inline-code">$1</code>');

      // Headers
      str = str.replace(/^### (.*$)/gim, '<h4 style="margin: 12px 0 6px; font-size: 15px; font-weight: 700; color: #ff9e42;">$1</h4>');
      str = str.replace(/^## (.*$)/gim, '<h3 style="margin: 14px 0 8px; font-size: 17px; font-weight: 700;">$1</h3>');
      str = str.replace(/^# (.*$)/gim, '<h2 style="margin: 16px 0 8px; font-size: 19px; font-weight: 800;">$1</h2>');

      // Bold & Italic
      str = str.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');
      str = str.replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>');

      // Blockquotes
      str = str.replace(/^\\> (.*$)/gim, '<blockquote class="ai-blockquote">$1</blockquote>');

      // Markdown Tables
      str = str.replace(/((?:\\|[^\n]+\\|\r?\n?)+)/g, (match) => {
        const lines = match.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
        if (lines.length < 2) return match;
        const headerLine = lines[0];
        const sepLine = lines[1];
        if (!sepLine.includes('---') && !sepLine.includes(':--')) return match;
        const getCells = (l) => l.slice(1, -1).split('|').map(c => c.trim());
        const headers = getCells(headerLine);
        const dataLines = lines.slice(2);
        let t = '<div class="ai-table-card"><table class="ai-markdown-table"><thead><tr>';
        headers.forEach(h => { t += '<th>' + h + '</th>'; });
        t += '</tr></thead><tbody>';
        dataLines.forEach(row => {
          const cells = getCells(row);
          t += '<tr>';
          cells.forEach(c => { t += '<td>' + c + '</td>'; });
          t += '</tr>';
        });
        t += '</tbody></table></div>';
        return t;
      });

      // Lists
      str = str.replace(/^\\s*[\\-\\*]\\s+(.*$)/gim, '<li style="margin-left: 18px; margin-bottom: 4px;">$1</li>');
      str = str.replace(/^\\s*(\\d+)\\.\\s+(.*$)/gim, '<li style="margin-left: 18px; margin-bottom: 4px;" value="$1">$2</li>');

      // Line breaks
      str = str.replace(/\\n\\n/g, '<p style="margin-bottom: 8px;"></p>');
      str = str.replace(/\\n/g, '<br>');

      return str;
    }

    function copyRawCode(btn) {
      const parent = btn.closest('.code-block-card');
      const store = parent.querySelector('.raw-code-store');
      if (store) {
        navigator.clipboard.writeText(store.value);
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
      }
    }

    function copyAiMessageText(btn, text) {
      navigator.clipboard.writeText(text);
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(() => btn.textContent = originalText, 2000);
    }

    function insertPromptToInput(txt) {
      const input = document.getElementById('ai-chat-input') || document.getElementById('bb-task-input');
      if (input) {
        input.value = txt;
        input.focus();
      }
    }

    // ---------------- Global AI Assistant View ----------------
    function loadGlobalAiAssistant() {
      const main = document.getElementById('app-view');
      const servers = state.servers || [];

      if (servers.length === 0) {
        main.innerHTML = \`
          <div style="text-align: center; padding: 80px 20px; max-width: 600px; margin: 0 auto;">
            <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
            <h2 style="font-size: 26px; font-weight: 800; margin-bottom: 10px;">Server AI Assistant</h2>
            <p style="color: var(--text-muted); margin-bottom: 24px; line-height: 1.6;">
              Please add or import a Minecraft server first to chat with its dedicated Server AI Assistant.
            </p>
            <button class="btn btn-primary" onclick="showAddServerModal()">+ Add Your First Server</button>
          </div>
        \`;
        return;
      }

      // If active server is already selected, route directly into it
      const targetServerId = state.activeServerId || servers[0].id;
      state.activeServerId = targetServerId;
      state.activeServer = servers.find(s => s.id === targetServerId) || servers[0];
      state.activeTab = 'ai-chat';
      navigateTo('server-detail', targetServerId);
    }

    // ---------------- Server AI Chat Tab Implementation ----------------
    function renderServerAiChatTab() {
      const s = state.activeServer || {};
      const conv = state.aiConversations.find(c => c.id === state.activeAiConvId) || state.aiConversations[0] || null;
      const messages = conv ? (conv.messages || []) : [];

      return \`
        <div class="ai-chat-layout">
          <!-- 1. Left Sidebar: Previous Conversations & Controls -->
          <div class="ai-sidebar">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13.5px; font-weight: 700; color: #ff9e42;">💬 Chat History</span>
              <button class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size: 12px;" onclick="handleCreateNewAiChat()">
                + New Chat
              </button>
            </div>

            <!-- Mode Selector: Chat Mode vs Agent Mode -->
            <div style="background: #141924; padding: 4px; border-radius: 8px; border: 1px solid #222c3d; display: flex;">
              <button type="button" class="btn \${state.aiChatMode === 'chat' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 6px 8px; font-size: 11.5px; border-radius: 6px;" onclick="toggleAiChatMode('chat')">
                💬 Chat Mode
              </button>
              <button type="button" class="btn \${state.aiChatMode === 'agent' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 6px 8px; font-size: 11.5px; border-radius: 6px;" onclick="toggleAiChatMode('agent')">
                ⚡ Agent Mode
              </button>
            </div>

            <!-- Search Chats -->
            <input type="text" placeholder="Search chats..." id="ai-chat-search" value="\${escapeHtml(state.aiSearchQuery || '')}" oninput="handleSearchAiChats(this.value)" style="font-size: 12px; padding: 8px 10px;">

            <!-- Conversations List -->
            <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;" id="ai-conv-list">
              \${renderAiConversationListHtml()}
            </div>
          </div>

          <!-- 2. Main Chat Conversation Panel -->
          <div class="ai-main-chat">
            <!-- Header -->
            <div class="ai-chat-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="ai-avatar">AI</div>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="font-size: 15px;">\${escapeHtml(conv?.title || 'Server AI Assistant')}</strong>
                    <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 11px;" onclick="handleRenameConversation('\${conv?.id || ''}')">✏️</button>
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-dim);">
                    Context: \${escapeHtml(s.name)} &middot; Mode: <span style="color: \${state.aiChatMode === 'agent' ? '#38bdf8' : '#ff9e42'}; font-weight: 700;">\${state.aiChatMode.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                \${(state.servers || []).length > 1 ? \`
                  <select class="form-select" style="font-size: 12px; padding: 5px 10px; width: auto; background: #141924; border: 1px solid #28354b; color: #f8fafc; border-radius: 6px;" onchange="switchAiChatServer(this.value)">
                    \${(state.servers || []).map(srv => \`<option value="\${srv.id}" \${srv.id === s.id ? 'selected' : ''}>🖥️ \${escapeHtml(srv.name)}</option>\`).join('')}
                  </select>
                \` : ''}
                <button class="btn btn-secondary btn-sm" onclick="toggleAiContextDrawer()">
                  📋 \${state.aiContextDrawerOpen ? 'Hide Context' : 'Show Context'}
                </button>
                \${conv ? \`
                  <button class="btn btn-danger btn-sm" style="padding: 6px 10px;" onclick="handleDeleteConversation('\${conv.id}')" title="Delete conversation">🗑️</button>
                \` : ''}
              </div>
            </div>

            <!-- Messages Scroll Area -->
            <div class="ai-messages-scroll" id="ai-messages-container">
              \${messages.length === 0 ? \`
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); max-width: 650px; margin: 0 auto;">
                  <div style="font-size: 38px; margin-bottom: 12px;">🤖</div>
                  <h3 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 8px;">Server AI Assistant</h3>
                  <p style="font-size: 13.5px; line-height: 1.6; margin-bottom: 24px;">
                    Ask questions, diagnose disconnects, explain console logs, or instruct the AI to execute real actions inside <strong>\${escapeHtml(s.name)}</strong>.
                  </p>
                </div>
              \` : messages.map((m, mIdx) => renderAiMessageHtml(m, mIdx, conv.id)).join('')}
              <div id="ai-typing-indicator" style="display: none; padding: 12px 20px; color: #ff9e42; font-size: 13px; font-weight: 600;">
                <span class="status-badge" style="background: rgba(255,106,0,0.15); border: 1px solid rgba(255,106,0,0.3); color: #ff9e42;">⏳ AI is thinking and preparing actions...</span>
              </div>
            </div>

            <!-- Bottom Prompt Pills & Input Box -->
            <div class="ai-input-wrapper">
              <div class="prompt-pills-bar">
                <span class="prompt-pill" onclick="insertPromptToInput('لماذا انقطع البوت قبل قليل وما سبب المشكلة؟')">🔍 Diagnose Disconnect</span>
                <span class="prompt-pill" onclick="insertPromptToInput('اشرح لي آخر 20 سطرًا من الكونسول والأخطاء الحالية')">📋 Explain Recent Errors</span>
                <span class="prompt-pill" onclick="insertPromptToInput('أرسل رسالة ترحيب لجميع اللاعبين الموجودين')">💬 Welcome Players</span>
                <span class="prompt-pill" onclick="insertPromptToInput('راقب اللاعبين واكتشف اللاعبين الذين يستخدمون X-Ray')">🛡️ Monitor X-Ray</span>
                <span class="prompt-pill" onclick="insertPromptToInput('أعد تشغيل البوت وتحقق من استقرار الـ Ping')">⚡ Restart & Test Ping</span>
                <span class="prompt-pill" onclick="insertPromptToInput('ابنِ لي منطقة سباون بطابع Medieval بمقاس 60×60')">🏗️ Build Medieval Spawn</span>
              </div>

              <form onsubmit="handleSendAiMessage(event)" style="display: flex; gap: 10px; align-items: flex-end;">
                <textarea id="ai-chat-input" placeholder="\${state.aiChatMode === 'agent' ? 'Ask or instruct Server AI (Agent Mode enabled to execute actions)...' : 'Ask anything about your server, plugins, logs, or Minecraft settings...'}" rows="2" style="resize: none; font-size: 14px;" onkeydown="handleAiInputKeyDown(event)"></textarea>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <button type="submit" class="btn btn-primary" id="ai-send-btn" style="padding: 10px 20px;">
                    Send ➔
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm" id="ai-stop-btn" style="display: none; padding: 6px 12px;" onclick="handleStopAiGeneration()">
                    ⏹ Stop
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- 3. Right Collapsible Context Drawer -->
          \${state.aiContextDrawerOpen ? \`
            <div class="ai-context-drawer">
              <div>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Connected Server</span>
                <h4 style="font-size: 16px; font-weight: 700; margin-top: 2px;">\${escapeHtml(s.name)}</h4>
                <div style="font-family: monospace; font-size: 12px; color: var(--text-muted); margin-top: 2px;">\${escapeHtml(s.host)}:\${s.port}</div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px;">
                <div style="background: #111622; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border);">
                  <div style="color: var(--text-dim); font-size: 11px;">SERVER</div>
                  <strong style="color: \${s.status === 'ONLINE' ? 'var(--online)' : 'var(--offline)'}">\${s.status || 'UNKNOWN'}</strong>
                </div>
                <div style="background: #111622; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border);">
                  <div style="color: var(--text-dim); font-size: 11px;">LATENCY</div>
                  <strong style="color: #38bdf8;">\${s.ping ? s.ping + 'ms' : 'Ready'}</strong>
                </div>
                <div style="background: #111622; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border);">
                  <div style="color: var(--text-dim); font-size: 11px;">BOT STATUS</div>
                  <strong style="color: var(--online);">\${state.activeBot?.status || 'OFFLINE'}</strong>
                </div>
                <div style="background: #111622; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border);">
                  <div style="color: var(--text-dim); font-size: 11px;">RECONNECTS</div>
                  <strong>\${state.activeBot?.reconnectAttempts || 0}</strong>
                </div>
              </div>

              <!-- Quick Action Shortcuts -->
              <div>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Quick Tools</span>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
                  <button class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start;" onclick="insertPromptToInput('افحص حالة السيرفر الآن وأعطني ملخصاً شاملاً')">
                    ⚡ Live Server Status Check
                  </button>
                  <button class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start;" onclick="insertPromptToInput('أعد تشغيل البوت وتحقق من الاتصال')">
                    🔄 Restart Bot Runtime
                  </button>
                  <button class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start;" onclick="insertPromptToInput('أنشئ تقريراً شاملاً عن صحة السيرفر وحركة اللاعبين')">
                    🧠 Generate Server Report
                  </button>
                </div>
              </div>

              <!-- Security notice -->
              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 12px; font-size: 12px; color: #a7f3d0; line-height: 1.5;">
                🛡️ <strong>Safety Guardrails:</strong> AI tools operate inside a secure sandbox. Actions that modify the server require your explicit confirmation.
              </div>
            </div>
          \` : ''}
        </div>
      \`;
    }

    function renderAiConversationListHtml() {
      let convs = state.aiConversations || [];
      if (state.aiSearchQuery) {
        const q = state.aiSearchQuery.toLowerCase();
        convs = convs.filter(c => (c.title || '').toLowerCase().includes(q));
      }
      if (convs.length === 0) {
        return '<div style="color: var(--text-dim); font-size: 12px; padding: 12px; text-align: center;">No chat history yet.</div>';
      }

      return convs.map(c => \`
        <div class="ai-conv-item \${c.id === state.activeAiConvId ? 'active' : ''}" onclick="selectAiConversation('\${c.id}')">
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
            \${escapeHtml(c.title || 'Conversation')}
          </div>
          <span style="font-size: 10px; color: var(--text-dim); margin-left: 6px;">\${new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</span>
        </div>
      \`).join('');
    }

    function renderAiMessageHtml(m, mIdx, convId) {
      const isUser = m.role === 'user';
      return \`
        <div class="ai-message \${isUser ? 'user' : 'assistant'}">
          \${!isUser ? '<div class="ai-avatar">AI</div>' : ''}
          <div class="ai-bubble">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11.5px; color: var(--text-dim);">
              <strong>\${isUser ? 'You' : 'Server AI Assistant'}</strong>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span>\${new Date(m.timestamp).toLocaleTimeString()}</span>
                \${!isUser ? \`
                  <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 10.5px;" onclick="copyAiMessageText(this, '\${escapeHtml(m.content)}')">📋 Copy</button>
                  <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 10.5px;" onclick="handleRegenerateAiMessage('\${convId}', '\${m.id}')" title="Regenerate this response">🔄 Regenerate</button>
                \` : ''}
              </div>
            </div>

            <!-- Thought Process Accordion -->
            \${m.thought ? \`
              <details class="thought-accordion" style="margin-bottom: 12px; background: rgba(0,0,0,0.25); border: 1px solid #1c2434; border-radius: 8px; padding: 8px 12px; font-size: 12.5px;">
                <summary style="cursor: pointer; color: #ff9e42; font-weight: 600;">🧠 Thinking Process & Context Grounding</summary>
                <div style="color: var(--text-muted); margin-top: 8px; font-size: 12px; line-height: 1.5;">\${escapeHtml(m.thought)}</div>
              </details>
            \` : ''}

            <!-- Message Body formatted with Markdown -->
            <div class="ai-message-body" style="font-size: 14px; word-break: break-word;">
              \${formatMarkdown(m.content)}
            </div>

            <!-- Action Proposals & Results (Agent Mode) -->
            \${Array.isArray(m.actions) && m.actions.length > 0 ? \`
              <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
                \${m.actions.map((act, actIdx) => renderActionProposalCardHtml(act, actIdx, m.id, convId)).join('')}
              </div>
            \` : ''}
          </div>
          \${isUser ? '<div class="ai-avatar" style="background: #2563eb; color: #ffffff;">U</div>' : ''}
        </div>
      \`;
    }

    function renderActionProposalCardHtml(act, actIdx, messageId, convId) {
      const isPending = act.status === 'requires_confirmation' || act.status === 'ready';
      const isRunning = act.status === 'running';
      const isDone = act.status === 'completed';
      const isFailed = act.status === 'failed';
      const isCancelled = act.status === 'cancelled';

      return \`
        <div class="action-proposal-card" id="act-card-\${messageId}-\${actIdx}">
          <div class="action-proposal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">⚡</span>
              <strong style="font-size: 13.5px; color: #ff9e42;">\${escapeHtml(act.summary || act.tool)}</strong>
            </div>
            <span class="action-badge" style="background: \${isDone ? 'rgba(16,185,129,0.2)' : isRunning ? 'rgba(56,189,248,0.2)' : isFailed ? 'rgba(239,68,68,0.2)' : 'rgba(255,106,0,0.2)'}; color: \${isDone ? '#34d399' : isRunning ? '#38bdf8' : isFailed ? '#f87171' : '#ff9e42'};">
              \${act.status.replace(/_/g, ' ')}
            </span>
          </div>

          \${act.params && Object.keys(act.params).length > 0 ? \`
            <div style="font-size: 12px; color: var(--text-muted); background: #080a0f; padding: 8px 12px; border-radius: 6px; font-family: monospace; margin-bottom: 10px;">
              \${Object.entries(act.params).map(([k, v]) => \`<div><strong style="color: #ff9e42;">\${escapeHtml(k)}:</strong> \${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : v)}</div>\`).join('')}
            </div>
          \` : ''}

          <!-- Execution Controls -->
          \${isPending ? \`
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="handleCancelAction('\${convId}', '\${messageId}', \${actIdx})">Cancel</button>
              <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #10b981, #059669); border-color: #34d399;" onclick="handleConfirmAction('\${convId}', '\${messageId}', \${actIdx})">
                ✓ Confirm & Execute
              </button>
            </div>
          \` : ''}

          \${isRunning ? \`
            <div style="color: #38bdf8; font-size: 12.5px; padding: 6px 0; display: flex; align-items: center; gap: 8px;">
              <span>⏳ Executing backend tool and verifying real server outcome...</span>
            </div>
          \` : ''}

          \${isDone ? \`
            <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 6px; padding: 10px; margin-top: 8px; font-size: 12.5px;">
              <strong style="color: #34d399;">✓ Verified Execution Output:</strong>
              <pre style="margin-top: 4px; font-family: monospace; color: #cbd5e1; font-size: 12px; white-space: pre-wrap;">\${escapeHtml(JSON.stringify(act.result, null, 2))}</pre>
            </div>
          \` : ''}

          \${isFailed ? \`
            <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 10px; margin-top: 8px; font-size: 12.5px; color: #fca5a5;">
              <strong>⚠️ Action Error:</strong> \${escapeHtml(act.error || 'Execution failed')}
            </div>
          \` : ''}
        </div>
      \`;
    }

    // ---------------- Actions & Chat API Handlers ----------------
    async function loadServerAiChatData(serverId) {
      try {
        const res = await fetch(\`/api/servers/\${serverId}/ai-chat/conversations\`, {
          headers: getAuthHeaders(serverId)
        });
        const data = await res.json();
        state.aiConversations = data.conversations || [];

        if (state.aiConversations.length > 0 && !state.activeAiConvId) {
          state.activeAiConvId = state.aiConversations[0].id;
        }

        renderServerDetail();
      } catch (err) {
        console.error('Failed to load AI conversations:', err);
      }
    }

    function selectAiConversation(convId) {
      state.activeAiConvId = convId;
      renderServerDetail();
    }

    function switchAiChatServer(srvId) {
      if (!srvId) return;
      state.activeServerId = srvId;
      state.activeServer = (state.servers || []).find(s => s.id === srvId) || state.servers[0];
      state.activeAiConvId = null;
      state.aiConversations = [];
      loadServerAiChatData(srvId);
      renderServerDetail();
    }

    async function handleCreateNewAiChat() {
      const serverId = state.activeServer?.id;
      try {
        const res = await fetch(\`/api/servers/\${serverId}/ai-chat/conversations\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({ title: 'New Conversation' })
        });
        const data = await res.json();
        if (data.success && data.conversation) {
          state.aiConversations.unshift(data.conversation);
          state.activeAiConvId = data.conversation.id;
          renderServerDetail();
        }
      } catch (err) {
        alert('Failed to create new chat: ' + err.message);
      }
    }

    function toggleAiChatMode(mode) {
      state.aiChatMode = mode;
      renderServerDetail();
    }

    function toggleAiContextDrawer() {
      state.aiContextDrawerOpen = !state.aiContextDrawerOpen;
      renderServerDetail();
    }

    function handleSearchAiChats(query) {
      state.aiSearchQuery = query;
      const listEl = document.getElementById('ai-conv-list');
      if (listEl) listEl.innerHTML = renderAiConversationListHtml();
    }

    function handleAiInputKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendAiMessage(e);
      }
    }

    async function handleSendAiMessage(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('ai-chat-input');
      const content = input ? input.value.trim() : '';
      if (!content || state.aiGenerating) return;

      const serverId = state.activeServer?.id;
      input.value = '';

      state.aiGenerating = true;
      const sendBtn = document.getElementById('ai-send-btn');
      const stopBtn = document.getElementById('ai-stop-btn');
      const indicator = document.getElementById('ai-typing-indicator');

      if (sendBtn) sendBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      if (indicator) indicator.style.display = 'block';

      try {
        const res = await fetch(\`/api/servers/\${serverId}/ai-chat/message\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({
            conversationId: state.activeAiConvId,
            content,
            mode: state.aiChatMode
          })
        });
        const data = await res.json();

        if (data.success && data.conversation) {
          const idx = state.aiConversations.findIndex(c => c.id === data.conversation.id);
          if (idx >= 0) state.aiConversations[idx] = data.conversation;
          else state.aiConversations.unshift(data.conversation);
          state.activeAiConvId = data.conversation.id;
        } else {
          alert('AI Chat error: ' + (data.message || 'Unknown response'));
        }
      } catch (err) {
        alert('Network error communicating with Server AI: ' + err.message);
      } finally {
        state.aiGenerating = false;
        renderServerDetail();
      }
    }

    async function handleRegenerateAiMessage(convId, messageId) {
      const serverId = state.activeServer?.id;
      if (!serverId || state.aiGenerating) return;

      state.aiGenerating = true;
      const sendBtn = document.getElementById('ai-send-btn');
      const stopBtn = document.getElementById('ai-stop-btn');
      const indicator = document.getElementById('ai-typing-indicator');

      if (sendBtn) sendBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      if (indicator) {
        indicator.innerHTML = '<span class="status-badge" style="background: rgba(255,106,0,0.15); border: 1px solid rgba(255,106,0,0.3); color: #ff9e42;">⏳ Regenerating AI response...</span>';
        indicator.style.display = 'block';
      }

      try {
        const res = await fetch(\`/api/servers/\${serverId}/ai-chat/regenerate\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({
            conversationId: convId,
            messageId,
            mode: state.aiChatMode
          })
        });
        const data = await res.json();
        if (data.success && data.conversation) {
          const idx = state.aiConversations.findIndex(c => c.id === data.conversation.id);
          if (idx >= 0) state.aiConversations[idx] = data.conversation;
          state.activeAiConvId = data.conversation.id;
        } else {
          alert('Regeneration failed: ' + (data.message || 'Error'));
        }
      } catch (err) {
        alert('Network error during regeneration: ' + err.message);
      } finally {
        state.aiGenerating = false;
        renderServerDetail();
      }
    }

    async function handleConfirmAction(convId, messageId, actionIndex) {
      const serverId = state.activeServer?.id;
      const card = document.getElementById(\`act-card-\${messageId}-\${actionIndex}\`);
      if (card) {
        card.innerHTML = '<div style="color: #38bdf8; padding: 12px; font-weight: 600;">⏳ Executing action on server...</div>';
      }

      try {
        const res = await fetch(\`/api/servers/\${serverId}/ai-chat/confirm-action\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({ conversationId: convId, messageId, actionIndex })
        });
        const data = await res.json();
        if (data.success) {
          loadServerAiChatData(serverId);
        } else {
          alert('Action execution failed: ' + (data.message || 'Error'));
          loadServerAiChatData(serverId);
        }
      } catch (err) {
        alert('Execution network error: ' + err.message);
        loadServerAiChatData(serverId);
      }
    }

    async function handleCancelAction(convId, messageId, actionIndex) {
      const serverId = state.activeServer?.id;
      try {
        await fetch(\`/api/servers/\${serverId}/ai-chat/cancel-action\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({ conversationId: convId, messageId, actionIndex })
        });
        loadServerAiChatData(serverId);
      } catch (err) {
        console.error(err);
      }
    }

    async function handleRenameConversation(convId) {
      const newTitle = prompt('Enter a new title for this conversation:');
      if (!newTitle) return;

      const serverId = state.activeServer?.id;
      try {
        const res = await fetch(\`/api/servers/\${serverId}/ai-chat/conversations/\${convId}\`, {
          method: 'PUT',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({ title: newTitle })
        });
        const data = await res.json();
        if (data.success) {
          const conv = state.aiConversations.find(c => c.id === convId);
          if (conv) conv.title = newTitle;
          renderServerDetail();
        }
      } catch (err) {
        alert('Rename error: ' + err.message);
      }
    }

    async function handleDeleteConversation(convId) {
      const conf = confirm('Are you sure you want to delete this conversation?');
      if (!conf) return;

      const serverId = state.activeServer?.id;
      try {
        await fetch(\`/api/servers/\${serverId}/ai-chat/conversations/\${convId}\`, {
          method: 'DELETE',
          headers: getAuthHeaders(serverId)
        });
        state.aiConversations = state.aiConversations.filter(c => c.id !== convId);
        state.activeAiConvId = state.aiConversations[0]?.id || null;
        renderServerDetail();
      } catch (err) {
        alert('Delete error: ' + err.message);
      }
    }

    function handleStopAiGeneration() {
      state.aiGenerating = false;
      const sendBtn = document.getElementById('ai-send-btn');
      const stopBtn = document.getElementById('ai-stop-btn');
      const indicator = document.getElementById('ai-typing-indicator');
      if (sendBtn) sendBtn.style.display = 'inline-flex';
      if (stopBtn) stopBtn.style.display = 'none';
      if (indicator) indicator.style.display = 'none';
    }

    // ---------------- Bot Builder Tab Implementation ----------------
    function renderBotBuilderTab() {
      const s = state.activeServer || {};
      const agents = state.builderAgents || {};
      const tasks = state.builderTasks || [];
      const evidence = state.builderEvidence || [];
      const reports = state.builderReports || [];

      return \`
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Top AI Command Input Box -->
          <div class="card" style="background: linear-gradient(135deg, #0e121c 0%, #151c2a 100%); border: 1px solid rgba(255,106,0,0.35); box-shadow: 0 10px 30px rgba(255,106,0,0.06);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <h3 style="font-size: 20px; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                  🤖 Bot Builder AI
                  <span class="status-badge" style="background: rgba(255,106,0,0.15); color: #ff9e42; font-size: 11px;">5 Autonomous Agents</span>
                </h3>
                <p style="color: var(--text-muted); font-size: 13.5px; margin-top: 2px;">
                  Describe what you want inside your server in natural language. The AI compiles it into an executable plan across your 5 agents.
                </p>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <textarea id="bb-task-input" rows="3" placeholder="Tell your AI bots what you want to build, monitor, automate, or manage... (e.g. 'راقب اللاعبين واكتشف الـ X-Ray واحظر المخالفين 30 يوماً' or 'ابنِ قلعة فخمة بالكوارتز والحجر')" style="font-size: 14px; line-height: 1.5;"></textarea>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div class="prompt-pills-bar" style="margin: 0;">
                  <span class="prompt-pill" onclick="insertPromptToInput('راقب اللاعبين واكتشف اللاعبين الذين يستخدمون X-Ray، وإذا تأكدت من المخالفة احظرهم 30 يومًا')">🛡️ X-Ray Sentinel</span>
                  <span class="prompt-pill" onclick="insertPromptToInput('ابنِ لي منطقة Spawn كاملة باستخدام الحجر والكوارتز وأضف إضاءة ومداخل')">🏗️ Build Medieval Spawn</span>
                  <span class="prompt-pill" onclick="insertPromptToInput('راقب اللاعبين الجدد وإذا دخل لاعب جديد رحب به وأعطه التعليمات')">👑 Auto Welcome Rules</span>
                  <span class="prompt-pill" onclick="insertPromptToInput('إذا مات لاعب أكثر من 5 مرات خلال 10 دقائق أرسل تنبيهاً للإدارة')">⚙️ Death Spike Sentinel</span>
                  <span class="prompt-pill" onclick="insertPromptToInput('راقب السيرفر وإذا حدث Lag شديد حاول تحديد السبب وأرسل تقريراً')">🧠 Lag Diagnostic</span>
                </div>
                <button class="btn btn-primary" id="bb-analyze-btn" onclick="handleAnalyzeBuilderPrompt()" style="padding: 10px 22px;">
                  Analyze Task ➔
                </button>
              </div>
            </div>

            <!-- Plan Preview Box -->
            <div id="bb-plan-preview-box" style="display: none; margin-top: 16px; border-top: 1px solid var(--card-border); padding-top: 16px;"></div>
          </div>

          <!-- Active 5 Agents Grid -->
          <div>
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Active Bot Builder Agents (24/7 Supervisor)</h3>
            <div class="agents-grid">
              \${renderAgentCardsHtml(agents)}
            </div>
          </div>

          <!-- Live Tasks Queue -->
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <h3 style="font-size: 17px; font-weight: 700;">⏱️ Task Execution Queue</h3>
                <p style="color: var(--text-muted); font-size: 13px;">Persistent background tasks continuing even after closing the browser.</p>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="loadBotBuilderData('\${s.id}')">🔄 Refresh Tasks</button>
            </div>

            <div id="bb-tasks-list" style="display: flex; flex-direction: column; gap: 12px;">
              \${tasks.length === 0 ? \`
                <div style="color: var(--text-dim); text-align: center; padding: 30px;">
                  No active or past tasks yet. Enter a prompt above to compile your first task.
                </div>
              \` : tasks.map(t => renderBuilderTaskCardHtml(t)).join('')}
            </div>
          </div>

          <!-- Guardian X-Ray Evidence & Suspicious Players -->
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <h3 style="font-size: 17px; font-weight: 700; color: #f87171;">🛡️ Guardian AI — X-Ray Evidence & Risk Scores</h3>
                <p style="color: var(--text-muted); font-size: 13px;">Evidence-based player analysis reducing false positives before punishment.</p>
              </div>
              <span class="status-badge" style="background: rgba(239,68,68,0.15); color: #f87171;">\${evidence.length} Flagged Events</span>
            </div>

            \${evidence.length === 0 ? \`
              <div style="color: var(--text-dim); text-align: center; padding: 24px;">No suspicious mining or movement anomalies detected yet.</div>
            \` : \`
              <table class="audit-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Risk Score</th>
                    <th>Evidence Details</th>
                    <th>Coordinates</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  \${evidence.map(e => \`
                    <tr>
                      <td><strong>\${escapeHtml(e.playerName)}</strong></td>
                      <td>
                        <span class="status-badge" style="background: \${e.riskScore >= 90 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}; color: \${e.riskScore >= 90 ? '#f87171' : '#fbbf24'};">
                          \${e.riskScore}% Risk
                        </span>
                      </td>
                      <td style="color: var(--text-muted); font-size: 12.5px;">\${escapeHtml(e.details)}</td>
                      <td style="font-family: monospace; font-size: 11.5px; color: var(--text-dim);">\${escapeHtml(e.coordinates || 'N/A')}</td>
                      <td>
                        <span style="font-size: 11px; font-weight: 700; color: \${e.punishmentStatus.includes('PUNISHED') ? '#34d399' : '#ff9e42'};">
                          \${escapeHtml(e.punishmentStatus)}
                        </span>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            \`}
          </div>
        </div>
      \`;
    }

    function renderAgentCardsHtml(agents) {
      const list = [
        { key: 'guardian', icon: '🛡️', title: 'Guardian AI', role: 'Security & Anti-Cheat', color: '#f87171' },
        { key: 'builder', icon: '🏗️', title: 'Builder AI', role: 'Creative Construction', color: '#38bdf8' },
        { key: 'admin', icon: '👑', title: 'Admin AI', role: 'Server Administration', color: '#fbbf24' },
        { key: 'automation', icon: '⚙️', title: 'Automation AI', role: 'Event-Driven Rules', color: '#34d399' },
        { key: 'analyst', icon: '🧠', title: 'Analyst AI', role: 'Deep Server Diagnostics', color: '#a78bfa' }
      ];

      return list.map(item => {
        const ag = agents[item.key] || {};
        return \`
          <div class="agent-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 24px;">\${item.icon}</span>
              <span class="status-badge" style="font-size: 11px; background: rgba(255,255,255,0.06);">
                \${ag.status || 'ONLINE'}
              </span>
            </div>
            <div>
              <strong style="font-size: 15px; color: \${item.color}">\${item.title}</strong>
              <div style="font-size: 12px; color: var(--text-muted);">\${item.role}</div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); border-top: 1px solid var(--card-border); padding-top: 8px;">
              <span>Health: <strong style="color: var(--online)">\${ag.health || 98}%</strong></span>
              <span>Tasks: <strong>\${ag.activeTasks || 0}</strong></span>
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderBuilderTaskCardHtml(t) {
      const isRunning = t.status === 'RUNNING';
      const isCompleted = t.status === 'COMPLETED';
      const isPaused = t.status === 'PAUSED';

      return \`
        <div class="card" style="padding: 16px; background: #0c1018; display: flex; flex-direction: column; gap: 10px;" id="bb-task-row-\${t.id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong>\${escapeHtml(t.title)}</strong>
                <span class="status-badge" style="font-size: 11px;">\${t.agentType.toUpperCase()}</span>
                <span class="status-badge" style="font-size: 11px; background: \${isCompleted ? 'rgba(16,185,129,0.2)' : isRunning ? 'rgba(56,189,248,0.2)' : 'rgba(255,106,0,0.2)'}; color: \${isCompleted ? '#34d399' : isRunning ? '#38bdf8' : '#ff9e42'};">
                  \${t.status}
                </span>
              </div>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">\${escapeHtml(t.userPrompt)}</p>
            </div>

            <!-- Controls -->
            <div style="display: flex; gap: 6px;">
              \${isRunning ? \`
                <button class="btn btn-secondary btn-sm" onclick="handlePauseBuilderTask('\${t.id}')">Pause</button>
                <button class="btn btn-danger btn-sm" onclick="handleStopBuilderTask('\${t.id}')">Stop</button>
              \` : ''}
              \${isPaused ? \`
                <button class="btn btn-primary btn-sm" onclick="handleResumeBuilderTask('\${t.id}')">Resume</button>
                <button class="btn btn-danger btn-sm" onclick="handleStopBuilderTask('\${t.id}')">Stop</button>
              \` : ''}
              \${t.agentType === 'builder' ? \`
                <button class="btn btn-secondary btn-sm" onclick="handleRollbackBuilderTask('\${t.id}')" title="Undo all blocks placed by this task">↩ Rollback</button>
              \` : ''}
            </div>
          </div>

          <!-- Progress Bar -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
              <span style="color: #ff9e42; font-weight: 600;">\${escapeHtml(t.actionDetails || 'Processing...')}</span>
              <strong style="color: #f8fafc;">\${t.progress || 0}%</strong>
            </div>
            <div style="height: 8px; background: #161c28; border-radius: 4px; overflow: hidden;">
              <div style="width: \${t.progress || 0}%; height: 100%; background: linear-gradient(90deg, #ff6a00, #ff9e00); transition: width 0.4s ease;"></div>
            </div>
          </div>
        </div>
      \`;
    }

    async function loadBotBuilderData(serverId) {
      try {
        const [tasksRes, agentsRes, evidenceRes] = await Promise.all([
          fetch(\`/api/servers/\${serverId}/builder/tasks\`, { headers: getAuthHeaders(serverId) }),
          fetch(\`/api/servers/\${serverId}/builder/agents\`, { headers: getAuthHeaders(serverId) }),
          fetch(\`/api/servers/\${serverId}/builder/evidence\`, { headers: getAuthHeaders(serverId) })
        ]);

        const tasksData = await tasksRes.json();
        const agentsData = await agentsRes.json();
        const evidenceData = await evidenceRes.json();

        state.builderTasks = tasksData.tasks || [];
        state.builderAgents = agentsData.agents || {};
        state.builderEvidence = evidenceData.evidence || [];

        renderServerDetail();
      } catch (err) {
        console.error('Failed to load Bot Builder data:', err);
      }
    }

    async function handleAnalyzeBuilderPrompt() {
      const input = document.getElementById('bb-task-input');
      const prompt = input ? input.value.trim() : '';
      if (!prompt) return;

      const serverId = state.activeServer?.id;
      const btn = document.getElementById('bb-analyze-btn');
      const previewBox = document.getElementById('bb-plan-preview-box');

      btn.disabled = true;
      btn.textContent = 'Compiling Plan with AI...';

      try {
        const res = await fetch(\`/api/servers/\${serverId}/builder/analyze\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();

        if (data.success && data.plan) {
          state.builderCurrentPlan = data.plan;
          previewBox.style.display = 'block';
          previewBox.innerHTML = \`
            <div style="background: #090c12; border: 1px solid var(--card-border); border-radius: 12px; padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="font-size: 16px; font-weight: 700; color: #ff9e42;">📋 AI Execution Plan: \${escapeHtml(data.plan.title)}</h4>
                <span class="status-badge" style="background: rgba(56,189,248,0.2); color: #38bdf8;">\${data.plan.agentType.toUpperCase()} AI</span>
              </div>
              <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.5;">\${escapeHtml(data.plan.summary)}</p>

              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                \${data.plan.steps.map(s => \`
                  <div style="background: #101520; padding: 8px 12px; border-radius: 6px; font-size: 13px; display: flex; gap: 10px;">
                    <strong style="color: #ff9e42;">Step \${s.step}:</strong>
                    <span>\${escapeHtml(s.title)} &mdash; \${escapeHtml(s.description)}</span>
                  </div>
                \`).join('')}
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('bb-plan-preview-box').style.display='none'">Dismiss</button>
                <button class="btn btn-primary" onclick="handleStartBuilderWork()">✓ Start Work (24/7 Background)</button>
              </div>
            </div>
          \`;
        } else {
          alert('Failed to analyze task: ' + (data.message || 'Unknown error'));
        }
      } catch (err) {
        alert('Analysis network error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Analyze Task ➔';
      }
    }

    async function handleStartBuilderWork() {
      if (!state.builderCurrentPlan) return;
      const serverId = state.activeServer?.id;

      try {
        const res = await fetch(\`/api/servers/\${serverId}/builder/tasks\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId),
          body: JSON.stringify({ plan: state.builderCurrentPlan })
        });
        const data = await res.json();
        if (data.success && data.task) {
          state.builderTasks.unshift(data.task);
          state.builderCurrentPlan = null;
          const box = document.getElementById('bb-plan-preview-box');
          if (box) box.style.display = 'none';
          const input = document.getElementById('bb-task-input');
          if (input) input.value = '';
          renderServerDetail();
        } else {
          alert('Task launch error: ' + (data.message || 'Error'));
        }
      } catch (err) {
        alert('Network error launching task: ' + err.message);
      }
    }

    async function handlePauseBuilderTask(taskId) {
      const serverId = state.activeServer?.id;
      try {
        await fetch(\`/api/servers/\${serverId}/builder/tasks/\${taskId}/pause\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId)
        });
        loadBotBuilderData(serverId);
      } catch (err) {
        alert('Error pausing task: ' + err.message);
      }
    }

    async function handleResumeBuilderTask(taskId) {
      const serverId = state.activeServer?.id;
      try {
        await fetch(\`/api/servers/\${serverId}/builder/tasks/\${taskId}/resume\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId)
        });
        loadBotBuilderData(serverId);
      } catch (err) {
        alert('Error resuming task: ' + err.message);
      }
    }

    async function handleStopBuilderTask(taskId) {
      const conf = confirm('Stop this task and safely clean up?');
      if (!conf) return;
      const serverId = state.activeServer?.id;
      try {
        await fetch(\`/api/servers/\${serverId}/builder/tasks/\${taskId}/stop\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId)
        });
        loadBotBuilderData(serverId);
      } catch (err) {
        alert('Error stopping task: ' + err.message);
      }
    }

    async function handleRollbackBuilderTask(taskId) {
      const conf = confirm('Undo all block placements recorded by this Builder task?');
      if (!conf) return;
      const serverId = state.activeServer?.id;
      try {
        const res = await fetch(\`/api/servers/\${serverId}/builder/tasks/\${taskId}/rollback\`, {
          method: 'POST',
          headers: getAuthHeaders(serverId)
        });
        const data = await res.json();
        alert(data.message || 'Rollback executed');
        loadBotBuilderData(serverId);
      } catch (err) {
        alert('Rollback error: ' + err.message);
      }
    }

    function updateLiveBuilderTaskUi(task) {
      const row = document.getElementById(\`bb-task-row-\${task.id}\`);
      if (row) {
        row.outerHTML = renderBuilderTaskCardHtml(task);
      }
    }
`;
}

module.exports = {
  getAiChatAndBuilderScripts
};
