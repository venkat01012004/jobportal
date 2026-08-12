# Job Portal

A fully Dockerized full-stack Job Portal with two login roles — **Job Seeker** and
**Recruiter** — built with React, Node.js/Express, MySQL, and Nginx.

```
Browser
   │
   ▼
┌─────────────┐   /api/*   ┌─────────────┐        ┌───────────┐
│    Nginx    │──────────▶│   Backend   │───────▶│   MySQL   │
│ (reverse    │            │ (Express +  │        │  (data +  │
│  proxy)     │   /*       │  JWT auth)  │        │  volume)  │
│ :8080       │──────────▶├─────────────┤        └───────────┘
└─────────────┘            │  Frontend   │
                            │ (React SPA, │
                            │  served by  │
                            │ its own     │
                            │  Nginx)     │
                            └─────────────┘
```

Four separate containers: **frontend**, **backend**, **mysql**, and **nginx**,
connected over a private Docker network, with named volumes for the database
and uploaded resumes.

---

## Features

- **Two roles**: Job Seeker and Recruiter, chosen at registration
- **JWT authentication**: stateless auth, tokens stored client-side, verified on every protected request
- **Recruiter**
  - Create, edit, delete job postings
  - Open/close a listing
  - View applicants per job, download resumes, update application status
    (pending → reviewed → shortlisted → accepted/rejected)
- **Job Seeker**
  - Search/filter jobs by keyword, location, job type
  - View job details
  - Apply with a resume upload (PDF/DOC/DOCX, up to 5MB) and optional cover letter
  - Track all submitted applications and their status
- **Resume storage**: uploaded to a dedicated Docker volume, only ever served
  back through an authenticated API route (never exposed as static files)
- **Health checks** on every container, `depends_on: condition: service_healthy`
  so services start in the correct order

---

## Tech stack

| Layer     | Technology                              |
|-----------|------------------------------------------|
| Frontend  | React 18, React Router, Axios            |
| Backend   | Node.js 18, Express, JWT, bcryptjs, multer |
| Database  | MySQL 8                                  |
| Proxy     | Nginx (reverse proxy + static file server) |
| Orchestration | Docker, Docker Compose               |

---

## Project structure

```
job-portal/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── uploads/                 # resume storage (mounted as a volume)
│   └── src/
│       ├── index.js             # Express app entry point + /api/health
│       ├── config/db.js         # MySQL connection pool
│       ├── middleware/          # auth.js (JWT), upload.js (multer)
│       ├── models/              # userModel, jobModel, applicationModel
│       ├── controllers/         # authController, jobController, applicationController
│       └── routes/              # authRoutes, jobRoutes, applicationRoutes
├── frontend/
│   ├── Dockerfile                # multi-stage build -> served by internal Nginx
│   ├── nginx.frontend.conf
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── api/axios.js          # API client with JWT interceptor
│       ├── context/AuthContext.js
│       ├── components/           # Navbar, JobCard, StatusStamp, PrivateRoute
│       └── pages/                # Login, Register, JobsBrowse, JobDetails,
│                                  # MyApplications, RecruiterDashboard, JobForm, Applicants
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf                # public reverse proxy: / -> frontend, /api -> backend
└── mysql/
    └── init.sql                  # schema: users, jobs, applications
```

---

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2 (the `docker compose` command, bundled with modern Docker Desktop/Engine)

---

## Quick start

```bash
# 1. Clone / unzip the project, then move into it
cd job-portal

# 2. Create your environment file from the example
cp .env.example .env
# (edit .env if you want different passwords / ports / JWT secret)

# 3. Build and start everything
docker compose up -d --build

# 4. Watch the logs until all containers report healthy
docker compose ps
```

Once all four containers show `healthy`, open:

- **App**: http://localhost:8080  (or whatever `NGINX_PORT` you set)

The Nginx container is the single public entrypoint — the frontend and
backend containers are not published to the host directly.

### Stopping / resetting

```bash
# Stop containers, keep data
docker compose down

# Stop containers and wipe the database + uploaded resumes
docker compose down -v
```

---

## Environment variables (`.env.example`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `root_super_secret` |
| `MYSQL_DATABASE` | Database name | `job_portal` |
| `MYSQL_USER` / `MYSQL_PASSWORD` | App DB user/password | `job_portal_user` / `job_portal_pass` |
| `MYSQL_PORT` | Host port mapped to MySQL (optional, for external DB tools) | `3306` |
| `JWT_SECRET` | Secret used to sign JWTs — **change this in production** | — |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `BACKEND_PORT` | Port the Express app listens on inside its container | `5000` |
| `REACT_APP_API_URL` | API base URL baked into the React build | `/api` |
| `NGINX_PORT` | Host port for the public reverse proxy | `8080` |

> The frontend talks to `/api`, which Nginx forwards to the backend container.
> There's no need to expose the backend port to the host at all in normal use.

---

## API overview

All endpoints are prefixed with `/api` (via Nginx) or served directly at the
backend root when hitting it in isolation.

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as `jobseeker` or `recruiter` |
| POST | `/api/auth/login` | Public | Log in, returns a JWT |
| GET  | `/api/auth/me` | Authenticated | Get the current user from their token |

### Jobs
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/jobs` | Public | Search/list open jobs (`keyword`, `location`, `job_type`, `page`, `limit`) |
| GET | `/api/jobs/:id` | Public | View a single job |
| GET | `/api/jobs/recruiter/mine` | Recruiter | List the recruiter's own postings |
| POST | `/api/jobs` | Recruiter | Create a job posting |
| PUT | `/api/jobs/:id` | Recruiter (owner) | Update a job posting |
| DELETE | `/api/jobs/:id` | Recruiter (owner) | Delete a job posting |

### Applications
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/applications` | Job Seeker | Apply to a job (`multipart/form-data`: `job_id`, `resume`, `cover_letter`) |
| GET | `/api/applications/mine` | Job Seeker | List the job seeker's own applications |
| GET | `/api/applications/recruiter/all` | Recruiter | All applications across the recruiter's jobs |
| GET | `/api/applications/job/:jobId` | Recruiter (owner) | Applicants for one job |
| PUT | `/api/applications/:id/status` | Recruiter (owner) | Update an application's status |
| GET | `/api/applications/:id/resume` | Job Seeker (owner) or Recruiter (owner) | Download the resume file |

### Health
| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Backend + DB connectivity check |
| GET | `/healthz` | Nginx reverse-proxy check |

---

## Database schema

Three tables, created automatically on first boot from `mysql/init.sql`:

- **users** — `id, name, email, password (bcrypt hash), role (jobseeker/recruiter), company_name, created_at, updated_at`
- **jobs** — `id, recruiter_id (FK), title, description, company, location, job_type, salary_min, salary_max, skills, status (open/closed), created_at, updated_at`
- **applications** — `id, job_id (FK), jobseeker_id (FK), resume_path, cover_letter, status (pending/reviewed/shortlisted/rejected/accepted), applied_at, updated_at`, unique constraint on `(job_id, jobseeker_id)` to prevent duplicate applications

---

## Local development (without Docker)

You can also run each piece directly for faster iteration:

```bash
# MySQL — run your own instance and execute mysql/init.sql against it,
# or keep using the Dockerized mysql service:
docker compose up -d mysql

# Backend
cd backend
npm install
cp ../.env.example .env   # adjust DB_HOST to "localhost" if MySQL is on the host
npm run dev

# Frontend
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
```

---

## Notes & design decisions

- **Resume access control**: resumes are never served as static files. Every
  download goes through an authenticated route that checks the requester is
  either the applicant or the recruiter who owns the job.
- **Duplicate applications** are prevented at the database level with a
  unique key on `(job_id, jobseeker_id)`.
- **Passwords** are hashed with bcrypt (10 rounds) before storage.
- **Startup ordering**: the backend actively retries its MySQL connection on
  boot in addition to the compose-level `depends_on: condition: service_healthy`,
  so a slow database init won't crash the API container.
- **Two Nginx layers**: the `frontend` container runs its own lightweight
  Nginx purely to serve the built React bundle with SPA fallback routing; the
  top-level `nginx` service is the actual reverse proxy / single entrypoint,
  matching the requirement for **separate frontend, backend, MySQL, and
  Nginx containers**.

---

## Troubleshooting

- **`docker compose ps` shows a container as `unhealthy`**: check its logs
  with `docker compose logs <service>`. The backend waits on MySQL's
  healthcheck, so if MySQL takes longer than usual on first boot (schema
  creation), give it another minute — the backend will keep retrying.
- **Port already in use**: change `NGINX_PORT` (or `MYSQL_PORT`) in `.env`
  and re-run `docker compose up -d --build`.
- **Resume uploads failing**: confirm the file is a PDF/DOC/DOCX under 5MB —
  both are enforced server-side.
