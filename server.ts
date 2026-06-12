import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { neon } from "@neondatabase/serverless";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.use(express.json({ limit: "50mb" }));

// âââ Cloudinary âââââââââââââââââââââââââââââââââââââââââââââââââââ
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: upload buffer to Cloudinary
async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  const isVideo = mimetype.startsWith("video/");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? "video" : "image",
        folder: "couple-app",
        transformation: isVideo ? undefined : [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) reject(error || new Error("Upload failed"));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// âââ Neon Database ââââââââââââââââââââââââââââââââââââââââââââââââ
let sql: ReturnType<typeof neon> | null = null;

async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.warn("No DATABASE_URL set â data will not persist to Neon.");
    return;
  }
  try {
    sql = neon(process.env.DATABASE_URL);
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log("Neon DB connected and tables ready.");
  } catch (err) {
    console.error("Failed to init Neon DB:", err);
    sql = null;
  }
}

// âââ Media Upload âââââââââââââââââââââââââââââââââââââââââââââââââ
// Use memory storage so we can stream to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

app.post("/api/upload-media", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });

  // If Cloudinary is configured, upload there
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const url = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      return res.json({ url });
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      // Fall through to base64 fallback
    }
  }

  // Fallback: return base64 data URL (works offline / without Cloudinary config)
  const mime = req.file.mimetype;
  const b64 = req.file.buffer.toString("base64");
  const dataUrl = `data:${mime};base64,${b64}`;
  res.json({ url: dataUrl });
});

// âââ Data CRUD endpoints ââââââââââââââââââââââââââââââââââââââââââ

// GET /api/posts
app.get("/api/posts", async (_req, res) => {
  if (!sql) return res.json([]);
  try {
    const rows = (await sql`SELECT data FROM posts ORDER BY (data->>'timestamp') ASC`) as any[];
    res.json(rows.map((r: any) => r.data));
  } catch (err) {
    console.error("GET /api/posts error:", err);
    res.json([]);
  }
});

// PUT /api/posts â replaces all posts
app.put("/api/posts", async (req, res) => {
  if (!sql) return res.json({ ok: true, persisted: false });
  const { posts } = req.body as { posts: any[] };
  if (!Array.isArray(posts)) return res.status(400).json({ error: "posts must be array" });
  try {

    await sql`DELETE FROM posts`;
    for (const p of posts) {
      const id = String(p.id);
      const data = JSON.stringify(p);
      await sql`INSERT INTO posts (id, data) VALUES (${id}, ${data}::jsonb)`;
    }
    }
    res.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("PUT /api/posts error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/events
app.get("/api/events", async (_req, res) => {
  if (!sql) return res.json([]);
  try {
    const rows = (await sql`SELECT data FROM events ORDER BY updated_at ASC`) as any[];
    res.json(rows.map((r: any) => r.data));
  } catch (err) {
    console.error("GET /api/events error:", err);
    res.json([]);
  }
});

// PUT /api/events â replaces all events
app.put("/api/events", async (req, res) => {
  if (!sql) return res.json({ ok: true, persisted: false });
  const { events } = req.body as { events: any[] };
  if (!Array.isArray(events)) return res.status(400).json({ error: "events must be array" });
  try {

    await sql`DELETE FROM events`;
    for (const e of events) {
      const id = String(e.id);
      const data = JSON.stringify(e);
      await sql`INSERT INTO events (id, data) VALUES (${id}, ${data}::jsonb)`;
    }
    }
    res.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("PUT /api/events error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/diary
app.get("/api/diary", async (_req, res) => {
  if (!sql) return res.json([]);
  try {
    const rows = (await sql`SELECT data FROM diary_entries ORDER BY (data->>'timestamp') ASC`) as any[];
    res.json(rows.map((r: any) => r.data));
  } catch (err) {
    console.error("GET /api/diary error:", err);
    res.json([]);
  }
});

// PUT /api/diary â replaces all diary entries
app.put("/api/diary", async (req, res) => {
  if (!sql) return res.json({ ok: true, persisted: false });
  const { entries } = req.body as { entries: any[] };
  if (!Array.isArray(entries)) return res.status(400).json({ error: "entries must be array" });
  try {

    await sql`DELETE FROM diary_entries`;
    for (const e of entries) {
      const id = String(e.id);
      const data = JSON.stringify(e);
      await sql`INSERT INTO diary_entries (id, data) VALUES (${id}, ${data}::jsonb)`;
    }
    }
    res.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("PUT /api/diary error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/profile
app.get("/api/profile", async (_req, res) => {
  if (!sql) return res.json(null);
  try {
    const rows = (await sql`SELECT value FROM app_config WHERE key = 'profile'`) as any[];
    res.json(rows.length > 0 ? rows[0].value : null);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    res.json(null);
  }
});

// PUT /api/profile
app.put("/api/profile", async (req, res) => {
  if (!sql) return res.json({ ok: true, persisted: false });
  const profile = req.body;
  try {
    await sql`
      INSERT INTO app_config (key, value) VALUES ('profile', ${JSON.stringify(profile)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(profile)}::jsonb, updated_at = NOW()
    `;
    res.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// âââ Gemini AI ââââââââââââââââââââââââââââââââââââââââââââââââââââ
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
    console.log("Gemini GenAI client initialized.");
  } catch (error) {
    console.error("Failed to initialize Gemini GenAI client:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY â AI will use fallback responses.");
}

// REST API for AI Summary Insights
app.post("/api/ai-summarize", async (req, res) => {
  const { type, items, language = "en", partner1 = "Sasa", partner2 = "Hao Hao", events: evts = [] } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({
      summary:
        language === "zh"
          ? "åä¸ä½ ä»¬çç¬¬ä¸æ¡åå¿å§ï¼AI ä¼å¨è¿éæ»ç»ä½ ä»¬ççèç¬é´ã"
          : "Share your first memory! AI will summarize your intimate moments here.",
    });
  }

  const itemsString = items
    .map((it: any) => `[${it.author || partner1} / ${it.date || "Moment"}]: "${it.content}"`)
    .join("\n");

  const eventsString =
    evts.length > 0
      ? "\n=== ANNIVERSARY / EVENT DATA ===\n" +
        evts
          .map(
            (ev: any) =>
              `[${ev.eventType} on ${ev.date}]: "${ev.title}" â ${ev.description || ""}${ev.location ? ` @ ${ev.location}` : ""}`
          )
          .join("\n")
      : "";

  const systemInstruction = `You are a romantic and gentle scrapbooking assistant for couples.
Your task is to generate a beautiful, sentiment-rich summary based on the shared memories provided.
Focus on warmth, intimacy, tiny details, and emotional connection.
Keep your response short (25 to 50 words) and quote-worthy, using intimate first/second-person style.
Translate or output strictly in the requested language (either "zh" for Simplified Chinese, or "en" for English).
Do not output technical jargon, JSON markers, or metadata. Only output the plain text summary.`;

  const prompt = `Requested Language: ${language}
Partner 1: ${partner1}
Partner 2: ${partner2}
Summary Type: ${type}
${eventsString}

Here are the recent couple entries:
${itemsString}

Please output a beautiful ${type === "timeline" ? "intimate summary" : type === "diary" ? "diary essence note" : "anniversary retrospective highlight"} of these shared moments.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { systemInstruction, temperature: 1.0 },
      });
      const txt = response.text ? response.text.trim() : "";
      if (txt) return res.json({ summary: txt });
    } catch (err) {
      console.error("Gemini ai-summarize error:", err);
    }
  }

  const fallbacks: Record<string, Record<string, string>> = {
    timeline: {
      zh: `"ä½ ä»¬ä»å¤©åäº«äºå³äºæ¸æ¨çç¢ä»ªå¼çè®°å½ãæ©æ¨ä¸èµ·ååå¡ãåäº«é³å°ä¸çå®éï¼æ¾ç¶æ¯ä½ ä»¬è¿æ¥ç»´ç³»äº²å¯æçéè¦æ¯æ±ãç»§ç»­å¨å¾®å°çäºç©ä¸­å¯»æ¾å½¼æ­¤å§ã"`,
      en: `"You've shared moments focusing on small daily rituals today. Keep finding magic in the little things."`,
    },
    diary: {
      zh: `"ä¸æ®µåæ»¡æ¬¢ç¬ä¸æ¸©é¦¨å®éçç¯ç« ãä½ ä»¬æ­£å¨æå¹³å¡çæ¥å­è¿æè¯ã"`,
      en: `"A beautiful chapter defined by laughter and playful messes. Every setback turns into a treasured wonder."`,
    },
    calendar: {
      zh: `"æ¯ä¸ä¸ªèªä¹æ¥ï¼é½è½½çä½ ä»¬çæ¬¢ç¬ãé£äºçè´µççºªå¿µæ¥ï¼è§è¯äºä½ ä»¬å±åèµ°è¿çæµªæ¼«åé´ã"`,
      en: `"Each anniversary day carries your shared laughter and precious memories through the years."`,
    },
  };

  const choice = fallbacks[type] || fallbacks.timeline;
  return res.json({ summary: choice[language] || choice.en });
});

// REST API for AI Chat
app.post("/api/ai-chat", async (req, res) => {
  const {
    messages,
    language = "zh",
    partner1 = "Sasa",
    partner2 = "Hao Hao",
    posts = [],
    entries = [],
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.json({
      reply: language === "zh" ? "æ¬¢è¿å¼å¯ç±å¿é®ç­ ð" : "Welcome to Memory Oracle ð",
    });
  }

  const systemInstruction = `You are an incredibly loving, sentiment-rich relationship memories assistant named "Gemini ç±æåå¿å®¶" for the couple ${partner1} and ${partner2}.
They have been together for over 1945 days. You have complete context-awareness of their shared photos, mood changes, coffee sessions, pasta kitchen failures, lakehouse trips, and anniversary milestones.
Your absolute mission is to answer questions about their dates, stories, and inside jokes, summarizing their love patterns in a romantic, poetic, supportive, and emotionally warm tone.
Use cute emoji icons (ð¸, ð, â, ð, ð§¸, ð°) to create a scrapbooking vibe.
If they ask something that is NOT mentioned in their shared logs, do not hallucinate dates or events; instead, reply with something sweet and encouraging.
Always write in Simplified Chinese (zh) by default, or English (en) if requested.`;

  const postsContext = posts
    .slice(0, 15)
    .map(
      (p: any) =>
        `[${p.author} at ${p.timestamp?.slice(0, 10)} - Mood: ${p.mood || "None"}]: "${p.content}"`
    )
    .join("\n");
  const entriesContext = entries
    .slice(0, 10)
    .map(
      (e: any) =>
        `[Diary by ${e.author} with date ${e.dateStr}]: "${e.title} - ${e.subtitle}: ${e.content}"`
    )
    .join("\n");

  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const prompt = `=== TIMELINE MOMENTS ===
${postsContext}

=== HANDWRITTEN DIARIES ===
${entriesContext}

=== RECENT CHAT HISTORY ===
${messages
  .slice(-4, -1)
  .map((m: any) => `${m.role === "user" ? "Couple" : "Gemini"}: ${m.content}`)
  .join("\n")}

Couple Question: "${lastUserMessage}"`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { systemInstruction, temperature: 0.7 },
      });
      const replyText = response.text ? response.text.trim() : "";
      if (replyText) return res.json({ reply: replyText });
    } catch (err) {
      console.error("Gemini ai-chat error:", err);
    }
  }

  const zhFallbacks = [
    "å¨ä½ ä»¬å¹¶è©èµ°è¿ç 1945 å¤©éï¼æ¯ä¸å£ balcony åå¡ â é½æ¯ççï¼æ¯ä¸æ¬¡ pasta night ð è½ç¶æå¿èä¹±ï¼ä½æä½ å¨å°±å¨æ¯å¹¸ç¦ãð",
    "æµ®ä¸ä¸åï¼å¾æä¸åï¼æ¥ãæä¸å¿â¦â¦ ä½ ä»¬æçç¢ççæ´»è¿æäºè®©äººç¾¡æä¸å·±çç«¥è¯æ¥è®°ãä»å¤©ä¹æ¯ç±ææ»¡æ»¡çä¸å¤©å¢ ð¸",
  ];
  const enFallbacks = [
    "Across your precious 1945 days, every morning coffee â and shared giggle proves that your souls are synchronized. ð",
  ];
  const fallbackArr = language === "zh" ? zhFallbacks : enFallbacks;
  const reply = fallbackArr[Math.floor(Math.random() * fallbackArr.length)];
  return res.json({ reply });
});

// âââ Start server âââââââââââââââââââââââââââââââââââââââââââââââââ
async function start() {
  await initDB();

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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving built static assets in Production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
