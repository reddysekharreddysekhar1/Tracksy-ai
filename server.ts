import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

const PRIMARY_MODEL = "gemini-4-hydrogen";
const FALLBACK_MODEL = "gemini-3.1-flash-lite";
const TRANSCRIBE_MODEL = "gemini-3.5-transcribe";

const VALID_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Travel",
  "Other",
] as const;

type ValidCategory = (typeof VALID_CATEGORIES)[number];

function normalizeCategory(raw?: string): ValidCategory {
  if (!raw) return "Other";
  const lower = raw.trim().toLowerCase();
  const exact = VALID_CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.includes("food") || lower.includes("dining") || lower.includes("cafe") || lower.includes("coffee") || lower.includes("grocery") || lower.includes("grocer") || lower.includes("restaurant")) return "Food";
  if (lower.includes("transport") || lower.includes("cab") || lower.includes("taxi") || lower.includes("uber") || lower.includes("ola") || lower.includes("fuel") || lower.includes("metro") || lower.includes("bus")) return "Transport";
  if (lower.includes("shop") || lower.includes("retail") || lower.includes("cloth") || lower.includes("mart") || lower.includes("amazon") || lower.includes("flipkart")) return "Shopping";
  if (lower.includes("bill") || lower.includes("utilit") || lower.includes("electric") || lower.includes("water") || lower.includes("wifi") || lower.includes("internet") || lower.includes("rent") || lower.includes("recharge")) return "Bills";
  if (lower.includes("entertain") || lower.includes("movie") || lower.includes("ott") || lower.includes("stream") || lower.includes("netflix") || lower.includes("spotify") || lower.includes("game")) return "Entertainment";
  if (lower.includes("health") || lower.includes("med") || lower.includes("pharm") || lower.includes("doctor") || lower.includes("clinic") || lower.includes("gym")) return "Health";
  if (lower.includes("travel") || lower.includes("flight") || lower.includes("hotel") || lower.includes("train") || lower.includes("trip")) return "Travel";
  return "Other";
}

function safeParseJson<T = any>(rawText?: string): T {
  const cleaned = (rawText || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned || "{}");
}

function formatGeminiError(error: any): { status: number; message: string } {
  const msg = String(error?.message || error || "AI request failed");
  const statusCode = Number(error?.status || error?.statusCode || 0);

  if (msg.includes("GEMINI_API_KEY is not configured")) {
    return {
      status: 503,
      message: "Gemini API key is not configured. Please check your key in Settings > Secrets.",
    };
  }
  if (
    statusCode === 403 ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API key not valid")
  ) {
    return {
      status: 403,
      message: "Gemini API key is invalid or lacks permission. Please verify your API key in Settings > Secrets.",
    };
  }
  if (statusCode === 429 || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
    return {
      status: 429,
      message: "Gemini API rate limit reached. Please wait a moment and try again, or check your quota in Settings > Secrets.",
    };
  }
  if (statusCode === 404 || msg.includes("NOT_FOUND")) {
    return {
      status: 502,
      message: "Requested Gemini model is currently unavailable. Please try again shortly.",
    };
  }
  return {
    status: statusCode >= 400 && statusCode < 600 ? statusCode : 500,
    message: msg,
  };
}

// Initialize Gemini Client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Calls primary Gemini model with automatic retry/fallback to secondary valid Gemini model
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: Record<string, any>;
    models?: string[];
  }
) {
  const models = params.models || [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: Record<string, any> = { ...(params.config || {}) };
        if (model === PRIMARY_MODEL && !config.thinkingConfig) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: Object.keys(config).length > 0 ? config : undefined,
        });
        const text = response.text?.trim();
        if (text) {
          return { text, model, response };
        }
        throw new Error(`Empty response from ${model}`);
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        console.warn(`[Gemini] ${model} attempt ${attempt + 1} failed:`, msg);

        // Don't retry auth/key errors
        if (
          msg.includes("API_KEY_INVALID") ||
          msg.includes("PERMISSION_DENIED") ||
          msg.includes("GEMINI_API_KEY is not configured")
        ) {
          throw err;
        }
        // Only retry transient errors once on the same model
        const isTransient =
          err?.status === 429 ||
          err?.status === 500 ||
          err?.status === 503 ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("fetch failed");
        if (!isTransient || attempt === 1) {
          break;
        }
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("All Gemini models failed to respond.");
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Download Backend Structure Zip
app.get("/api/download-backend-zip", (req, res) => {
  const zipPath = path.join(process.cwd(), "public", "tracksy-backend.zip");
  res.download(zipPath, "tracksy-backend-structure.zip", (err) => {
    if (err) {
      console.error("Download Zip Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download zip file." });
      }
    }
  });
});

// Google OAuth Login URL endpoint
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "OAUTH_CLIENT_ID is not configured in environment variables." });
  }
  const host = req.get("x-forwarded-host") || req.get("host");
  const protocol = req.get("x-forwarded-proto") || req.protocol;
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  const scope = "openid email profile";
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=select_account`;

  res.json({ url: authUrl });
});

// Google OAuth Callback endpoint
app.get("/api/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send("Authorization code missing.");
    }
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    const host = req.get("x-forwarded-host") || req.get("host");
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("OAuth token exchange failed:", tokenData);
      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; padding: 30px; text-align: center;">
            <h3 style="color: #e11d48;">Authentication Failed</h3>
            <p>${tokenData.error_description || "Could not retrieve access token."}</p>
            <script>
              setTimeout(() => { if (window.opener) window.close(); }, 3000);
            </script>
          </body>
        </html>
      `);
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const name = userData.name || userData.given_name || (userData.email ? userData.email.split("@")[0] : "Google User");
    const email = userData.email || "user@gmail.com";
    const avatarUrl = userData.picture || "";
    const handle = `@${email.split("@")[0]}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Authentication Successful</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center; max-width: 320px; }
            .spinner { border: 3px solid #e2e8f0; stroke: #4f46e5; border-top: 3px solid #4f46e5; border-radius: 50%; width: 28px; height: 28px; animation: spin 0.8s linear infinite; margin: 1rem auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #0f172a;">Connected as ${name}</h3>
            <p style="margin: 0; font-size: 0.85rem; color: #64748b;">Completing sign in to Tracksy...</p>
            <div class="spinner"></div>
          </div>
          <script>
            const userProfile = {
              name: ${JSON.stringify(name)},
              email: ${JSON.stringify(email)},
              avatarUrl: ${JSON.stringify(avatarUrl)},
              handle: ${JSON.stringify(handle)}
            };
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', userProfile }, '*');
              setTimeout(() => { window.close(); }, 600);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error: any) {
    console.error("Google OAuth Callback Error:", error);
    res.status(500).send("Authentication error: " + error.message);
  }
});

// AI Insights endpoint
app.post("/api/ai-insights", async (req, res) => {
  try {
    const { expenses = [], subscriptions = [], totalBudget = 10000 } = req.body || {};
    const ai = getGeminiClient();

    // Pre-compute accurate category totals to ground the AI analysis
    const categoryTotals: Record<string, number> = {};
    for (const s of subscriptions) {
      if (s?.active !== false) {
        const cat = s?.category || "Other";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(s?.amount) || 0);
      }
    }
    for (const e of expenses) {
      const cat = e?.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e?.amount) || 0);
    }
    const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    const prompt = `Analyze this user's monthly budget and expense data in Indian Rupees (₹):
Total Monthly Budget: ₹${Number(totalBudget)}
Total Combined Spend (Expenses + Active Subscriptions): ₹${grandTotal}
Budget Utilization: ${totalBudget > 0 ? ((grandTotal / totalBudget) * 100).toFixed(1) : 0}%
Pre-computed Category Totals: ${JSON.stringify(categoryTotals)}
Active Subscriptions: ${JSON.stringify(subscriptions.slice(0, 20))}
Recent Expenses: ${JSON.stringify(expenses.slice(0, 40))}

Return a JSON object with:
1. summary: A specific 2-3 sentence personalized financial analysis and spending prediction citing their actual ₹ figures and top merchants/categories.
2. topCategories: An array of top spending categories based strictly on the Pre-computed Category Totals (with name, amount, percentage, and icon emoji).
3. healthScore: An integer from 0 to 100 rating their financial health based on budget utilization and spending balance.
4. recommendations: An array of 3 concrete, actionable financial saving tips tailored to their actual expenses.`;

    const { text, model } = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            topCategories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  percentage: { type: Type.NUMBER },
                  icon: { type: Type.STRING },
                },
                required: ["name", "amount", "percentage", "icon"],
              },
            },
            healthScore: { type: Type.INTEGER },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["summary", "topCategories", "healthScore", "recommendations"],
        },
      },
    });

    const result = safeParseJson(text);
    res.json({ success: true, data: result, engine: model });
  } catch (error: any) {
    console.error("AI Insights Error:", error);
    const { status, message } = formatGeminiError(error);
    res.status(status).json({
      success: false,
      error: message,
    });
  }
});

// Scan Receipt Endpoint with Gemini Vision OCR
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ success: false, error: "Missing imageBase64 payload." });
    }

    // Detect actual MIME type from data URL if present (prevents MIME mismatches after canvas JPEG conversion)
    const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,/i);
    const resolvedMimeType = (dataUrlMatch?.[1] || mimeType || "image/jpeg").split(";")[0].trim();
    const cleanBase64 = imageBase64.replace(/^data:.*?;base64,/i, "").trim();

    if (!cleanBase64) {
      return res.status(400).json({ success: false, error: "Empty base64 image data." });
    }

    const ai = getGeminiClient();

    const { text, model } = await generateContentWithFallback(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: resolvedMimeType,
              data: cleanBase64,
            },
          },
          {
            text: `You are an expert OCR receipt parsing assistant. Carefully inspect this receipt, bill, or invoice image and extract:
1. merchant: The store, cafe, restaurant, or business name printed on the receipt.
2. amount: The final total payable / net payable / grand total amount as a positive number (do not include currency symbols).
3. category: Strictly one of: Food, Transport, Shopping, Bills, Entertainment, Health, Travel, Other.
4. note: A brief 1-sentence summary of the key items purchased or service billed.
5. date: The receipt date in YYYY-MM-DD format if visible, otherwise today's date (${new Date().toISOString().split("T")[0]}).`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            note: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ["merchant", "amount", "category"],
        },
      },
    });

    const parsed = safeParseJson(text);
    const normalized = {
      merchant: String(parsed?.merchant || "").trim() || "Scanned Receipt",
      amount: Number(parsed?.amount) || 0,
      category: normalizeCategory(parsed?.category),
      note: String(parsed?.note || "").trim(),
      date: String(parsed?.date || new Date().toISOString().split("T")[0]).trim(),
    };

    return res.json({
      success: true,
      data: normalized,
      engine: model,
    });
  } catch (error: any) {
    console.error("Scan Receipt Error:", error);
    const { status, message } = formatGeminiError(error);
    res.status(status).json({
      success: false,
      error: message,
    });
  }
});

// Helper to parse an expense transcript into structured JSON using Gemini
async function parseExpenseTranscript(ai: GoogleGenAI, transcript: string) {
  const { text, model } = await generateContentWithFallback(ai, {
    contents: `Parse the following spoken spending statement into structured expense fields:
"${transcript}"

Extract:
- amount: numeric amount spent (positive number in ₹, e.g. 450). If no amount is mentioned, return 0.
- category: strictly one of Food, Transport, Shopping, Bills, Entertainment, Health, Travel, Other.
- merchant: store, brand, restaurant, or service name mentioned (e.g. Starbucks, Uber, Netflix, DMart). Leave empty if not mentioned.
- note: a short clean description of what was bought or paid for.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          category: { type: Type.STRING },
          merchant: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ["amount", "category"],
      },
    },
  });

  const parsed = safeParseJson(text);
  return {
    data: {
      amount: Number(parsed?.amount) || 0,
      category: normalizeCategory(parsed?.category),
      merchant: String(parsed?.merchant || "").trim(),
      note: String(parsed?.note || "").trim(),
    },
    engine: model,
  };
}

// Helper to transcribe base64 audio via Gemini (gemini-3.5-transcribe with fallback to gemini-4-hydrogen)
async function transcribeAudioBase64(ai: GoogleGenAI, audioBase64: string, mimeType: string) {
  const dataUrlMatch = audioBase64.match(/^data:([^;]+);base64,/i);
  const resolvedMimeType = (dataUrlMatch?.[1] || mimeType || "audio/webm").split(";")[0].trim();
  const cleanBase64 = audioBase64.replace(/^data:.*?;base64,/i, "").trim();

  if (!cleanBase64) {
    throw new Error("Empty audio recording received.");
  }

  const audioPart = {
    inlineData: {
      mimeType: resolvedMimeType,
      data: cleanBase64,
    },
  };

  // Try dedicated audio transcription model first, then general multimodal fallback
  const modelsToTry = [TRANSCRIBE_MODEL, PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config =
        model === PRIMARY_MODEL
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : undefined;
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            audioPart,
            {
              text: "Transcribe the spoken words accurately into clean plain text. Return only the transcription with no extra commentary.",
            },
          ],
        },
        config,
      });
      const transcript = response.text?.trim();
      if (transcript) {
        return { transcript, model };
      }
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err);
      console.warn(`[Voice Transcribe] ${model} warning:`, msg);
      if (
        msg.includes("API_KEY_INVALID") ||
        msg.includes("PERMISSION_DENIED") ||
        msg.includes("GEMINI_API_KEY is not configured")
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Could not transcribe audio. Please speak clearly and try again.");
}

// Voice Text Parse Endpoint
app.post("/api/voice-parse", async (req, res) => {
  try {
    const { transcript } = req.body || {};
    if (!transcript || !String(transcript).trim()) {
      return res.status(400).json({ success: false, error: "Transcript is required." });
    }

    const ai = getGeminiClient();
    const { data, engine } = await parseExpenseTranscript(ai, String(transcript).trim());
    res.json({ success: true, data, transcript: String(transcript).trim(), engine });
  } catch (error: any) {
    console.error("Voice Parse Error:", error);
    const { status, message } = formatGeminiError(error);
    res.status(status).json({
      success: false,
      error: message,
    });
  }
});

// Voice Audio Transcription Endpoint (used by AI Chat Bot microphone input)
app.post("/api/voice-transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ success: false, error: "Audio data is required." });
    }

    const ai = getGeminiClient();
    const { transcript, model } = await transcribeAudioBase64(ai, audioBase64, mimeType);
    res.json({ success: true, transcript, engine: model });
  } catch (error: any) {
    console.error("Voice Transcribe Error:", error);
    const { status, message } = formatGeminiError(error);
    res.status(status).json({
      success: false,
      error: message,
    });
  }
});

// Voice Audio Expense Endpoint (transcribes audio + extracts structured expense fields)
app.post("/api/voice-expense", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ success: false, error: "Audio data is required." });
    }

    const ai = getGeminiClient();
    const { transcript, model: transcribeEngine } = await transcribeAudioBase64(
      ai,
      audioBase64,
      mimeType
    );
    const { data, engine: parseEngine } = await parseExpenseTranscript(ai, transcript);

    res.json({
      success: true,
      transcript,
      data,
      engine: `${transcribeEngine} + ${parseEngine}`,
    });
  } catch (error: any) {
    console.error("Voice Expense Error:", error);
    const { status, message } = formatGeminiError(error);
    res.status(status).json({
      success: false,
      error: message,
    });
  }
});

// AI Chat Bot Endpoint for AI Insights & Comprehensive Expense Analysis
app.post("/api/ai-chat", async (req, res) => {
  try {
    const { message, history = [], financialContext } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: "Message prompt is required." });
    }

    const budget: number = Number(financialContext?.overallBudget) || 10000;
    const spent: number = Number(financialContext?.grandTotal) || 0;
    const remaining: number = Math.max(0, budget - spent);
    const burnPercent: string = budget > 0 ? ((spent / budget) * 100).toFixed(1) : "0";

    const transactions: any[] = financialContext?.recentTransactions || financialContext?.transactions || [];
    const subscriptions: any[] = financialContext?.subscriptions || [];
    const categoryTotals: Record<string, number> = financialContext?.categoryTotals || {};

    // Compute key financial metrics
    const sortedByAmount = [...transactions].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    const highestTx = sortedByAmount.length > 0 ? sortedByAmount[0] : null;
    const lowestTx = sortedByAmount.length > 0 ? sortedByAmount[sortedByAmount.length - 1] : null;

    // Aggregate merchant totals
    const merchantMap: Record<string, { total: number; count: number; category: string }> = {};
    for (const tx of transactions) {
      const name = (tx.merchant || tx.title || "General Merchant").trim();
      if (!merchantMap[name]) {
        merchantMap[name] = { total: 0, count: 0, category: tx.category || "Other" };
      }
      merchantMap[name].total += Number(tx.amount) || 0;
      merchantMap[name].count += 1;
    }

    const topMerchants = Object.entries(merchantMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8);

    const categoryListText = Object.entries(categoryTotals)
      .map(([cat, amt]) => `• ${cat}: ₹${Number(amt).toLocaleString("en-IN")} (${spent > 0 ? ((amt / spent) * 100).toFixed(1) : 0}% of spend)`)
      .join("\n");

    const merchantListText = topMerchants
      .map(([name, data]) => `• ${name}: ₹${data.total.toLocaleString("en-IN")} (${data.count} transaction${data.count > 1 ? "s" : ""}, ${data.category})`)
      .join("\n");

    const subsListText = subscriptions
      .map((s: any) => `• ${s.name}: ₹${Number(s.amount).toLocaleString("en-IN")}/month (${s.category})`)
      .join("\n");

    const txListText = transactions
      .slice(0, 40)
      .map((t: any) => `• ${t.date || "Recent"}: ₹${Number(t.amount).toLocaleString("en-IN")} at ${t.merchant || t.title || "Unknown"} [${t.category}]${t.note ? ` - "${t.note}"` : ""}`)
      .join("\n");

    const activeSubsMonthly = subscriptions.reduce((acc: number, s: any) => acc + (Number(s.amount) || 0), 0);
    const activeSubsYearly = activeSubsMonthly * 12;

    const systemInstruction = `You are Tracksy AI, an expert, friendly, and highly analytical personal financial advisor.
Your role is to analyze the user's spending data and provide accurate, direct, and actionable answers to ANY question they ask about their expenses, budget, merchants, categories, or savings.

=== LIVE USER FINANCIAL DATA (100% ACCURATE REAL-TIME) ===
• Monthly Budget: ₹${budget.toLocaleString("en-IN")}
• Total Spent: ₹${spent.toLocaleString("en-IN")} (${burnPercent}% of budget)
• Remaining Balance: ₹${remaining.toLocaleString("en-IN")}
• Total Transactions Logged: ${transactions.length}
• Highest Expense: ${highestTx ? `₹${Number(highestTx.amount).toLocaleString("en-IN")} at ${highestTx.merchant || highestTx.title || "Unknown"} (${highestTx.category}, ${highestTx.date}${highestTx.note ? ` - ${highestTx.note}` : ""})` : "None logged"}
• Lowest Expense: ${lowestTx ? `₹${Number(lowestTx.amount).toLocaleString("en-IN")} at ${lowestTx.merchant || lowestTx.title || "Unknown"} (${lowestTx.category}, ${lowestTx.date})` : "None logged"}
• Active Subscriptions: ₹${activeSubsMonthly.toLocaleString("en-IN")}/month (₹${activeSubsYearly.toLocaleString("en-IN")}/year across ${subscriptions.length} services)

=== SPENDING BY CATEGORY ===
${categoryListText || "• No categorized expenses yet."}

=== TOP MERCHANTS & VENUES ===
${merchantListText || "• No merchant records yet."}

=== ACTIVE SUBSCRIPTIONS ===
${subsListText || "• No active subscriptions."}

=== DETAILED TRANSACTION LOG ===
${txListText || "• No transaction logs recorded yet."}

=== INSTRUCTIONS FOR ANSWERING ===
1. ANSWER DIRECTLY: Always address the specific question first with the exact figures from the data above before offering extra insights.
2. MERCHANT QUERIES: If the user asks about a specific merchant (e.g., "Starbucks", "Uber", "Swiggy", "Amazon"), check the transaction log, sum their total spent on that merchant, and cite the individual purchases and dates.
3. CATEGORY QUERIES: If asked about Food, Transport, Shopping, Bills, etc., state the exact category total, its proportion of overall spending, and the biggest items.
4. HIGHEST / LOWEST: Cite the exact merchant name, amount, category, and date.
5. AFFORDABILITY: If asked "Can I afford ₹X?" or "Can I buy X?", calculate the impact on their remaining ₹${remaining.toLocaleString("en-IN")} balance and advise whether it is financially safe.
6. SAVINGS & BUDGETING: Give concrete, customized tips based on where they spend the most.
7. FORMATTING: Use INR (₹) symbol. Keep responses concise, structured with bullet points and bold formatting for key numbers.`;

    // Sanitize multi-turn history so roles start with 'user' and strictly alternate
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
    for (const item of Array.isArray(history) ? history : []) {
      if (!item || typeof item.content !== "string" || !item.content.trim()) continue;
      const role: "user" | "model" = item.role === "user" ? "user" : "model";
      if (contents.length === 0 && role !== "user") continue;
      const prev = contents[contents.length - 1];
      if (prev && prev.role === role) {
        prev.parts[0].text += `\n${item.content.trim()}`;
      } else {
        contents.push({ role, parts: [{ text: item.content.trim() }] });
      }
    }

    const currentText = String(message).trim();
    const lastEntry = contents[contents.length - 1];
    if (lastEntry && lastEntry.role === "user") {
      lastEntry.parts[0].text += `\n${currentText}`;
    } else {
      contents.push({ role: "user", parts: [{ text: currentText }] });
    }

    const ai = getGeminiClient();
    const { text: botReply, model: usedEngine } = await generateContentWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      success: true,
      reply: botReply,
      engine: usedEngine,
    });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    const { status, message } = formatGeminiError(error);
    res.status(status).json({
      success: false,
      error: message,
    });
  }
});

async function startServer() {
  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tracksy Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
