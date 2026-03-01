# TuerSS — No Code, No Problem

Generate Roblox Lua scripts with **TuerAi** (powered by AI). No coding experience needed.

- **Support:** support@tuerss.com  
- **Digital-only:** No business location, no support phone.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Vercel**-friendly (frontend + API routes)
- **Prisma** + **MongoDB** (Atlas or any MongoDB)
- **Gemini** (branded as TuerAi) for script generation

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — Your MongoDB connection string (e.g. `mongodb+srv://...`)
   - `GEMINI_API_KEY` — Your Gemini API key
   - `JWT_SECRET` — Random string (min 32 chars) for auth

3. **Database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

   (`db push` syncs your Prisma schema to MongoDB; use it instead of migrations.)

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Features

- **Auth:** Sign up, log in. **Bypass** button on login/register for a test account (no email verification).
- **Credits:** New users get 20 free generations. 1 generation per AI request. Daily 20 credits (granted on next login after a new day).
- **Dashboard:** List scripts, create new script.
- **Editor:** VS Code–style (Monaco) on the left; TuerAi chat on the right. Describe what you want → get Lua → **Apply** or **Decline** into the editor. Conversation memory is sent to the AI so it can follow context (e.g. “remember the username we added”).
- **TuerAi:** All AI replies are presented as “TuerAi — latest development AI for Roblox”. System prompt instructs the model to never refuse and to generate Roblox Lua when asked.

## Deploy on Vercel

1. Push to GitHub and import the project in Vercel.
2. Add env vars: `DATABASE_URL` (your MongoDB connection string), `GEMINI_API_KEY`, `JWT_SECRET`.
3. MongoDB Atlas works well with Vercel serverless; ensure your cluster allows connections from Vercel’s IPs (or use “Allow access from anywhere” for development).

## Bypass (test account)

On **Login** and **Register** there is a **Bypass (test account)** button. It creates or reuses a test user and logs you in so you can test without email verification.
