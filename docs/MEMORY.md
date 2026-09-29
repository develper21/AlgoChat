# 🧠 Project Memory

## AlgoChat — Context, Progress & Important Notes

This document keeps track of the current state of the project, important decisions, and things to remember. It helps maintain continuity across development sessions and for new contributors.

| | | |
| --- | --- | --- |
| 📅 **Last Updated:** Sep 29, 2026 | 🚀 **Current Phase:** Phase 3 | ⏳ **In Progress:** Messaging |

---

## 🎯 Current Status

- ✅ Project setup completed (React + Vite, Tailwind + DaisyUI)
- ✅ Git repository initialized and pushed to GitHub
- ✅ MongoDB connection and models (User, Message) created
- ✅ Authentication (signup, login, JWT, protected routes) completed
- ✅ Real-time messaging core (text, image, delivery status) completed
- 🔄 Working on voice notes polish + Media gallery (UI in progress)
- 🔄 Postman collections created for API testing (client + server)

## ✅ Completed Tasks

| # | Task | Completed On |
| --- | --- | --- |
| 1.1 | Initialize React (Vite) project | Sep 20, 2026 |
| 1.2 | Configure Tailwind CSS + DaisyUI | Sep 20, 2026 |
| 1.3 | Set up Git repository | Sep 21, 2026 |
| 1.5 | Setup Express server | Sep 22, 2026 |
| 2.1 | Create MongoDB connection | Sep 22, 2026 |
| 2.2 | Create User model | Sep 23, 2026 |
| 2.3 | Implement signup & login APIs | Sep 23, 2026 |
| 2.4 | Implement login page | Sep 24, 2026 |
| 2.5 | Implement signup page | Sep 24, 2026 |
| 2.6 | Protect API routes (JWT) | Sep 25, 2026 |
| 2.7 | Session restore (checkAuth) | Sep 25, 2026 |
| 2.8 | Onboarding flow | Sep 26, 2026 |
| 3.1 | Create Message model | Sep 26, 2026 |
| 3.2 | Send message API | Sep 26, 2026 |
| 3.3 | Get conversation API | Sep 27, 2026 |
| 3.4 | Get users for sidebar | Sep 27, 2026 |
| 3.5 | Socket.io real-time messaging | Sep 27, 2026 |
| 3.6 | Online/offline presence | Sep 28, 2026 |
| 3.7 | Message status ticks | Sep 28, 2026 |
| 4.2 | Avatar upload API | Sep 28, 2026 |
| 4.3 | Update full name API | Sep 28, 2026 |

## 🔄 In Progress

| # | Task | Started |
| --- | --- | --- |
| 3.8 | Voice notes (recording + duration) | Sep 28, 2026 |
| 3.9 | Media gallery page | Sep 29, 2026 |

## ⏭️ Next Up

- [ ] Polish voice note playback UI
- [ ] Finish MediaPage grid + download actions
- [ ] Settings page (theme switcher UI)
- [ ] Deploy MVP on Render
- [ ] Run Postman regression before release

## 🗝️ Important Notes & Decisions

1. **JWT in localStorage** — token stored via `client/src/lib/token.js`, attached by an axios interceptor. Postman collections mirror this exactly.
2. **Bearer auth, not cookies** — `protectRoute` reads `Authorization` header; keep Postman and client in sync.
3. **Base64 uploads** — images/audio go to Cloudinary as base64; JSON body limit is `50mb` in `server/src/index.js`.
4. **Socket mapping** — `userSocketMap` in `server/src/lib/socket.js` maps `userId → socketId`; presence + direct events depend on it.
5. **Message status flow** — `sent → delivered → read`; server flips to `delivered` only when receiver is online; read receipts via socket ack events.
6. **Onboarding rule** — users with empty `fullName` are redirected to `/onboarding` → `/profile` until they set a name.
7. **Docs are source of truth** — PRD (what), ARCHITECTURE (how), RULES (constraints), DESIGN (UI), TASKS (progress), MEMORY (context).
8. **Postman collections** — `server/postman/postman.json` (full API) and `client/postman/postman.json` (frontend-mapped copy). Both auto-save `{{token}}` on signup/login.

## 🔧 Environment Quick Reference

| Variable | Where | Purpose |
| --- | --- | --- |
| `PORT=5001` | server | API port |
| `MONGODB_URI` | server | Mongo connection |
| `JWT_SECRET` | server | Token signing |
| `CLOUDINARY_*` | server | Media uploads |
| `VITE_API_URL` / `VITE_SOCKET_URL` | client | Dev API/socket URLs |
