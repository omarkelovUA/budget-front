# Family Budget — Frontend

Angular 22 SPA for Family Budget: private and family-shared accounts, categories,
transactions and monthly budgets.

- Backend: [`budget-backend`](https://github.com/omarkelovUA/budget-backend) (Spring Boot)
- Design and roadmap: in the backend repo's
  [`docs/`](https://github.com/omarkelovUA/budget-backend/tree/dev/docs)

## Run locally

You need the backend running on `localhost:8080` first. The simplest way needs only
Docker — in a clone of the backend repo:

```bash
docker compose --profile app up --build
```

Then, here (Node 22+; with nvm, `nvm use` picks it up from `.nvmrc`):

```bash
npm ci
npm start
```

Open <http://localhost:4200>, register, and create a family to share data.

`npm start` (`ng serve`) proxies `/api`, `/oauth2` and `/login/oauth2` to the backend
(`src/proxy.conf.json`), so the browser sees a single origin: no CORS setup, and the
httpOnly refresh cookie works as in production. Restart `ng serve` after changing the
proxy file.

## Test and build

```bash
npx ng test --watch=false   # Vitest unit tests
npx ng build                # production build into dist/
```

CI runs both on every push (`.github/workflows/ci.yml`).

## How it's put together

- Standalone components, signals, signal forms; `rxResource` for request-backed state.
- `src/app/features/<domain>/data/`: one abstract `*Repository` contract per domain plus
  its `Http*Repository`, wired in `app.config.ts`. Components only see the contract.
- `src/app/core/auth`: session state — access token in memory only, refreshed from an
  httpOnly cookie (also restored on page load). `core/http/auth.interceptor.ts` attaches
  the token and retries once after a refresh on 401.
- `src/app/core/http/problem.ts`: maps the backend's error `type`s to UI messages.

Google login works once the backend has Google credentials configured (see the backend
README).
