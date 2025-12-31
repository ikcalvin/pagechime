# Project: PageChime (Scalable Edition)

## 1. Context & Goal

We are building **PageChime**, a high-performance "Read-it-Later" audio app designed to scale to millions of users.
**Core Functionality:** Users save article URLs. The system asynchronously scrapes text, converts it to audio, and makes it available for offline listening.
**Key Architecture:** We are decoupling the heavy processing (Scraping/TTS) from the API using **Inngest** to ensure reliability and scalability.

## 2. Technical Stack (Strict)

- **Frontend (Web):** Next.js 14+ (App Router), Tailwind CSS, Shadcn/UI.
- **Frontend (Mobile):** React Native (Expo SDK 50+).
- **Backend API:** Node.js + **Express.js**.
- **Background Jobs:** **Inngest** (Serverless Queues & Workflows).
- **Database:** Supabase (PostgreSQL).
  - **Note:** RLS (Row Level Security) is **DISABLED**. All data access is managed via the Express Backend to ensure performance and centralized logic.
- **File Storage:** **Cloudflare R2** (S3-compatible, zero egress fees).
- **AI/ML:**
  - **Scraper:** `@mozilla/readability` + `jsdom`.
  - **TTS:** OpenAI API (`tts-1`).

---

## 3. Database Schema

**Database:** Supabase (PostgreSQL).
**Security:** RLS Disabled. The Express API is the sole gatekeeper.

### Table: `users` (Managed manually or synced with Auth)

- `id` (uuid, PK)
- `email` (text, unique)
- `created_at` (timestamptz)

### Table: `articles`

- `id` (uuid, PK, default uuid_generate_v4())
- `user_id` (uuid, FK)
- `original_url` (text)
- `title` (text)
- `clean_text` (text)
- `audio_url` (text, nullable - Cloudflare R2 Public URL)
- `status` (enum: 'queued', 'processing', 'completed', 'failed')
- `created_at` (timestamptz, indexed for sort)

---

## 4. System Architecture & Data Flow

### A. The Express API Layer

The API should be lightweight. It validates requests and offloads work to Inngest.

**Endpoint: `POST /api/articles`**

- **Auth:** Verify user token.
- **Action:**
  1. Insert row into `articles` with `status: 'queued'`.
  2. Send event `app/article.created` to Inngest.
  3. Return `201 Accepted` immediately to the client.

**Endpoint: `GET /api/articles`**

- **Auth:** Verify user token.
- **Action:** Query Supabase for articles belonging to `user_id`, ordered by `created_at` DESC.

### B. The Background Worker (Inngest)

**Function: `processArticle`**

- **Trigger:** Event `app/article.created`.
- **Steps:**
  1. **Scrape:** Fetch HTML, parse with `Readability`. Update DB with `title` and `clean_text`.
  2. **Generate Audio:** Send text to OpenAI TTS.
  3. **Upload:** Stream binary audio directly to **Cloudflare R2**.
  4. **Finalize:** Update DB `articles` row with `audio_url` and `status: 'completed'`.

---

## 5. Scalability Strategy

- **Storage:** Use Cloudflare R2 to avoid S3 egress fees when serving millions of audio streams.
- **Concurrency:** Inngest must handle rate limiting for OpenAI (e.g., max 5 concurrent TTS jobs) to avoid hitting API limits, while queuing thousands of user requests.
- **Database:** Since RLS is disabled, use standard indexing on `user_id` and `created_at` for fast lookups.

---

## 6. Development Phases

### Phase 1: Backend Setup (Express + Inngest)

- Initialize Express app with TypeScript.
- Setup Inngest Serve Handler (`/api/inngest`).
- Configure Supabase Client (Service Role).
- Configure Cloudflare R2 S3 Client (`@aws-sdk/client-s3`).

### Phase 2: The Inngest Pipeline

- Define the event schema.
- Create the `processArticle` function.
- Implement the "Scrape -> TTS -> R2 Upload" chain.
- **Crucial:** Add error handling/retries in Inngest (e.g., if OpenAI times out).

### Phase 3: API & Database

- Create the `POST` and `GET` Express routes.
- Connect Express to Supabase.

### Phase 4: Clients (Web & Mobile)

- Build the frontend UI to consume the Express API.
- Implement polling or WebSocket (optional) to update UI when article status changes from 'queued' to 'completed'.

---

## 7. Rules for AI Generation

- **Security:** Since RLS is disabled, **every** Express endpoint must strictly validate the `user_id` from the auth token before querying the database.
- **Performance:** Do not block the main Express thread. All network-heavy tasks (Scraping, AI, Uploads) MUST go through Inngest.
- **Code Style:** Use strict TypeScript types for all Inngest events and API responses.
