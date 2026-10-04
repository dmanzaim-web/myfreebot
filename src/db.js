"use strict";

const fs = require("fs");
const path = require("path");
const { hashAccessKey, verifyAccessKey } = require("./security");

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
      backups: []
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
          backups: parsed.backups || []
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
      edition: s.edition,
      version: s.version,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastOnline: s.lastOnline,
      ping: s.ping
    }));
  }

  getServer(id) {
    return this.data.servers.find((s) => s.id === id) || null;
  }

  findServerByAccessKey(rawKey) {
    if (!rawKey) return null;
    const providedHash = hashAccessKey(rawKey);
    return this.data.servers.find((s) => s.accessKeyHash === providedHash) || null;
  }

  saveServer(serverData) {
    const existingIndex = this.data.servers.findIndex((s) => s.id === serverData.id);
    const now = Date.now();

    if (existingIndex >= 0) {
      this.data.servers[existingIndex] = {
        ...this.data.servers[existingIndex],
        ...serverData,
        updatedAt: now
      };
    } else {
      this.data.servers.push({
        ...serverData,
        createdAt: now,
        updatedAt: now
      });
    }
    this.save();
    return this.getServer(serverData.id);
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
}

const db = new Database();
module.exports = { db };
