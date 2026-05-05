# Lumina - AI Resume Builder

Lumina is a React/Vite frontend for building AI-assisted resumes, managing resume versions, and tracking job applications through a visual pipeline.

## Features

### Resume Builder

- AI-powered resume content generation.
- Rich text editing with Lexical.
- Drag-and-drop section reordering with dnd-kit.
- Live resume preview and PDF export.
- Resume import, upload, download, and saved resume management.
- Resume-to-job match scoring.

### Job Tracker

- Kanban-style application pipeline.
- Saved, Applied, Screening, Aptitude, Technical, Interview, and Offer stages.
- Resume linking and AI tailoring workflows.
- One-way status progression to keep job history consistent.
- Offer-stage celebration.

### Analytics And Reminders

- Application funnel charts with Recharts.
- Status history per job card.
- Round scheduling for aptitude, technical, and interview steps.
- Interview reminders backed by the API email service.

### Auth And Admin

- Email/password signup and login.
- Google OAuth sign-in through `@react-oauth/google`.
- Protected routes for normal users and admins.
- Admin dashboard backed by `/api/admin` endpoints.
- Board state synced to the backend with local fallback behavior.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React 19, Vite |
| Language | TypeScript and JavaScript |
| Styling | Tailwind CSS, Emotion |
| UI | MUI, Lucide React |
| Rich Text | Lexical |
| Drag And Drop | dnd-kit |
| Animations | Framer Motion |
| HTTP | Axios |
| Routing | React Router DOM 7 |
| Charts | Recharts |
| Notifications | Sonner |
| Auth | JWT, Google OAuth |

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- The Lumina backend running on `http://localhost:5002`

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` in this directory:

```env
VITE_API_URL=http://localhost:5002/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

`VITE_API_URL` should include `/api` because the frontend calls endpoints such as `/auth/login`, `/resumes`, `/reminders`, and `/admin`.

### Run Locally

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

### Build For Production

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Project Structure

```text
src/
|-- components/     # Reusable UI, dashboard, auth, layout components
|-- context/        # Resume/global state
|-- hooks/          # Custom React hooks
|-- lib/            # Axios client and shared library setup
|-- pages/          # Route-level screens
|-- services/       # API service layer
|-- types/          # TypeScript types
|-- utils/          # Constants and helpers
`-- App.jsx         # Router configuration
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## License

See the project license metadata.
