# Taskly — weekly to-do planner

[![ci](https://github.com/shrijit37/assignment/actions/workflows/ci.yml/badge.svg)](https://github.com/shrijit37/assignment/actions/workflows/ci.yml)

Live at <https://todo.shrijit.tech>.

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
├── Dockerfile           multi-stage production image
└── docker-compose.yaml  web + mongo stack used in production
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
| `STATIC_DIR` | no | Folder with the compiled client. When set, the API serves the app and the API from one origin |
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

The app runs as a single Express process that also serves the compiled client, plus a
MongoDB container. Both are defined in `docker-compose.yaml` and deployed to
[Coolify](https://coolify.io) at <https://todo.shrijit.tech>.

```bash
cp .env.example .env        # only CLIENT_ORIGIN and SERVICE_PASSWORD_MONGO are read here
docker compose up --build
```

`docker compose` builds the image from the `Dockerfile` (Node 24, compiled workspaces,
production dependencies only, non-root user) and stores MongoDB in the `mongo-data`
volume. Coolify generates `SERVICE_PASSWORD_MONGO` on the first deploy and keeps it, so
the database credentials survive redeploys.

### Continuous deployment

`.github/workflows/ci.yml` runs on every push and pull request: install, type-check, test
and build. On `feat/weekly-planner` a passing run then calls the Coolify deploy webhook
and waits until the new container answers `/api/health`.

Two repository secrets are needed:

| Secret | Where to get it |
| --- | --- |
| `COOLIFY_WEBHOOK` | Application → Webhooks → Deploy webhook |
| `COOLIFY_TOKEN` | Keys & Tokens → API tokens |

The Coolify application itself points at this repository with the **Docker Compose** build
pack, so a deploy means "pull, rebuild, restart" — no manual steps. Auto-deploy stays off
on purpose: only commits that pass CI reach production.

### Running the same image without Coolify

```bash
docker build -t taskly .
docker run --rm -p 4000:4000 \
  -e MONGODB_URI="mongodb://…" \
  -e CLIENT_ORIGIN="http://localhost:4000" \
  taskly
```

## Notes

- There is no authentication; the assessment does not ask for user accounts, so all tasks
  live in one shared list.
- Swipe to delete is a touch gesture. The same delete action is always available from the
  row button and from the edit sheet, so the app stays usable with a keyboard or mouse.
- Priority and an end time are optional extras required by the brief but not visible in the
  Figma frames; they follow the same visual language.
