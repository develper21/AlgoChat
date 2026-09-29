# 📜 Development Rules

## AlgoChat — Project Guidelines for AI & Human Collaboration

This document defines the development rules, coding standards, and best practices for the AlgoChat application. These rules ensure consistency, maintainability, security, and quality across the codebase. Both AI assistants and human contributors must follow these guidelines.

---

## 1️⃣ General Principles

These rules apply to the entire project.

- ✅ Follow the project documentation (PRD, ARCHITECTURE, DESIGN) before making changes.
- ✅ Keep the code clean, readable, and well-structured.
- ✅ Prioritize simplicity and maintainability.
- ✅ Do not duplicate logic. Reuse existing components, utilities, or services.
- ✅ Make small, focused changes instead of large, risky edits.
- ✅ Do not modify unrelated files.
- ✅ Write self-explanatory code with meaningful variable and function names.

---

## 2️⃣ Technology & Coding Standards

Rules related to the tech stack and coding style.

| Area | Rule |
| --- | --- |
| 🟨 **Language** | Use modern JavaScript (ESM). Avoid `any`-style sloppy patterns; validate inputs at boundaries. |
| ⚛️ **Framework** | Follow React 18 + Vite best practices; function components and hooks only. |
| 🎨 **Styling** | Use Tailwind CSS + DaisyUI and follow the design system in [DESIGN.md](DESIGN.md). |
| 🧹 **Linting** | Follow the ESLint config in `client/eslint.config.js`; keep zero warnings before commit. |
| 📐 **Formatting** | Use Prettier defaults: 2-space indent, double quotes (server), single quotes per existing files, semicolons. |
| 📦 **Dependencies** | Use stable, well-maintained packages. Do not add a dependency without a clear reason. |
| 🗂️ **File Naming** | Components/pages: `PascalCase.jsx` (e.g. `ChatContainer.jsx`). Stores: `camelCase` with `use` prefix (e.g. `useChatStore.js`). Server files: `name.type.js` (e.g. `auth.route.js`). |

---

## 3️⃣ Project Structure

Follow the defined folder structure in [ARCHITECTURE.md](ARCHITECTURE.md).

- ✅ Place reusable UI components in `client/src/components`.
- ✅ Route pages belong in `client/src/pages`.
- ✅ Global state lives in `client/src/store` (Zustand stores only).
- ✅ API clients, token helpers and shared utils belong in `client/src/lib`.
- ✅ Database and external service logic stays in `server/src/lib` (db, socket, cloudinary).
- ✅ Request handlers go in `server/src/controllers`, registered in `server/src/routes`.
- ✅ Types/enums (like message status) live in the Mongoose models.
- ❌ Do not create new folders without a clear, documented reason.

---

## 4️⃣ Git & Version Control

- ✅ Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`.
- ✅ Commit messages: imperative mood, e.g. `Add voice message recording`.
- ✅ One logical change per commit.
- ✅ Never commit secrets. Use `.env` (git-ignored) and update `.env.example`.
- ❌ Never push directly to `main`; use feature branches + PRs.

---

## 5️⃣ API & Backend Rules

- ✅ Every protected route must use `protectRoute` middleware.
- ✅ Controllers never trust client input: validate required fields before DB writes.
- ✅ Never return `password` (or hashes) in any API response — use `.select("-password")` where needed.
- ✅ Return consistent JSON errors: `{ "message": "..." }` (auth) / `{ "error": "..." }` (messages).
- ✅ Keep route files thin; business logic lives in controllers/services.
- ✅ Log server errors with context (`Error in <controller>:`) for easier debugging.

---

## 6️⃣ Security Rules

- ✅ Hash passwords with bcryptjs (min 10 salt rounds). Never store plain text.
- ✅ Sign JWTs with `process.env.JWT_SECRET`, expiry 7d.
- ✅ Validate `Authorization: Bearer <token>` on every protected request.
- ✅ Restrict CORS to the known frontend origins (`http://localhost:5173` in dev).
- ✅ Sanitize and limit request body size (already `50mb` for base64 media).
- ❌ Never commit `.env` files or real Cloudinary/Mongo credentials.

---

## 7️⃣ UI & Design Rules

- ✅ Reuse DaisyUI components; match the theme (`dracula`) tokens.
- ✅ Keep every page responsive: mobile → tablet → desktop.
- ✅ Use lucide-react icons; no emoji icons in UI chrome.
- ✅ Show loading states (skeletons) instead of blank screens.
- ✅ Toasts via react-hot-toast for success/error feedback.

---

## 8️⃣ Testing & Documentation Rules

- ✅ After any API change, update both `client/postman/postman.json` and `server/postman/postman.json`.
- ✅ After any architecture change, update [ARCHITECTURE.md](ARCHITECTURE.md).
- ✅ After any completed task, tick it in [TASKS.md](TASKS.md) and update [MEMORY.md](MEMORY.md).
- ✅ Keep docs short, factual, and in sync with the code.
