# Real-time Messenger App

A full-stack real-time messaging application built with React, Node.js, Socket.io, and SQLite.

## Features

- ✅ User registration and authentication with phone numbers
- ✅ Real-time messaging with Socket.io
- ✅ Friend system - add friends by phone number
- ✅ Online/offline status indicators
- ✅ Typing indicators
- ✅ Message history
- ✅ Responsive design
- ✅ Production-ready deployment

## Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- Socket.io Client
- Axios
- React Router
- Lucide React (icons)
- Vite (build tool)

**Backend:**
- Node.js
- Express.js
- Socket.io
- SQLite3
- JWT Authentication
- bcryptjs
- CORS

## Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd real-time-messenger
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment setup:**
    Create a `.env` file in the root directory of the project.
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file. For local development, the default values should work.
    ```dotenv
    # .env
    NODE_ENV=development
    PORT=3001
    JWT_SECRET=your-super-secret-jwt-key-here-2024-messenger
    FRONTEND_URL=http://localhost:3000
    VITE_API_URL=http://localhost:3001
    ```

4.  **Run development server:**
    ```bash
    npm run dev
    ```
    This command uses `concurrently` to start both the backend server (on `http://localhost:3001`) and the frontend development server (on `http://localhost:3000`).

## Production Deployment

### 1. Environment Variables

**CRITICAL:** You **MUST** set these environment variables in your hosting platform's configuration. Do NOT commit your production `.env` file to version control.

```dotenv
# Example for production environment variables
NODE_ENV=production
PORT=3001 # Or whatever port your hosting platform assigns (e.g., 8080, 5000)
JWT_SECRET=a-very-strong-and-unique-secret-for-production-use-a-long-random-string
FRONTEND_URL=https://your-frontend-domain.com # e.g., https://messenger.vercel.app
VITE_API_URL=https://your-backend-api.com # e.g., https://messenger-api.railway.app
```
-   `NODE_ENV`: Set to `production`.
-   `PORT`: The port your backend server will listen on. Your hosting provider might inject this.
-   `JWT_SECRET`: A long, random, and secure string. **Do not use the default value in production.**
-   `FRONTEND_URL`: The full URL of your deployed frontend application. This is crucial for CORS.
-   `VITE_API_URL`: The full URL of your deployed backend API. This is used by the frontend to make API calls and establish Socket.io connections.

### 2. Build Frontend

Before deploying, you need to build the React frontend. This creates optimized static files.
```bash
npm run build
```
This command will create a `dist` folder containing your production-ready frontend assets.

### 3. Deploy Backend

The backend is a Node.js Express server. You can deploy it to platforms like:
-   **Railway**: Excellent for full-stack Node.js apps with SQLite support.
-   **Heroku**: Simple to deploy Node.js apps.
-   **DigitalOcean App Platform**: Scalable and reliable.
-   **AWS EC2/ECS, Google Cloud Run**: For more control and larger scale.

To start the backend server in production mode:
```bash
npm start
```
This script sets `NODE_ENV=production` and runs `node server/index.js`.

### 4. Deploy Frontend

The frontend is a static React application. You can deploy the `dist` folder to platforms like:
-   **Vercel**: Ideal for React apps, integrates well with Vite.
-   **Netlify**: Another great option for static sites.
-   **GitHub Pages**: For simple static hosting.
-   **Any static file host/CDN**.

### Common Deployment Issues & Troubleshooting

1.  **CORS Errors (`Not allowed by CORS`)**:
    *   **Cause**: Your frontend (origin) is trying to access your backend (resource) but the backend doesn't allow requests from that origin.
    *   **Fix**:
        *   Ensure `FRONTEND_URL` environment variable on your **backend** is set to the exact domain of your deployed frontend (e.g., `https://your-frontend-domain.com`).
        *   If your frontend is on a subdomain (e.g., `app.yourdomain.com`) and your API is on another (e.g., `api.yourdomain.com`), both need to be correctly configured.
        *   Check the `corsOptions` in `server/index.js` to ensure your production domain is explicitly allowed.

2.  **Socket.io Connection Issues (`WebSocket connection failed`, `connect_error`)**:
    *   **Cause**: Firewalls, proxy configurations, or incorrect URLs preventing WebSocket connections.
    *   **Fix**:
        *   Ensure `VITE_API_URL` environment variable on your **frontend** is set to the correct, publicly accessible URL of your backend API (e.g., `https://api.yourdomain.com`).
        *   Verify your hosting platform supports WebSockets and that they are not blocked. Some platforms require specific configurations.
        *   If using a reverse proxy (like Nginx), ensure it's configured to proxy WebSocket traffic.
        *   If your backend uses HTTPS, ensure your `VITE_API_URL` also uses `https://`.

3.  **Database Issues (`SQLITE_CANTOPEN`, `permission denied`)**:
    *   **Cause**: The SQLite database file (`server/messenger.db`) cannot be created or written to in the production environment due to insufficient permissions or read-only file systems.
    *   **Fix**:
        *   Ensure your hosting environment provides write access to the directory where `messenger.db` is stored (`server/`).
        *   Some serverless platforms or immutable file systems might not be suitable for SQLite. Consider using a hosted database solution (e.g., PostgreSQL, MySQL) if SQLite is problematic in your chosen environment. For this project, if SQLite is a hard requirement, choose a platform that allows persistent storage and write access (like Railway, Heroku with add-ons, or a traditional VPS).

4.  **Frontend not loading/blank page**:
    *   **Cause**: Incorrect base URL for API calls, or issues with static file serving.
    *   **Fix**:
        *   Double-check `VITE_API_URL` in your frontend's environment variables.
        *   Ensure your static file host is correctly serving the `dist` folder.
        *   Check browser console for JavaScript errors or network request failures.

5.  **Server not starting (`Port already in use`, `EADDRINUSE`)**:
    *   **Cause**: Another process is using the specified port, or the server is trying to bind to `localhost` instead of `0.0.0.0`.
    *   **Fix**:
        *   Ensure your `PORT` environment variable is correctly set and not conflicting. Many hosting platforms inject their own `PORT` variable.
        *   The server is configured to listen on `0.0.0.0`, which is correct for production.

## API Endpoints

### Authentication
-   `POST /api/auth/register` - Register new user
-   `POST /api/auth/login` - Login user
-   `GET /api/auth/me` - Get current user

### Friends
-   `GET /api/friends` - Get user's friends
-   `POST /api/friends/add` - Add friend by phone

### Messages
-   `GET /api/messages/:friendId` - Get message history

### Health Check
-   `GET /` - Basic server status
-   `GET /api/health` - Detailed API server status

## Socket Events

### Client to Server
-   `authenticate` - Authenticate socket connection
-   `join_conversation` - Join chat room
-   `send_message` - Send message
-   `typing` - Typing indicator

### Server to Client
-   `auth_success` - Authentication successful
-   `auth_error` - Authentication failed
-   `new_message` - New message received
-   `message_history` - Load previous messages
-   `user_typing` - User typing status
-   `users_online` - Online users list

## Database Schema

### Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Friends
```sql
CREATE TABLE friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  status TEXT DEFAULT 'accepted',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Messages
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Contributing

1.  Fork the repository
2.  Create a feature branch
3.  Make your changes
4.  Add tests if applicable
5.  Submit a pull request

## License

MIT License - see LICENSE file for details