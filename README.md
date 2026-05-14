# Bulk Email Sender - Professional SaaS Edition

A modern, production-grade bulk email campaign manager built with SvelteKit and Hono. This project features a robust throttling engine, persistent scheduling, and a premium SaaS-style interface.

## 🚀 Tech Stack

### Frontend (Client)
- **Framework**: SvelteKit 5 (Runes)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (Server State) & Svelte Runes (Client State)
- **Icons**: Lucide Svelte
- **Editor**: Quill.js (WYSIWYG)
- **Validation**: Zod
- **Notifications**: Svelte Sonner

### Backend (Server)
- **Framework**: Hono (Node/Bun runtime)
- **Database**: SQLite (via `bun:sqlite`)
- **Email Engine**: Nodemailer
- **Authentication**: Argon2 hashing & Signed HMAC-SHA256 sessions
- **Storage**: Persistent scheduler and user databases

## 📂 Project Structure

```text
├── server/               # Hono API Backend
│   ├── src/
│   │   ├── routes/       # API Endpoints
│   │   ├── services/     # Business Logic (Email, Scheduler, DB)
│   │   └── app.ts        # API Entry point
│   ├── data/             # SQLite Databases
│   └── uploads/          # Uploaded Assets
├── src/                  # SvelteKit Frontend
│   ├── lib/
│   │   ├── api/          # API Service Layer (Centralized Client)
│   │   ├── components/   # Reusable UI Components
│   │   ├── stores/       # Auth & UI State (Runes)
│   │   └── validations/  # Zod Schemas
│   └── routes/           # Dashboard & Auth Pages
└── static/               # Static Assets
```

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js 18+ or Bun 1.0+

### 2. Environment Configuration
Create a `.env` file in the root:
```env
PUBLIC_API_BASE_URL=http://localhost:3000
```
Create a `.env` file in the `server/` directory:
```env
PORT=3000
SESSION_SECRET=your_super_secret_key
# Optional Global SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Installation
```bash
# Install root (frontend) dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 4. Running the Project
Open two terminals:

**Terminal 1 (Backend)**:
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend)**:
```bash
npm run dev
```

## ✨ Key Features

- **Professional API Layer**: Centralized fetch wrapper with request/response interceptors.
- **Modern Auth Flow**: Secure session handling with route guards and persistent login state.
- **Smart Throttling**: Batch email sending with customizable delays to prevent provider blocks.
- **Persistent Scheduling**: Schedule campaigns to run in the future; survives server restarts.
- **Recipient Management**: Bulk upload Excel/CSV files with instant preview and validation.
- **Rich Text Composing**: Full WYSIWYG editor for professional email designs.

## 🔒 Security Improvements
- **Signed Sessions**: Session tokens are cryptographically signed to prevent tampering.
- **Argon2 Hashing**: Industry-leading password security.
- **Strict CORS**: Restricted API access to authorized frontend origins.
- **Validation**: Strict input validation using Zod on the frontend and schema-based checks on the backend.

## 📈 Future Enhancements
- **Real-time Updates**: Integration with WebSockets (Hono + SvelteKit) for live progress tracking.
- **Advanced Analytics**: Interactive charts for open rates and click-through rates.
- **Template Gallery**: Save and reuse professional email templates.
