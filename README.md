# ⚡ CronoBash — Cognitive Focus Scanner & Competitive Study Arena

> **Turn Study into a Sport.**  
> CronoBash is a next-generation productivity platform combining **client-side AI gaze tracking**, **real-time squad study arenas**, **1v1 focus duels**, and **gamified 100-tier mastery progression**.

---

## 📖 Overview & Project Description

**CronoBash** reimagines how students and professionals engage in deep focus work. Traditional study timers fail because they rely on honor systems, lead to isolation, and lack meaningful incentives. CronoBash addresses these challenges by merging **computer vision AI**, **peer accountability**, and **competitive gamification** into a sleek, liquid-glass web environment.

### The Problem
* **Procrastination & Distraction:** Static Pomodoro timers don't verify active engagement or eye contact.
* **Textbook/Screen False-Positives:** Conventional eye-trackers penalize users when they look down at physical books or notes.
* **Isolation & Lack of Motivation:** Studying alone lacks the energy and accountability of high-performance team environments.

### The CronoBash Solution
* **Client-Side AI Focus Engine:** Uses MediaPipe Face Mesh (WASM) to analyze gaze vector angles locally inside the browser. **No raw video is ever stored or transmitted to external servers.**
* **Smart Mode Switching:** Includes dedicated **Paper/Textbook Mode** to credit focus time while reading physical books without false distraction penalties.
* **Squad Arenas & 1v1 Duels:** Stake virtual Focus Tokens ($TKN) in head-to-head duels or squad lobbies with live WebRTC camera tiles and real-time leaderboards.
* **100 Tier Mastery Progression:** Earn badges, level up through 100 achievement tiers, unlock custom avatars, soundscapes, and streak shields in the Marketplace.

---

## ✨ Key Features

### 👁️ 1. Real-Time AI Gaze Scanner (MediaPipe WASM)
* **On-Device Computer Vision:** Evaluates facial landmarks directly in browser memory.
* **Interactive Calibration:** Quick pre-session gaze calibration ensuring high accuracy across different camera angles.
* **Paper & Book Mode:** Pause facial gaze enforcement when working on physical notebooks or reading textbooks.

### 🏟️ 2. Squad Arenas & Multi-User Lobbies
* **Peer Accountability:** Join public or password-protected private study rooms with peer WebRTC video streams.
* **Live Leaderboards:** Real-time ranking based on session focus scores, study duration, and streak multipliers.
* **Realtime Chat Drawer:** Powered by Supabase Realtime broadcast channels with spam filters and study invites.

### ⚔️ 3. 1v1 Focus Duels & Token Stakes
* **Head-to-Head Challenges:** Challenge study buddies or random opponents to timed focus duels.
* **Token Pools:** Stake virtual Focus Tokens ($TKN). Automated database procedures (`settle_1v1_challenge`) award the winner upon session verification.

### 🤖 4. AI Focus Coach
* **Personalized Guidance:** Contextual study advice, session breakdown recommendations, and energy optimization tips.

### 🏆 5. 100 Tier Mastery & Verified Badges
* **Level Progression:** Gain XP from verified focus minutes to climb through 100 distinct mastery tiers.
* **Verified Emblem Badges:** Display custom badges and level markers on your profile and leaderboards.

### 🛍️ 6. Gamified Store & Wallet System
* **Focus Wallet:** Deposit, earn, and manage virtual tokens. Fully integrated with Razorpay gateway for token top-ups.
* **Marketplace:** Unlock ambient soundscapes, profile themes, animated avatars, and streak shields using earned focus tokens.

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Modern React 19 architecture with server/client components and Turbopack |
| **Language** | **TypeScript 5** | End-to-end static typing and strict safety |
| **Styling & UI** | **Tailwind CSS v4** | Custom liquid-glass aesthetic, dark modes, and dynamic theme tokens |
| **Computer Vision** | **MediaPipe Tasks Vision** | WebAssembly (WASM) face mesh landmark and gaze vector tracking |
| **3D & Graphics** | **Three.js / R3F / Spline** | Interactive 3D focus orbs, spatial graphics, and dynamic hero scenes |
| **Backend & Database** | **Supabase (PostgreSQL)** | Authentication, Postgres database, Row Level Security (RLS), & Realtime |
| **Animations** | **Framer Motion / GSAP** | Micro-interactions, page transitions, and smooth scrolling with Lenis |
| **Visualizations** | **Recharts** | Focus score analytics, daily productivity distributions, and streak charts |
| **Payments** | **Razorpay SDK** | Secure transaction engine for focus token purchases and balance top-ups |

---

## 📁 Repository Directory Structure

```text
FOCUS-ARENA/
├── public/                 # Static assets, audio, Lottie animations, and 3D assets
├── supabase/               # Database migrations & production schema definitions
│   └── migrations/         # PostgreSQL table definitions, functions, and RLS policies
├── src/
│   ├── app/                # Next.js App Router Routes & Pages
│   │   ├── (auth)/         # Auth pages (login, signup, onboarding)
│   │   ├── admin/          # Admin stats & session monitoring
│   │   ├── ai-coach/       # AI Focus Coach interface
│   │   ├── analytics/      # Deep cognitive analytics & chart visualizers
│   │   ├── arena/          # Global arena lobbies & live stream replays
│   │   ├── buddies/        # Study buddy network & invitation system
│   │   ├── challenges/     # Daily quests & milestone challenges
│   │   ├── dashboard/      # Main user dashboard with 3D Focus Orb
│   │   ├── leaderboard/    # Global focus rankings & top streaks
│   │   ├── marketplace/    # Store for badges, soundscapes, & profile cosmetics
│   │   ├── matchmaking/    # 1v1 duels matchmaking console
│   │   ├── privacy/        # Privacy policy & DPDP Act disclosures
│   │   ├── profile/        # User profile, 100 mastery tiers, & badges
│   │   ├── refund/         # Refund policy & billing terms
│   │   ├── rooms/          # Squad Arena lobbies & dynamic room detail page
│   │   │   └── [roomId]/   # Real-time WebRTC room & live leaderboard
│   │   ├── settings/       # Profile, security, & gaze calibration settings
│   │   ├── study/          # Active AI Focus Sprint environment
│   │   ├── tasks/          # Timetable scheduler & task management
│   │   ├── terms/          # Terms of service & legal disclosures
│   │   └── wallet/         # Virtual token balance & transaction ledger
│   ├── components/         # Reusable UI Components
│   │   ├── admin/          # Admin modal controllers
│   │   ├── study/          # Camera tile, gaze calibration, badge display
│   │   ├── widgets/        # Dashboard widgets (Focus Orb, Task, Notes, Calendar)
│   │   ├── auth-context.tsx# Auth state provider & wallet synchronizer
│   │   ├── header.tsx      # Top bar navigation & notification drawer
│   │   ├── layout-wrapper.tsx # Global page wrapper & layout manager
│   │   └── Footer.tsx      # Policy navigation footer
│   └── lib/
│       ├── badges.ts       # Mastery badges metadata definition
│       ├── razorpay.ts     # Razorpay payment gateway client
│       └── supabaseClient.ts # Supabase client initialization & types
├── package.json            # Dependencies & project scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
* **Node.js**: `v18.x` or higher
* **npm**: `v9.x` or higher
* **Supabase Account**: A free or pro account at [supabase.com](https://supabase.com)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/PrashantCodes150/FocusArena.git
cd FocusArena
```

---

### Step 2: Install Dependencies
```bash
npm install
```

---

### Step 3: Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Razorpay Payment Gateway (Optional for token top-ups)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
```

---

### Step 4: Setup Supabase Database
1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** > **New Query**.
3. Copy and execute the contents of the latest migration in `supabase/migrations/` (e.g. `20260731000019_master_production_full_database_schema.sql`).
4. This provisions all necessary tables (`users`, `wallets`, `transactions`, `rooms`, `room_members`, `study_sessions`, `tasks`, `connections`, `notifications`), triggers, and Row Level Security (RLS) policies.

---

### Step 5: Launch Local Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start using CronoBash.

---

## 🛡️ Privacy & Compliance (DPDP Act 2023)

CronoBash is built with **privacy by design**:
* **100% On-Device Facial Processing:** Optical landmarks are evaluated exclusively in the browser's local WebAssembly runtime environment. No video recordings, camera snapshots, or biometric facial templates are transmitted to or stored on any server.
* **DPDP Act 2023 & IT Act 2000 Compliant:** Strict data minimization principles are followed. Only minimal numerical metrics (focus score percentages and session durations) are stored in the user's private database record.

---

## ⚡ Scripts & Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Turbopack |
| `npm run build` | Compiles optimized production build |
| `npm run start` | Launches production server |
| `npm run lint` | Runs ESLint syntax and code quality checks |
| `npx tsc --noEmit` | Performs TypeScript type checking |

---

## 📄 License & Contact

* **Repository**: [CronoBash/CronoBash](https://github.com/CronoBash/CronoBash)
* **Grievances & Support**: `support@cronobash.com` | `legal@cronobash.com`
* **Copyright**: © CronoBash. All rights reserved.