"use strict";

const fs = require("fs");
const path = require("path");
const { hashAccessKey, verifyAccessKey, normalizeServerAddress } = require("./security");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "mcfbot.db.json");
const TMP_FILE = path.join(DATA_DIR, "mcfbot.db.json.tmp");

class Database {
  constructor() {
    this.data = {
      servers: [],
      bots: [],
      workflows: [],
      schedules: [],
      logs: [],
      chat_messages: [],
      activities: [],
      backups: [],
      builder_tasks: [],
      builder_evidence: [],
      builder_reports: [],
      builder_chat: [],
      builder_settings: [],
      ai_conversations: []
    };
    this.maxLogsPerServer = 1000;
    this.maxChatPerServer = 500;
    this.maxActivitiesPerServer = 200;
    this.writePending = false;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf8");
        const parsed = JSON.parse(raw);
        this.data = {
          servers: parsed.servers || [],
          bots: parsed.bots || [],
          workflows: parsed.workflows || [],
          schedules: parsed.schedules || [],
          logs: parsed.logs || [],
          chat_messages: parsed.chat_messages || [],
          activities: parsed.activities || [],
          backups: parsed.backups || [],
          builder_tasks: parsed.builder_tasks || [],
          builder_evidence: parsed.builder_evidence || [],
          builder_reports: parsed.builder_reports || [],
          builder_chat: parsed.builder_chat || [],
          builder_settings: parsed.builder_settings || [],
          ai_conversations: parsed.ai_conversations || []
        };
      } else {
        // Clean initial state: 0 servers, 0 bots
        this.saveSync();
      }
    } catch (err) {
      console.error("[MCFBOT DB] Failed to load database file:", err.message);
      this.saveSync();
    }
  }

  saveSync() {
    try {
      const serialized = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(TMP_FILE, serialized, "utf8");
      fs.renameSync(TMP_FILE, DB_FILE);
    } catch (err) {
      console.error("[MCFBOT DB] Atomic write error:", err.message);
    }
  }

  save() {
    if (this.writePending) return;
    this.writePending = true;
    setTimeout(() => {
      this.writePending = false;
      this.saveSync();
    }, 100);
  }

  // --- Servers ---

  getAllServers() {
    return this.data.servers.map((s) => ({
      id: s.id,
      name: s.name,
      host: s.host,
      port: s.port,
      normalizedAddress: s.normalizedAddress || normalizeServerAddress(s.host, s.port).normalized,
      edition: s.edition,
      version: s.version,
      status: s.status,
      accessCode: s.accessCode || null,
      ownerId: s.ownerId || null,
      isProtected: Boolean(s.protection && s.protection.enabled),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastOnline: s.lastOnline,
      ping: s.ping
    }));
  }

  getServer(id) {
    return this.data.servers.find((s) => s.id === id) || null;
  }

  findServerByNormalizedAddress(rawHost, rawPort) {
    if (!rawHost) return null;
    const target = normalizeServerAddress(rawHost, rawPort).normalized;
    return this.data.servers.find((s) => {
      const addr = s.normalizedAddress || normalizeServerAddress(s.host, s.port).normalized;
      return addr === target;
    }) || null;
  }

  findServerByAccessKey(rawKey) {
    if (!rawKey) return null;
    const clean = String(rawKey).trim();

    // Check if it matches an Access Code (e.g. HEARTLYSMP-4827)
    const normalizedCode = clean.toUpperCase();
    const matchByCode = this.data.servers.find(
      (s) => s.accessCode && s.accessCode.toUpperCase() === normalizedCode
    );
    if (matchByCode) return matchByCode;

    // Otherwise check SHA-256 hash for legacy access keys
    const providedHash = hashAccessKey(clean);
    return this.data.servers.find((s) => s.accessKeyHash === providedHash) || null;
  }

  findServerByAccessCode(code) {
    if (!code) return null;
    const normalized = String(code).trim().toUpperCase();
    return this.data.servers.find((s) => s.accessCode && s.accessCode.toUpperCase() === normalized) || null;
  }

  isAccessCodeTaken(code, excludeServerId = null) {
    if (!code) return false;
    const normalized = String(code).trim().toUpperCase();
    return this.data.servers.some(
      (s) => s.id !== excludeServerId && s.accessCode && s.accessCode.toUpperCase() === normalized
    );
  }

  saveServer(serverData) {
    const existingIndex = this.data.servers.findIndex((s) => s.id === serverData.id);
    const now = Date.now();

    // Ensure normalizedAddress is stored
    const norm = normalizeServerAddress(serverData.host, serverData.port).normalized;
    const enriched = {
      ...serverData,
      normalizedAddress: norm
    };

    if (existingIndex >= 0) {
      this.data.servers[existingIndex] = {
        ...this.data.servers[existingIndex],
        ...enriched,
        updatedAt: now
      };
    } else {
      this.data.servers.push({
        ...enriched,
        createdAt: now,
        updatedAt: now
      });
    }
    this.save();
    return this.getServer(serverData.id);
  }

  // --- Server Access Sessions & Security ---

  addAccessSession(serverId, sessionToken, role = "member", durationMs = 30 * 24 * 3600 * 1000) {
    const server = this.getServer(serverId);
    if (!server) return null;
    if (!Array.isArray(server.accessSessions)) {
      server.accessSessions = [];
    }
    const now = Date.now();
    const session = {
      token: sessionToken,
      role,
      createdAt: now,
      expiresAt: now + durationMs,
      lastUsedAt: now
    };
    server.accessSessions.push(session);
    server.accessSessions = server.accessSessions.filter((s) => s.expiresAt > now);
    this.save();
    return session;
  }

  verifyAccessSession(serverId, token) {
    const server = this.getServer(serverId);
    if (!server || !Array.isArray(server.accessSessions) || !token) return null;
    const now = Date.now();
    const session = server.accessSessions.find((s) => s.token === token && s.expiresAt > now);
    if (session) {
      session.lastUsedAt = now;
      this.save();
      return session;
    }
    return null;
  }

  revokeAllMemberSessions(serverId) {
    const server = this.getServer(serverId);
    if (!server || !Array.isArray(server.accessSessions)) return;
    server.accessSessions = server.accessSessions.filter((s) => s.role === "owner");
    this.save();
  }

  // --- Audit Logs ---

  addAuditLog(serverId, action, details, ip = "anonymous", role = "user") {
    const server = this.getServer(serverId);
    if (!server) return null;
    if (!Array.isArray(server.auditLogs)) {
      server.auditLogs = [];
    }
    const cleanIp = String(ip || "anonymous").replace(/^.*:/, "");
    const logEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      action,
      details: String(details || "").slice(0, 200),
      timestamp: Date.now(),
      ip: cleanIp,
      role
    };
    server.auditLogs.unshift(logEntry);
    if (server.auditLogs.length > 100) {
      server.auditLogs = server.auditLogs.slice(0, 100);
    }
    this.save();
    return logEntry;
  }

  getAuditLogs(serverId) {
    const server = this.getServer(serverId);
    return server?.auditLogs || [];
  }

  deleteServer(id) {
    this.data.servers = this.data.servers.filter((s) => s.id !== id);
    this.data.bots = this.data.bots.filter((b) => b.serverId !== id);
    this.data.workflows = this.data.workflows.filter((w) => w.serverId !== id);
    this.data.schedules = this.data.schedules.filter((s) => s.serverId !== id);
    this.data.logs = this.data.logs.filter((l) => l.serverId !== id);
    this.data.chat_messages = this.data.chat_messages.filter((c) => c.serverId !== id);
    this.data.activities = this.data.activities.filter((a) => a.serverId !== id);
    this.data.backups = this.data.backups.filter((bk) => bk.serverId !== id);
    this.save();
    return true;
  }

  // --- Bots ---

  getBotsByServer(serverId) {
    return this.data.bots.filter((b) => b.serverId === serverId);
  }

  getBot(id) {
    return this.data.bots.find((b) => b.id === id) || null;
  }

  getAllBots() {
    return this.data.bots;
  }

  saveBot(botData) {
    const existingIndex = this.data.bots.findIndex((b) => b.id === botData.id);
    if (existingIndex >= 0) {
      this.data.bots[existingIndex] = {
        ...this.data.bots[existingIndex],
        ...botData
      };
    } else {
      this.data.bots.push(botData);
    }
    this.save();
    return this.getBot(botData.id);
  }

  deleteBot(id) {
    this.data.bots = this.data.bots.filter((b) => b.id !== id);
    this.data.workflows = this.data.workflows.filter((w) => w.botId !== id);
    this.data.schedules = this.data.schedules.filter((s) => s.botId !== id);
    this.save();
    return true;
  }

  // --- Logs ---

  addLog({ serverId, botId = null, level = "INFO", category = "SYSTEM", message }) {
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      serverId,
      botId,
      level,
      category,
      message,
      timestamp: Date.now()
    };

    this.data.logs.push(logEntry);

    // Prune old logs for this server if exceeding limit
    const serverLogs = this.data.logs.filter((l) => l.serverId === serverId);
    if (serverLogs.length > this.maxLogsPerServer) {
      const toRemove = serverLogs.length - this.maxLogsPerServer;
      let removed = 0;
      this.data.logs = this.data.logs.filter((l) => {
        if (l.serverId === serverId && removed < toRemove) {
          removed++;
          return false;
        }
        return true;
      });
    }

    this.save();
    return logEntry;
  }

  getLogs(serverId, limit = 200, category = null, search = "") {
    let list = this.data.logs.filter((l) => l.serverId === serverId);
    if (category && category !== "ALL") {
      list = list.filter((l) => l.category === category || l.level === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.message.toLowerCase().includes(q));
    }
    return list.slice(-limit);
  }

  clearLogs(serverId) {
    this.data.logs = this.data.logs.filter((l) => l.serverId !== serverId);
    this.save();
    return true;
  }

  // --- Chat ---

  addChat({ serverId, botId = null, sender, message, isBot = false }) {
    const entry = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      serverId,
      botId,
      sender,
      message,
      isBot,
      timestamp: Date.now()
    };
    this.data.chat_messages.push(entry);

    const serverChat = this.data.chat_messages.filter((c) => c.serverId === serverId);
    if (serverChat.length > this.maxChatPerServer) {
      const toRemove = serverChat.length - this.maxChatPerServer;
      let removed = 0;
      this.data.chat_messages = this.data.chat_messages.filter((c) => {
        if (c.serverId === serverId && removed < toRemove) {
          removed++;
          return false;
        }
        return true;
      });
    }

    this.save();
    return entry;
  }

  getChat(serverId, limit = 100) {
    return this.data.chat_messages
      .filter((c) => c.serverId === serverId)
      .slice(-limit);
  }

  // --- Activities ---

  addActivity({ serverId, botId = null, type, message }) {
    const entry = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      serverId,
      botId,
      type,
      message,
      timestamp: Date.now()
    };
    this.data.activities.push(entry);

    const list = this.data.activities.filter((a) => a.serverId === serverId);
    if (list.length > this.maxActivitiesPerServer) {
      const toRemove = list.length - this.maxActivitiesPerServer;
      let removed = 0;
      this.data.activities = this.data.activities.filter((a) => {
        if (a.serverId === serverId && removed < toRemove) {
          removed++;
          return false;
        }
        return true;
      });
    }

    this.save();
    return entry;
  }

  getActivities(serverId, limit = 50) {
    return this.data.activities
      .filter((a) => a.serverId === serverId)
      .slice(-limit)
      .reverse();
  }

  // --- Workflows ---

  getWorkflows(serverId) {
    return this.data.workflows.filter((w) => w.serverId === serverId);
  }

  saveWorkflow(wfData) {
    const idx = this.data.workflows.findIndex((w) => w.id === wfData.id);
    if (idx >= 0) {
      this.data.workflows[idx] = { ...this.data.workflows[idx], ...wfData };
    } else {
      this.data.workflows.push(wfData);
    }
    this.save();
    return wfData;
  }

  deleteWorkflow(id) {
    this.data.workflows = this.data.workflows.filter((w) => w.id !== id);
    this.save();
    return true;
  }

  // --- Schedules ---

  getSchedules(serverId) {
    return this.data.schedules.filter((s) => s.serverId === serverId);
  }

  saveSchedule(scData) {
    const idx = this.data.schedules.findIndex((s) => s.id === scData.id);
    if (idx >= 0) {
      this.data.schedules[idx] = { ...this.data.schedules[idx], ...scData };
    } else {
      this.data.schedules.push(scData);
    }
    this.save();
    return scData;
  }

  deleteSchedule(id) {
    this.data.schedules = this.data.schedules.filter((s) => s.id !== id);
    this.save();
    return true;
  }

  // --- Backups ---

  createBackup(serverId, name = "Manual Backup") {
    const server = this.getServer(serverId);
    if (!server) return null;

    const bots = this.getBotsByServer(serverId);
    const workflows = this.getWorkflows(serverId);
    const schedules = this.getSchedules(serverId);

    // Sanitize secrets from backup
    const safeBots = bots.map((b) => {
      const clone = JSON.parse(JSON.stringify(b));
      if (clone.config && clone.config.autoLogin) {
        delete clone.config.autoLogin.passwordEncrypted;
        delete clone.config.autoLogin.password;
      }
      return clone;
    });

    const backupRecord = {
      id: `backup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      serverId,
      name,
      createdAt: Date.now(),
      data: {
        server: {
          name: server.name,
          host: server.host,
          port: server.port,
          edition: server.edition,
          version: server.version
        },
        bots: safeBots,
        workflows,
        schedules
      }
    };

    this.data.backups.push(backupRecord);
    this.save();
    return backupRecord;
  }

  getBackups(serverId) {
    return this.data.backups.filter((b) => b.serverId === serverId);
  }

  getBackup(id) {
    return this.data.backups.find((b) => b.id === id) || null;
  }

  deleteBackup(id) {
    this.data.backups = this.data.backups.filter((b) => b.id !== id);
    this.save();
    return true;
  }

  restoreBackup(id) {
    const backup = this.getBackup(id);
    if (!backup || !backup.data) return false;
    const { serverId, data } = backup;
    const server = this.getServer(serverId);
    if (!server) return false;

    if (Array.isArray(data.workflows)) {
      this.data.workflows = this.data.workflows.filter((w) => w.serverId !== serverId).concat(data.workflows);
    }
    if (Array.isArray(data.schedules)) {
      this.data.schedules = this.data.schedules.filter((s) => s.serverId !== serverId).concat(data.schedules);
    }
    this.save();
    return true;
  }

  resetBotConfig(botId) {
    const bot = this.data.bots.find((b) => b.id === botId);
    if (!bot) return null;
    bot.config = {
      persistent247: true,
      autoReconnect: true,
      authType: "offline",
      antiAfk: {
        enabled: true,
        lookAround: true,
        randomJump: false,
        sneak: false,
        walk: false
      },
      autoLogin: {
        enabled: false,
        command: "/login {password}",
        trigger: "prompt"
      },
      watchlist: []
    };
    this.save();
    return bot;
  }

  toggleWatchlistPlayer(serverId, username) {
    const bots = this.getBotsByServer(serverId);
    if (!bots || bots.length === 0) return [];
    const bot = bots[0];
    if (!bot.config) bot.config = {};
    if (!Array.isArray(bot.config.watchlist)) bot.config.watchlist = [];
    const clean = String(username || "").trim().toLowerCase();
    if (!clean) return bot.config.watchlist;

    const idx = bot.config.watchlist.indexOf(clean);
    if (idx >= 0) {
      bot.config.watchlist.splice(idx, 1);
    } else {
      bot.config.watchlist.push(clean);
    }
    this.saveBot(bot);
    return bot.config.watchlist;
  }

  // --- Bot Builder Tasks & Agents ---

  getBuilderTasks(serverId) {
    if (!Array.isArray(this.data.builder_tasks)) this.data.builder_tasks = [];
    return this.data.builder_tasks.filter((t) => t.serverId === serverId).sort((a, b) => b.createdAt - a.createdAt);
  }

  getBuilderTask(id) {
    if (!Array.isArray(this.data.builder_tasks)) this.data.builder_tasks = [];
    return this.data.builder_tasks.find((t) => t.id === id) || null;
  }

  saveBuilderTask(task) {
    if (!Array.isArray(this.data.builder_tasks)) this.data.builder_tasks = [];
    const idx = this.data.builder_tasks.findIndex((t) => t.id === task.id);
    const enriched = {
      ...task,
      updatedAt: Date.now()
    };
    if (idx >= 0) {
      this.data.builder_tasks[idx] = enriched;
    } else {
      enriched.createdAt = enriched.createdAt || Date.now();
      this.data.builder_tasks.unshift(enriched);
    }
    // Limit to 200 tasks per server
    if (this.data.builder_tasks.length > 500) {
      this.data.builder_tasks = this.data.builder_tasks.slice(0, 500);
    }
    this.save();
    return enriched;
  }

  deleteBuilderTask(id) {
    if (!Array.isArray(this.data.builder_tasks)) this.data.builder_tasks = [];
    this.data.builder_tasks = this.data.builder_tasks.filter((t) => t.id !== id);
    this.save();
    return true;
  }

  // --- Bot Builder Guardian Evidence ---

  getBuilderEvidence(serverId) {
    if (!Array.isArray(this.data.builder_evidence)) this.data.builder_evidence = [];
    return this.data.builder_evidence.filter((e) => e.serverId === serverId).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  saveBuilderEvidence(evidence) {
    if (!Array.isArray(this.data.builder_evidence)) this.data.builder_evidence = [];
    const idx = this.data.builder_evidence.findIndex((e) => e.id === evidence.id || (e.serverId === evidence.serverId && e.playerName?.toLowerCase() === evidence.playerName?.toLowerCase()));
    const enriched = {
      ...evidence,
      updatedAt: Date.now()
    };
    if (idx >= 0) {
      this.data.builder_evidence[idx] = enriched;
    } else {
      enriched.id = enriched.id || `evi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      enriched.createdAt = enriched.createdAt || Date.now();
      this.data.builder_evidence.unshift(enriched);
    }
    this.save();
    return enriched;
  }

  // --- Bot Builder Analyst Reports ---

  getBuilderReports(serverId) {
    if (!Array.isArray(this.data.builder_reports)) this.data.builder_reports = [];
    return this.data.builder_reports.filter((r) => r.serverId === serverId).sort((a, b) => b.createdAt - a.createdAt);
  }

  saveBuilderReport(report) {
    if (!Array.isArray(this.data.builder_reports)) this.data.builder_reports = [];
    const enriched = {
      ...report,
      id: report.id || `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: report.createdAt || Date.now()
    };
    this.data.builder_reports.unshift(enriched);
    if (this.data.builder_reports.length > 100) {
      this.data.builder_reports = this.data.builder_reports.slice(0, 100);
    }
    this.save();
    return enriched;
  }

  // --- Bot Builder Interactive Chat ---

  getBuilderChat(serverId, limit = 50) {
    if (!Array.isArray(this.data.builder_chat)) this.data.builder_chat = [];
    const msgs = this.data.builder_chat.filter((c) => c.serverId === serverId);
    return msgs.slice(-limit);
  }

  addBuilderChatMessage(serverId, msg) {
    if (!Array.isArray(this.data.builder_chat)) this.data.builder_chat = [];
    const entry = {
      id: `bc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      serverId,
      sender: msg.sender || "user", // user, ai, guardian, builder, admin, automation, analyst
      role: msg.role || "user",
      agentType: msg.agentType || null,
      content: String(msg.content || "").slice(0, 4000),
      timestamp: Date.now()
    };
    this.data.builder_chat.push(entry);
    // Keep max 300 chat messages per server
    const serverChat = this.data.builder_chat.filter((c) => c.serverId === serverId);
    if (serverChat.length > 300) {
      this.data.builder_chat = this.data.builder_chat.filter((c) => c.serverId !== serverId || serverChat.slice(-300).some((s) => s.id === c.id));
    }
    this.save();
    return entry;
  }

  // --- Bot Builder Settings & Permissions ---

  getBuilderSettings(serverId) {
    if (!Array.isArray(this.data.builder_settings)) this.data.builder_settings = [];
    const found = this.data.builder_settings.find((s) => s.serverId === serverId);
    if (found) return found;

    // Default settings
    return {
      serverId,
      autoPunishEnabled: false,
      evidenceThreshold: 90, // %
      banDurationDays: 30,
      creativeBuildMode: true,
      buildAreaConstraint: {
        radius: 150,
        safeZoneOnly: true,
        respectProtectedRegions: true
      },
      rollbacksEnabled: true,
      lagThresholdTps: 15,
      notificationChannel: "CHAT_AND_DASHBOARD",
      welcomeMessage: "Welcome {player} to our Minecraft Server! Type /help for instructions.",
      alertDeathCount: 5,
      alertDeathWindowMinutes: 10
    };
  }

  saveBuilderSettings(serverId, newSettings) {
    if (!Array.isArray(this.data.builder_settings)) this.data.builder_settings = [];
    const current = this.getBuilderSettings(serverId);
    const updated = {
      ...current,
      ...newSettings,
      serverId,
      updatedAt: Date.now()
    };
    const idx = this.data.builder_settings.findIndex((s) => s.serverId === serverId);
    if (idx >= 0) {
      this.data.builder_settings[idx] = updated;
    } else {
      this.data.builder_settings.push(updated);
    }
    this.save();
    return updated;
  }

  // --- Server AI Chat Conversations ---

  getAiConversations(serverId) {
    if (!Array.isArray(this.data.ai_conversations)) this.data.ai_conversations = [];
    return this.data.ai_conversations
      .filter((c) => c.serverId === serverId)
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  }

  getAiConversation(id) {
    if (!Array.isArray(this.data.ai_conversations)) this.data.ai_conversations = [];
    return this.data.ai_conversations.find((c) => c.id === id) || null;
  }

  saveAiConversation(conv) {
    if (!Array.isArray(this.data.ai_conversations)) this.data.ai_conversations = [];
    const now = Date.now();
    const enriched = {
      ...conv,
      id: conv.id || `conv_${now}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: conv.createdAt || now,
      updatedAt: now,
      messages: Array.isArray(conv.messages) ? conv.messages : []
    };

    const idx = this.data.ai_conversations.findIndex((c) => c.id === enriched.id);
    if (idx >= 0) {
      this.data.ai_conversations[idx] = enriched;
    } else {
      this.data.ai_conversations.unshift(enriched);
    }

    if (this.data.ai_conversations.length > 500) {
      this.data.ai_conversations = this.data.ai_conversations.slice(0, 500);
    }
    this.save();
    return enriched;
  }

  deleteAiConversation(id) {
    if (!Array.isArray(this.data.ai_conversations)) this.data.ai_conversations = [];
    this.data.ai_conversations = this.data.ai_conversations.filter((c) => c.id !== id);
    this.save();
    return true;
  }

  renameAiConversation(id, newTitle) {
    const conv = this.getAiConversation(id);
    if (!conv) return null;
    conv.title = String(newTitle || "Untitled Chat").trim().slice(0, 80);
    conv.updatedAt = Date.now();
    this.save();
    return conv;
  }

  addAiMessage(convId, message) {
    const conv = this.getAiConversation(convId);
    if (!conv) return null;
    if (!Array.isArray(conv.messages)) conv.messages = [];

    const msg = {
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: message.role || "user", // "user" | "assistant" | "system"
      content: String(message.content || ""),
      mode: message.mode || "chat", // "chat" | "agent"
      thought: message.thought || null,
      actions: Array.isArray(message.actions) ? message.actions : [],
      timestamp: message.timestamp || Date.now()
    };

    conv.messages.push(msg);
    conv.updatedAt = Date.now();

    // Auto update title from first user message if default
    if (conv.title === "New Conversation" && msg.role === "user") {
      conv.title = msg.content.trim().slice(0, 45) + (msg.content.length > 45 ? "..." : "");
    }

    this.save();
    return msg;
  }

  updateAiMessageAction(convId, messageId, actionIndex, updateData) {
    const conv = this.getAiConversation(convId);
    if (!conv || !Array.isArray(conv.messages)) return null;

    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg || !Array.isArray(msg.actions) || !msg.actions[actionIndex]) return null;

    msg.actions[actionIndex] = {
      ...msg.actions[actionIndex],
      ...updateData
    };
    conv.updatedAt = Date.now();
    this.save();
    return msg.actions[actionIndex];
  }
}

const db = new Database();
module.exports = { db };
