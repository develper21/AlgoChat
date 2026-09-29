# 🎨 Design System

## AlgoChat — Clean. Fast. Real-Time.

This document defines the visual design system, UI components, and user experience guidelines for AlgoChat. The goal is to create a modern, minimal, chat-focused interface with a consistent look across devices.

---

## 1. Design Principles

| | | |
| :---: | :---: | :---: |
| **User-Centered** 🧑‍🤝‍🧑 | **Minimal & Clean** 🪶 | **Consistent** 🧩 |
| Simple and intuitive chat for everyone. | Reduce clutter, focus on conversation. | One unified design language everywhere. |

---

## 2. Color Palette

Primary colors used across the application. AlgoChat uses the **DaisyUI `dracula` theme** (dark-first) with these semantic roles:

| Role | Color | Usage |
| --- | --- | --- |
| **Primary** | `#BD93F9` (purple) | Send button, active states, links |
| **Secondary** | `#FF79C6` (pink) | Accents, badges, highlights |
| **Success** | `#50FA7B` (green) | Online dot, delivered/read ticks |
| **Warning** | `#F1FA8C` (yellow) | Caution states, "sent" tick |
| **Error** | `#FF5555` (red) | Error toasts, delete actions |
| **Background** | `#282A36` (dark) | App background |
| **Surface** | `#44475A` (slate) | Cards, chat bubbles, sidebar |
| **Text** | `#F8F8F2` (off-white) | Primary text |

> Change themes via `data-theme` on the root div (`useThemeStore`); all colors come from DaisyUI tokens, not hard-coded values.

---

## 3. Typography

We use **Inter** (system fallback) as the primary font for a clean, modern, highly readable interface.

| Element | Size | Weight |
| --- | --- | --- |
| Page titles | 24px | 700 |
| Section headers | 18px | 600 |
| Body / chat text | 14–16px | 400 |
| Meta (time, status) | 12px | 400 |
| Buttons | 14px | 500 |

---

## 4. UI Components

Standard components to be used throughout the app.

### 4.1 Buttons
| Variant | Style | Use |
| --- | --- | --- |
| Primary | Filled `primary`, white text | Send, Login, Signup |
| Secondary | Outline / ghost | Cancel, theme toggle |
| Destructive | `error` background | Logout, delete |
| Icon | Round ghost with lucide icon | Attach image, mic, emoji |

### 4.2 Inputs
- Rounded `input-bordered` fields with subtle surface background.
- Label above field, 12px; error text below, 12px in `error` color.
- Password fields include a show/hide toggle.

### 4.3 Chat Bubbles
| Bubble | Background | Position |
| --- | --- | --- |
| Sent | `primary`, white text, rounded-2xl with tail | Right |
| Received | Surface `#44475A`, light text, rounded-2xl | Left |
| Image | Image fills bubble, 2px rounded corners | Either |
| Voice note | Audio player pill + duration | Either |

### 4.4 Cards & Lists
- Sidebar user rows: avatar (36px) + name + last message preview + online dot.
- Hover state: slightly lighter surface; selected state: `primary` at 10% opacity.

### 4.5 Avatars
- 3 sizes: 32px (header), 36px (sidebar), 96px (profile).
- Fallback: initials on gradient when no `profilePic`.
- Online indicator: 10px green dot, bottom-right, 2px border in background color.

---

## 5. Layout

```
┌───────────────┬──────────────────────────────────┐
│               │  ChatHeader (avatar, name, ⋮)    │
│   Sidebar     ├──────────────────────────────────┤
│  (users list) │                                  │
│               │        ChatContainer             │
│  🔍 Search    │     (bubbles, scroll area)       │
│  👤 User rows │                                  │
│               ├──────────────────────────────────┤
│  ⚙️ Footer    │  MessageInput (emoji, text, 📎)  │
└───────────────┴──────────────────────────────────┘
```

- Desktop: sidebar fixed 320px, chat fills the rest.
- Mobile: sidebar and chat swap full-screen; back button in header.
- Max content width 1440px, centered.

---

## 6. Spacing, Radius & Shadows

| Token | Value |
| --- | --- |
| Space scale | 4 / 8 / 12 / 16 / 24 / 32px |
| Card radius | 12px |
| Bubble radius | 16px (18px at the tail corner) |
| Input radius | 8px |
| Shadow | `0 2px 8px rgba(0,0,0,0.25)` for elevated cards |

---

## 7. Motion & Feedback

- Message send: bubble slides up + fades in (150ms ease-out).
- Skeletons while `isUsersLoading` / `isMessagesLoading`.
- Online dot appears instantly via socket event (no animation needed).
- Toasts: bottom-center, auto-dismiss 3s.
- No heavy animations; respect `prefers-reduced-motion`.

---

## 8. Iconography

- Library: **lucide-react** only (Send, Image, Mic, Smile, LogOut, Settings…).
- Stroke width 2, size 18–20px in buttons, 16px inline.
- Never mix icon libraries.

---

## 9. Accessibility

- All interactive elements have visible focus rings.
- Color contrast ≥ 4.5:1 for text (dracula palette passes for body text).
- Voice notes have play/pause with keyboard support.
- Form inputs have associated labels.

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Layout |
| --- | --- | --- |
| Mobile | < 640px | Single pane, full-screen views |
| Tablet | 640–1024px | Sidebar 280px + chat |
| Desktop | > 1024px | Sidebar 320px + chat, max 1440px |
