# ✅ Project Tasks

## AlgoChat — Task Breakdown & Development Plan

This document contains the complete list of tasks for building the AlgoChat application. Tasks are divided into phases with clear deliverables, priorities and status tracking.

| 📊 | | |
| --- | --- | --- |
| **Total Tasks:** 28 | **Completed:** 17 (61%) | **In Progress:** 2 |

---

## ✅ Phase 1: Project Setup

Set up the development environment, repository, and core configuration.

| # | Task | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | Initialize React (Vite) client | High | ✅ Completed | Vite + React 18 |
| 1.2 | Configure Tailwind CSS + DaisyUI | High | ✅ Completed | `dracula` theme |
| 1.3 | Set up Git repository | High | ✅ Completed | GitHub remote |
| 1.4 | Configure ESLint & Prettier | Medium | ✅ Completed | eslint.config.js |
| 1.5 | Setup Express server | High | ✅ Completed | ESM, nodemon |
| 1.6 | ~~Docker compose (client+server+Mongo)~~ | Low | 🗑️ Removed | Not needed — local dev + Render node runtime |

## ✅ Phase 2: Authentication

Implement user authentication and protected routes.

| # | Task | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 2.1 | Create MongoDB connection (lib/db) | High | ✅ Completed | Mongoose |
| 2.2 | User model + password hashing | High | ✅ Completed | bcryptjs 10 rounds |
| 2.3 | Signup & Login APIs + JWT | High | ✅ Completed | 7d expiry |
| 2.4 | Login page | High | ✅ Completed | AuthPage.jsx |
| 2.5 | Signup page | High | ✅ Completed | SignupPage.jsx |
| 2.6 | protectRoute middleware | High | ✅ Completed | Bearer token |
| 2.7 | checkAuth on app load | High | ✅ Completed | AuthSync.jsx |
| 2.8 | Onboarding (fullName) flow | Medium | ✅ Completed | /onboarding → /profile |

## 🔄 Phase 3: Messaging (In Progress)

Real-time one-to-one messaging with text, images, and voice notes.

| # | Task | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 3.1 | Message model + status enum | High | ✅ Completed | sent/delivered/read |
| 3.2 | Send message API + Cloudinary | High | ✅ Completed | text/image/audio |
| 3.3 | Get conversation API | High | ✅ Completed | /messages/:id |
| 3.4 | Sidebar users API | High | ✅ Completed | /messages/users |
| 3.5 | Socket.io real-time delivery | High | ✅ Completed | newMessage event |
| 3.6 | Online/offline presence | High | ✅ Completed | getOnlineUsers |
| 3.7 | Message ticks (delivered/read) | Medium | ✅ Completed | socket ack events |
| 3.8 | Voice notes with duration | Medium | 🔄 In Progress | audioDuration |
| 3.9 | Media gallery page | Medium | 🔄 In Progress | MediaPage.jsx |

## ⬜ Phase 4: Profile & Settings (Planned)

User profile management and app settings.

| # | Task | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 4.1 | Profile page UI | Medium | ⬜ Planned | ProfilePage exists, polish |
| 4.2 | Avatar upload (Cloudinary) | Medium | ✅ Completed | update-profile API |
| 4.3 | Update full name API | Medium | ✅ Completed | /auth/fullname |
| 4.4 | Settings page (theme switch) | Low | ⬜ Planned | useThemeStore |

## ⬜ Phase 5: Deployment (Planned)

Ship the MVP to production.

| # | Task | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 5.1 | Env configs (.env.example) | Medium | ✅ Completed | Both sides |
| 5.2 | ~~Nginx + Dockerfiles~~ | Low | 🗑️ Removed | Docker dropped; production static serving instead |
| 5.3 | Production static serving | Medium | ⬜ Planned | server serves client/dist |
| 5.4 | Deploy on Render | Medium | ⬜ Planned | render.yaml ready |
| 5.5 | Final QA + Postman regression | Medium | ⬜ Planned | Use postman collections |
