# Taskly — weekly to-do planner

A full-stack task planner built around one idea: plan the week Monday to Sunday, see what
is still open, and tick things off as the week goes.

The interface follows the supplied Figma — search on top, day strip, weekly counters,
progress bar and floating add button — with the extra behaviour the brief asks for
(weekly grouping, expandable weeks, swipe to delete, search).

## Features

- Create, view, edit and delete tasks
- Required title, date and start time; optional end time, priority and description
- `In progress` / `Completed` status with optimistic updates
- Tasks grouped into Monday–Sunday weeks with open/completed counts
- Weekly progress bar plus completed and open counters
- Expandable week cards, current week open by default
- Search across titles and descriptions
- Swipe left on a task to reveal delete, with a confirmation step
- Responsive from 320 px phones to wide desktops
- Keyboard accessible dialogs, form validation and visible delete actions

## Stack

| Layer | Choice |
| --- | --- |
| Client | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, React Hook Form, date-fns |
| API | Node.js, Express 5, TypeScript, Zod |
| Database | MongoDB with Mongoose |
| Tests | Vitest, Testing Library, Supertest, mongodb-memory-server |

## Project structure

```
todo-list-app/
├── client/              React application
│   └── src/
│       ├── api/         fetch wrapper and task endpoints
│       ├── components/  shared UI primitives
│       ├── features/    task domain components and forms
│       ├── hooks/       query hooks and the swipe gesture
│       ├── lib/         week maths and helpers
│       └── pages/       onboarding, planner and search
├── server/              Express API
│   └── src/
│       ├── config/      environment and database
│       ├── controllers/ request handlers
│       ├── middleware/  error handling
│       ├── models/      Mongoose schema
│       ├── routes/      route table
│       └── validators/  Zod schemas
└── netlify.toml         client deployment
```

## Getting started

Requirements: Node 20 or newer and npm.

```bash
npm install
npm run dev:memory
```

`dev:memory` starts the API against a throwaway in-memory MongoDB, so nothing has to be
installed locally. The client runs on <http://localhost:5173> and proxies `/api` to
<http://localhost:4000>.

To use a real database instead:

```bash
cp server/.env.example server/.env      # set MONGODB_URI
cp client/.env.example client/.env
npm run dev
```

### Environment variables

Server (`server/.env`):

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes, unless `USE_MEMORY_DB=1` | MongoDB connection string |
| `PORT` | no | API port, defaults to `4000` |
| `CLIENT_ORIGIN` | no | Comma separated allowed origins, defaults to `http://localhost:5173` |
| `USE_MEMORY_DB` | no | `1` boots an in-memory database for local development |

Client (`client/.env`):

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | no | API origin. Leave empty to use the Vite proxy in development |

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/tasks` | List tasks, ordered by start time |
| `GET` | `/api/tasks/:id` | Fetch a single task |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update fields or status |
| `DELETE` | `/api/tasks/:id` | Delete a task |

`GET /api/tasks` accepts `search` (title and description, case insensitive), `status`,
`from` and `to`.

```bash
curl -X POST http://localhost:4000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Finishing wireframe","scheduledAt":"2026-11-13T09:00:00.000Z","priority":"high"}'
```

Errors come back as `{ "message": "...", "fields": { "title": ["..."] } }`.

### Task shape

```json
{
  "id": "673f1c2b9f1e4a0012ab34cd",
  "title": "Finishing wireframe",
  "description": "Home screen and weekly overview",
  "scheduledAt": "2026-11-13T09:00:00.000Z",
  "endsAt": "2026-11-13T10:30:00.000Z",
  "priority": "high",
  "status": "in_progress",
  "createdAt": "2026-11-12T18:02:11.000Z",
  "updatedAt": "2026-11-12T18:02:11.000Z"
}
```

## Week rules

- Weeks start on Monday and end on Sunday.
- Dates are entered in the browser's timezone, stored as UTC ISO strings and shown in
  local time again.
- A week is identified by the Monday it starts on, so moving a task to another date moves
  it to that week's card.
- Week totals count `in_progress` as open and `completed` as done.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API and client with a configured database |
| `npm run dev:memory` | API with an in-memory database, plus the client |
| `npm run build` | Type-check and build both workspaces |
| `npm run start` | Run the compiled API |
| `npm test` | API and client test suites |
| `npm run typecheck` | Type-check both workspaces |

## Tests

```bash
npm test
```

The API suite talks to a real MongoDB instance started by `mongodb-memory-server`, so it
covers validation, filtering, search escaping, status changes and deletion without needing
a local database. The client suite covers week maths, task rows and form validation.

## Deployment

**API (Render or similar)**

1. Create a MongoDB Atlas cluster and copy its connection string.
2. Create a web service from this repository.
3. Build command: `npm install && npm run build -w server`
4. Start command: `npm start`
5. Environment: `MONGODB_URI`, `CLIENT_ORIGIN=https://your-site.netlify.app`, `NODE_ENV=production`

**Client (Netlify)**

1. Import the repository; `netlify.toml` already sets the build command, publish directory
   and SPA redirect.
2. Add `VITE_API_BASE_URL=https://your-api.onrender.com`.
3. Deploy, then add the Netlify origin to `CLIENT_ORIGIN` on the API and redeploy it.

## Notes

- There is no authentication; the assessment does not ask for user accounts, so all tasks
  live in one shared list.
- Swipe to delete is a touch gesture. The same delete action is always available from the
  row button and from the edit sheet, so the app stays usable with a keyboard or mouse.
- Priority and an end time are optional extras required by the brief but not visible in the
  Figma frames; they follow the same visual language.
