# ResumeForge AI

A local-first AI resume builder that creates tailored, ATS-compatible resumes from your verified career data using local AI (Ollama).

## Features

- **Master Career Profile** -- Centralized profile with experiences, education, skills, projects, certifications, and languages
- **Job Description Analysis** -- Local AI parses job postings to extract required skills, keywords, seniority, and responsibilities
- **Tailored Resume Generation** -- AI generates resume content only from your verified profile data; no fabricated claims
- **4 ATS-Safe LaTeX Templates** -- Classic Professional, Modern Minimal, Executive, Technical
- **Local PDF Compilation** -- LaTeX compilation in an isolated Docker container with resource limits
- **Resume Versioning** -- Full history of every generated version with diffs
- **Quality Checks** -- AI-powered detection of unsupported claims, keyword stuffing, repeated wording, and weak bullets
- **Dark / Light Theme** -- System-aware theme toggle
- **Fully Local** -- No cloud APIs, no external services. Your data never leaves your machine

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (localhost:3000)                               │
├─────────────────────────────────────────────────────────┤
│  Web (Next.js 15, React 19, Tailwind CSS)               │
│  ├── Prisma ORM                                         │
│  ├── BullMQ producer                                    │
│  └── Ollama HTTP client                                 │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL 16 │ Redis 7 │ Ollama (host)                │
├─────────────────────────────────────────────────────────┤
│  Worker (BullMQ)                                        │
│  ├── latex-compilation queue                            │
│  └── ai-processing queue                                │
├─────────────────────────────────────────────────────────┤
│  LaTeX Compiler (TeX Live, isolated container)           │
└─────────────────────────────────────────────────────────┘
```

### Services

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| `web` | Next.js 15, React 19 | `3000` | UI, API routes, AI inference |
| `postgres` | PostgreSQL 16 Alpine | `5432` | Persistent data storage |
| `redis` | Redis 7 Alpine | `6379` | Job queues (BullMQ) |
| `worker` | Node.js, BullMQ | -- | Async LaTeX compilation & AI processing |
| `latex-compiler` | TeX Live | -- | Sandboxed PDF generation |

## Prerequisites

- **Docker** and **Docker Compose** (v2+)
- **Node.js 20+** (for local development only)
- **Ollama** installed on the host machine ([ollama.ai](https://ollama.ai))

## Quick Start

```bash
# 1. Clone and configure
git clone <repo-url> && cd Resume
cp .env.example .env

# 2. Install Ollama and pull the default model
ollama pull qwen2.5:14b

# 3. Start all services
docker compose up --build

# 4. Run database migrations (in a second terminal)
docker compose exec web npx prisma migrate deploy

# 5. Seed demo data (optional, development only)
docker compose exec web npx tsx prisma/seed.ts

# 6. Open the app
open http://localhost:3000
```

## Demo Account

| | |
|---|---|
| Email | `demo@resumeforge.local` |
| Password | `Demo1234!` |

The seed script populates a full career profile for "Alex Chen" including 3 jobs, 20 skills, 2 projects, 2 certifications, and 3 languages.

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://resumeforge:resumeforge@postgres:5432/resumeforge?schema=public` | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Ollama API endpoint (see [Ollama Setup](#ollama-setup)) |
| `OLLAMA_MODEL` | `qwen2.5:14b` | Ollama model to use for inference |
| `AUTH_SECRET` | *(must set)* | Random string for JWT signing (min 32 chars) |
| `NEXTAUTH_URL` | `http://localhost:3000` | Application URL |
| `NODE_ENV` | `development` | `development` or `production` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public-facing URL |
| `STORAGE_PATH` | `./storage` | Where compiled PDFs and assets are stored |
| `WORKER_CONCURRENCY` | `2` | Number of concurrent worker jobs |
| `LATEX_COMPILE_TIMEOUT` | `30` | Seconds before LaTeX compilation times out |
| `LATEX_MEMORY_LIMIT` | `256m` | Memory limit for the latex-compiler container |
| `LATEX_CPU_LIMIT` | `1.0` | CPU limit for the latex-compiler container |

## Development

### Local Development (Docker)

```bash
# Start all services with hot reload
npm run dev

# Stop services
npm run down

# Stop and remove all data
npm run clean
```

### Local Development (Web only)

```bash
# Start just the web app with Turbopack
npm run dev:web

# Requires PostgreSQL and Redis running locally or via docker compose
docker compose up postgres redis
```

### Database Migrations

```bash
# Deploy migrations
npm run migrate

# Create a new migration (development)
npm run migrate:dev

# Seed demo data
npm run seed
```

### Lint and Type Check

```bash
npm run lint
npm run typecheck
```

### Testing

```bash
# Unit tests
npm test

# Unit tests (watch mode)
cd packages/web && npm run test:watch

# End-to-end tests (requires Playwright)
npm run test:e2e
```

## Ollama Setup

### Installation

1. Download and install from [ollama.ai](https://ollama.ai)
2. Start the Ollama service (runs on `http://localhost:11434` by default)
3. Pull the default model:

```bash
ollama pull qwen2.5:14b
```

### Changing the Model

1. Pull your preferred model:
   ```bash
   ollama pull llama3.1:8b
   ```
2. Update `OLLAMA_MODEL` in `.env`:
   ```
   OLLAMA_MODEL=llama3.1:8b
   ```
3. Restart the app: `docker compose up --build`

### Linux: `host.docker.internal` Workaround

On Linux, Docker containers cannot resolve `host.docker.internal` by default. You have two options:

**Option A -- Add to `docker-compose.yml` (recommended):**

```yaml
services:
  web:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**Option B -- Use the host network for Ollama:**

```
OLLAMA_BASE_URL=http://172.17.0.1:11434
```

(`172.17.0.1` is the default Docker bridge gateway)

### Verifying Ollama

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Check model availability
ollama list
```

## Templates

All templates use `%%PLACEHOLDER%%` tokens replaced at generation time and are compiled with `pdflatex`.

| Template | Description | Best For |
|----------|-------------|----------|
| **Classic Professional** | Traditional single-column layout with clear section headers | Corporate, finance, consulting |
| **Modern Minimal** | Clean design with subtle visual hierarchy | Tech, startups, design |
| **Executive** | Polished layout with prominent summary and leadership focus | Senior/VP/C-level roles |
| **Technical** | Categorized skill groups with monospace formatting, dense layout | Engineering, data science, DevOps |

Templates are located in `packages/latex-templates/` and can be customized by editing the `.tex` files directly.

## API Endpoints

### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/auth/me` | Get current user |

### Profile

| Method | Route | Description |
|--------|-------|-------------|
| `GET/PUT` | `/api/profile` | Get or update user profile |
| `GET/POST` | `/api/profile/experience` | List or create experience entries |
| `PUT/DELETE` | `/api/profile/experience/[id]` | Update or delete experience |
| `GET/POST` | `/api/profile/education` | List or create education entries |
| `PUT/DELETE` | `/api/profile/education/[id]` | Update or delete education |
| `GET/POST` | `/api/profile/skills` | List or create skills |
| `PUT/DELETE` | `/api/profile/skills/[id]` | Update or delete skill |
| `GET/POST` | `/api/profile/projects` | List or create projects |
| `PUT/DELETE` | `/api/profile/projects/[id]` | Update or delete project |
| `GET/POST` | `/api/profile/certifications` | List or create certifications |
| `PUT/DELETE` | `/api/profile/certifications/[id]` | Update or delete certification |
| `GET/POST` | `/api/profile/languages` | List or create languages |
| `PUT/DELETE` | `/api/profile/languages/[id]` | Update or delete language |

### Resumes

| Method | Route | Description |
|--------|-------|-------------|
| `GET/POST` | `/api/resumes` | List or create resumes |
| `GET/PUT/DELETE` | `/api/resumes/[id]` | Get, update, or delete a resume |
| `POST` | `/api/resumes/[id]/analyze` | Run AI job description analysis |
| `POST` | `/api/resumes/[id]/generate` | Generate tailored resume content |
| `POST` | `/api/resumes/[id]/quality-check` | Run AI quality check |
| `POST` | `/api/resumes/[id]/compile` | Queue LaTeX compilation |
| `GET` | `/api/resumes/[id]/latex` | Get LaTeX source |
| `GET` | `/api/resumes/[id]/versions` | List resume versions |
| `GET` | `/api/resumes/[id]/download/[type]` | Download PDF or LaTeX |

## Security

- **Local-only storage** -- No data leaves your machine; no external API calls
- **Password hashing** -- bcryptjs with 12 salt rounds
- **JWT sessions** -- HTTP-only cookies with 7-day expiry, signed with HS256
- **Rate limiting** -- Login attempts capped at 5 per 15-minute window per IP
- **LaTeX isolation** -- Compiled in a resource-limited container (`--no-shell-escape`, CPU/memory limits, timeout)
- **User data ownership** -- All queries are scoped to the authenticated user via foreign keys
- **Audit logging** -- Entity changes are recorded in an `AuditLog` table
- **Input validation** -- Zod schemas on all API inputs and AI responses

## Backup

### Database

```bash
docker compose exec postgres pg_dump -U resumeforge resumeforge > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
cat backup_20240101.sql | docker compose exec -T postgres psql -U resumeforge -d resumeforge
```

### Generated PDFs

PDFs are stored in the `resumeforge_storage` Docker volume. To export:

```bash
docker run --rm -v resumeforge_storage:/data -v $(pwd):/backup alpine \
  cp -r /data/resumes /backup/resumes_export
```

## Troubleshooting

### Ollama connection refused

Ensure Ollama is running on the host (`ollama serve`). If `host.docker.internal` doesn't resolve:

```bash
# Linux: add to docker-compose.yml under the web service
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### LaTeX compilation fails

Check worker logs for the compilation error:

```bash
docker compose logs worker
```

Common causes:
- Missing LaTeX packages (unlikely -- the container uses a full TeX Live install)
- Timeout (increase `LATEX_COMPILE_TIMEOUT`)
- Memory limit hit (increase `LATEX_MEMORY_LIMIT`)

### Database migration errors

Ensure PostgreSQL is healthy before running migrations:

```bash
docker compose exec web npx prisma migrate deploy
```

If the database is in a bad state, reset (destroys all data):

```bash
npm run clean
docker compose up --build
npm run migrate
npm run seed
```

### Redis connection errors

Verify Redis is running:

```bash
docker compose exec redis redis-cli ping
# Should return: PONG
```

### Port conflicts

If `3000`, `5432`, or `6379` are already in use, stop the conflicting service or change the port mappings in `docker-compose.yml`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, Zustand, TanStack Query |
| API | Next.js API Routes (App Router) |
| Auth | JWT (jose), bcryptjs, HTTP-only cookies |
| Database | PostgreSQL 16, Prisma 6 |
| Queue | BullMQ, Redis 7 |
| AI | Ollama (local inference), Zod schema validation |
| PDF | LaTeX (pdflatex), TeX Live |
| Testing | Vitest (unit/integration), Playwright (e2e) |
| Infra | Docker Compose |

## License

MIT
