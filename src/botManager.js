"use strict";

const mineflayer = require("mineflayer");
const EventEmitter = require("events");
const { db } = require("./db");
const { decryptSecret, redactSecrets } = require("./security");
const { pingMinecraftServer } = require("./mcPing");

class BotEventEmitter extends EventEmitter {}
const botEvents = new BotEventEmitter();
botEvents.setMaxListeners(200);

class ServerBot {
  constructor(server, botRecord) {
    this.server = server;
    this.botRecord = botRecord;
    this.bot = null;
    this.status = botRecord.status || "OFFLINE";
    this.serverStatus = server.status || "UNKNOWN";
    this.manualStop = Boolean(botRecord.manualStop);
    this.startedAt = null;
    this.lastConnection = botRecord.lastConnection || null;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.serverPollTimer = null;
    this.intervals = [];
    this.lastError = null;
    this.position = null;
    this.health = 20;
    this.food = 20;
    this.players = [];
    this.knownSecrets = [];

    this.initSecrets();
  }

  initSecrets() {
    this.knownSecrets = [];
    if (this.botRecord.config?.autoLogin?.passwordEncrypted) {
      const decrypted = decryptSecret(this.botRecord.config.autoLogin.passwordEncrypted);
      if (decrypted) {
        this.knownSecrets.push(decrypted);
      }
    }
  }

  log(level, category, message) {
    const cleanMsg = redactSecrets(message, this.knownSecrets);
    const logItem = db.addLog({
      serverId: this.server.id,
      botId: this.botRecord.id,
      level,
      category,
      message: cleanMsg
    });

    botEvents.emit(`event:${this.server.id}`, {
      type: "log",
      data: logItem
    });
  }

  recordActivity(type, message) {
    const act = db.addActivity({
      serverId: this.server.id,
      botId: this.botRecord.id,
      type,
      message
    });

    botEvents.emit(`event:${this.server.id}`, {
      type: "activity",
      data: act
    });
  }

  emitStatus() {
    const statusData = this.getStatus();
    botEvents.emit(`event:${this.server.id}`, {
      type: "bot_status",
      data: statusData
    });

    // Update in database
    db.saveBot({
      ...this.botRecord,
      status: this.status,
      manualStop: this.manualStop,
      lastConnection: this.lastConnection,
      uptime: this.startedAt && this.status === "ONLINE" ? Math.floor((Date.now() - this.startedAt) / 1000) : 0
    });
  }

  getStatus() {
    const uptime = this.startedAt && this.status === "ONLINE"
      ? Math.floor((Date.now() - this.startedAt) / 1000)
      : 0;

    return {
      id: this.botRecord.id,
      serverId: this.server.id,
      username: this.botRecord.username,
      status: this.status,
      serverStatus: this.serverStatus,
      uptime,
      lastConnection: this.lastConnection,
      reconnectAttempts: this.reconnectAttempts,
      position: this.position,
      health: this.health,
      food: this.food,
      playersCount: this.players.length,
      lastError: this.lastError,
      manualStop: this.manualStop,
      persistent247: this.botRecord.config?.persistent247 ?? true
    };
  }

  start() {
    this.manualStop = false;
    this.botRecord.manualStop = false;
    this.lastError = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.serverPollTimer) {
      clearInterval(this.serverPollTimer);
      this.serverPollTimer = null;
    }

    this.log("INFO", "CONNECTION", `Starting bot ${this.botRecord.username} for ${this.server.host}:${this.server.port}...`);
    this.recordActivity("BOT_START", `Bot start initiated for ${this.botRecord.username}`);

    this.connect();
    return true;
  }

  connect() {
    if (this.status === "ONLINE" && this.bot) {
      return;
    }

    this.status = "CONNECTING";
    this.emitStatus();

    this.log("INFO", "CONNECTION", `Connecting to Minecraft server at ${this.server.host}:${this.server.port || 25565}`);

    // Pre-check server availability
    pingMinecraftServer(this.server.host, this.server.port, 4000)
      .then((pingRes) => {
        if (!pingRes.online) {
          this.serverStatus = "OFFLINE";
          this.handleServerOffline(pingRes.error || "Server is offline");
          return;
        }

        this.serverStatus = "ONLINE";
        db.saveServer({ ...this.server, status: "ONLINE", lastOnline: Date.now(), ping: pingRes.latency });

        this.spawnMineflayerBot();
      })
      .catch(() => {
        this.spawnMineflayerBot();
      });
  }

  spawnMineflayerBot() {
    if (this.manualStop) return;

    this.status = "AUTHENTICATING";
    this.emitStatus();

    const options = {
      host: this.server.host,
      port: Number(this.server.port || 25565),
      username: this.botRecord.username,
      version: this.server.version && this.server.version !== "auto" && this.server.version.trim() !== ""
        ? this.server.version
        : false,
      auth: this.botRecord.config?.authType || "offline",
      checkTimeoutInterval: 45000,
      hideErrors: false
    };

    try {
      this.bot = mineflayer.createBot(options);
      this.registerBotEvents();
    } catch (err) {
      this.lastError = err.message;
      this.status = "ERROR";
      this.log("ERROR", "CONNECTION", `Failed to instantiate Mineflayer client: ${err.message}`);
      this.emitStatus();
      this.handleDisconnect("client_init_error");
    }
  }

  registerBotEvents() {
    if (!this.bot) return;

    this.bot.once("spawn", () => {
      this.status = "ONLINE";
      this.serverStatus = "ONLINE";
      this.startedAt = Date.now();
      this.lastConnection = Date.now();
      this.reconnectAttempts = 0;
      this.lastError = null;

      this.log("INFO", "CONNECTION", `Bot successfully joined ${this.server.host} as player "${this.bot.username}"!`);
      this.recordActivity("BOT_ONLINE", `Joined server as ${this.bot.username}`);
      this.emitStatus();

      // Trigger workflows for on_join
      this.evaluateWorkflows("on_join");

      // Setup in-game Anti-AFK and Auto-Login
      this.setupAntiAfk();
      this.setupAutoLogin();
    });

    this.bot.on("health", () => {
      if (!this.bot) return;
      this.health = Math.round(this.bot.health || 20);
      this.food = Math.round(this.bot.food || 20);

      if (this.health < 6) {
        this.evaluateWorkflows("on_health_low", { health: this.health });
      }
    });

    this.bot.on("move", () => {
      if (this.bot && this.bot.entity) {
        this.position = {
          x: Math.round(this.bot.entity.position.x * 10) / 10,
          y: Math.round(this.bot.entity.position.y * 10) / 10,
          z: Math.round(this.bot.entity.position.z * 10) / 10
        };
      }
    });

    this.bot.on("chat", (username, message) => {
      if (!username || username === this.bot?.username) return;

      const chatEntry = db.addChat({
        serverId: this.server.id,
        botId: this.botRecord.id,
        sender: username,
        message,
        isBot: false
      });

      botEvents.emit(`event:${this.server.id}`, {
        type: "chat",
        data: chatEntry
      });

      this.log("INFO", "CHAT", `<${username}> ${message}`);
      this.evaluateWorkflows("on_chat", { username, message });
    });

    this.bot.on("messagestr", (msg) => {
      const clean = redactSecrets(msg, this.knownSecrets);
      // Check for server prompt for /login
      this.checkLoginPrompt(clean);
    });

    this.bot.on("playerJoined", (player) => {
      if (!player || !player.username) return;
      this.updatePlayerList();

      const watchlist = this.botRecord.config?.watchlist || [];
      if (watchlist.includes(player.username.toLowerCase())) {
        this.log("WARNING", "PLAYERS", `[WATCHLIST ALERT] Player ${player.username} joined the server!`);
        this.recordActivity("WATCHLIST_ALERT", `Watched player joined: ${player.username}`);
      }

      this.evaluateWorkflows("on_player_join", { player: player.username });
    });

    this.bot.on("playerLeft", () => {
      this.updatePlayerList();
    });

    this.bot.on("kicked", (reason) => {
      const reasonStr = typeof reason === "object" ? JSON.stringify(reason) : String(reason);
      this.lastError = `Kicked: ${reasonStr}`;
      this.log("WARNING", "CONNECTION", `Kicked from server: ${reasonStr}`);
      this.recordActivity("BOT_KICKED", `Kicked: ${reasonStr.slice(0, 80)}`);
      this.evaluateWorkflows("on_kicked", { reason: reasonStr });
    });

    this.bot.on("error", (err) => {
      this.lastError = err.message;
      this.log("ERROR", "SYSTEM", `Mineflayer error: ${err.message}`);
    });

    this.bot.on("end", (reason) => {
      this.clearIntervals();
      const endReason = reason || "connection_closed";
      this.log("INFO", "CONNECTION", `Connection ended (${endReason})`);
      this.handleDisconnect(endReason);
    });
  }

  updatePlayerList() {
    if (!this.bot || !this.bot.players) return;
    this.players = Object.keys(this.bot.players).map((name) => {
      const p = this.bot.players[name];
      return {
        username: name,
        ping: p.ping || 0
      };
    });

    botEvents.emit(`event:${this.server.id}`, {
      type: "player_update",
      data: { players: this.players }
    });
  }

  handleDisconnect(reason) {
    this.clearIntervals();
    this.bot = null;
    this.position = null;
    this.players = [];

    if (this.manualStop) {
      this.status = "STOPPED";
      this.log("INFO", "CONNECTION", "Bot stopped manually.");
      this.recordActivity("BOT_STOP", "Bot stopped by user.");
      this.emitStatus();
      return;
    }

    // Ping server to check if server is offline or just disconnected
    pingMinecraftServer(this.server.host, this.server.port, 4000)
      .then((pingRes) => {
        if (!pingRes.online) {
          this.serverStatus = "OFFLINE";
          this.handleServerOffline(pingRes.error || "Server offline");
        } else {
          this.serverStatus = "ONLINE";
          this.scheduleReconnect(reason);
        }
      })
      .catch(() => {
        this.scheduleReconnect(reason);
      });
  }

  handleServerOffline(reasonMsg) {
    this.status = "WAITING_FOR_SERVER";
    this.emitStatus();
    this.log("WARNING", "CONNECTION", `Minecraft server is currently offline (${reasonMsg}). MCFBOT will automatically reconnect when the server comes back online.`);
    this.recordActivity("SERVER_OFFLINE", "Server offline. Waiting for return.");

    if (this.serverPollTimer) {
      clearInterval(this.serverPollTimer);
    }

    // Active polling for server returning online (every 10 seconds)
    this.serverPollTimer = setInterval(async () => {
      if (this.manualStop) {
        clearInterval(this.serverPollTimer);
        this.serverPollTimer = null;
        return;
      }

      try {
        const pingRes = await pingMinecraftServer(this.server.host, this.server.port, 4000);
        if (pingRes.online) {
          this.log("INFO", "CONNECTION", `Minecraft server is back online! Latency: ${pingRes.latency}ms. Reconnecting bot...`);
          this.recordActivity("SERVER_ONLINE", "Server back online! Reconnecting bot.");
          clearInterval(this.serverPollTimer);
          this.serverPollTimer = null;
          this.serverStatus = "ONLINE";
          this.reconnectAttempts = 0;
          this.connect();
        }
      } catch {}
    }, 10000);
  }

  scheduleReconnect(reason = "network") {
    if (this.manualStop) return;

    const config = this.botRecord.config || {};
    if (config.autoReconnect === false) {
      this.status = "OFFLINE";
      this.emitStatus();
      return;
    }

    this.reconnectAttempts += 1;
    this.status = "RECONNECTING";
    this.emitStatus();

    const maxRetries = config.maxRetries || 0; // 0 = infinite
    if (maxRetries > 0 && this.reconnectAttempts > maxRetries) {
      this.status = "STOPPED";
      this.log("WARNING", "CONNECTION", `Max reconnection attempts (${maxRetries}) reached. Stopped.`);
      this.emitStatus();
      return;
    }

    const baseDelay = Number(config.retryDelay || 5000);
    // Exponential backoff: 5s, 10s, 20s, 40s, capped at 60s
    const exponentialMultiplier = Math.min(12, Math.pow(2, Math.min(this.reconnectAttempts - 1, 4)));
    const delay = Math.min(baseDelay * exponentialMultiplier, 60000);

    this.log("INFO", "CONNECTION", `Reconnecting in ${Math.round(delay / 1000)}s (Attempt #${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.manualStop) {
        this.connect();
      }
    }, delay);
  }

  stop() {
    this.manualStop = true;
    this.botRecord.manualStop = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.serverPollTimer) {
      clearInterval(this.serverPollTimer);
      this.serverPollTimer = null;
    }

    this.clearIntervals();

    if (this.bot) {
      try {
        this.bot.quit("Stopped by user");
      } catch {
        try {
          this.bot.end();
        } catch {}
      }
      this.bot = null;
    }

    this.status = "STOPPED";
    this.log("INFO", "CONNECTION", "Bot stopped manually.");
    this.recordActivity("BOT_STOPPED", "Bot stopped manually.");
    this.emitStatus();
    return true;
  }

  restart() {
    this.log("INFO", "CONNECTION", "Restarting bot...");
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1500);
    return true;
  }

  sendCommand(rawCommand) {
    if (!this.bot || this.status !== "ONLINE") {
      return { success: false, message: "Bot is not connected to Minecraft" };
    }

    const trimmed = String(rawCommand || "").trim();
    if (!trimmed) {
      return { success: false, message: "Command cannot be empty" };
    }

    // Security: Block any OS shell command injection patterns
    const sanitized = trimmed.replace(/[\r\n]/g, " ");
    const formatted = sanitized.startsWith("/") ? sanitized : `/${sanitized}`;

    try {
      this.bot.chat(formatted);
      this.log("INFO", "COMMAND", `Executed command: ${formatted}`);
      this.recordActivity("COMMAND_SENT", `Executed: ${formatted.slice(0, 50)}`);
      return { success: true, message: `Sent: ${formatted}` };
    } catch (err) {
      this.log("ERROR", "COMMAND", `Command failed: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  sendChat(message) {
    if (!this.bot || this.status !== "ONLINE") {
      return { success: false, message: "Bot is not connected to Minecraft" };
    }

    const trimmed = String(message || "").trim();
    if (!trimmed) {
      return { success: false, message: "Message cannot be empty" };
    }

    try {
      this.bot.chat(trimmed);

      const entry = db.addChat({
        serverId: this.server.id,
        botId: this.botRecord.id,
        sender: this.bot.username,
        message: trimmed,
        isBot: true
      });

      botEvents.emit(`event:${this.server.id}`, {
        type: "chat",
        data: entry
      });

      this.log("INFO", "CHAT", `<${this.bot.username}> ${trimmed}`);
      return { success: true, message: "Message sent" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // --- Anti-AFK & Aternos 24/7 Keep-Alive Engine ---

  setupAntiAfk() {
    const config = this.botRecord.config?.antiAfk || { enabled: true, lookAround: true, randomJump: true, walk: true, swing: true };
    if (!config.enabled) return;

    this.log("INFO", "SYSTEM", "Anti-AFK & Aternos 24/7 Keep-Alive active (Arm Swing, Steps, Jump, Look).");

    // 1. Arm Swing (Resets server-side player activity timer & mouse click checks)
    const swingInterval = setInterval(() => {
      if (!this.bot || this.status !== "ONLINE") return;
      try {
        if (typeof this.bot.swingArm === "function") {
          this.bot.swingArm("right");
        }
      } catch {}
    }, 6000);
    this.intervals.push(swingInterval);

    // 2. Look Around (Smooth head rotation to non-repeating angles)
    if (config.lookAround !== false) {
      const lookInterval = setInterval(() => {
        if (!this.bot || this.status !== "ONLINE") return;
        try {
          const yaw = Math.random() * Math.PI * 2 - Math.PI;
          const pitch = (Math.random() * 0.8) - 0.4;
          this.bot.look(yaw, pitch, true);
        } catch {}
      }, 5000);
      this.intervals.push(lookInterval);
    }

    // 3. Jump Bursts (every 12 seconds)
    if (config.randomJump !== false) {
      const jumpInterval = setInterval(() => {
        if (!this.bot || this.status !== "ONLINE" || typeof this.bot.setControlState !== "function") return;
        try {
          this.bot.setControlState("jump", true);
          setTimeout(() => {
            if (this.bot && typeof this.bot.setControlState === "function") {
              this.bot.setControlState("jump", false);
            }
          }, 300);
        } catch {}
      }, 12000);
      this.intervals.push(jumpInterval);
    }

    // 4. Physical Coordinate Movement (Walk micro steps to change position packets)
    if (config.walk !== false) {
      let stepDirection = 0;
      const walkInterval = setInterval(() => {
        if (!this.bot || this.status !== "ONLINE" || typeof this.bot.setControlState !== "function") return;
        try {
          const directions = ["forward", "back", "left", "right"];
          const dir = directions[stepDirection % directions.length];
          stepDirection++;

          this.bot.setControlState(dir, true);
          setTimeout(() => {
            if (this.bot && typeof this.bot.setControlState === "function") {
              this.bot.setControlState(dir, false);
            }
          }, 350);
        } catch {}
      }, 8000);
      this.intervals.push(walkInterval);
    }

    // 5. Sneak Toggle / Cycle
    if (config.sneak) {
      if (typeof this.bot?.setControlState === "function") {
        this.bot.setControlState("sneak", true);
      }
    } else {
      // Periodic momentary crouch to trigger sneaking packets
      const sneakCycleInterval = setInterval(() => {
        if (!this.bot || this.status !== "ONLINE" || typeof this.bot.setControlState !== "function") return;
        try {
          this.bot.setControlState("sneak", true);
          setTimeout(() => {
            if (this.bot && typeof this.bot.setControlState === "function") {
              this.bot.setControlState("sneak", false);
            }
          }, 400);
        } catch {}
      }, 15000);
      this.intervals.push(sneakCycleInterval);
    }
  }

  // --- Auto Login Engine ---

  setupAutoLogin() {
    const config = this.botRecord.config?.autoLogin;
    if (!config || !config.enabled) return;

    if (config.trigger === "on_join") {
      const delay = Number(config.delay || 3000);
      setTimeout(() => {
        this.executeLogin();
      }, delay);
    }
  }

  checkLoginPrompt(message) {
    const config = this.botRecord.config?.autoLogin;
    if (!config || !config.enabled) return;

    const lower = message.toLowerCase();
    if (lower.includes("/login") || lower.includes("register") || lower.includes("use /login") || lower.includes("please login")) {
      this.executeLogin();
    }
  }

  executeLogin() {
    const config = this.botRecord.config?.autoLogin;
    if (!config || !config.enabled || !this.bot || this.status !== "ONLINE") return;

    const password = decryptSecret(config.passwordEncrypted);
    if (!password) return;

    const cmdTemplate = config.command || "/login {password}";
    const fullCommand = cmdTemplate.split("{password}").join(password);

    try {
      this.bot.chat(fullCommand);
      this.log("INFO", "SECURITY", "Sent auto-login authentication command [PASSWORD PROTECTED]");
      this.recordActivity("AUTH_SENT", "Auto-login command dispatched");
    } catch (err) {
      this.log("ERROR", "SECURITY", `Auto-login failed: ${err.message}`);
    }
  }

  // --- Automation Engine ---

  evaluateWorkflows(triggerType, eventContext = {}) {
    const workflows = db.getWorkflows(this.server.id) || [];
    const active = workflows.filter((w) => w.enabled && w.trigger === triggerType);

    for (const wf of active) {
      this.executeWorkflow(wf, eventContext);
    }
  }

  executeWorkflow(workflow, context) {
    this.log("INFO", "AUTOMATION", `Executing workflow: "${workflow.name}" (Trigger: ${workflow.trigger})`);

    // Check conditions if present
    if (workflow.conditions && workflow.conditions.length > 0) {
      for (const cond of workflow.conditions) {
        if (cond.field === "message" && context.message) {
          if (!context.message.toLowerCase().includes(cond.value.toLowerCase())) {
            return; // Condition not met
          }
        }
      }
    }

    const actions = workflow.actions || [];
    let currentDelay = 0;

    for (const action of actions) {
      currentDelay += Number(action.delay || 0) * 1000;
      setTimeout(() => {
        if (!this.bot || this.status !== "ONLINE") return;

        if (action.type === "command" && action.value) {
          this.sendCommand(action.value);
        } else if (action.type === "chat" && action.value) {
          this.sendChat(action.value);
        } else if (action.type === "jump") {
          if (typeof this.bot.setControlState === "function") {
            this.bot.setControlState("jump", true);
            setTimeout(() => this.bot.setControlState("jump", false), 300);
          }
        }
      }, currentDelay);
    }

    db.saveWorkflow({
      ...workflow,
      lastRun: Date.now(),
      runCount: (workflow.runCount || 0) + 1
    });
  }

  clearIntervals() {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
  }
}

// ------------------- Bot Manager (Singleton) -------------------

class BotManager {
  constructor() {
    this.servers = new Map(); // serverId -> Map(botId, ServerBot)
    this.schedulerTimer = null;
  }

  init() {
    console.log("[MCFBOT] Initializing Bot Manager & Database...");
    const servers = db.getAllServers();

    for (const server of servers) {
      const bots = db.getBotsByServer(server.id);
      const serverBotMap = new Map();

      for (const botRecord of bots) {
        const botInstance = new ServerBot(server, botRecord);
        serverBotMap.set(botRecord.id, botInstance);

        // 24/7 Persistent Mode: Auto-start if persistent247 is enabled and not manually stopped
        const isPersistent = botRecord.config?.persistent247 ?? true;
        if (isPersistent && !botRecord.manualStop) {
          console.log(`[MCFBOT 24/7] Auto-starting persistent bot: ${botRecord.username} on ${server.host}`);
          botInstance.start();
        }
      }
      this.servers.set(server.id, serverBotMap);
    }

    this.startScheduler();
  }

  startScheduler() {
    // Run scheduler check every 30 seconds
    this.schedulerTimer = setInterval(() => {
      const now = Date.now();
      for (const [serverId, botMap] of this.servers.entries()) {
        const schedules = db.getSchedules(serverId) || [];
        for (const schedule of schedules) {
          if (!schedule.enabled) continue;

          const intervalMs = Math.max(1, Number(schedule.intervalMinutes || 5)) * 60 * 1000;
          const lastRun = schedule.lastRun || 0;

          if (now - lastRun >= intervalMs) {
            // Find active bot
            const activeBot = Array.from(botMap.values()).find((b) => b.status === "ONLINE");
            if (activeBot) {
              if (schedule.actionType === "command") {
                activeBot.sendCommand(schedule.actionPayload);
              } else if (schedule.actionType === "chat") {
                activeBot.sendChat(schedule.actionPayload);
              }
            }
            db.saveSchedule({
              ...schedule,
              lastRun: now,
              nextRun: now + intervalMs
            });
          }
        }
      }
    }, 30000);
  }

  registerServer(server, botRecord) {
    if (!this.servers.has(server.id)) {
      this.servers.set(server.id, new Map());
    }

    const botInstance = new ServerBot(server, botRecord);
    this.servers.get(server.id).set(botRecord.id, botInstance);
    return botInstance;
  }

  getBotInstance(serverId, botId) {
    const serverMap = this.servers.get(serverId);
    if (!serverMap) return null;
    return serverMap.get(botId) || null;
  }

  getFirstBot(serverId) {
    const serverMap = this.servers.get(serverId);
    if (!serverMap || serverMap.size === 0) return null;
    return serverMap.values().next().value;
  }

  removeServer(serverId) {
    const serverMap = this.servers.get(serverId);
    if (serverMap) {
      for (const bot of serverMap.values()) {
        bot.stop();
      }
      this.servers.delete(serverId);
    }
  }

  shutdown() {
    console.log("[MCFBOT] Gracefully shutting down all bot runtimes...");
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);

    for (const serverMap of this.servers.values()) {
      for (const bot of serverMap.values()) {
        try {
          bot.stop();
        } catch {}
      }
    }
  }
}

const botManager = new BotManager();

module.exports = {
  botManager,
  botEvents,
  ServerBot
};
