# 🏎 Real-Time Typing Race

A **Next.js + Pusher** full-stack web app that enables players to join a live typing competition, type given sentences, and track real-time performance metrics (Words Per Minute & Accuracy).

---

## 📚 Features Implemented

- **Real-time competition** with live progress table (powered by **Pusher Channels** presence + client events).
- **Fixed-time rounds** — new sentence every round.
- **Metrics calculation** (WPM & accuracy) updated locally and broadcast to all players.
- **Profile editing** — update player name during a session.
- **Local echo** for instant UI updates before server confirmation.
- **Unit testing** with **Jest** for core logic (e.g., metrics calculation).
- **E2E testing** with **Playwright** for profile editing and table updates.
- **Type safety** via TypeScript.
- **Server-only store** for in-memory persistence (not completed).

---

## 🛠️ Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Pusher Channels** (real-time messaging)
- **Tailwind CSS** (styling)
- **Jest** (unit testing)
- **Playwright** (end-to-end testing)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <https://github.com/DmytroLysachenko/type-racer.git>
cd <type-racer>
pnpm install
```

### 2. Set Environment Variables

Create `.env` with:

```env
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=your-cluster
```

### 3. Run Dev Server

```bash
pnpm dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Running Tests

### Unit tests (Jest)

```bash
pnpm run test
```

### End-to-End tests (Playwright)

```bash
# Install browsers (first time only)
npx playwright install

# Run all tests
npx playwright test

# Headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

---

## ⚙️ Design Decisions & Assumptions

- **In-memory store** instead of a database — faster to implement for the challenge timeframe. (implemented partly, should be completed in next product updates with db integration as well )
- **Pusher presence channels** for live player list. Pusher has very generous free tier (200k msgs per day, 100 concurrent connections ) and give better performance with such tasks than for example Supabase broadcasting. Can be scaled with upgrading Pusher plan and adjusting throttling on client side to reduce amount of messages.
- **Local echo** for UI responsiveness without waiting for network.
- **Simplified authentication** — no full login, just player ID & name.
- **Sentences** are static/local for now (could be randomized or fetched from API in production).

---

## 📝 Future Improvements (if productionizing)

1. **Persistent storage** (PostgreSQL, Redis) for stats.
2. **Authentication** (e.g., NextAuth).
3. **Sorting & pagination** for score table.
4. **Spectator mode** for non-playing users.
5. **Live sentence source** from external API.
6. **Better error handling** & fallback UIs.
7. **Analytics & monitoring** (Sentry, LogRocket).
8. **CI pipeline** with automated tests on PR.
9. **Code modularity** to be improved for better code reusability

---

## 🤖 AI Usage

Parts of the implementation were accelerated using AI:

- Initial scaffolding of **custom hooks**, **store** and **utils**.
- Generating **Jest** and **Playwright** test boilerplate.
- Writing **README** structure.

All AI-generated code was **reviewed, adapted, and tested** by me.
