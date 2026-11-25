# Tracksy - Smart Expense Tracker Backend Architecture 🚀

A production-ready, modular Express + TypeScript backend powering **Tracksy (Smart Expense Tracker)**, featuring Google Gemini 3.8 Flash Vision OCR for receipt auto-scanning, voice expense parsing, AI financial advisory, and Google OAuth.

---

## 📁 Directory Structure

```text
tracksy-backend/
├── .env.example                     # Environment template
├── package.json                     # Node dependencies & npm scripts
├── tsconfig.json                    # Modern TypeScript configuration
├── README.md                        # Documentation & setup guide
├── tracksy-api.postman_collection.json # Postman API collection
└── src/
    ├── app.ts                       # Express application bootstrap & middleware
    ├── server.ts                    # Server listener entry point
    ├── config/
    │   └── env.ts                   # Centralized type-safe environment configuration
    ├── controllers/
    │   ├── ai.controller.ts         # AI Insights & chat controllers
    │   ├── auth.controller.ts       # OAuth URL & callback handlers
    │   ├── expense.controller.ts    # CRUD operations for expenses
    │   ├── ocr.controller.ts        # Multimodal Gemini receipt OCR handler
    │   └── voice.controller.ts      # Voice speech-to-expense transcript parser
    ├── middlewares/
    │   └── errorHandler.ts          # Centralized error handler
    ├── routes/
    │   ├── index.ts                 # Master API router (/api/...)
    │   ├── ai.routes.ts             # AI chat & insights routes
    │   ├── auth.routes.ts           # Google OAuth routes
    │   ├── expense.routes.ts        # Expense routes
    │   ├── ocr.routes.ts            # OCR scanner routes
    │   └── voice.routes.ts          # Spoken voice expense routes
    ├── services/
    │   └── gemini.service.ts        # @google/genai SDK integration with fallback
    └── types/
        └── index.ts                 # Shared TypeScript interfaces & types
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** or **bun**
- **Google Gemini API Key**: [Get one free from Google AI Studio](https://aistudio.google.com/)

### 2. Installation
```bash
cd tracksy-backend
npm install
```

### 3. Environment Setup
Create a `.env` file in the root of `tracksy-backend`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Running Locally
```bash
# Start in hot-reload development mode
npm run dev

# Compile TypeScript to JavaScript in /dist
npm run build

# Start production build
npm start
```

The server will start at `http://localhost:5000`.

---

## 📡 REST API Documentation

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "ok",
  "service": "Tracksy Backend API",
  "uptime": 24.3,
  "timestamp": "2026-09-18T10:00:00.000Z"
}
```

---

### 2. Scan Receipt OCR (Multimodal AI)
- **Endpoint**: `POST /api/scan-receipt` or `POST /api/ocr/scan`
- **Headers**: `Content-Type: application/json`
- **Payload**:
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg",
  "fileName": "starbucks_bill.jpg"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "merchant": "Starbucks Coffee",
    "amount": 546.0,
    "category": "Food",
    "note": "Caramel Macchiato and Blueberry Muffin",
    "date": "2026-09-18"
  },
  "engine": "gemini-ai-ocr"
}
```

---

### 3. Voice Expense Parser
- **Endpoint**: `POST /api/voice-parse` or `POST /api/voice/parse`
- **Payload**:
```json
{
  "transcript": "I spent 350 rupees on cab ride with Uber to office"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "amount": 350,
    "category": "Transport",
    "merchant": "Uber",
    "note": "Cab ride to office"
  }
}
```

---

### 4. AI Financial Insights
- **Endpoint**: `POST /api/ai-insights` or `POST /api/ai/insights`
- **Payload**:
```json
{
  "totalBudget": 25000,
  "expenses": [
    { "category": "Food", "amount": 4500, "merchant": "Swiggy" },
    { "category": "Transport", "amount": 1200, "merchant": "Metro" }
  ],
  "subscriptions": [
    { "name": "Netflix", "amount": 649 }
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "insights": {
    "healthScore": 82,
    "healthStatus": "Good",
    "topRecommendations": [
      "Keep dining deliveries under ₹1000/week",
      "Consolidate unused media streaming subs"
    ],
    "savingsOpportunities": ["Groceries bulk buying", "Carpooling"],
    "summary": "You are pacing well under the ₹25,000 budget with 74% funds intact."
  }
}
```

---

### 5. AI Advisor Chat
- **Endpoint**: `POST /api/ai-chat` or `POST /api/ai/chat`
- **Payload**:
```json
{
  "message": "Can I afford buying a new mechanical keyboard for 4500?",
  "financialContext": {
    "overallBudget": 20000,
    "grandTotal": 9800
  }
}
```

---

### 6. Expenses CRUD
- `GET /api/expenses` - Fetch list of expenses
- `POST /api/expenses` - Create a new expense record

---

## 🚢 Production Deployment

### Option 1: Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Option 2: Render / Railway / Google Cloud Run
Set build command to:
```bash
npm run build
```
Set start command to:
```bash
npm start
```
Environment Variables to supply in platform settings:
`PORT`, `GEMINI_API_KEY`, `CORS_ORIGIN`.

---

## 🔒 Security & Best Practices
- Keep your `GEMINI_API_KEY` strictly on the backend.
- Rate limiting can be attached via `express-rate-limit`.
- Use a dedicated database like PostgreSQL (with Drizzle ORM/Prisma) or Google Cloud Firestore for persistent multi-user records.
