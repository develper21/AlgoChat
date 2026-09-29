# 🏛️ System Architecture

## AlgoChat — Real-Time Chat Application

This document describes the overall system architecture, technology stack, folder structure, data flow, and key design decisions for the AlgoChat application.

---

## 1. High-Level Architecture

AlgoChat follows a classic full-stack architecture using React (Vite) and Node.js/Express with Socket.io.

```
┌──────────┐      HTTPS / WSS     ┌─────────────────┐      TCP     ┌───────────────────┐      ┌──────────┐
│   User   │◄────────────────────►│  React Frontend │◄────────────►│  Node.js Backend  │◄────►│ MongoDB  │
│ (Browser)│                      │   (Vite Client) │  REST + WS   │ (Express / API)   │      │(Mongoose)│
└──────────┘                      └─────────────────┘              └─────────┬─────────┘      └──────────┘
                                                                               │
                                                                               ▼
                                                                        ┌──────────────┐
                                                                        │  Cloudinary  │
                                                                        │(Images/Audio)│
                                                                        └──────────────┘
```

- **User ↔ Frontend:** Browser renders the React SPA.
- **Frontend ↔ Backend:** REST calls via axios (`/api/...`) + Socket.io WebSocket for real-time events.
- **Backend ↔ MongoDB:** Mongoose ODM for users and messages.
- **Backend ↔ Cloudinary:** Base64 uploads for profile pics, images, and voice notes.

---

## 2. Technology Stack

Technologies used in the project and their purpose:

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 18 (Vite) | UI framework |
| Language | JavaScript (ESM) | Type-safe-ish, fast development |
| Styling | Tailwind CSS + DaisyUI | Modern, responsive UI with theming |
| State | Zustand | Lightweight global state |
| Routing | React Router DOM v6 | Client-side routing |
| Realtime | Socket.io (client + server) | Live messages & online status |
| Backend | Node.js + Express | REST API server |
| Database | MongoDB + Mongoose | Data persistence |
| Auth | JWT (jsonwebtoken) + bcryptjs | Token auth & password hashing |
| Media | Cloudinary | Image & audio (voice note) storage |
| Dev | Nodemon, Vite | DX & fast reload |
| Deployment | Docker / Render | Containerization & hosting |
| Version Control | Git & GitHub | Source code management |

---

## 3. Folder Structure

The project follows a client/server split to keep code organized and scalable.

```text
algochat/
├── client/                    # React frontend (Vite)
│   ├── postman/               # Postman collection (client view)
│   ├── public/
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── constants/         # Themes etc.
│       ├── lib/               # axios instance, token helpers, utils
│       ├── pages/             # Route pages (Home, Auth, Profile...)
│       ├── store/             # Zustand stores (auth, chat, theme)
│       ├── App.jsx            # Routes & guards
│       └── main.jsx           # Entry point
├── server/                    # Node.js backend (Express)
│   ├── postman/               # Postman collection (server view)
│   └── src/
│       ├── controllers/       # Request handlers (auth, message)
│       ├── lib/               # db, socket, cloudinary config
│       ├── middleware/        # protectRoute (JWT)
│       ├── models/            # User, Message schemas
│       ├── routes/            # auth.route, message.route
│       └── index.js           # Server entry (REST + static in prod)
├── docs/                      # Project documentation
├── docker-compose.yml
└── README.md
```

---

## 4. Data Flow

### 4.1 Authentication flow

```
Signup/Login (client form)
   │  POST /api/auth/signup | /api/auth/login
   ▼
Server validates → bcrypt compare → signs JWT (7d)
   │  { token, user }
   ▼
Client saves token to localStorage → authUser in Zustand → connectSocket()
```

### 4.2 Real-time message flow

```
Sender types message (MessageInput)
   │  POST /api/messages/send/:receiverId  (base64 image/audio → Cloudinary)
   ▼
Server saves Message in MongoDB (status: sent)
   │  receiver online?
   ├─ yes → status = delivered → io.to(socketId).emit("newMessage", msg)
   └─ no  → stays "sent" until receiver connects
   ▼
Receiver client emits messageDelivered / messageRead
   │  socket events
   ▼
Server updates status in DB → emits messageStatusUpdate / allMessagesRead to sender
```

### 4.3 Online presence flow

```
Client connects socket with ?userId=<id>
   ▼
Server maps userId → socketId (userSocketMap)
   ▼
io.emit("getOnlineUsers", [...ids]) → all clients update sidebar dots
```

---

## 5. Key Design Decisions

1. **Bearer token in Authorization header** — `protectRoute` reads `req.headers.authorization`; the client attaches it via an axios interceptor, so JWT works from Postman and browsers alike.
2. **Base64 → Cloudinary uploads** — keeps the REST API simple (no multipart parsing); the 50mb JSON limit accommodates large images/audio.
3. **Zustand over Redux** — minimal boilerplate for a mid-size app; separate stores for auth, chat, and theme.
4. **Socket user map on server** — `userSocketMap` gives O(1) lookup of a user's socket for direct event delivery.
5. **Single repo, client/server folders** — one clone runs both sides; docker-compose ties them with MongoDB.
6. **Production static serving** — in production the Express app serves `client/dist`, so one deployment serves both API and UI.

---

## 6. Environment & Ports (Development)

| Service | URL / Port |
| --- | --- |
| Frontend (Vite) | `http://localhost:5173` |
| Backend API | `http://localhost:5001` (base `/api`) |
| MongoDB | `mongodb://localhost:27017/algochat` |
| Socket.io | Same origin as backend (WS transport) |
