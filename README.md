# TaskFlow - Real-Time Collaborative Task Management System

A full-stack MERN application for project and task management with real-time updates, user collaboration, and email verification.

Live Demo: [https://codeaedoc.github.io/TaskFlow](https://codeaedoc.github.io/TaskFlow)

## 🚀 Features

## Authentication & User Management

*   User Registration with email verification
    
*   JWT-based Authentication with secure token management
    
*   Email Verification via SendGrid
    
*   Password Hashing with bcryptjs
    
*   Session Management (7-day token expiry)
    
*   User Search functionality for collaboration
    
*   Profile Management with user details
    

## Project Management

*   Create Projects with custom details
    
*   Project Dashboard with overview statistics
    
*   Add Team Members to projects
    
*   Project-specific Task Management
    
*   Member Permissions (restrict task assignment to project members)
    

## Task Management

*   CRUD Operations for tasks (Create, Read, Update, Delete)
    
*   Task Assignment to specific project members
    
*   Task Status Tracking
    
*   Task Statistics on dashboard
    
*   Organized Task Views by project
    

## Real-Time Features

*   Socket.io Integration for live updates
    
*   Real-time Task Updates across all connected clients
    
*   Live Notifications for task changes
    
*   Instant Collaboration without page refresh
    

## User Interface

*   Responsive Dashboard with task statistics
    
*   Toast Notifications with React Toastify
    
*   Dark Theme interface
    
*   Intuitive Navigation between projects and tasks
    
*   Organized Folder Structure for maintainability
    

## Email System

*   SendGrid Integration for transactional emails
    
*   Verification Email on registration
    
*   Resend Verification option
    
*   Email Templates for consistent branding
    

## 🛠️ Tech Stack

Frontend:

*   React 18
    
*   React Router v6
    
*   Context API (Auth, Project, Task, Notification contexts)
    
*   Socket.io Client
    
*   Vite
    
*   React Toastify
    
*   Deployed on GitHub Pages
    

Backend:

*   Node.js & Express
    
*   MongoDB with Mongoose
    
*   JWT (JSON Web Tokens)
    
*   Socket.io Server
    
*   SendGrid API
    
*   Express Validator
    
*   Bcryptjs
    
*   Crypto (for token generation)
    

## 📋 Prerequisites

*   Node.js (v14 or higher)
    
*   MongoDB database
    
*   SendGrid API key with verified sender
    
*   npm or yarn
    
*   Git
    

## 🔧 Installation

## Backend Setup

1.  Clone the repository:
    

bash

`git clone https://github.com/CodeAedoC/TaskFlow.git cd TaskFlow/backend`

2.  Install dependencies:
    

bash

`npm install`

3.  Create `.env` file in the backend directory:
    

text

`PORT=5000 MONGODB_URI=your_mongodb_connection_string JWT_SECRET=your_jwt_secret_key_at_least_32_characters CLIENT_URL=https://codeaedoc.github.io/TaskFlow SENDGRID_API_KEY=SG.your_sendgrid_api_key SENDGRID_FROM_EMAIL=your_verified_sender_email@domain.com`

4.  Start the backend server:
    

bash

`npm start # or for development npm run dev`

## Frontend Setup

1.  Navigate to frontend directory:
    

bash

`cd ../frontend`

2.  Install dependencies:
    

bash

`npm install`

3.  Create `.env` file in the frontend directory:
    

text

`VITE_API_URL=your_backend_url VITE_SOCKET_URL=your_backend_websocket_url`

4.  Ensure `vite.config.js` is configured:
    

javascript

`import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({   base: '/TaskFlow/',   plugins: [react()], });`

5.  Update `package.json`:
    

json

`{   "homepage": "https://codeaedoc.github.io/TaskFlow",   "scripts": {     "dev": "vite",     "build": "vite build",     "predeploy": "npm run build",     "deploy": "gh-pages -d dist"   } }`

6.  Run development server:
    

bash

`npm run dev`

## 🚢 Deployment

## Frontend (GitHub Pages)

1.  Build the project:
    

bash

`npm run build`

2.  Deploy to GitHub Pages:
    

bash

`npm run deploy`

## Backend (Render/Railway/Heroku)

Environment Variables to Set:

*   `CLIENT_URL=https://codeaedoc.github.io/TaskFlow`
    
*   `MONGODB_URI=your_connection_string`
    
*   `JWT_SECRET=your_secret`
    
*   `SENDGRID_API_KEY=your_key`
    
*   `SENDGRID_FROM_EMAIL=your_email`
    
*   `PORT=5000` (if required)
    

Important: Restart your backend service after setting environment variables.

## 📁 Project Structure

text

# TaskFlow Project Structure

.
 * [backend/](./backend)
   * [models/](./backend/models)
     * [user.models.js](./backend/models/user.models.js) - User schema with authentication
     * [project.models.js](./backend/models/project.models.js) - Project schema
     * [task.models.js](./backend/models/task.models.js) - Task schema
   * [routes/](./backend/routes)
     * [auth.routes.js](./backend/routes/auth.routes.js) - Authentication endpoints
     * [project.routes.js](./backend/routes/project.routes.js) - Project CRUD operations
     * [task.routes.js](./backend/routes/task.routes.js) - Task management endpoints
   * [middleware/](./backend/middleware)
     * [auth.middleware.js](./backend/middleware/auth.middleware.js) - JWT verification
   * [utils/](./backend/utils)
     * [email.utils.js](./backend/utils/email.utils.js) - SendGrid email functions
   * [server.js](./backend/server.js) - Express server setup
   * [package.json](./backend/package.json)
 * [frontend/](./frontend)
   * [src/](./frontend/src)
     * [components/](./frontend/src/components)
       * [Auth/](./frontend/src/components/Auth) - Login, Register, Email Verification
       * [Dashboard/](./frontend/src/components/Dashboard) - Main dashboard views
       * [Projects/](./frontend/src/components/Projects) - Project components
       * [Tasks/](./frontend/src/components/Tasks) - Task components
       * [Layout/](./frontend/src/components/Layout) - Navbar, Sidebar, Routes
     * [context/](./frontend/src/context)
       * [AuthContext.jsx](./frontend/src/context/AuthContext.jsx) - Authentication state
       * [ProjectContext.jsx](./frontend/src/context/ProjectContext.jsx) - Project state
       * [TaskContext.jsx](./frontend/src/context/TaskContext.jsx) - Task state
       * [NotificationContext.jsx](./frontend/src/context/NotificationContext.jsx) - Socket.io notifications
     * [App.jsx](./frontend/src/App.jsx) - Main app component with routes
     * [main.jsx](./frontend/src/main.jsx) - React entry point with BrowserRouter
   * [public/](./frontend/public)
     * [index.html](./frontend/public/index.html) - HTML template
     * [404.html](./frontend/public/404.html) - SPA routing fallback
   * [vite.config.js](./frontend/vite.config.js) - Vite configuration
   * [package.json](./frontend/package.json)
 * [README.md](./README.md)


## 🔌 API Endpoints

## Authentication

*   `POST /api/auth/register` - Register new user with email verification
    
*   `POST /api/auth/login` - Login user (requires verified email)
    
*   `GET /api/auth/me` - Get current authenticated user
    
*   `POST /api/auth/verify-email` - Verify email with token
    
*   `POST /api/auth/resend-verification` - Resend verification email
    

## User Management

*   `GET /api/auth/search?q=query` - Search users by name or email
    
*   `GET /api/auth/users` - Get all users (authenticated)
    

## 🔍 Development & Debugging

## Debug Backend URL Generation

Add to registration endpoint:

javascript

``const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`; console.log("🔍 CLIENT_URL:", process.env.CLIENT_URL); console.log("🔍 Generated URL:", verificationUrl);``

## Check Environment Variables

Add test endpoint:

javascript

``router.get("/test-url", (req, res) => {   res.json({     CLIENT_URL: process.env.CLIENT_URL,     generatedURL: `${process.env.CLIENT_URL}/verify-email?token=TEST123`,     allClientKeys: Object.keys(process.env).filter(k => k.includes('CLIENT'))   }); });``


## 🎨 Features in Detail

## Context Providers

The app uses multiple context providers for state management:

*   AuthContext - User authentication state
    
*   ProjectContext - Project management state
    
*   TaskContext - Task management state
    
*   NotificationContext - Real-time notifications via Socket.io
    

## Security Features

*   Password hashing with bcryptjs (salt rounds: 10)
    
*   JWT tokens with 7-day expiration
    
*   Email verification required before login
    
*   Token-based verification with 24-hour expiry
    
*   Protected routes with authentication middleware
    
*   Input validation with Express Validator
    

## 📝 Usage

1.  Register a new account with your email
    
2.  Check email for verification link
    
3.  Verify your email address
    
4.  Login with credentials
    
5.  Create projects and add team members
    
6.  Create tasks and assign to project members
    
7.  Track progress on the dashboard
    
8.  Collaborate in real-time with team members
    
