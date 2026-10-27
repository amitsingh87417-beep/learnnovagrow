import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
app.use(express.json({ limit: "30kb" }));
app.use(express.static(__dirname));


const rateWindowMs = 60_000;
const maxRequestsPerWindow = 12;
const buckets = new Map();

app.use("/api/", (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start > rateWindowMs) {
    bucket = { start: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count++;
  if (bucket.count > maxRequestsPerWindow) {
    return res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

function cleanText(value, fallback, max = 500) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim().slice(0, max);
  return cleaned || fallback;
}
function boundedInt(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("AI is not configured yet. Add OPENAI_API_KEY in Render Environment settings.");
    error.status = 503;
    throw error;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
async function generateText(instructions, input, maxOutputTokens = 1800) {
  const client = getClient();
  const response = await client.responses.create({
    model: MODEL,
    instructions,
    input,
    max_output_tokens: maxOutputTokens
  });
  return response.output_text || "";
}

app.post("/api/assistant", async (req, res) => {
  try {
    const question = cleanText(req.body?.question, "", 1200);
    const subject = cleanText(req.body?.subject, "General studies", 80);
    if (!question) return res.status(400).json({ error: "Enter a question first." });
    const answer = await generateText(
      "You are LearnNovaGrow, a friendly educational tutor for school and competitive-exam learners. Explain clearly in simple language, show steps when useful, avoid inventing facts, and encourage learning. Do not claim to be an official exam authority.",
      `Subject: ${subject}\nStudent question: ${question}`,
      1200
    );
    res.json({ answer });
  } catch (e) {
    console.error("assistant error:", e.message);
    res.status(e.status || 500).json({ error: e.status ? e.message : "AI request failed. Please try again later." });
  }
});

app.post("/api/generate-quiz", async (req, res) => {
  try {
    const topic = cleanText(req.body?.topic, "", 180);
    const exam = cleanText(req.body?.exam, "General practice", 80);
    const subject = cleanText(req.body?.subject, "General knowledge", 80);
    const count = boundedInt(req.body?.count, 10, 3, 25);
    if (!topic) return res.status(400).json({ error: "Enter a topic for the quiz." });
    const raw = await generateText(
      `Create original educational multiple-choice questions. Return ONLY valid JSON, no markdown, with shape {"title":string,"questions":[{"question":string,"options":[string,string,string,string],"answerIndex":0,"explanation":string}]}. Each answerIndex must be 0-3. Questions must be appropriate for teens, accurate, and not copied from copyrighted exam papers. If uncertain about a fact, choose a safer general question.`,
      `Create ${count} questions. Exam/level: ${exam}. Subject: ${subject}. Topic: ${topic}. Use four plausible options and a short explanation for every answer.`,
      3500
    );
    let data;
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      data = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: "The AI returned an unreadable quiz. Please try again." });
    }
    if (!Array.isArray(data.questions)) return res.status(502).json({ error: "Quiz format was incomplete. Please try again." });
    data.questions = data.questions.slice(0, count).filter(q =>
      typeof q.question === "string" &&
      Array.isArray(q.options) && q.options.length === 4 &&
      Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex <= 3
    );
    if (!data.questions.length) return res.status(502).json({ error: "No valid questions were generated. Please try again." });
    res.json(data);
  } catch (e) {
    console.error("quiz error:", e.message);
    res.status(e.status || 500).json({ error: e.status ? e.message : "Quiz generation failed. Please try again later." });
  }
});

app.post("/api/study-plan", async (req, res) => {
  try {
    const exam = cleanText(req.body?.exam, "General studies", 100);
    const hours = boundedInt(req.body?.hoursPerDay, 2, 1, 12);
    const days = boundedInt(req.body?.days, 7, 1, 30);
    const subjects = cleanText(req.body?.subjects, "Maths, reasoning, English and general knowledge", 500);
    const plan = await generateText(
      "You are a practical study planner. Create a realistic, balanced plan with breaks, revision and practice. Do not promise exam success. Format with clear headings and bullet points.",
      `Create a ${days}-day study plan for ${exam}. Available study time: ${hours} hours/day. Subjects/topics: ${subjects}.`,
      1800
    );
    res.json({ plan });
  } catch (e) {
    console.error("plan error:", e.message);
    res.status(e.status || 500).json({ error: e.status ? e.message : "Plan generation failed. Please try again later." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`LearnNovaGrow running on port ${PORT}`));
