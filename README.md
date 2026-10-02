# Template Project

Monorepo with a FastAPI backend and a React Vite frontend.


[Backend documentation](backend/README.md)


[Frontend documentation](frontend/README.md)


## Table of content


- [Using this template](#using-this-template)

- [Features](#features)
    - [Google Authentication](#google-authentication)


## Using this template

On GitHub, choose **Use this template**. That creates a new repository with a single commit and no link back to this one.

Replace `Template Project` in these places:

- `README.md`: the heading, and the `#template-project` back-to-top link. GitHub builds that anchor from the heading.
- `frontend/index.html`: the page title.
- `backend/app/main.py`: the API title and description.

The word template in `backend/alembic.ini` and `frontend/README.md` refers to Alembic migration file names and the React Compiler, so those lines stay.

In `backend/pyproject.toml`, set `authors` and replace the description. It currently says `Add your description here`.

Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL`, `ALLOWED_ORIGINS`, and a Google OAuth client for this project (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`). Locally the redirect URI is `http://localhost:5173/auth/google/callback`.

Keep `backend/uv.lock`, `frontend/yarn.lock`, and the Alembic revision under `backend/alembic/versions/`. CI installs from the lockfiles, and that revision creates the auth tables.

`.github/workflows/ci.yml` runs on pull requests and on pushes to `main`. The file has no repository-specific names, so a new project can keep it. It uses Python 3.13 and Node 22, matching `backend/.python-version` and `.nvmrc`. Each side checks formatting and requires 100% test coverage: the backend job uses `--cov-fail-under=100`, and the frontend thresholds are in `frontend/vite.config.ts`. Change the version pins in the workflow when you change Python or Node.

[Back to the top](#template-project)


## Features

### Google authentication

Sign in with Google using the openid and email scopes. The backend stores a server session and sends it as an httpOnly cookie. The same Google account always maps to the same user.

[Back to the top](#template-project)