# ⚙️ AlgoChat Backend

The backend for AlgoChat is a Node.js API built with Express, MongoDB, and Socket.io.

## 🚀 Getting Started

### Prerequisites

- Node.js
- MongoDB

### Environment Variables

Create a `.env` file based on `.env.example`:

- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret for JSON Web Tokens.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.

### Running Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start in development mode:

   ```bash
   npm run dev
   ```

3. Start in production mode:

   ```bash
   npm start
   ```

## 🛠️ Features

- User authentication (JWT)
- Real-time communication (Socket.io)
- Database modeling (Mongoose)
- Image storage (Cloudinary)
- Security middleware (CORS, Cookie Parser)
