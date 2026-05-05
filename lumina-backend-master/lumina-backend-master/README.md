# Lumina API - Resume & Job Tracker Backend

The REST API powering Lumina, an AI-assisted resume builder and job application tracker.

Built with Express.js and Sequelize, this server handles authentication, Google Gemini resume generation, resume storage, file uploads, job board persistence, admin APIs, and interview reminder emails.

## Features

- JWT-based signup, login, and Google OAuth.
- Resume generation with Google Gemini through `@google/generative-ai`.
- Resume CRUD, import, download, and optional Cloudinary uploads.
- Resume-to-job match scoring.
- User job board persistence.
- Interview reminder scheduling with Gmail or SMTP delivery.
- Protected admin routes for user and platform management.
- Helmet, CORS, compression, request logging, and rate limiting.
- Jest and Supertest test coverage.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| Framework | Express.js 5 |
| ORM | Sequelize |
| Database | SQLite local, PostgreSQL production |
| AI | Google Gemini |
| Auth | JWT, Google Auth Library |
| File Upload | Multer, Cloudinary |
| Validation | Zod |
| Logging | Winston, winston-daily-rotate-file |
| Testing | Jest, Supertest |

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A Google Gemini API key
- Optional: PostgreSQL database for production

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` in this directory:

```env
PORT=5002
NODE_ENV=development
JWT_SECRET=change_me

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Gemini AI
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Reminder emails via Gmail
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
GMAIL_FROM="Lumina <your-gmail-address@gmail.com>"

# Or generic SMTP
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM="Lumina <your-email@gmail.com>"

# Optional uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Production
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Run Locally

```bash
npm run dev
```

The server starts at `http://localhost:5002`. API routes are mounted under `/api`.

## API Reference

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Service, database, and AI configuration status |
| `GET` | `/ping` | Simple liveness check |

### Auth - `/api/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/signup` | No | Register a new user |
| `POST` | `/login` | No | Login with email and password |
| `POST` | `/google` | No | Login with Google OAuth token |
| `GET` | `/board` | Yes | Get the authenticated user's job board |
| `POST` | `/board` | Yes | Save the authenticated user's job board |

### Resumes - `/api/resumes`

All routes require authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | List resumes for the current user |
| `POST` | `/` | Save a new resume |
| `GET` | `/:id` | Get a resume by ID |
| `DELETE` | `/:id` | Delete a resume |
| `POST` | `/generate` | Generate resume content with AI |
| `POST` | `/match-score` | Analyze resume fit against a job description |
| `POST` | `/import` | Import a resume from a file |
| `POST` | `/:id/upload` | Upload a file attachment |
| `GET` | `/:id/download` | Download a resume file |

### AI - `/api/generate`

| Method | Endpoint | Auth | Rate Limit | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/generate` | No | 5 requests/minute | Generate resume content via Gemini |

### Reminders - `/api/reminders`

All routes require authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/email-status` | Check email reminder configuration |
| `GET` | `/` | List scheduled reminders |
| `POST` | `/` | Create a reminder |
| `DELETE` | `/:id` | Cancel a reminder |

### Admin - `/api/admin`

Admin routes require authentication and admin access.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/stats` | Dashboard statistics |
| `GET` | `/users` | List users |
| `GET` | `/users/:userId` | Get a user by ID |
| `POST` | `/users/:userId/impersonate` | Issue impersonation token |
| `PATCH` | `/users/:userId/credits` | Update user credits |
| `PATCH` | `/users/:userId/status` | Update user status |
| `POST` | `/users/:userId/reset-password` | Reset a user password |
| `DELETE` | `/users/:userId` | Delete a user |
| `GET` | `/logs` | Read system logs |

## Project Structure

```text
src/
|-- bots/          # AI bot and prompt logic
|-- config/        # Database, AI client, Cloudinary, logger
|-- controllers/   # Route handlers
|-- middleware/    # Auth, errors, uploads
|-- models/        # Sequelize models
|-- routes/        # Express routers
|-- services/      # AI, email, reminder services
`-- utils/         # Shared constants/utilities
server.js          # App entry point
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm test` | Run tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |

## License

ISC
