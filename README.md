# Lumina

Lumina is a full-stack AI resume builder and job application tracker. The app combines a React/Vite frontend with an Express/Sequelize backend for authentication, resume generation, resume storage, job board state, analytics, admin tools, and interview reminders.

## Repository Layout

```text
.
|-- lumina-backend-master/
|   `-- lumina-backend-master/      # Express API
`-- lumina-frontend-master/
    `-- lumina-frontend-master/     # React + Vite app
```

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, MUI |
| Backend | Node.js, Express 5, Sequelize |
| Database | SQLite for local development, PostgreSQL for production |
| AI | Google Gemini via `@google/generative-ai` |
| Auth | JWT, Google OAuth |
| Testing | Jest/Supertest on backend, ESLint/build checks on frontend |

## Prerequisites

- Node.js 18 or newer
- npm
- A Google Gemini API key for AI generation
- Optional: Google OAuth client ID, Cloudinary credentials, SMTP/Gmail app password, PostgreSQL database URL

## Backend Setup

```bash
cd lumina-backend-master/lumina-backend-master
npm install
```

Create `lumina-backend-master/lumina-backend-master/.env`:

```env
PORT=5002
NODE_ENV=development
JWT_SECRET=change_me
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GEMINI_MODEL=gemini-2.5-flash

# Optional email reminders
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
GMAIL_FROM="Lumina <your-email@gmail.com>"

# Optional uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Production
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=postgresql://user:password@host:5432/database
```

Run the API:

```bash
npm run dev
```

The backend runs on `http://localhost:5002`. API routes are mounted under `http://localhost:5002/api`.

## Frontend Setup

```bash
cd lumina-frontend-master/lumina-frontend-master
npm install
```

Create `lumina-frontend-master/lumina-frontend-master/.env`:

```env
VITE_API_URL=http://localhost:5002/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Run the app:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Common Commands

Backend:

```bash
npm run dev
npm start
npm test
npm run test:unit
npm run test:integration
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Main API Areas

| Route | Purpose |
| --- | --- |
| `GET /health` | Backend health status |
| `POST /api/auth/signup` | Create an account |
| `POST /api/auth/login` | Log in with email and password |
| `POST /api/auth/google` | Log in with Google OAuth |
| `GET /api/auth/board` | Load the user's job board |
| `POST /api/auth/board` | Save the user's job board |
| `/api/resumes` | Resume CRUD, import, upload, download, AI generation, match scoring |
| `/api/reminders` | Interview reminder scheduling and email status |
| `/api/admin` | Protected admin dashboard endpoints |


