# FocusArena - Competitive Study Platform

FocusArena is a production-ready, full-stack web application built to gamify academic and professional productivity. It merges the discipline of deep focus sprints with the high-stakes matching system of competitive gaming. 



---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router, dynamic routing, Client/Server component separations), React, TypeScript.
- **Styling:** Tailwind CSS v4 configured with dark-mode theme layouts and neon green highlights.
- **Animations:** Framer Motion for premium transition effects and component hover glows.
- **Backend / Database:** Supabase (Postgres, Auth, Realtime listeners for room leaderboards).
- **Data Visualizations:** Recharts daily focus stats, winnings trackers, and accumulation indices.

---

## 🚀 Setup & Installation Instructions

Follow these step-by-step instructions to configure the database, connect credential environments, and launch the platform.

### Step 1: Create a Supabase Project
1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Click **New Project**, choose a name (e.g. `FocusArena`), set a secure Database Password, and select your preferred hosting region.
3. Once the database instance is fully provisioned, navigate to **Project Settings** > **API** to locate your URL and Anon Key.

### Step 2: Deploy SQL Migrations
1. Navigate to the **SQL Editor** tab in your Supabase Dashboard.
2. Click **New query** and copy the contents of the local [schema.sql](file:///c:/Users/Sanjana/Desktop/FOCUS-ARENA/schema.sql) file into the editor.
3. Click **Run**. This will generate:
   - The Postgres tables: `users`, `wallets`, `transactions`, `rooms`, `room_members`, `study_sessions`, `tasks`, and `timetables`.
   - Table constraints, automatic triggers to construct profiles/wallets upon auth signups, Row Level Security (RLS) policies, and the stored procedure (`settle_money_rooms`) to settle money stakes challenges at midnight.

### Step 3: Setup Local Environment Variables
1. Create a file named `.env.local` in the root of your project directory:
   ```bash
   touch .env.local
   ```
2. Open the file and configure your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 4: Run Locally
1. Install project packages:
   ```bash
   npm install
   ```
2. Launch the local Next.js development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ Deployment to Vercel

The application is structured for direct, non-interactive integration into Vercel.

1. Push your local repository to GitHub, GitLab, or Bitbucket.
2. Log in to the [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Select your FocusArena repository and choose **Next.js** as the framework template.
4. Under **Environment Variables**, add the values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will compile the pages and route endpoints statically.

---

## 📂 Project Directory Structure

```text
FOCUS-ARENA/
├── public/                 # Static asset resources
├── schema.sql              # Supabase Postgres database structure
├── src/
│   ├── app/                # Next.js App Router Pages
│   │   ├── arena/          # Live streams & replays
│   │   ├── dashboard/      # Daily stats & task CRUD
│   │   ├── login/          # Auth entry console
│   │   ├── onboarding/     # Initial setup preferences
│   │   ├── profile/        # Lifetime logs & badges
│   │   ├── rooms/          # Lobby search & dynamic Room pages
│   │   │   └── [roomId]/   # Realtime leaderboard & Buy-ins
│   │   ├── signup/         # Account creation
│   │   ├── study/          # Active WebRTC webcam timer sprints
│   │   ├── tasks/          # Timetable scheduling grids
│   │   ├── wallet/         # Transaction ledger & deposit mocks
│   │   ├── globals.css     # Global stylesheets and Tailwind v4 theme specs
│   │   └── layout.tsx      # Root html & providers wrapper
│   ├── components/         # Shared Components & React context
│   │   ├── auth-context.tsx # Auth status, redirection guards, and wallet refreshers
│   │   ├── layout-wrapper.tsx # Conditional sidebar/header routing wrapper
│   │   ├── sidebar.tsx     # Navigation sidebar matching design spec
│   │   └── header.tsx      # Top bar settings and wallet balances indicators
│   └── lib/
│       └── supabase.ts     # Supabase Client and TypeScript interface definitions
├── package.json            # Scripts & packages dependencies
├── tsconfig.json           # Compiler rules
└── README.md               # Setup & deployment guidelines
```

---

## 🌟 FocusArena 2.0 Feature Changelog

FocusArena 2.0 introduces powerful new features designed to solve textbooks focus false-negatives, enable head-to-head stakes, and create a real-time lobby workspace.

### 1. Client-Side Gaze Tracking (MediaPipe FaceMesh)
- Focus is tracked via raw webcamera landmarks rather than static timers.
- **Initial Calibration:** Interactive pre-session calibration guides the user to center their gaze coordinates.
- **Paper/Textbook Mode:** Solves the screen-focus dilemma. Toggle to `Paper Mode` to study books; the app pauses gaze validation and credits focus time based on elapsed minutes.

### 2. 1v1 Challenges Matchmaking
- Host focus battles with custom buy-in stakes (TKN) and duration options.
- The `settle_1v1_challenge` procedure compares focus logs at completion and distributes the stakes pool (90% to the winner, 10% platform commission).

### 3. Real-Time Chat Channels
- Fully integrated live chat drawer overlay inside room details.
- Runs on **Supabase Realtime** changes listener for message insertions.
- Basic profanity filter and rate-limiter prevents spamming.

---

## 📈 Post-Launch Monitoring Setup

To ensure 100% platform health and track metrics in production:

### 1. Error Tracking (Sentry)
1. Initialize a project on [Sentry.io](https://sentry.io).
2. Install the Next.js SDK:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
3. Configure `SENTRY_AUTH_TOKEN` in your deployment pipeline or environment variables to track source maps and build errors.

### 2. User & Focus Analytics (PostHog)
1. Sign up on [PostHog](https://posthog.com) and fetch your Project API Key.
2. Add environment credentials:
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```
3. Initialize the SDK in your root provider to track page routing, button interactions, average study session length, and stakes metrics.

