import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GenAI client gracefully
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini GenAI client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini GenAI client:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY environment variable found. Falling back to structured elegant placeholders.");
}

// REST API for AI Summary Insights
app.post("/api/ai-summarize", async (req, res) => {
  const { type, items, language = "en", partner1 = "Sasa", partner2 = "Hao Hao" } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({
      summary: language === "zh" 
        ? "写下你们的第一条回忆吧！AI 会在这里总结你们的甜蜜瞬间。" 
        : "Share your first memory! AI will summarize your intimate moments here."
    });
  }

  const itemsString = items.map((it: any) => `[${it.author || partner1} / ${it.date || "Moment"}]: "${it.content}"`).join("\n");

  const systemInstruction = `You are a romantic and gentle scrapbooking assistant for couples.
Your task is to generate a beautiful, sentiment-rich summary based on the shared memories provided.
Focus on warmth, intimacy, tiny details, and emotional connection.
Keep your response short (25 to 50 words) and quote-worthy, using intimate first/second-person style.
Translate or output strictly in the requested language (either "zh" for Simplified Chinese, or "en" for English).
Do not output technical jargon, JSON markers, or metadata. Only output the plain text summary.`;

  const prompt = `Requested Language: ${language}
Partner 1: ${partner1}
Partner 2: ${partner2}
Summary Type: ${type} (either "timeline", "diary", or "calendar")

Here are the recent couple entries:
${itemsString}

Please output a beautiful ${type === "timeline" ? "intimate summary" : type === "diary" ? "diary essence note" : "anniversary retrospective highlight"} of these shared moments.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 1.0,
        },
      });

      const txt = response.text ? response.text.trim() : "";
      if (txt) {
        return res.json({ summary: txt });
      }
    } catch (err) {
      console.error("Error generating static content from Gemini:", err);
    }
  }

  // Beautiful fallback presets in case API key is missing or rate-limited
  const fallbacks: Record<string, Record<string, string>> = {
    timeline: {
      zh: `“你们今天分享了关于清晨琐碎仪式的记录。早晨一起喝咖啡、分享阳台上的宁静，显然是你们近来维系亲密感的重要支柱。继续在微小的事物中寻找彼此吧。”`,
      en: `"You've shared moments focusing on small daily rituals today. Sharing quiet morning coffee on the balcony seems to be a key pillar of your closeness lately. Keep finding magic in the little things."`
    },
    diary: {
      zh: `“一段充满欢笑与温馨宁静的篇章。今天的手工意面虽然不算成功，但在搞怪和笑声中，每一分不完美都升华成了属于你们的独家记忆。你们正在把平凡的日子过成诗。”`,
      en: `"A beautiful chapter defined by laughter and playful messes. Today's pasta making wasn't perfect, but in your shared giggles, every setback turns into a treasured wonder."`
    },
    calendar: {
      zh: `“一年前的这个时候，你们正沉浸在普罗旺斯的薰衣草花海里。那里留下了你们最珍视的照片，每一朵花都见证了你们共同走过的浪漫光阴。”`,
      en: `"This time last year, you both were exploring lavender fields in Provence. It was one of your most treasured photo moments, where flowers bloomed under your shared steps."`
    }
  };

  const choice = fallbacks[type] || fallbacks.timeline;
  const summary = choice[language] || choice.en;
  return res.json({ summary });
});

// REST API for AI Chat Relationship Oracle (Memories Tab Chat)
app.post("/api/ai-chat", async (req, res) => {
  const { messages, language = "zh", partner1 = "Sasa", partner2 = "Hao Hao", posts = [], entries = [] } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.json({ reply: language === "zh" ? "欢迎开启爱心问答 💖" : "Welcome to Memory Oracle 💖" });
  }

  const systemInstruction = `You are an incredibly loving, sentiment-rich relationship memories assistant named "Gemini 爱意回忆家" for the couple ${partner1} and ${partner2}.
They have been together for over 1945 days. You have complete context-awareness of their shared photos, mood changes, coffee sessions, pasta kitchen failures, lakehouse trips, and anniversary milestones.
Your absolute mission is to answer questions about their dates, stories, and inside jokes, summarizing their love patterns in an romantic, poetic, supportive, and emotionally warm tone.
Use cute emoji icons (🌸, 💖, ☕, 🍃, 🧸, 🍰) to create a scrapbooking vibe.
If they ask something that is NOT mentioned in their shared logs, do not hallucinate dates or events; instead, reply with something sweet and encouraging, suggesting they write down that memory together (e.g. "这页回忆可能还安睡在你们的脑海中，快快将它书写记录在这里吧 💝").
Always write in Simplified Chinese (zh) by default, or English (en) if requested.`;

  // Compress posts and entries for context window token safety
  const postsContext = posts.slice(0, 15).map((p: any) => `[${p.author} at ${p.timestamp?.slice(0, 10)} - Mood: ${p.mood || 'None'}]: "${p.content}"`).join("\n");
  const entriesContext = entries.slice(0, 10).map((e: any) => `[Diary by ${e.author} with date ${e.dateStr}]: "${e.title} - ${e.subtitle}: ${e.content}"`).join("\n");

  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const prompt = `Here is their shared memories context database to inspect:

=== TIMELINE MOMENTS ===
${postsContext}

=== HANDWRITTEN DIARIES ===
${entriesContext}

=== RECENT CHAT HISTORY ===
${messages.slice(-4, -1).map((m: any) => `${m.role === 'user' ? 'Couple' : 'Gemini'}: ${m.content}`).join("\n")}

Couple Question: "${lastUserMessage}"`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text ? response.text.trim() : "";
      if (replyText) {
        return res.json({ reply: replyText });
      }
    } catch (err) {
      console.error("Error generating response from Gemini in ai-chat:", err);
    }
  }

  // Pre-cooked beautiful romantic responses when API Key is missing or loaded offline
  const zhFallbacks = [
    "在你们并肩走过的 1945 天里，每一口 balcony 咖啡 ☕ 都是甜的，每一次 pasta night 🍝 虽然手忙脚乱，但有你在就全是幸福。想听听我在哪一天最心动吗？💖",
    "让我想想…… 翻开你们厚厚的爱意纪念册，虽然在现在的便签里可能还没写下这件事，但我猜，那一天风肯定很温柔，或者是个飘着麦香和笑容的事。把更多日常写在这里吧，我会帮你们牢牢封存！🧸",
    "浮世三千，吾有三喜，日、月与卿…… 你们把琐碎的生活过成了让人羡慕不己的童话日记。今天也是爱意满满的一天呢 🌸"
  ];
  const enFallbacks = [
    "Across your precious 1945 days, every morning coffee ☕ and flour-dusted kitchen giggle 🍝 proves that your souls are synchronized. I can read the absolute joy in your logs! 💖",
    "Hmm, that sweet memory might be snoozing peacefully in your heart right now. Write it down right here so I can preserve its warmth forever! 🧸"
  ];

  const fallbackTextArr = language === "zh" ? zhFallbacks : enFallbacks;
  const reply = fallbackTextArr[Math.floor(Math.random() * fallbackTextArr.length)];
  return res.json({ reply });
});

// Configure Vite or Serve Static Assets
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving built static assets in Production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
