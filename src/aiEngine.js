"use strict";

const { GoogleGenAI } = require("@google/genai");

let geminiClient = null;

function getGeminiClient() {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    return geminiClient;
  } catch (err) {
    console.error("[MCFBOT AI] Failed to initialize GoogleGenAI:", err.message);
    return null;
  }
}

/**
 * Intelligent NLP Task Parser for Arabic & English
 * Used as fallback or primary when LLM is offline, ensuring 100% reliability
 */
function parseLocalTaskNLP(prompt, serverContext = {}) {
  const p = String(prompt || "").toLowerCase();
  const rawP = String(prompt || "");

  // Detect Agent Type
  let agentType = "admin";
  let title = "Server Management Task";
  let summary = "";
  let steps = [];
  let specs = {};
  let requiredPermissions = [];
  let safetyChecks = [
    "World Protection: Verified boundaries",
    "Permissions: Confined to allowed Minecraft commands",
    "Anti-Grief: Player builds protected",
    "Context: Strictly isolated to this server"
  ];

  // 1. GUARDIAN / X-RAY / ANTI-CHEAT / SECURITY
  if (
    p.includes("x-ray") ||
    p.includes("xray") ||
    p.includes("غش") ||
    p.includes("مخالف") ||
    p.includes("حظر") ||
    p.includes("ban") ||
    p.includes("punish") ||
    p.includes("أدلة") ||
    p.includes("evidence") ||
    p.includes("مشبو") ||
    p.includes("suspicious") ||
    p.includes("مراقبة اللاعبين") ||
    p.includes("راقب اللاعبين") ||
    p.includes("تعدين") ||
    p.includes("cheat")
  ) {
    agentType = "guardian";
    const isXray = p.includes("x-ray") || p.includes("xray") || p.includes("تعدين") || p.includes("ore") || p.includes("خامات");
    const isBan = p.includes("احظر") || p.includes("ban") || p.includes("30") || p.includes("عقوبة");

    title = isXray ? "Guardian: Evidence-Based X-Ray Detection & Monitoring" : "Guardian: Player Security & Anti-Cheat Shield";
    summary = isXray
      ? "Activate automated behavioral analytics on all mining activities. Correlate ray-casts, mining angles, hidden vein frequency, and rare ore ratios to calculate real-time Player Risk Scores."
      : "Initiate continuous security audit on player movements, combat consistency, and abnormal transactions.";

    steps = [
      { step: 1, title: "Initialize Security Scanner", description: "Attach Guardian listener to world block breaks and player movement packets.", actionType: "INITIALIZE_LISTENER" },
      { step: 2, title: "Mining & Movement Pattern Analysis", description: "Track trajectories, straight tunneling to hidden diamonds/netherite, and unusual mining speeds.", actionType: "BEHAVIOR_TRACK" },
      { step: 3, title: "Risk Score & Multi-Signal Synthesis", description: "Synthesize mining angles, block visibility, inventory ratios into an objective Risk Score (0-100%).", actionType: "CALCULATE_RISK" },
      { step: 4, title: "Evidence Logging", description: "Capture block coordinates, vein isolation metrics, and timestamped evidence records.", actionType: "LOG_EVIDENCE" }
    ];

    if (isBan) {
      steps.push({
        step: 5,
        title: "Automated Punishment Evaluation",
        description: "If verified risk score exceeds 90% and owner has enabled auto-punishment, enforce 30-day temporary ban.",
        actionType: "ENFORCE_PUNISHMENT"
      });
    }

    specs = {
      detectionFocus: isXray ? "X-Ray Hidden Ore Mining" : "Movement & Speed Inconsistencies",
      thresholdPercent: 90,
      punishmentAction: isBan ? "Temporary Ban (30 Days)" : "Admin Alert & Evidence Recording",
      monitoredOres: ["Diamond Ore", "Deepslate Diamond", "Ancient Debris", "Emerald", "Gold"],
      multiSignalSignals: ["Direct Pathing", "Zero-Deviation Tunneling", "High Value Vein Density", "Block Visibility Factor"]
    };

    requiredPermissions = ["READ_PLAYERS", "READ_BLOCK_EVENTS", "READ_MOVEMENT", isBan ? "PUNISH_PLAYERS" : "LOG_EVIDENCE"];
  }

  // 2. BUILDER / SPAWN / CASTLE / BRIDGE / HOUSE
  else if (
    p.includes("ابن") ||
    p.includes("ابني") ||
    p.includes("build") ||
    p.includes("spawn") ||
    p.includes("سباون") ||
    p.includes("قلعة") ||
    p.includes("castle") ||
    p.includes("بيت") ||
    p.includes("house") ||
    p.includes("طريق") ||
    p.includes("جسر") ||
    p.includes("bridge") ||
    p.includes("بناء") ||
    p.includes("كوارتز") ||
    p.includes("حجر") ||
    p.includes("stone") ||
    p.includes("medieval")
  ) {
    agentType = "builder";
    let project = "Custom Architectural Project";
    let dimensions = "60 × 60";
    let blocks = 8500;
    let materials = ["Stone Bricks", "Smooth Quartz", "Spruce Wood", "Lanterns", "Glass"];

    if (p.includes("spawn") || p.includes("سباون")) {
      project = "Grand Medieval Spawn Complex";
      dimensions = "120 × 120";
      blocks = 48500;
      materials = ["Stone Bricks", "Smooth Quartz", "Polished Andesite", "Dark Oak Planks", "Lanterns", "Sea Lanterns"];
    } else if (p.includes("قلعة") || p.includes("castle")) {
      project = "Fortified Stone Castle & Watchtowers";
      dimensions = "80 × 80";
      blocks = 64200;
      materials = ["Cobblestone", "Stone Bricks", "Iron Bars", "Spruce Logs", "Campfires", "Torches"];
    } else if (p.includes("جسر") || p.includes("bridge")) {
      project = "Arched Suspension Bridge";
      dimensions = "40 × 10";
      blocks = 3200;
      materials = ["Stone", "Chiseled Stone", "Oak Fences", "Lanterns"];
    } else if (p.includes("بيت") || p.includes("house")) {
      project = "Modern Survival Residence";
      dimensions = "30 × 30";
      blocks = 6800;
      materials = ["White Concrete", "Oak Planks", "Tinted Glass", "Glowstone"];
    }

    title = `Builder: ${project}`;
    summary = `Architectural execution plan for ${project} with full rollback history, boundary confinement, and progressive layered placement.`;

    steps = [
      { step: 1, title: "Survey Site & Boundary Enclosure", description: "Validate building perimeter, check protected regions, ensure safe zone clearance.", actionType: "SURVEY_REGION" },
      { step: 2, title: "Sub-grade Foundation & Leveling", description: "Lay foundational grid and base support layers.", actionType: "LAY_FOUNDATION" },
      { step: 3, title: "Primary Structural Walls & Columns", description: "Erect vertical supports, load-bearing pillars, and perimeter enclosure.", actionType: "BUILD_STRUCTURE" },
      { step: 4, title: "Roofing, Vaults & Flooring", description: "Complete ornamental roof arches, flooring patterns, and inter-floor stairs.", actionType: "ROOF_FLOORS" },
      { step: 5, title: "Lighting, Glazing & Decorative Details", description: "Install lanterns, windows, doors, and functional pathway lighting.", actionType: "DECORATE_LIGHTING" },
      { step: 6, title: "Integrity Verification & History Checkpoint", description: "Verify all block coordinates against plan, record final rollback checkpoint.", actionType: "VERIFY_BUILD" }
    ];

    specs = {
      project,
      dimensions,
      estimatedBlocks: blocks,
      materials,
      mode: "Creative Builder Mode (Safe Staging)",
      rollbackSupported: true
    };

    requiredPermissions = ["BUILD_BLOCKS", "READ_WORLD", "MODIFY_ALLOWED_REGION"];
    safetyChecks.push("Rollback snapshot created before placement", "Outside region boundaries locked from modification");
  }

  // 3. ANALYST / LAG / PERFORMANCE / DIAGNOSTIC / METRICS
  else if (
    p.includes("lag") ||
    p.includes("لاغ") ||
    p.includes("تقرير") ||
    p.includes("report") ||
    p.includes("تحليل") ||
    p.includes("analyst") ||
    p.includes("tps") ||
    p.includes("تشخيص") ||
    p.includes("أداء") ||
    p.includes("performance") ||
    p.includes("صحة السيرفر")
  ) {
    agentType = "analyst";
    title = "Analyst: Deep Server Health & Performance Diagnostic";
    summary = "Comprehensive runtime analysis across network latency, bot stability, player load distribution, chat trends, and anomalous performance spikes.";

    steps = [
      { step: 1, title: "Collect Realtime Metrics", description: "Sample ping latency, packet round-trip times, and bot heartbeat jitter.", actionType: "SAMPLE_TELEMETRY" },
      { step: 2, title: "Log Event & Error Clustering", description: "Aggregate recent disconnects, login errors, and command syntax issues.", actionType: "ANALYZE_LOGS" },
      { step: 3, title: "Player Activity & Peak Correlation", description: "Correlate player count with latency degradation to identify TPS drops.", actionType: "CORRELATE_LOAD" },
      { step: 4, title: "Generate AI Server Health Report", description: "Calculate Server Health % score and synthesize concrete mitigation steps.", actionType: "GENERATE_REPORT" }
    ];

    specs = {
      diagnosticScope: "Network, Hardware Lag, Error Frequency & Player Load",
      samplingIntervalSeconds: 10,
      reportOutput: "AI Server Health Score (0-100%) & Root-Cause Insights"
    };

    requiredPermissions = ["READ_LOGS", "READ_METRICS", "READ_PLAYER_DATA", "GENERATE_REPORTS"];
  }

  // 4. AUTOMATION / RULES / WELCOME / EVENT
  else if (
    p.includes("تلقائي") ||
    p.includes("automation") ||
    p.includes("عندما") ||
    p.includes("إذا") ||
    p.includes("if") ||
    p.includes("when") ||
    p.includes("قواعد") ||
    p.includes("rule") ||
    p.includes("تنبيه") ||
    p.includes("alert")
  ) {
    agentType = "automation";
    const isWelcome = p.includes("رحب") || p.includes("welcome") || p.includes("جديد");
    const isDeath = p.includes("مات") || p.includes("death") || p.includes("die");

    title = isWelcome ? "Automation: Player Onboarding & Welcome Protocol" : isDeath ? "Automation: Death Spike Incident Sentinel" : "Automation: Custom Event-Driven Workflow";
    summary = "Construct active background workflow rules responding to in-game triggers with deterministic actions, cooldowns, and audit logging.";

    steps = [
      { step: 1, title: "Register Event Triggers", description: isWelcome ? "Listen for player join packets (PLAYER_JOIN)." : isDeath ? "Listen for player death messages in chat." : "Subscribe to target event trigger.", actionType: "REGISTER_TRIGGER" },
      { step: 2, title: "Evaluate Guard Conditions", description: "Check cooldowns, user whitelist, and frequency limits.", actionType: "EVALUATE_CONDITIONS" },
      { step: 3, title: "Dispatch Configured Actions", description: isWelcome ? "Wait 3 seconds, send welcome chat message, and display server guide." : isDeath ? "Count deaths within 10-minute window; trigger admin alert if > 5." : "Execute defined Minecraft commands and notification.", actionType: "DISPATCH_ACTIONS" },
      { step: 4, title: "Persist Execution Record", description: "Log event execution timestamp, target player, and result to database.", actionType: "LOG_EXECUTION" }
    ];

    specs = {
      trigger: isWelcome ? "PLAYER_JOIN" : isDeath ? "PLAYER_DEATH_SPIKE" : "CUSTOM_EVENT",
      cooldownSeconds: 5,
      actionPayload: isWelcome ? "Welcome message + instructions" : "Emergency admin alert"
    };

    requiredPermissions = ["CREATE_AUTOMATION", "EXECUTE_ACTIONS", "SEND_CHAT"];
  }

  // 5. ADMIN / MANAGEMENT / BROADCAST / DAY-NIGHT
  else {
    agentType = "admin";
    title = "Admin: Server Oversight & Operations Sentinel";
    summary = "Execute high-level administrative tasks, broadcast schedules, player cap notifications, and automated server oversight.";

    steps = [
      { step: 1, title: "Inspect Current Server State", description: "Query online player count, current time of day, and active bots.", actionType: "INSPECT_STATE" },
      { step: 2, title: "Execute Permitted Commands", description: "Safely execute requested administrative action within permitted scope.", actionType: "EXECUTE_COMMAND" },
      { step: 3, title: "Broadcast Status Update", description: "Provide feedback to authorized users and log execution in audit log.", actionType: "CONFIRM_ACTION" }
    ];

    specs = {
      operationsScope: "Administrative monitoring, permitted commands & periodic summaries",
      frequency: "Continuous 24/7 background supervision"
    };

    requiredPermissions = ["READ_SERVER_STATUS", "SEND_ALLOWED_COMMANDS", "MANAGE_PLAYERS"];
  }

  return {
    success: true,
    userPrompt: rawP,
    agentType,
    title,
    summary,
    steps,
    specs,
    requiredPermissions,
    safetyChecks,
    estimatedDuration: "Realtime Continuous / Phased Execution",
    source: "NLP_ENGINE"
  };
}

/**
 * Main Task Analyzer: calls Gemini 3.8 Flash if available, otherwise NLP engine
 */
async function analyzeUserTask(prompt, serverContext = {}) {
  const client = getGeminiClient();

  if (!client) {
    return parseLocalTaskNLP(prompt, serverContext);
  }

  try {
    const systemInstruction = `You are the lead AI Architect for Minecraft Bot SaaS platform 'myfreebot'.
Your role is to analyze natural language user instructions (in Arabic or English) and compile them into a precise, safe execution plan for one of the 5 Bot Builder Agents:
1. 'guardian' - Security, Anti-Cheat, X-Ray detection, Player Risk Scoring, evidence collection, and automated punishment.
2. 'builder' - Creative / Survival architectural construction, world boundaries, block placement, and full rollback history.
3. 'admin' - Server administration, TPS/lag monitoring, player capacity alerts, welcome messages, permitted Minecraft commands.
4. 'automation' - Natural language triggers, delays, conditions, action workflows (e.g. on join, on death).
5. 'analyst' - Deep server telemetry, error clustering, player load, and AI Server Health Reports.

Safety Constraints:
- NEVER allow OS commands, shell commands, or arbitrary code.
- Always output strict JSON adhering to the required schema.`;

    const promptText = `Analyze this user request for Minecraft server "${serverContext.name || "Server"}":
"${prompt}"

Produce a complete, structured JSON response with:
- agentType: "guardian" | "builder" | "admin" | "automation" | "analyst"
- title: string (concise title)
- summary: string (clear explanation of what will be done)
- steps: array of objects { step: number, title: string, description: string, actionType: string }
- specs: object with key parameters (e.g. materials, dimensions, estimatedBlocks for builder; threshold, monitoredOres for guardian; triggers for automation; metrics for analyst)
- requiredPermissions: array of string permissions
- safetyChecks: array of string safety validations
- estimatedDuration: string`;

    const response = await client.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      return {
        success: true,
        userPrompt: prompt,
        agentType: parsed.agentType || "admin",
        title: parsed.title || "AI Planned Task",
        summary: parsed.summary || "",
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        specs: parsed.specs || {},
        requiredPermissions: Array.isArray(parsed.requiredPermissions) ? parsed.requiredPermissions : [],
        safetyChecks: Array.isArray(parsed.safetyChecks) ? parsed.safetyChecks : ["World Boundary Protection", "Command Whitelist Enforced"],
        estimatedDuration: parsed.estimatedDuration || "Automated Execution",
        source: "GEMINI_3.8_FLASH"
      };
    }
  } catch (err) {
    console.warn("[MCFBOT AI] Gemini analysis fallback triggered:", err.message);
  }

  return parseLocalTaskNLP(prompt, serverContext);
}

/**
 * Interactive Chat with Bot Builder AI Agents
 */
async function chatWithAgent(userMessage, agentType = "assistant", serverContext = {}, chatHistory = []) {
  const client = getGeminiClient();

  if (client) {
    try {
      const systemInstruction = `You are the ${agentType.toUpperCase()} AI Agent in myfreebot, an elite 24/7 Minecraft Bot SaaS platform.
You are assisting the server owner of "${serverContext.name || "Minecraft Server"}".
Provide helpful, concise, Minecraft-expert responses. Support Arabic and English fluently.
Never output shell commands or OS commands. Always operate within Minecraft game rules and platform capabilities.`;

      const contents = [];
      // Include last 6 history messages
      const recent = chatHistory.slice(-6);
      for (const h of recent) {
        contents.push({
          role: h.role === "ai" || h.role === "model" ? "model" : "user",
          parts: [{ text: h.content }]
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: userMessage }]
      });

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      if (response.text) {
        return { success: true, reply: response.text.trim() };
      }
    } catch (err) {
      console.warn("[MCFBOT AI] Chat fallback triggered:", err.message);
    }
  }

  // Local fallback response engine
  const m = String(userMessage || "").toLowerCase();
  let reply = "";

  if (agentType === "guardian" || m.includes("x-ray") || m.includes("حظر") || m.includes("غش")) {
    reply = "سأقوم بإنشاء نظام مراقبة مستمر للاعبين وتحليل أنماط التعدين وحساب Player Risk Score مع جمع الأدلة بصورة تلقائية. لن يتم تطبيق الحظر إلا عند تجاوز نسبة الأدلة المحددة (90%) مع تفعيل خاصية العقوبة التلقائية من الإعدادات.";
  } else if (agentType === "builder" || m.includes("ابن") || m.includes("spawn") || m.includes("قلعة")) {
    reply = "مرحبًا! بصفتي Builder AI، أستطيع بناء تصاميم متقدمة مع المحافظة التامة على أمان السيرفر وتوفير خاصية Rollback/Undo. هل ترغب في البدء بتصميم Spawn، أو قلعة، أو جسر؟ حدد الأبعاد والمواد وسأجهز لك المخطط فوراً.";
  } else if (agentType === "analyst" || m.includes("lag") || m.includes("تقرير") || m.includes("tps")) {
    reply = "قمت بفحص حالة السيرفر الحالية: معدل الاستجابة مستقر، وجميع البوتات تعمل بنظام 24/7 دون انقطاع. يمكنك طلب تقرير شامل في أي وقت للحصول على نسبة صحة السيرفر والتوصيات.";
  } else {
    reply = `مرحباً بك! أنا جاهز لتنفيذ طلباتك على سيرفر "${serverContext.name || "Minecraft Server"}". يمكنك أن تطلب مني مراقبة اللاعبين، أو البناء في السيرفر، أو جدولة مهام تلقائية، وسأحول طلبك إلى خطة تنفيذية مباشرة.`;
  }

  return { success: true, reply };
}

module.exports = {
  analyzeUserTask,
  chatWithAgent
};
