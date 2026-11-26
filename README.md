# GovTapp — AI Government Tender Discovery & Intelligence Platform

GovTapp is an automated procurement intelligence platform that scrapes, classifies, and vectorizes government tenders in real time, delivering personalized feeds, sub-100ms semantic vector search, and live token-streamed AI summaries for contractors and MSMEs.

**Live Application:** [https://gov-tapp.vercel.app](https://gov-tapp.vercel.app)

---

## Key Engineering Highlights

### 1. Semantic Vector Search (`pgvector` + Gemini)
* **High-Dimensional Embeddings:** Ingests tender metadata and generates 768-dimensional semantic embeddings using Google's `gemini-embedding-001` via `@google/genai` with Matryoshka Representation Learning (MRL).
* **Cosine Distance Scoring:** Uses PostgreSQL’s native `<=>` cosine distance operator via raw SQL to rank tenders by meaning rather than rigid keyword matching.
* **Instant Discovery:** Searching for *"hospital supplies"* accurately surfaces diagnostic immuno-analyzers and pharmaceutical tenders without keyword matches in the title.

### 2. Real-Time LLM Token Streaming (Server-Sent Events)
* **Low-Latency Inference:** Powered by `gemini-3.5-flash-lite`, generating structured 3-bullet procurement breakdowns (Scope, Criteria, Urgency) in ~1.4 seconds.
* **Unidirectional Streaming:** Uses standard HTTP Server-Sent Events (`text/event-stream`) streamed at 60 FPS directly into native browser `ReadableStream` and `TextDecoder` readers with a typing cursor animation.
* **Cache-Aside Persistence:** Persists generated summaries into Neon PostgreSQL on first request. Subsequent queries cost $0 and respond in 0ms.

### 3. Resilient Ingestion & Automated Web Scraping
* **Multi-Portal Crawler:** Scrapes real-time tenders across national portals (`eprocure.gov.in`, `epublish.gov.in`) using Cheerio and Axios.
* **Proxy Routing & Anti-Bot Protection:** Integrates ScraperAPI with Indian residential proxy rotation (`country_code=in`) to bypass geo-restrictions and challenge pages.
* **Pipeline Vectorization:** Automatically computes vector embeddings during ingestion so newly published tenders are searchable within milliseconds of scraping.

### 4. High-Performance Caching & Architecture
* **Upstash Redis Caching:** Caches personalized category feeds with 300s TTLs, reducing database load and speeding up dashboard loads.
* **Relational Integrity:** Implements compound unique keys (`@@unique([userId, tenderId])`) and database indexes for instant watchlist bookmarking.
* **Automated Alerting:** Dispatches real-time email notifications (Brevo) to registered contractors when matching category tenders are scraped.

---

## System Architecture

```text
       [ Government Portals ] (eprocure.gov.in)
                 │
                 ▼
     [ Cheerio / Axios Scraper ]  ◄── (ScraperAPI Indian IP Proxy)
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
[ Gemini Embeddings ]  [ Neon PostgreSQL ]
 (768D Vector MRL)        │ (pgvector <=> Cosine Search)
      │                   │
      └──────────┬────────┘
                 ▼
        [ Express.js REST API ] ◄── [ Upstash Redis (Feed Cache) ]
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
 [ SSE AI Stream ]   [ Debounced Vector Search ]
      │                     │
      └──────────┬──────────┘
                 ▼
       [ React 19 Frontend ] (Vercel / Tailwind CSS)
```

---

## Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS, React Router, Native Web Streams (`ReadableStreamDefaultReader`, `TextDecoder`)
* **Backend:** Node.js, Express.js, Server-Sent Events (SSE), JWT Authentication
* **Database & AI:** Neon Serverless PostgreSQL, `pgvector`, Prisma ORM, Google Gemini (`@google/genai`)
* **Caching & Automation:** Upstash Redis, Node-Cron, Cheerio, Axios, ScraperAPI
* **Deployment:** Vercel (Client), Render (Server), Neon (Database)

---

## Getting Started Locally

### Prerequisites
* Node.js v22 or higher
* PostgreSQL database with `pgvector` enabled (or a free Neon account)
* Google Gemini API Key from Google AI Studio

### 1. Clone the repository
```bash
git clone https://github.com/nikhilkumarkushwaha/GovTapp.git
cd GovTapp
```

### 2. Backend Setup
```bash
cd server
npm install

# Configure environment variables (.env)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
GEMINI_API_KEY="your-gemini-api-key"
JWT_SECRET="your-jwt-secret"
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Synchronize database schema and generate Prisma client
npx prisma generate
npx prisma db push

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```

### 4. (Optional) Run Scraper or Backfill Vectors
```bash
cd ../server
# Run tender crawler
npm run scrape

# Backfill vector embeddings for all existing tenders
node scripts/backfill-embeddings.js
```

---

## License
This project is licensed under the ISC License.
