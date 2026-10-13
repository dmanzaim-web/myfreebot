"use strict";

const { db } = require("./db");
const { botManager } = require("./botManager");
const { botBuilderSupervisor } = require("./botBuilderSupervisor");
const { pingMinecraftServer } = require("./mcPing");

/**
 * List of permitted Minecraft commands that can be executed in-game or via console
 * Strictly forbids OS shell commands, sudo, curl, bash, exec, etc.
 */
const ALLOWED_MINECRAFT_COMMANDS = [
  "time",
  "weather",
  "say",
  "tellraw",
  "msg",
  "tell",
  "w",
  "list",
  "help",
  "gamemode",
  "tp",
  "teleport",
  "difficulty",
  "gamerule",
  "seed",
  "whitelist",
  "kill",
  "kick",
  "ban",
  "tempban",
  "pardon",
  "unban"
];

class AiActionEngine {
  constructor() {
    this.toolRegistry = {
      get_server_status: this.getServerStatus.bind(this),
      get_bot_status: this.getBotStatus.bind(this),
      get_player_list: this.getPlayerList.bind(this),
      get_recent_logs: this.getRecentLogs.bind(this),
      analyze_connection: this.analyzeConnection.bind(this),
      get_monitoring_metrics: this.getMonitoringMetrics.bind(this),
      send_minecraft_chat: this.sendMinecraftChat.bind(this),
      execute_allowed_minecraft_command: this.executeAllowedMinecraftCommand.bind(this),
      start_bot: this.startBot.bind(this),
      stop_bot: this.stopBot.bind(this),
      restart_bot: this.restartBot.bind(this),
      create_automation: this.createAutomation.bind(this),
      run_builder_task: this.runBuilderTask.bind(this),
      get_task_status: this.getTaskStatus.bind(this),
      update_allowed_bot_settings: this.updateAllowedBotSettings.bind(this)
    };
  }

  /**
   * Determine if an action is sensitive and requires user confirmation
   */
  requiresConfirmation(toolName, params = {}) {
    switch (toolName) {
      case "stop_bot":
        return true;
      case "restart_bot":
        return true;
      case "send_minecraft_chat":
        return false;
      case "execute_allowed_minecraft_command":
        const cmd = String(params.command || "").trim().toLowerCase();
        // Read-only commands do not require confirmation
        if (cmd.startsWith("/list") || cmd.startsWith("/help") || cmd.startsWith("/seed") || cmd.startsWith("/time query")) {
          return false;
        }
        return true; // Modifying commands require confirmation
      case "run_builder_task":
        return true; // Building / banning tasks require confirmation
      case "update_allowed_bot_settings":
        return true;
      default:
        return false;
    }
  }

  /**
   * Execute an action tool safely within the context of a server
   */
  async executeTool(toolName, params = {}, serverId, isOwner = true) {
    if (!this.toolRegistry[toolName]) {
      return {
        success: false,
        error: `Tool "${toolName}" is not supported or not implemented in AI Action Engine.`
      };
    }

    const server = db.getServer(serverId);
    if (!server) {
      return { success: false, error: "Server context not found." };
    }

    // Permission check
    const ownerOnlyTools = ["stop_bot", "restart_bot", "update_allowed_bot_settings", "execute_allowed_minecraft_command"];
    if (ownerOnlyTools.includes(toolName) && !isOwner) {
      return {
        success: false,
        error: "Permission Denied: Only the server owner can execute administrative modifications."
      };
    }

    try {
      const result = await this.toolRegistry[toolName](params, server, isOwner);
      return {
        success: true,
        tool: toolName,
        params,
        result
      };
    } catch (err) {
      console.error(`[AI Action Engine] Error executing ${toolName}:`, err.message);
      return {
        success: false,
        tool: toolName,
        error: err.message
      };
    }
  }

  // ---------------- Tool Implementations ----------------

  async getServerStatus(params, server) {
    const pingRes = await pingMinecraftServer(server.host, server.port, 3500).catch(() => ({ online: false }));
    const bot = botManager.getFirstBot(server.id);

    return {
      serverName: server.name,
      host: server.host,
      port: server.port,
      normalizedAddress: server.normalizedAddress,
      edition: server.edition,
      version: server.version,
      serverOnline: pingRes.online,
      latency: pingRes.latency ? `${pingRes.latency}ms` : "Unreachable",
      playersOnline: pingRes.players ? `${pingRes.players.online} / ${pingRes.players.max}` : "N/A",
      botStatus: bot ? bot.status : "OFFLINE",
      botUptime: bot && bot.startedAt ? Math.floor((Date.now() - bot.startedAt) / 1000) : 0,
      isProtected: Boolean(server.protection?.enabled)
    };
  }

  async getBotStatus(params, server) {
    const bot = botManager.getFirstBot(server.id);
    if (!bot) {
      return { status: "OFFLINE", message: "No bot registered for this server." };
    }

    return {
      id: bot.botRecord?.id,
      username: bot.botRecord?.username,
      status: bot.status,
      serverStatus: bot.serverStatus,
      uptimeSeconds: bot.startedAt && bot.status === "ONLINE" ? Math.floor((Date.now() - bot.startedAt) / 1000) : 0,
      reconnectAttempts: bot.reconnectAttempts || 0,
      health: bot.health,
      food: bot.food,
      position: bot.position,
      persistent247: bot.botRecord?.config?.persistent247 ?? true,
      lastError: bot.lastError || "None"
    };
  }

  async getPlayerList(params, server) {
    const bot = botManager.getFirstBot(server.id);
    if (!bot || bot.status !== "ONLINE") {
      // Fallback to ping data
      const pingRes = await pingMinecraftServer(server.host, server.port, 3000).catch(() => ({ online: false }));
      return {
        online: pingRes.online,
        count: pingRes.players?.online || 0,
        players: pingRes.players?.sample || [],
        note: "Bot is offline; player names sampled from server handshake ping."
      };
    }

    const players = bot.players || [];
    return {
      online: true,
      count: players.length,
      players: players.map((p) => ({
        username: p.username,
        ping: p.ping || 0
      }))
    };
  }

  async getRecentLogs(params, server) {
    const limit = Math.min(50, Math.max(5, Number(params.limit || 20)));
    const filter = params.level || null;

    let logs = db.getLogs(server.id, limit);
    if (filter) {
      logs = logs.filter((l) => l.level === filter || l.category === filter);
    }

    return {
      count: logs.length,
      logs: logs.map((l) => ({
        time: new Date(l.timestamp).toLocaleTimeString(),
        level: l.level,
        category: l.category,
        message: l.message
      }))
    };
  }

  async analyzeConnection(params, server) {
    const bot = botManager.getFirstBot(server.id);
    const pingRes = await pingMinecraftServer(server.host, server.port, 3500).catch(() => ({ online: false }));

    const logs = db.getLogs(server.id, 60);
    const connectionErrors = logs.filter((l) => l.category === "CONNECTION" && (l.level === "ERROR" || l.level === "WARN"));

    let healthScore = 95;
    if (!pingRes.online) healthScore -= 20;
    if (pingRes.latency > 150) healthScore -= 10;
    if (connectionErrors.length > 5) healthScore -= 15;

    return {
      healthScore: Math.max(40, Math.min(100, healthScore)),
      serverReachable: pingRes.online,
      ping: pingRes.latency ? `${pingRes.latency}ms` : "N/A",
      reconnectCountToday: bot?.reconnectAttempts || 0,
      recentConnectionErrorsCount: connectionErrors.length,
      recentErrorSamples: connectionErrors.slice(0, 3).map((e) => e.message),
      stabilityRating: healthScore > 85 ? "STABLE" : healthScore > 65 ? "MODERATE" : "UNSTABLE",
      diagnosis: !pingRes.online
        ? "The Minecraft server appears offline or unreachable from the network. myfreebot auto-reconnect listener remains active."
        : connectionErrors.length > 3
        ? "Frequent disconnects observed. Possible causes: Cracked mode disabled on Aternos, ViaVersion missing, or server tick lag."
        : "Connection is healthy and latency is within acceptable parameters."
    };
  }

  async getMonitoringMetrics(params, server) {
    const bot = botManager.getFirstBot(server.id);
    const tasks = db.getBuilderTasks(server.id) || [];
    const activeTasks = tasks.filter((t) => t.status === "RUNNING");
    const evidence = db.getBuilderEvidence(server.id) || [];
    const workflows = db.getWorkflows(server.id) || [];

    return {
      activeBot: bot ? bot.botRecord?.username : null,
      botStatus: bot ? bot.status : "OFFLINE",
      uptimeSeconds: bot && bot.startedAt ? Math.floor((Date.now() - bot.startedAt) / 1000) : 0,
      activeTasksCount: activeTasks.length,
      activeTasks: activeTasks.map((t) => ({ id: t.id, title: t.title, progress: `${t.progress}%` })),
      suspiciousPlayersCount: evidence.filter((e) => e.riskScore >= 75).length,
      activeAutomationsCount: workflows.filter((w) => w.enabled).length,
      systemUptime: Math.floor(process.uptime())
    };
  }

  async sendMinecraftChat(params, server) {
    const message = String(params.message || "").trim();
    if (!message) throw new Error("Message text cannot be empty.");

    const bot = botManager.getFirstBot(server.id);
    if (!bot || bot.status !== "ONLINE") {
      throw new Error("Cannot send chat message: Bot is currently OFFLINE.");
    }

    bot.sendChat(message);
    bot.log("INFO", "AI_ACTION", `AI Assistant sent in-game message: "${message}"`);

    return {
      sent: true,
      message,
      timestamp: Date.now()
    };
  }

  async executeAllowedMinecraftCommand(params, server) {
    let command = String(params.command || "").trim();
    if (!command) throw new Error("Command string cannot be empty.");
    if (!command.startsWith("/")) command = "/" + command;

    const baseCmd = command.slice(1).split(" ")[0].toLowerCase();

    // Security check: strictly whitelist Minecraft commands
    if (!ALLOWED_MINECRAFT_COMMANDS.includes(baseCmd)) {
      throw new Error(`Command "/${baseCmd}" is not permitted. Only standard Minecraft administration commands are allowed.`);
    }

    // Safety guard against OS injections
    if (command.includes(";") || command.includes("&&") || command.includes("|") || command.includes("`") || command.includes("$")) {
      throw new Error("Command contains illegal shell syntax characters.");
    }

    const bot = botManager.getFirstBot(server.id);
    if (!bot || bot.status !== "ONLINE") {
      throw new Error("Cannot execute command: Bot is currently OFFLINE.");
    }

    bot.sendCommand(command);
    bot.log("INFO", "AI_ACTION", `AI Assistant executed command: "${command}"`);

    return {
      executed: true,
      command,
      timestamp: Date.now()
    };
  }

  async startBot(params, server) {
    const bot = botManager.getFirstBot(server.id);
    if (!bot) throw new Error("No bot instance found for this server.");

    bot.start();
    return {
      status: "STARTING",
      message: `Bot ${bot.botRecord?.username} start sequence initiated.`
    };
  }

  async stopBot(params, server) {
    const bot = botManager.getFirstBot(server.id);
    if (!bot) throw new Error("No bot instance found for this server.");

    bot.stop();
    return {
      status: "STOPPED",
      message: `Bot ${bot.botRecord?.username} has been stopped.`
    };
  }

  async restartBot(params, server) {
    const bot = botManager.getFirstBot(server.id);
    if (!bot) throw new Error("No bot instance found for this server.");

    bot.stop();
    setTimeout(() => {
      bot.start();
    }, 1500);

    return {
      status: "RESTARTING",
      message: `Bot ${bot.botRecord?.username} is restarting.`
    };
  }

  async createAutomation(params, server) {
    const { name, trigger, actionType, actionPayload, delay = 0 } = params;
    if (!name || !trigger || !actionType) {
      throw new Error("Missing automation parameters (name, trigger, actionType).");
    }

    const workflowRecord = {
      id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      serverId: server.id,
      name: String(name).trim(),
      trigger, // "PLAYER_JOIN", "CHAT_MESSAGE", "LOW_HEALTH", "DEATH"
      enabled: true,
      conditions: params.conditions || [],
      actions: [
        {
          type: actionType, // "chat" | "command" | "jump"
          value: actionPayload || "",
          delay: Number(delay) || 0
        }
      ],
      runCount: 0,
      createdAt: Date.now()
    };

    db.saveWorkflow(workflowRecord);
    return {
      created: true,
      workflow: workflowRecord
    };
  }

  async runBuilderTask(params, server) {
    const { agentType, userPrompt, title, steps, specs } = params;
    if (!userPrompt && !title) throw new Error("Task prompt or title required.");

    const plan = {
      agentType: agentType || "builder",
      userPrompt: userPrompt || title,
      title: title || "AI Automated Task",
      steps: steps || [
        { step: 1, title: "Survey Scope", description: "Validate safety parameters", actionType: "SURVEY" },
        { step: 2, title: "Execute Action", description: "Run agent process", actionType: "EXECUTE" },
        { step: 3, title: "Verify Integrity", description: "Audit result", actionType: "VERIFY" }
      ],
      specs: specs || {}
    };

    const task = await botBuilderSupervisor.createTask(server.id, plan);
    await botBuilderSupervisor.startTask(server.id, task.id);

    return {
      taskStarted: true,
      taskId: task.id,
      agentType: task.agentType,
      title: task.title
    };
  }

  async getTaskStatus(params, server) {
    const taskId = params.taskId;
    if (!taskId) throw new Error("Task ID required.");

    const task = db.getBuilderTask(taskId);
    if (!task) throw new Error("Task not found.");

    return {
      taskId: task.id,
      title: task.title,
      status: task.status,
      progress: task.progress,
      currentStep: task.currentStep,
      actionDetails: task.actionDetails || "Running..."
    };
  }

  async updateAllowedBotSettings(params, server) {
    const bot = botManager.getFirstBot(server.id);
    if (!bot) throw new Error("No bot found for server.");

    const allowedFields = ["persistent247", "retryDelay", "autoReconnect"];
    const updatedConfig = { ...bot.botRecord.config };

    for (const key of allowedFields) {
      if (params[key] !== undefined) {
        updatedConfig[key] = params[key];
      }
    }

    bot.botRecord.config = updatedConfig;
    db.saveBot(bot.botRecord);

    return {
      updated: true,
      settings: updatedConfig
    };
  }
}

const aiActionEngine = new AiActionEngine();

module.exports = {
  aiActionEngine,
  ALLOWED_MINECRAFT_COMMANDS
};
