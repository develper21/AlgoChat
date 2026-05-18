# 🚀 AlgoChat - Modern Real-Time Chat Application

AlgoChat is a full-stack, real-time messaging platform built with the MERN stack (MongoDB, Express, React, Node.js). It features seamless real-time communication, robust authentication, and a sleek, responsive UI with multi-theme support.

---

## ✨ Key Features

- **💬 Real-Time Messaging**: Instant communication powered by Socket.io.
- **🔐 Secure Authentication**: Clerk authentication with Google and Apple sign-in.
- **👤 Profile Management**: User profile customization, including avatar uploads via Cloudinary.
- **🟢 Online/Offline Status**: Track active users in real-time.
- **🎨 Dynamic Themes**: Modern UI with 30+ built-in themes using DaisyUI and Tailwind CSS.
- **📱 Responsive Design**: Fully optimized for mobile, tablet, and desktop screens.
- **⚡ Fast Performance**: State management handled by Zustand for a smooth user experience.

---

## 🛠️ Tech Stack

### Frontend

- **React (Vite)**: Modern frontend library and build tool.
- **Tailwind CSS & DaisyUI**: For styling and premium UI components.
- **Zustand**: Lightweight and scalable state management.
- **React Router DOM**: Client-side routing.
- **Socket.io-Client**: Real-time communication on the client side.
- **Lucide React**: Beautiful icons.
- **React Hot Toast**: Beautiful notifications.

### Backend

- **Node.js**: JavaScript runtime environment.
- **Express**: Fast, unopinionated web framework.
- **MongoDB & Mongoose**: Flexible NoSQL database and ODM.
- **Socket.io**: Real-time engine for event-driven communication.
- **Cloudinary**: Cloud-based image and video management.
- **Clerk**: OAuth authentication (Google, Apple).

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account (for image uploads)

### Configuration

#### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
PORT=5001
```

#### Frontend Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/AlgoChat.git
   cd AlgoChat
   ```

2. **Setup Backend**

   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Setup Frontend**

   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 🐳 Running with Docker

You can run the entire application using Docker Compose:

```bash
docker-compose up --build
```

This will start:

- **MongoDB** at `localhost:27017`
- **Backend** at `localhost:5001`
- **Frontend** at `localhost:3000`

---

## 📂 Project Structure

```text
AlgoChat/
├── client/           # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/    # Zustand Stores
│   │   └── lib/      # Shared Utilities
├── server/           # Node.js Backend (Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── lib/      # Core logic & DB config
├── docker-compose.yml
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by AlgoChat Team
</p>
