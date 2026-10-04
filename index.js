"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const { db } = require("./src/db");
const {
  generateAccessKey,
  hashAccessKey,
  verifyAccessKey,
  encryptSecret,
  RateLimiter
} = require("./src/security");
const { pingMinecraftServer } = require("./src/mcPing");
const { botManager, botEvents } = require("./src/botManager");
const { renderApp } = require("./src/ui");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const rateLimiter = new RateLimiter(60000, 100);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Global Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Rate limiting middleware
app.use("/api", (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
  if (!rateLimiter.isAllowed(String(ip))) {
    return res.status(429).json({ success: false, message: "Too many requests. Please slow down." });
  }
  next();
});

// Middleware: Authenticate Server Access Key
function requireServerAccess(req, res, next) {
  const serverId = req.params.id || req.query.serverId;
  if (!serverId) {
    return res.status(400).json({ success: false, message: "Missing server ID" });
  }

  const server = db.getServer(serverId);
  if (!server) {
    return res.status(404).json({ success: false, message: "Server not found" });
  }

  const rawKey = req.headers["x-server-key"] ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null) ||
    req.query.key;

  if (!rawKey || !verifyAccessKey(rawKey, server.accessKeyHash)) {
    return res.status(403).json({
      success: false,
      message: "403 Forbidden: Invalid or missing Server Access Key."
    });
  }

  req.server = server;
  next();
}

// ---------------- HTML Frontend ----------------
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderApp());
});

// ---------------- REST APIs ----------------

// Real Minecraft Server Connection Ping (DNS SRV + TCP SLP)
app.post("/api/test-connection", async (req, res) => {
  const { host, port } = req.body || {};
  if (!host) {
    return res.status(400).json({ online: false, error: "Host address is required." });
  }

  const result = await pingMinecraftServer(host, Number(port) || 25565, 5000);
  res.json(result);
});

// Verify an Access Key (Import Server)
app.post("/api/servers/verify-key", (req, res) => {
  const { accessKey } = req.body || {};
  if (!accessKey) {
    return res.status(400).json({ success: false, message: "Access key is required" });
  }

  const server = db.findServerByAccessKey(accessKey);
  if (!server) {
    return res.status(404).json({ success: false, message: "Invalid Access Key" });
  }

  res.json({
    success: true,
    server: {
      id: server.id,
      name: server.name,
      host: server.host,
      port: server.port
    }
  });
});

// Create Server & Initial Bot (Anonymous, No Login)
app.post("/api/servers", async (req, res) => {
  const {
    name,
    host,
    port = 25565,
    edition = "java",
    version = "auto",
    botUsername,
    persistent247 = true
  } = req.body || {};

  if (!name || !host || !botUsername) {
    return res.status(400).json({
      success: false,
      message: "Server name, host address, and bot username are required."
    });
  }

  // Generate cryptographically secure access key
  const accessKey = generateAccessKey();
  const accessKeyHash = hashAccessKey(accessKey);

  const serverId = `srv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const botId = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Quick initial probe of server status
  const pingRes = await pingMinecraftServer(host, Number(port), 4000).catch(() => ({ online: false }));

  const serverData = {
    id: serverId,
    name: name.trim(),
    host: host.trim(),
    port: Number(port) || 25565,
    edition,
    version: version || "auto",
    status: pingRes.online ? "ONLINE" : "OFFLINE",
    accessKeyHash,
    lastOnline: pingRes.online ? Date.now() : null,
    ping: pingRes.latency || null
  };

  const botData = {
    id: botId,
    serverId,
    username: botUsername.trim(),
    status: "OFFLINE",
    uptime: 0,
    lastConnection: null,
    reconnectCount: 0,
    manualStop: false,
    config: {
      authType: "offline",
      autoReconnect: true,
      retryDelay: 5000,
      maxRetries: 0,
      persistent247: Boolean(persistent247),
      antiAfk: {
        enabled: true,
        lookAround: true,
        randomJump: true,
        sneak: false,
        walk: true,
        swing: true
      },
      autoLogin: {
        enabled: false,
        command: "/login {password}",
        passwordEncrypted: "",
        trigger: "prompt"
      },
      watchlist: []
    }
  };

  db.saveServer(serverData);
  db.saveBot(botData);

  // Register in runtime manager
  const botInstance = botManager.registerServer(serverData, botData);

  // If persistent mode is on, start bot right away
  if (persistent247) {
    botInstance.start();
  }

  res.json({
    success: true,
    server: serverData,
    bot: botData,
    accessKey
  });
});

// Retrieve User's Servers by provided keys
app.get("/api/servers", (req, res) => {
  let keys = [];
  try {
    const headerKeys = req.headers["x-server-keys"];
    if (headerKeys) {
      keys = JSON.parse(headerKeys);
    } else if (req.query.keys) {
      keys = JSON.parse(req.query.keys);
    }
  } catch {}

  const servers = db.getAllServers().filter((s) => {
    return keys.some((rawKey) => verifyAccessKey(rawKey, s.accessKeyHash));
  });

  const enriched = servers.map((s) => {
    const bots = db.getBotsByServer(s.id);
    const primaryBot = bots[0] || null;
    let liveStatus = primaryBot ? primaryBot.status : "OFFLINE";

    // Merge live runtime status if active
    const runtimeBot = botManager.getFirstBot(s.id);
    if (runtimeBot) {
      liveStatus = runtimeBot.status;
    }

    return {
      ...s,
      bot: primaryBot ? {
        id: primaryBot.id,
        username: primaryBot.username,
        status: liveStatus,
        uptime: runtimeBot ? runtimeBot.getStatus().uptime : primaryBot.uptime,
        position: runtimeBot ? runtimeBot.position : null,
        reconnectAttempts: runtimeBot ? runtimeBot.reconnectAttempts : 0
      } : null
    };
  });

  res.json({ success: true, servers: enriched });
});

// Server Details (Protected by Access Key)
app.get("/api/servers/:id", requireServerAccess, (req, res) => {
  const bots = db.getBotsByServer(req.server.id);
  const botRecord = bots[0] || null;

  let liveBot = botRecord;
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (runtimeBot) {
    liveBot = {
      ...botRecord,
      ...runtimeBot.getStatus()
    };
  }

  res.json({
    success: true,
    server: req.server,
    bot: liveBot,
    workflows: db.getWorkflows(req.server.id),
    schedules: db.getSchedules(req.server.id)
  });
});

// Delete Server (Protected by Access Key)
app.delete("/api/servers/:id", requireServerAccess, (req, res) => {
  botManager.removeServer(req.server.id);
  db.deleteServer(req.server.id);
  res.json({ success: true, message: "Server deleted successfully" });
});

// Bot Control: Start
app.post("/api/servers/:id/bot/start", requireServerAccess, (req, res) => {
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (!runtimeBot) {
    return res.status(404).json({ success: false, message: "Bot not found" });
  }

  runtimeBot.start();
  res.json({ success: true, message: "Bot started" });
});

// Bot Control: Stop
app.post("/api/servers/:id/bot/stop", requireServerAccess, (req, res) => {
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (!runtimeBot) {
    return res.status(404).json({ success: false, message: "Bot not found" });
  }

  runtimeBot.stop();
  res.json({ success: true, message: "Bot stopped manually" });
});

// Bot Control: Restart
app.post("/api/servers/:id/bot/restart", requireServerAccess, (req, res) => {
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (!runtimeBot) {
    return res.status(404).json({ success: false, message: "Bot not found" });
  }

  runtimeBot.restart();
  res.json({ success: true, message: "Bot restarted" });
});

// Bot Control: Send Minecraft In-Game Command
app.post("/api/servers/:id/bot/command", requireServerAccess, (req, res) => {
  const { command } = req.body || {};
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (!runtimeBot) {
    return res.status(404).json({ success: false, message: "Bot not found" });
  }

  const result = runtimeBot.sendCommand(command);
  res.json(result);
});

// Bot Control: Send Minecraft In-Game Chat
app.post("/api/servers/:id/bot/chat", requireServerAccess, (req, res) => {
  const { message } = req.body || {};
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (!runtimeBot) {
    return res.status(404).json({ success: false, message: "Bot not found" });
  }

  const result = runtimeBot.sendChat(message);
  res.json(result);
});

// Update Bot Configuration (Anti-AFK, Auto-Login with encryption)
app.patch("/api/servers/:id/bot/config", requireServerAccess, (req, res) => {
  const bots = db.getBotsByServer(req.server.id);
  const botRecord = bots[0];
  if (!botRecord) {
    return res.status(404).json({ success: false, message: "Bot not found" });
  }

  const { antiAfk, autoLogin } = req.body || {};
  const newConfig = { ...botRecord.config };

  if (antiAfk) {
    newConfig.antiAfk = { ...newConfig.antiAfk, ...antiAfk };
  }

  if (autoLogin) {
    newConfig.autoLogin = { ...newConfig.autoLogin, ...autoLogin };
    if (autoLogin.password) {
      newConfig.autoLogin.passwordEncrypted = encryptSecret(autoLogin.password);
      delete newConfig.autoLogin.password;
    }
  }

  const updatedBot = db.saveBot({
    ...botRecord,
    config: newConfig
  });

  // Re-sync runtime bot if active
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (runtimeBot) {
    runtimeBot.botRecord = updatedBot;
    runtimeBot.initSecrets();
  }

  res.json({ success: true, bot: updatedBot });
});

// Logs Endpoint
app.get("/api/servers/:id/logs", requireServerAccess, (req, res) => {
  const limit = Math.min(Number(req.query.limit || 200), 500);
  const logs = db.getLogs(req.server.id, limit, req.query.category, req.query.search);
  res.json({ success: true, logs });
});

app.delete("/api/servers/:id/logs", requireServerAccess, (req, res) => {
  db.clearLogs(req.server.id);
  res.json({ success: true });
});

// Chat History
app.get("/api/servers/:id/chat", requireServerAccess, (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 200);
  const chat = db.getChat(req.server.id, limit);
  res.json({ success: true, chat });
});

// Real-Time SSE Event Stream
app.get("/api/stream", (req, res) => {
  const serverId = req.query.serverId;
  const rawKey = req.query.key;

  if (!serverId || !rawKey) {
    return res.status(400).end("Missing serverId or key");
  }

  const server = db.getServer(serverId);
  if (!server || !verifyAccessKey(rawKey, server.accessKeyHash)) {
    return res.status(403).end("Forbidden");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const listener = (eventPayload) => {
    res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
  };

  const channel = `event:${serverId}`;
  botEvents.on(channel, listener);

  // Keep-alive heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    botEvents.off(channel, listener);
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    platform: "myfreebot",
    version: "2.5.0",
    uptime: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  });
});

// ---------------- Startup & Graceful Shutdown ----------------

// Initialize Bot Manager (Starts 24/7 persistent bots)
botManager.init();

const serverInstance = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[myfreebot] Platform running at http://0.0.0.0:${PORT}`);
});

process.on("SIGTERM", () => {
  botManager.shutdown();
  serverInstance.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  botManager.shutdown();
  serverInstance.close(() => process.exit(0));
});