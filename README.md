
# Student Learning Outcome Stability Monitor (Starter)

## Run backend
cd server
npm install
npm run dev

## Run frontend
cd client
npm install
npm run dev

## Build & deploy frontend (fixes "MIME type text/jsx" error)
- Build command: `cd client && npm run build`
- Deploy/publish folder: `client/dist` (not `client/`)
- If you serve frontend from the backend, set `NODE_ENV=production` (or `SERVE_CLIENT=true`) and ensure `client/dist` exists.
