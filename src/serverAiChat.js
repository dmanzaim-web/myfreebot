"use strict";

const { GoogleGenAI, Type } = require("@google/genai");
const { db } = require("./db");
const { botManager } = require("./botManager");
const { aiActionEngine } = require("./aiActionEngine");
const { pingMinecraftServer } = require("./mcPing");

let geminiClient = null;

function getGeminiClient() {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" }
      }
    });
    return geminiClient;
  } catch (err) {
    console.error("[Server AI Chat] GoogleGenAI init error:", err.message);
    return null;
  }
}

/**
 * Gather rich, live, real-time context for a specific Minecraft server
 */
async function gatherServerContext(serverId) {
  const server = db.getServer(serverId);
  if (!server) return null;

  const bot = botManager.getFirstBot(serverId);
  const pingRes = await pingMinecraftServer(server.host, server.port, 3000).catch(() => ({ online: false }));
  const logs = db.getLogs(serverId, 25);
  const recentErrors = logs.filter((l) => l.level === "ERROR" || l.level === "WARN");
  const tasks = db.getBuilderTasks(serverId) || [];
  const activeTasks = tasks.filter((t) => t.status === "RUNNING");
  const evidence = db.getBuilderEvidence(serverId) || [];
  const workflows = db.getWorkflows(serverId) || [];

  return {
    serverId: server.id,
    serverName: server.name,
    host: server.host,
    port: server.port,
    normalizedAddress: server.normalizedAddress,
    edition: server.edition,
    version: server.version,
    isProtected: Boolean(server.protection?.enabled),
    serverOnline: pingRes.online,
    latency: pingRes.latency ? `${pingRes.latency}ms` : "Unreachable",
    playersOnline: pingRes.players ? `${pingRes.players.online} / ${pingRes.players.max}` : "N/A",
    botStatus: bot ? bot.status : "OFFLINE",
    botUsername: bot ? bot.botRecord?.username : "None",
    botUptimeSeconds: bot && bot.startedAt ? Math.floor((Date.now() - bot.startedAt) / 1000) : 0,
    reconnectAttemptsToday: bot?.reconnectAttempts || 0,
    persistent247: bot?.botRecord?.config?.persistent247 ?? true,
    activeTasksCount: activeTasks.length,
    activeTasksSummary: activeTasks.map((t) => `${t.title} (${t.progress}%)`),
    recentErrorsCount: recentErrors.length,
    recentErrorsSample: recentErrors.slice(0, 3).map((e) => `[${e.category}] ${e.message}`),
    suspiciousPlayersCount: evidence.filter((e) => e.riskScore >= 75).length,
    activeAutomationsCount: workflows.filter((w) => w.enabled).length
  };
}

/**
 * Generate response using Gemini 3.8 Flash or smart local fallback
 */
async function processChatMessage({ serverId, conversationId, userMessage, mode = "chat", isOwner = true }) {
  const context = await gatherServerContext(serverId);
  if (!context) {
    throw new Error("Server context not found for this conversation.");
  }

  const conv = db.getAiConversation(conversationId);
  const history = conv ? conv.messages.slice(-8) : [];

  const client = getGeminiClient();

  // Try LLM processing
  if (client) {
    try {
      const systemInstruction = `You are "Server AI Assistant" for Minecraft server "${context.serverName}" on the myfreebot platform.
You are an expert in Minecraft server administration, networking, Bukkit/Spigot/Paper plugins, Aternos hosting, Bot Runtime, and automated player bots.
You converse fluently in both Arabic (including dialects) and English.

Current Real Server State:
- Server: ${context.serverName} (${context.host}:${context.port})
- Status: ${context.serverOnline ? "ONLINE" : "OFFLINE"} (Ping: ${context.latency})
- Minecraft Version: ${context.version} (${context.edition})
- Players: ${context.playersOnline}
- Bot Username: ${context.botUsername} (Status: ${context.botStatus}, Uptime: ${context.botUptimeSeconds}s)
- Reconnect Count: ${context.reconnectAttemptsToday}
- 24/7 Persistent Mode: ${context.persistent247 ? "ENABLED" : "DISABLED"}
- Recent Errors Count: ${context.recentErrorsCount}
${context.recentErrorsSample.length > 0 ? "- Recent Errors: " + context.recentErrorsSample.join(" | ") : ""}
- Active Bot Builder Tasks: ${context.activeTasksSummary.join(", ") || "None"}
- Mode: ${mode.toUpperCase()} (Chat Mode = explanatory and safe; Agent Mode = propose concrete actions)

Instructions:
1. Always base answers on the real server context above. Never fabricate nonexistent player names or fake IP addresses.
2. In 'Agent Mode', if the user asks you to perform an action (e.g. send a chat, restart the bot, run a command, start building, stop the bot), format your proposed actions inside a JSON block at the very end of your response with the following format:
<<<ACTIONS
[
  { "tool": "send_minecraft_chat", "params": { "message": "Welcome all!" }, "summary": "Send in-game welcome message" }
]
ACTIONS>>>

Permitted tools:
- get_server_status
- get_bot_status
- get_player_list
- get_recent_logs (params: limit)
- analyze_connection
- get_monitoring_metrics
- send_minecraft_chat (params: message)
- execute_allowed_minecraft_command (params: command)
- start_bot
- stop_bot
- restart_bot
- create_automation (params: name, trigger, actionType, actionPayload)
- run_builder_task (params: agentType, userPrompt, title)
- update_allowed_bot_settings (params: persistent247)

Never output shell or OS commands.`;

      const contents = [];
      for (const m of history) {
        contents.push({
          role: m.role === "assistant" || m.role === "model" ? "model" : "user",
          parts: [{ text: m.content }]
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
          temperature: 0.4
        }
      });

      const rawText = response.text || "";
      const parsed = extractActionsFromResponse(rawText, mode, isOwner);

      return {
        reply: parsed.reply,
        thought: parsed.thought,
        actions: parsed.actions,
        source: "GEMINI_3.8_FLASH"
      };
    } catch (err) {
      console.warn("[Server AI Chat] Gemini request fallback:", err.message);
    }
  }

  // Local fallback engine with contextual heuristics
  return generateLocalAiResponse(userMessage, context, mode, isOwner);
}

/**
 * Extract action proposals from model text
 */
function extractActionsFromResponse(text, mode, isOwner) {
  let reply = text;
  let actions = [];
  let thought = null;

  const actionRegex = /<<<ACTIONS\s*([\s\S]*?)\s*ACTIONS>>>/;
  const match = text.match(actionRegex);

  if (match) {
    reply = text.replace(actionRegex, "").trim();
    try {
      const parsedActions = JSON.parse(match[1]);
      if (Array.isArray(parsedActions)) {
        actions = parsedActions.map((act) => {
          const reqConf = aiActionEngine.requiresConfirmation(act.tool, act.params);
          return {
            id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            tool: act.tool,
            params: act.params || {},
            summary: act.summary || `Execute ${act.tool}`,
            status: reqConf ? "requires_confirmation" : "ready",
            requiresConfirmation: reqConf,
            confirmed: false
          };
        });
      }
    } catch (e) {
      console.error("[Server AI Chat] Action parse error:", e);
    }
  }

  return { reply, thought, actions };
}

/**
 * Intelligent local response generator when API key is unavailable or during rate limit
 */
function generateLocalAiResponse(msg, ctx, mode, isOwner) {
  const p = msg.toLowerCase();
  let reply = "";
  let actions = [];
  let thought = "تحليل الرسالة ومقارنتها بسياق السيرفر الحالي...";

  // 1. Inquiries about why bot disconnected / cannot connect
  if (p.includes("انقطع") || p.includes("disconnect") || p.includes("لا يستطيع الدخول") || p.includes("مشكلة الاتصال")) {
    reply = `### 🔍 تحليل حالة الاتصال لسيرفر **${ctx.serverName}**

بناءً على فحص السجلات الحية لـ **myfreebot**:
- **حالة السيرفر:** ${ctx.serverOnline ? `🟢 Online (الاستجابة: ${ctx.latency})` : "🔴 Offline حالياً (في انتظار تشغيل السيرفر)"}
- **حالة البوت:** ${ctx.botStatus}
- **عدد محاولات إعادة الاتصال اليوم:** ${ctx.reconnectAttemptsToday} محاولة
- **خاصية 24/7 Persistent:** ${ctx.persistent247 ? "مفعلة وتعمل بالخلفية" : "غير مفعلة"}

**الأسباب الأكثر شيوعاً لانقطاع البوت:**
1. **وضع Cracked غير مفعّل:** إذا كان سيرفرك على Aternos، تأكد من الدخول إلى *Options* وتفعيل **Cracked**.
2. **توافق الإصدارات:** إصدار سيرفرك المسجل هو \`${ctx.version}\`. إذا قمت بتحديث السيرفر مؤخراً، قم بتثبيت بلجن **ViaVersion** أو **ViaBackwards**.
3. **توقف السيرفر المجاني:** السيرفرات المجانية تغلق تلقائياً عند خلوها من اللاعبين. نظام myfreebot يظل يترصد ويعيد ربط البوت بمجرد تشغيل السيرفر.`;

    if (mode === "agent") {
      actions.push({
        id: `act_${Date.now()}_1`,
        tool: "analyze_connection",
        params: {},
        summary: "إجراء فحص تشخيصي شامل لجودة الاتصال والـ Ping",
        status: "ready",
        requiresConfirmation: false
      });
    }
  }

  // 2. Restart / start / stop bot
  else if (p.includes("أعد تشغيل") || p.includes("restart") || p.includes("ريستارت")) {
    reply = `سأقوم بإعادة تشغيل البوت **${ctx.botUsername}** على سيرفر **${ctx.serverName}** لتجديد جلسة الاتصال وإعادة تفعيل جميع الأنظمة الملحقة.`;
    actions.push({
      id: `act_${Date.now()}_1`,
      tool: "restart_bot",
      params: {},
      summary: `إعادة تشغيل البوت ${ctx.botUsername}`,
      status: "requires_confirmation",
      requiresConfirmation: true
    });
  } else if (p.includes("شغل البوت") || p.includes("start bot")) {
    reply = `سأقوم بتشغيل البوت **${ctx.botUsername}** للاتصال بسيرفر **${ctx.host}:${ctx.port}**.`;
    actions.push({
      id: `act_${Date.now()}_1`,
      tool: "start_bot",
      params: {},
      summary: `تشغيل البوت ${ctx.botUsername}`,
      status: "ready",
      requiresConfirmation: false
    });
  } else if (p.includes("أوقف البوت") || p.includes("stop bot")) {
    reply = `⚠️ هل أنت متأكد من رغبتك في إيقاف البوت؟ عند إيقافه سيتوقف عن الحفاظ على تشغيل السيرفر والتحميل التلقائي للـ Chunks.`;
    actions.push({
      id: `act_${Date.now()}_1`,
      tool: "stop_bot",
      params: {},
      summary: `إيقاف البوت ${ctx.botUsername} بأمان`,
      status: "requires_confirmation",
      requiresConfirmation: true
    });
  }

  // 3. Send chat / welcome message
  else if (p.includes("أرسل رسالة") || p.includes("رحب") || p.includes("send chat") || p.includes("رسالة ترحيب")) {
    const defaultMsg = "Welcome everyone to our server! Enjoy your time!";
    reply = `سأرسل رسالة ترحيبية إلى جميع اللاعبين المتصلين في شات Minecraft:\n\n> \`${defaultMsg}\`\n\nهل تؤكد إرسالها الآن؟`;
    actions.push({
      id: `act_${Date.now()}_1`,
      tool: "send_minecraft_chat",
      params: { message: defaultMsg },
      summary: `إرسال رسالة لشات اللعبة: "${defaultMsg}"`,
      status: "requires_confirmation",
      requiresConfirmation: true
    });
  }

  // 4. Inquire about errors & logs
  else if (p.includes("أخطاء") || p.includes("logs") || p.includes("errors") || p.includes("console")) {
    reply = `### 📋 تقرير السجلات والأخطاء لسيرفر **${ctx.serverName}**

- **إجمالي الأخطاء المسجلة حديثاً:** ${ctx.recentErrorsCount} أخطاء
${ctx.recentErrorsSample.length > 0 ? ctx.recentErrorsSample.map((e) => `- \`${e}\``).join("\n") : "🟢 لا توجد أخطاء حرجة مسجلة في الجلسة الحالية."}

الـ Bot Runtime يعمل بنجاح ومزود بحماية استرجاع ذاتية ضد الانقطاعات.`;

    actions.push({
      id: `act_${Date.now()}_1`,
      tool: "get_recent_logs",
      params: { limit: 20 },
      summary: "جلب آخر 20 سطر من سجلات الكونسول",
      status: "ready",
      requiresConfirmation: false
    });
  }

  // 5. Inquire about X-Ray & Guardian
  else if (p.includes("x-ray") || p.includes("حماية") || p.includes("غش") || p.includes("guardian")) {
    reply = `### 🛡️ نظام الحماية واكتشاف X-Ray (Guardian AI)

يوفر **Guardian AI** فحصاً متعدد الإشارات:
1. **تحليل مسار الحفر (Mining Pathing):** اكتشاف الأنفاق المستقيمة الموجهة مباشرة إلى خامات الألماس والنذر رايت.
2. **نسبة الخامات النادرة:** مقارنة عدد البلوكات العادية (Stone/Deepslate) بالخامات النادرة.
3. **Player Risk Score:** حساب مؤشر المخاطرة من 0 إلى 100%.
4. **العقوبة التلقائية:** عند تجاوز نسبة الأدلة 90%، يطبق حظر مؤقت (30 يوماً مثلاً) إذا تم تفعيل الخيار.`;

    if (mode === "agent") {
      actions.push({
        id: `act_${Date.now()}_1`,
        tool: "run_builder_task",
        params: {
          agentType: "guardian",
          userPrompt: "راقب اللاعبين واكتشف مستخدمي X-Ray",
          title: "Guardian AI: Active X-Ray Sentinel"
        },
        summary: "تشغيل مهمة مراقبة X-Ray بواسطة Guardian AI",
        status: "requires_confirmation",
        requiresConfirmation: true
      });
    }
  }

  // 6. Inquire about Ping / Latency
  else if (p.includes("ping") || p.includes("لاغ") || p.includes("lag")) {
    reply = `### ⚡ قياس الاستجابة والـ Ping

- **الاستجابة الحالية (Ping):** ${ctx.latency}
- **حالة السيرفر:** ${ctx.serverOnline ? "🟢 متصل" : "🔴 غير متاح"}
- **التقييم:** ${ctx.serverOnline && parseInt(ctx.latency) < 100 ? "استجابة ممتازة وسلسة للعب." : "استجابة مقبولة مع مراقبة تقلبات الشبكة."}`;
  }

  // Default intelligent assistant response
  else {
    reply = `مرحباً بك! أنا **Server AI Assistant** المساعد الذكي الخاص بسيرفرك **${ctx.serverName}** (${ctx.host}:${ctx.port}).

أنا متصل مباشرة بـ **Bot Runtime** ومعلومات السيرفر الحالية. يمكنك سؤالي عن:
- 📊 **تشخيص المشكلات:** "لماذا انقطع البوت؟" أو "ما آخر الأخطاء التي حدثت؟"
- ⚙️ **التحكم والعمليات:** "أعد تشغيل البوت" أو "أرسل رسالة ترحيب للاعبين"
- 🛡️ **الأمان والمراقبة:** "كيف أحمي السيرفر من X-Ray؟"
- 🏗️ **البناء والأتمتة:** "ابنِ منطقة سباون" أو "أنشئ ترحيب تلقائي باللاعبين الجدد"

بماذا ترغب أن نبدأ؟`;
  }

  return { reply, thought, actions, source: "LOCAL_SERVER_AI" };
}

module.exports = {
  gatherServerContext,
  processChatMessage
};
