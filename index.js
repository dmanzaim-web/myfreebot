"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const { db } = require("./src/db");
const {
  generateAccessKey,
  hashAccessKey,
  verifyAccessKey,
  generateAccessCode,
  normalizeAccessCode,
  normalizeServerAddress,
  hashServerPassword,
  verifyServerPassword,
  generateSessionToken,
  generateSecureServerPassword,
  encryptSecret,
  RateLimiter
} = require("./src/security");
const { pingMinecraftServer } = require("./src/mcPing");
const { botManager, botEvents } = require("./src/botManager");
const { botBuilderSupervisor } = require("./src/botBuilderSupervisor");
const { analyzeUserTask, chatWithAgent } = require("./src/aiEngine");
const { aiActionEngine } = require("./src/aiActionEngine");
const { gatherServerContext, processChatMessage } = require("./src/serverAiChat");
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

// Middleware: Authenticate Server Access Key, Code, or Session Token
function requireServerAccess(req, res, next) {
  const serverId = req.params.id || req.query.serverId;
  if (!serverId) {
    return res.status(400).json({ success: false, message: "Missing server ID" });
  }

  const server = db.getServer(serverId);
  if (!server) {
    return res.status(404).json({ success: false, message: "Server not found" });
  }

  const rawSession = req.headers["x-session-token"] || req.query.token;
  const rawCode = req.headers["x-access-code"] ||
    req.headers["x-server-key"] ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null) ||
    req.query.code ||
    req.query.key;

  if (!rawSession && !rawCode) {
    return res.status(403).json({
      success: false,
      message: "403 Forbidden: Invalid or missing Server Access Code."
    });
  }

  // 1. Check if rawCode matches owner Access Code or Access Key
  if (rawCode) {
    const cleanCode = String(rawCode).trim();
    const isMatchCode = server.accessCode && server.accessCode.toUpperCase() === cleanCode.toUpperCase();
    const isMatchKey = verifyAccessKey(cleanCode, server.accessKeyHash);
    if (isMatchCode || isMatchKey) {
      req.server = server;
      req.accessRole = "owner";
      req.isOwner = true;
      return next();
    }
  }

  // 2. Check if rawSession or rawCode matches a registered session token (owner or member)
  const candidateToken = rawSession || rawCode;
  if (candidateToken) {
    const cleanToken = String(candidateToken).trim();
    const session = db.verifyAccessSession(server.id, cleanToken);
    if (session) {
      req.server = server;
      req.accessRole = session.role;
      req.isOwner = session.role === "owner";
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    message: "403 Forbidden: Invalid Server Access Code or Session."
  });
}

// Middleware: Strictly require Owner privileges
function requireOwnerAccess(req, res, next) {
  requireServerAccess(req, res, () => {
    if (req.accessRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "403 Forbidden: Only the server owner can perform this action."
      });
    }
    next();
  });
}

// ---------------- HTML Frontend ----------------
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderApp());
});

// ---------------- REST APIs ----------------

// Real Minecraft Server Connection Ping (DNS SRV + TCP SLP) & Platform Registry Check
app.post("/api/test-connection", async (req, res) => {
  const { host, port } = req.body || {};
  if (!host) {
    return res.status(400).json({ online: false, error: "Host address is required." });
  }

  const norm = normalizeServerAddress(host, port);
  const result = await pingMinecraftServer(norm.host, norm.port, 5000);

  // Check if server exists in platform DB by normalized address (IP/Domain + Port)
  const existingServer = db.findServerByNormalizedAddress(norm.host, norm.port);

  let alreadyInAccount = false;
  if (existingServer) {
    try {
      const headerKeys = req.headers["x-server-keys"] || req.headers["x-access-codes"];
      if (headerKeys) {
        const keysList = JSON.parse(headerKeys);
        if (Array.isArray(keysList)) {
          alreadyInAccount = keysList.some((k) => {
            const clean = String(k || "").trim().toUpperCase();
            return (
              (existingServer.accessCode && existingServer.accessCode.toUpperCase() === clean) ||
              existingServer.id === clean ||
              verifyAccessKey(clean, existingServer.accessKeyHash)
            );
          });
        }
      }
    } catch {}
  }

  res.json({
    ...result,
    resolvedHost: norm.host,
    resolvedPort: norm.port,
    normalizedAddress: norm.normalized,
    isRegistered: Boolean(existingServer),
    isProtected: Boolean(existingServer?.protection?.enabled),
    alreadyInAccount,
    serverName: existingServer ? existingServer.name : null,
    serverId: existingServer ? existingServer.id : null,
    requiresPassword: Boolean(existingServer?.protection?.enabled)
  });
});

// Verify Server Access Password for protected server
app.post("/api/servers/verify-password", (req, res) => {
  const { host, port, serverId, password } = req.body || {};

  let server = null;
  if (serverId) {
    server = db.getServer(serverId);
  } else if (host) {
    server = db.findServerByNormalizedAddress(host, port);
  }

  if (!server) {
    return res.status(404).json({ success: false, message: "Server not found on platform" });
  }

  // If server is not protected
  if (!server.protection || !server.protection.enabled) {
    const sessionToken = generateSessionToken();
    db.addAccessSession(server.id, sessionToken, "member");
    return res.json({
      success: true,
      verified: true,
      message: "Server has no access password protection.",
      server: {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        accessCode: null,
        isProtected: false,
        role: "member"
      },
      sessionToken
    });
  }

  // Check brute force lockout
  if (server.protection.lockedUntil && Date.now() < server.protection.lockedUntil) {
    const remainingMin = Math.ceil((server.protection.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      isLocked: true,
      message: `Too many failed attempts. Please try again in ${remainingMin} minute(s).`
    });
  }

  if (!password || String(password).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "You must enter the server password to continue."
    });
  }

  const valid = verifyServerPassword(String(password), server.protection.passwordHash);
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";

  if (!valid) {
    server.protection.failedAttempts = (server.protection.failedAttempts || 0) + 1;
    if (server.protection.failedAttempts >= 5) {
      server.protection.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minute temporary lockout
    }
    db.saveServer(server);
    db.addAuditLog(server.id, "ACCESS_FAILED", "Failed server password attempt", clientIp, "guest");

    return res.status(401).json({
      success: false,
      message: "Invalid server password. Please try again."
    });
  }

  // Password correct: reset failed attempts & lockout
  server.protection.failedAttempts = 0;
  server.protection.lockedUntil = null;
  db.saveServer(server);

  // Generate short-lived access session token
  const sessionToken = generateSessionToken();
  db.addAccessSession(server.id, sessionToken, "member");
  db.addAuditLog(server.id, "ACCESS_VERIFIED", "Successful server password verification", clientIp, "member");

  res.json({
    success: true,
    verified: true,
    message: "Server access has been verified successfully.",
    server: {
      id: server.id,
      name: server.name,
      host: server.host,
      port: server.port,
      accessCode: null,
      isProtected: true,
      role: "member"
    },
    sessionToken
  });
});

// Verify an Access Code or Key (Import Server / Login)
app.post("/api/servers/verify-key", (req, res) => {
  const identifier = req.body?.accessCode || req.body?.accessKey || req.body?.code;
  if (!identifier) {
    return res.status(400).json({ success: false, message: "Access code is required" });
  }

  const server = db.findServerByAccessKey(identifier);
  if (!server) {
    return res.status(404).json({ success: false, message: "Invalid Access Code. Please check the code and try again." });
  }

  res.json({
    success: true,
    server: {
      id: server.id,
      name: server.name,
      host: server.host,
      port: server.port,
      accessCode: server.accessCode || null
    }
  });
});

// Create or Connect Server & Initial Bot
app.post("/api/servers", async (req, res) => {
  const {
    name,
    host,
    port = 25565,
    edition = "java",
    version = "auto",
    botUsername,
    persistent247 = true,
    protectServer = false,
    serverPassword = "",
    sessionToken = null
  } = req.body || {};

  if (!name || !host || !botUsername) {
    return res.status(400).json({
      success: false,
      message: "Server name, host address, and bot username are required."
    });
  }

  const norm = normalizeServerAddress(host, port);
  const existingServer = db.findServerByNormalizedAddress(norm.host, norm.port);

  // ---------------- CASE 1: Server already registered on platform ----------------
  if (existingServer) {
    // If protected, verify sessionToken or serverPassword
    if (existingServer.protection && existingServer.protection.enabled) {
      const isSessionValid = sessionToken && db.verifyAccessSession(existingServer.id, sessionToken);
      const isPwdValid = serverPassword && verifyServerPassword(String(serverPassword), existingServer.protection.passwordHash);

      if (!isSessionValid && !isPwdValid) {
        return res.status(403).json({
          success: false,
          requiresPassword: true,
          message: "This server is protected by its owner. Enter the Server Access Password to continue."
        });
      }
    }

    // Access granted as member (original ownership NOT transferred)
    let userSession = sessionToken;
    if (!userSession || !db.verifyAccessSession(existingServer.id, userSession)) {
      userSession = generateSessionToken();
      db.addAccessSession(existingServer.id, userSession, "member");
    }

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
    db.addAuditLog(existingServer.id, "ACCESS_SESSION_CREATED", `User added server to dashboard as member (${botUsername})`, clientIp, "member");

    const bots = db.getBotsByServer(existingServer.id);
    const primaryBot = bots[0] || null;

    return res.json({
      success: true,
      alreadyRegistered: true,
      server: {
        id: existingServer.id,
        name: existingServer.name,
        host: existingServer.host,
        port: existingServer.port,
        normalizedAddress: existingServer.normalizedAddress,
        edition: existingServer.edition,
        version: existingServer.version,
        status: existingServer.status,
        accessCode: null,
        isProtected: Boolean(existingServer.protection?.enabled),
        isOwner: false,
        role: "member"
      },
      bot: primaryBot,
      accessCode: null,
      accessKey: userSession,
      sessionToken: userSession,
      isOwner: false,
      role: "member",
      message: "Connected to existing platform server."
    });
  }

  // ---------------- CASE 2: Server not registered (Create New Server & Owner) ----------------
  let accessCode = generateAccessCode(name);
  let attempts = 0;
  while (db.isAccessCodeTaken(accessCode) && attempts < 30) {
    accessCode = generateAccessCode(name);
    attempts++;
  }

  const accessKey = generateAccessKey();
  const accessKeyHash = hashAccessKey(accessKey);

  const serverId = `srv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const botId = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const ownerId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const pingRes = await pingMinecraftServer(norm.host, norm.port, 4000).catch(() => ({ online: false }));

  const hasProtection = Boolean(protectServer && serverPassword && String(serverPassword).trim().length >= 4);
  const passwordHash = hasProtection ? hashServerPassword(String(serverPassword).trim()) : null;

  const serverData = {
    id: serverId,
    ownerId,
    name: name.trim(),
    host: norm.host,
    port: norm.port,
    normalizedAddress: norm.normalized,
    edition,
    version: version || "auto",
    status: pingRes.online ? "ONLINE" : "OFFLINE",
    accessCode,
    accessKeyHash,
    protection: {
      enabled: hasProtection,
      passwordHash,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: Date.now()
    },
    accessSessions: [],
    auditLogs: [],
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

  // Create owner session
  const ownerSessionToken = generateSessionToken();
  db.addAccessSession(serverId, ownerSessionToken, "owner");

  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
  db.addAuditLog(serverId, "SERVER_CREATED", `Server registered with name "${serverData.name}"`, clientIp, "owner");
  if (hasProtection) {
    db.addAuditLog(serverId, "PROTECTION_ENABLED", "Server access password enabled upon creation", clientIp, "owner");
  }

  // Register in runtime manager
  const botInstance = botManager.registerServer(serverData, botData);
  if (persistent247) {
    botInstance.start();
  }

  res.json({
    success: true,
    server: serverData,
    bot: botData,
    accessCode,
    accessKey,
    sessionToken: ownerSessionToken,
    isOwner: true,
    role: "owner"
  });
});

// Retrieve User's Servers by provided keys or codes
app.get("/api/servers", (req, res) => {
  let keys = [];
  try {
    const headerKeys = req.headers["x-server-keys"] || req.headers["x-access-codes"];
    if (headerKeys) {
      keys = JSON.parse(headerKeys);
    } else if (req.query.keys) {
      keys = JSON.parse(req.query.keys);
    }
  } catch {}

  const servers = db.getAllServers().filter((s) => {
    return keys.some((rawKey) => {
      const clean = String(rawKey || "").trim();
      if (!clean) return false;
      if (s.accessCode && s.accessCode.toUpperCase() === clean.toUpperCase()) return true;
      if (verifyAccessKey(clean, s.accessKeyHash)) return true;
      const full = db.getServer(s.id);
      if (
        full &&
        Array.isArray(full.accessSessions) &&
        full.accessSessions.some((sess) => sess.token === clean && sess.expiresAt > Date.now())
      ) {
        return true;
      }
      return false;
    });
  });

  const enriched = servers.map((s) => {
    const isOwner = keys.some((rawKey) => {
      const clean = String(rawKey || "").trim();
      return (s.accessCode && s.accessCode.toUpperCase() === clean.toUpperCase()) || verifyAccessKey(clean, s.accessKeyHash);
    });

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
      accessCode: isOwner ? s.accessCode : null,
      isOwner,
      role: isOwner ? "owner" : "member",
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

// Server Details (Protected by Access Key or Session)
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

  const isOwner = req.isOwner || req.accessRole === "owner";

  // Safe server view without exposing passwordHash or secret internals
  const safeServer = {
    id: req.server.id,
    ownerId: req.server.ownerId,
    name: req.server.name,
    host: req.server.host,
    port: req.server.port,
    normalizedAddress: req.server.normalizedAddress,
    edition: req.server.edition,
    version: req.server.version,
    status: req.server.status,
    accessCode: isOwner ? req.server.accessCode : null,
    isOwner,
    role: req.accessRole || (isOwner ? "owner" : "member"),
    isProtected: Boolean(req.server.protection && req.server.protection.enabled),
    protection: {
      enabled: Boolean(req.server.protection && req.server.protection.enabled),
      isLocked: Boolean(req.server.protection?.lockedUntil && Date.now() < req.server.protection.lockedUntil),
      failedAttempts: req.server.protection?.failedAttempts || 0,
      updatedAt: req.server.protection?.updatedAt || null
    },
    createdAt: req.server.createdAt,
    lastOnline: req.server.lastOnline,
    ping: req.server.ping
  };

  res.json({
    success: true,
    server: safeServer,
    bot: liveBot,
    workflows: db.getWorkflows(req.server.id),
    schedules: db.getSchedules(req.server.id)
  });
});

// Regenerate Access Code (Owner only)
app.post("/api/servers/:id/regenerate-code", requireOwnerAccess, (req, res) => {
  let newCode = generateAccessCode(req.server.name);
  let attempts = 0;
  while (db.isAccessCodeTaken(newCode, req.server.id) && attempts < 30) {
    newCode = generateAccessCode(req.server.name);
    attempts++;
  }

  req.server.accessCode = newCode;
  db.saveServer(req.server);

  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
  db.addAuditLog(req.server.id, "ACCESS_CODE_REGENERATED", "Server access code regenerated by owner", clientIp, "owner");

  res.json({
    success: true,
    accessCode: newCode,
    message: "Access code regenerated successfully."
  });
});

// Enable Server Access Protection (Owner only)
app.post("/api/servers/:id/protection/enable", requireOwnerAccess, (req, res) => {
  const { password, confirmPassword } = req.body || {};

  if (!password || String(password).trim().length < 4) {
    return res.status(400).json({ success: false, message: "Password must be at least 4 characters." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match." });
  }

  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
  req.server.protection = {
    enabled: true,
    passwordHash: hashServerPassword(String(password).trim()),
    failedAttempts: 0,
    lockedUntil: null,
    updatedAt: Date.now()
  };
  db.saveServer(req.server);
  db.addAuditLog(req.server.id, "PROTECTION_ENABLED", "Server access protection enabled by owner", clientIp, "owner");

  res.json({
    success: true,
    message: "Server access protection enabled successfully."
  });
});

// Disable Server Access Protection (Owner only)
app.post("/api/servers/:id/protection/disable", requireOwnerAccess, (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
  req.server.protection = {
    enabled: false,
    passwordHash: null,
    failedAttempts: 0,
    lockedUntil: null,
    updatedAt: Date.now()
  };
  db.saveServer(req.server);
  db.addAuditLog(req.server.id, "PROTECTION_DISABLED", "Server access protection disabled by owner", clientIp, "owner");

  res.json({
    success: true,
    message: "Server access protection disabled successfully."
  });
});

// Change Server Access Password (Owner only)
app.post("/api/servers/:id/protection/change-password", requireOwnerAccess, (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body || {};

  if (req.server.protection && req.server.protection.enabled && req.server.protection.passwordHash) {
    if (!currentPassword || !verifyServerPassword(String(currentPassword), req.server.protection.passwordHash)) {
      return res.status(400).json({ success: false, message: "Current server password is incorrect." });
    }
  }

  if (!newPassword || String(newPassword).trim().length < 4) {
    return res.status(400).json({ success: false, message: "New password must be at least 4 characters." });
  }
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ success: false, message: "New passwords do not match." });
  }

  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
  req.server.protection = {
    enabled: true,
    passwordHash: hashServerPassword(String(newPassword).trim()),
    failedAttempts: 0,
    lockedUntil: null,
    updatedAt: Date.now()
  };
  db.saveServer(req.server);

  // Invalidate previous member sessions
  db.revokeAllMemberSessions(req.server.id);
  db.addAuditLog(req.server.id, "PASSWORD_CHANGED", "Server access password changed and member sessions revoked", clientIp, "owner");

  res.json({
    success: true,
    message: "Server password changed successfully."
  });
});

// Regenerate Server Access Password (Owner only)
app.post("/api/servers/:id/protection/regenerate-password", requireOwnerAccess, (req, res) => {
  const newPwd = generateSecureServerPassword(12);
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";

  req.server.protection = {
    enabled: true,
    passwordHash: hashServerPassword(newPwd),
    failedAttempts: 0,
    lockedUntil: null,
    updatedAt: Date.now()
  };
  db.saveServer(req.server);

  // Invalidate previous member sessions
  db.revokeAllMemberSessions(req.server.id);
  db.addAuditLog(req.server.id, "PASSWORD_REGENERATED", "Server access password regenerated", clientIp, "owner");

  res.json({
    success: true,
    generatedPassword: newPwd,
    message: "New server password generated successfully."
  });
});

// View Security Audit Logs
app.get("/api/servers/:id/audit-logs", requireServerAccess, (req, res) => {
  const logs = db.getAuditLogs(req.server.id);
  res.json({ success: true, logs });
});

// Delete Server (Owner only)
app.delete("/api/servers/:id", requireOwnerAccess, (req, res) => {
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
    if (!req.isOwner && req.accessRole !== "owner") {
      return res.status(403).json({ success: false, message: "Only the server owner can configure auto-login passwords." });
    }
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

// Schedules: List
app.get("/api/servers/:id/schedules", requireServerAccess, (req, res) => {
  const schedules = db.getSchedules(req.server.id);
  res.json({ success: true, schedules });
});

// Schedules: Create
app.post("/api/servers/:id/schedules", requireServerAccess, (req, res) => {
  const { name, intervalMinutes = 5, actionType = "command", actionPayload = "/list" } = req.body || {};
  if (!name || !actionPayload) {
    return res.status(400).json({ success: false, message: "Schedule name and action payload are required." });
  }

  const mins = Math.max(1, Number(intervalMinutes) || 5);
  const now = Date.now();
  const schedule = db.saveSchedule({
    serverId: req.server.id,
    name: String(name).trim(),
    intervalMinutes: mins,
    actionType,
    actionPayload: String(actionPayload).trim(),
    enabled: true,
    lastRun: null,
    nextRun: now + mins * 60 * 1000,
    runCount: 0
  });

  res.json({ success: true, schedule });
});

// Schedules: Toggle
app.patch("/api/servers/:id/schedules/:scId/toggle", requireServerAccess, (req, res) => {
  const schedules = db.getSchedules(req.server.id);
  const schedule = schedules.find((s) => s.id === req.params.scId);
  if (!schedule) {
    return res.status(404).json({ success: false, message: "Schedule not found." });
  }

  schedule.enabled = !schedule.enabled;
  db.saveSchedule(schedule);
  res.json({ success: true, schedule });
});

// Schedules: Run Now
app.post("/api/servers/:id/schedules/:scId/run-now", requireServerAccess, (req, res) => {
  const result = botManager.executeScheduleNow(req.server.id, req.params.scId);
  res.json(result);
});

// Schedules: Delete
app.delete("/api/servers/:id/schedules/:scId", requireServerAccess, (req, res) => {
  db.deleteSchedule(req.params.scId);
  res.json({ success: true, message: "Schedule deleted." });
});

// Workflows: List
app.get("/api/servers/:id/workflows", requireServerAccess, (req, res) => {
  const workflows = db.getWorkflows(req.server.id);
  res.json({ success: true, workflows });
});

// Workflows: Create
app.post("/api/servers/:id/workflows", requireServerAccess, (req, res) => {
  const { name, trigger, actions, conditions, delay = 0, cooldown = 5 } = req.body || {};
  if (!name || !trigger) {
    return res.status(400).json({ success: false, message: "Workflow name and trigger are required." });
  }

  const wf = db.saveWorkflow({
    serverId: req.server.id,
    name: String(name).trim(),
    trigger,
    actions: Array.isArray(actions) ? actions : [{ type: "chat", value: "Welcome to our server!" }],
    conditions: Array.isArray(conditions) ? conditions : [],
    delay: Number(delay) || 0,
    cooldown: Number(cooldown) || 5,
    enabled: true,
    runCount: 0,
    lastRun: null
  });

  res.json({ success: true, workflow: wf });
});

// Workflows: Toggle
app.patch("/api/servers/:id/workflows/:wfId/toggle", requireServerAccess, (req, res) => {
  const workflows = db.getWorkflows(req.server.id);
  const wf = workflows.find((w) => w.id === req.params.wfId);
  if (!wf) {
    return res.status(404).json({ success: false, message: "Workflow not found." });
  }

  wf.enabled = !wf.enabled;
  db.saveWorkflow(wf);
  res.json({ success: true, workflow: wf });
});

// Workflows: Delete
app.delete("/api/servers/:id/workflows/:wfId", requireServerAccess, (req, res) => {
  db.deleteWorkflow(req.params.wfId);
  res.json({ success: true, message: "Workflow deleted." });
});

// Backups: List
app.get("/api/servers/:id/backups", requireServerAccess, (req, res) => {
  const backups = db.getBackups(req.server.id);
  res.json({ success: true, backups });
});

// Backups: Create
app.post("/api/servers/:id/backups", requireServerAccess, (req, res) => {
  const { name = "Manual Snapshot" } = req.body || {};
  const backup = db.createBackup(req.server.id, name);
  res.json({ success: true, backup });
});

// Backups: Restore
app.post("/api/servers/:id/backups/:bId/restore", requireServerAccess, (req, res) => {
  const ok = db.restoreBackup(req.params.bId);
  if (!ok) {
    return res.status(404).json({ success: false, message: "Backup snapshot not found or invalid." });
  }
  res.json({ success: true, message: "Configuration restored from backup." });
});

// Backups: Delete
app.delete("/api/servers/:id/backups/:bId", requireServerAccess, (req, res) => {
  db.deleteBackup(req.params.bId);
  res.json({ success: true, message: "Backup snapshot removed." });
});

// Reset Bot Config
app.post("/api/servers/:id/bot/reset", requireServerAccess, (req, res) => {
  const bots = db.getBotsByServer(req.server.id);
  if (!bots || bots.length === 0) {
    return res.status(404).json({ success: false, message: "Bot not found." });
  }

  const updatedBot = db.resetBotConfig(bots[0].id);
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (runtimeBot) {
    runtimeBot.botRecord = updatedBot;
    runtimeBot.setupAntiAfk();
  }
  res.json({ success: true, bot: updatedBot, message: "Bot settings reset to default." });
});

// Watchlist toggle
app.post("/api/servers/:id/watchlist", requireServerAccess, (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required." });
  }

  const watchlist = db.toggleWatchlistPlayer(req.server.id, username);
  const runtimeBot = botManager.getFirstBot(req.server.id);
  if (runtimeBot && runtimeBot.botRecord && runtimeBot.botRecord.config) {
    runtimeBot.botRecord.config.watchlist = watchlist;
  }

  res.json({ success: true, watchlist });
});

// Real-Time SSE Event Stream
app.get("/api/stream", (req, res) => {
  const serverId = req.query.serverId;
  const rawKey = req.query.key;

  if (!serverId || !rawKey) {
    return res.status(400).end("Missing serverId or key");
  }

  const server = db.getServer(serverId);
  const cleanKey = String(rawKey).trim();
  const isValid = server && (
    (server.accessCode && server.accessCode.toUpperCase() === cleanKey.toUpperCase()) ||
    verifyAccessKey(cleanKey, server.accessKeyHash)
  );
  if (!isValid) {
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

// ==========================================
// Bot Builder 5-Agent Architecture Endpoints
// ==========================================

// 1. Analyze Task with AI Planner (Gemini + Local NLP fallback)
app.post("/api/servers/:id/builder/analyze", requireServerAccess, async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || String(prompt).trim().length === 0) {
    return res.status(400).json({ success: false, message: "Task prompt is required." });
  }

  try {
    const plan = await analyzeUserTask(prompt, {
      id: req.server.id,
      name: req.server.name,
      host: req.server.host,
      edition: req.server.edition,
      version: req.server.version
    });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create and Start Bot Builder Task
app.post("/api/servers/:id/builder/tasks", requireServerAccess, async (req, res) => {
  const { plan } = req.body || {};
  if (!plan) {
    return res.status(400).json({ success: false, message: "Execution plan is required." });
  }

  try {
    const task = await botBuilderSupervisor.createTask(req.server.id, plan);
    await botBuilderSupervisor.startTask(req.server.id, task.id);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. List Bot Builder Tasks
app.get("/api/servers/:id/builder/tasks", requireServerAccess, (req, res) => {
  const tasks = db.getBuilderTasks(req.server.id);
  res.json({ success: true, tasks });
});

// 4. Task Controls: Pause / Resume / Stop / Rollback
app.post("/api/servers/:id/builder/tasks/:taskId/pause", requireServerAccess, async (req, res) => {
  try {
    const task = await botBuilderSupervisor.pauseTask(req.server.id, req.params.taskId);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/servers/:id/builder/tasks/:taskId/resume", requireServerAccess, async (req, res) => {
  try {
    const task = await botBuilderSupervisor.resumeTask(req.server.id, req.params.taskId);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/servers/:id/builder/tasks/:taskId/stop", requireServerAccess, async (req, res) => {
  try {
    const task = await botBuilderSupervisor.stopTask(req.server.id, req.params.taskId);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/servers/:id/builder/tasks/:taskId/rollback", requireServerAccess, async (req, res) => {
  try {
    const result = await botBuilderSupervisor.rollbackTask(req.server.id, req.params.taskId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Active Agents Status
app.get("/api/servers/:id/builder/agents", requireServerAccess, (req, res) => {
  const agents = botBuilderSupervisor.getAgents(req.server.id);
  res.json({ success: true, agents });
});

// 6. Guardian Evidence List
app.get("/api/servers/:id/builder/evidence", requireServerAccess, (req, res) => {
  const evidence = db.getBuilderEvidence(req.server.id);
  res.json({ success: true, evidence });
});

// 7. Analyst Reports List & Manual Generate
app.get("/api/servers/:id/builder/reports", requireServerAccess, (req, res) => {
  const reports = db.getBuilderReports(req.server.id);
  res.json({ success: true, reports });
});

app.post("/api/servers/:id/builder/reports/generate", requireServerAccess, (req, res) => {
  const report = botBuilderSupervisor.generateServerHealthReport(req.server.id);
  res.json({ success: true, report });
});

// 8. Bot Builder Settings
app.get("/api/servers/:id/builder/settings", requireServerAccess, (req, res) => {
  const settings = db.getBuilderSettings(req.server.id);
  res.json({ success: true, settings });
});

app.post("/api/servers/:id/builder/settings", requireOwnerAccess, (req, res) => {
  const updated = db.saveBuilderSettings(req.server.id, req.body || {});
  res.json({ success: true, settings: updated });
});


// ==========================================
// Server AI Chat (Dedicated AI Assistant)
// ==========================================

// 1. Get Live Server Context for AI
app.get("/api/servers/:id/ai-chat/context", requireServerAccess, async (req, res) => {
  try {
    const context = await gatherServerContext(req.server.id);
    res.json({ success: true, context });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. List Conversations for this server
app.get("/api/servers/:id/ai-chat/conversations", requireServerAccess, (req, res) => {
  const conversations = db.getAiConversations(req.server.id);
  res.json({ success: true, conversations });
});

// 3. Create New Conversation
app.post("/api/servers/:id/ai-chat/conversations", requireServerAccess, (req, res) => {
  const title = (req.body && req.body.title) ? req.body.title : "New Conversation";
  const conv = db.saveAiConversation({
    serverId: req.server.id,
    title,
    messages: []
  });
  res.json({ success: true, conversation: conv });
});

// 4. Get Conversation Details & Messages
app.get("/api/servers/:id/ai-chat/conversations/:convId", requireServerAccess, (req, res) => {
  const conv = db.getAiConversation(req.params.convId);
  if (!conv || conv.serverId !== req.server.id) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }
  res.json({ success: true, conversation: conv });
});

// 5. Rename Conversation
app.put("/api/servers/:id/ai-chat/conversations/:convId", requireServerAccess, (req, res) => {
  const { title } = req.body || {};
  const conv = db.renameAiConversation(req.params.convId, title);
  if (!conv || conv.serverId !== req.server.id) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }
  res.json({ success: true, conversation: conv });
});

// 6. Delete Conversation
app.delete("/api/servers/:id/ai-chat/conversations/:convId", requireServerAccess, (req, res) => {
  const conv = db.getAiConversation(req.params.convId);
  if (!conv || conv.serverId !== req.server.id) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }
  db.deleteAiConversation(req.params.convId);
  res.json({ success: true });
});

// 7. Send User Message & Receive AI Assistant Reply + Proposed Actions
app.post("/api/servers/:id/ai-chat/message", requireServerAccess, async (req, res) => {
  const { conversationId, content, mode = "chat" } = req.body || {};
  if (!content || String(content).trim().length === 0) {
    return res.status(400).json({ success: false, message: "Message content cannot be empty." });
  }

  let conv = conversationId ? db.getAiConversation(conversationId) : null;
  if (!conv || conv.serverId !== req.server.id) {
    // Auto-create new conversation if none provided
    conv = db.saveAiConversation({
      serverId: req.server.id,
      title: content.trim().slice(0, 45) + (content.length > 45 ? "..." : ""),
      messages: []
    });
  }

  // Record user message
  const userMsg = db.addAiMessage(conv.id, {
    role: "user",
    content: String(content).trim(),
    mode
  });

  try {
    const isOwner = Boolean(req.isOwner || req.accessRole === "owner");
    const aiResult = await processChatMessage({
      serverId: req.server.id,
      conversationId: conv.id,
      userMessage: content,
      mode,
      isOwner
    });

    // Record AI response
    const assistantMsg = db.addAiMessage(conv.id, {
      role: "assistant",
      content: aiResult.reply,
      mode,
      thought: aiResult.thought,
      actions: aiResult.actions || []
    });

    const updatedConv = db.getAiConversation(conv.id);
    res.json({
      success: true,
      message: assistantMsg,
      conversation: updatedConv
    });
  } catch (err) {
    console.error("[Server AI Chat] Message processing error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7.1 Regenerate AI Assistant Response
app.post("/api/servers/:id/ai-chat/regenerate", requireServerAccess, async (req, res) => {
  const { conversationId, messageId, mode = "chat" } = req.body || {};
  let conv = conversationId ? db.getAiConversation(conversationId) : null;
  if (!conv || conv.serverId !== req.server.id) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  const msgIdx = conv.messages.findIndex((m) => m.id === messageId);
  if (msgIdx < 0) {
    return res.status(404).json({ success: false, message: "Message to regenerate not found." });
  }

  let userMessage = "";
  for (let i = msgIdx - 1; i >= 0; i--) {
    if (conv.messages[i].role === "user") {
      userMessage = conv.messages[i].content;
      break;
    }
  }

  if (!userMessage) {
    return res.status(400).json({ success: false, message: "No previous user prompt found to regenerate." });
  }

  try {
    const isOwner = Boolean(req.isOwner || req.accessRole === "owner");
    const aiResult = await processChatMessage({
      serverId: req.server.id,
      conversationId: conv.id,
      userMessage,
      mode,
      isOwner
    });

    conv.messages[msgIdx] = {
      ...conv.messages[msgIdx],
      content: aiResult.reply,
      mode,
      thought: aiResult.thought,
      actions: aiResult.actions || [],
      timestamp: Date.now()
    };
    conv.updatedAt = Date.now();
    db.save();

    res.json({
      success: true,
      message: conv.messages[msgIdx],
      conversation: conv
    });
  } catch (err) {
    console.error("[Server AI Chat] Regenerate error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Confirm & Execute Proposed Action (AI Action Engine)
app.post("/api/servers/:id/ai-chat/confirm-action", requireServerAccess, async (req, res) => {
  const { conversationId, messageId, actionIndex } = req.body || {};
  const conv = db.getAiConversation(conversationId);
  if (!conv || conv.serverId !== req.server.id) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  const msg = conv.messages.find((m) => m.id === messageId);
  if (!msg || !msg.actions || !msg.actions[actionIndex]) {
    return res.status(404).json({ success: false, message: "Proposed action not found." });
  }

  const action = msg.actions[actionIndex];
  const isOwner = Boolean(req.isOwner || req.accessRole === "owner");

  // Mark action as running
  db.updateAiMessageAction(conv.id, messageId, actionIndex, { status: "running" });

  try {
    const execution = await aiActionEngine.executeTool(action.tool, action.params, req.server.id, isOwner);
    const updatedStatus = execution.success ? "completed" : "failed";

    const updatedAction = db.updateAiMessageAction(conv.id, messageId, actionIndex, {
      status: updatedStatus,
      result: execution.result || null,
      error: execution.error || null,
      confirmed: true,
      executedAt: Date.now()
    });

    // Also add audit log
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
    db.addAuditLog(req.server.id, "AI_ACTION_EXECUTED", `Action ${action.tool} executed (${updatedStatus})`, clientIp, isOwner ? "owner" : "member");

    res.json({
      success: true,
      action: updatedAction,
      execution
    });
  } catch (err) {
    db.updateAiMessageAction(conv.id, messageId, actionIndex, {
      status: "failed",
      error: err.message,
      confirmed: true
    });
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Cancel Proposed Action
app.post("/api/servers/:id/ai-chat/cancel-action", requireServerAccess, (req, res) => {
  const { conversationId, messageId, actionIndex } = req.body || {};
  const updatedAction = db.updateAiMessageAction(conversationId, messageId, actionIndex, {
    status: "cancelled",
    confirmed: false
  });
  res.json({ success: true, action: updatedAction });
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
// Initialize Bot Builder 5-Agent Supervisor
botBuilderSupervisor.init();

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