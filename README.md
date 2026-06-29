# Equinox Mail — Frontend (Vercel)

Vite + React SPA for Equinox Mail. It talks to the `equinox-mail-backend`
service over HTTP using the `VITE_API_BASE_URL` environment variable.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

For local development, either:
- leave `VITE_API_BASE_URL` empty and run the backend on the same origin, or
- set `VITE_API_BASE_URL=http://localhost:3000` (the local backend) in a
  `.env.local` file.

## Build

```bash
npm install
npm run build      # outputs static site to dist/
```

## Deploy to Vercel

1. Import this folder into Vercel (push to a Git repo or use the Vercel CLI).
   `vercel.json` sets the build command (`npm run build`), output directory
   (`dist`), and SPA rewrites.
2. Set the environment variable `VITE_API_BASE_URL` to your Railway backend URL,
   e.g. `https://your-app.up.railway.app`.
3. Deploy, then make sure the resulting Vercel URL is included in the backend's
   `CORS_ORIGIN`.

## Environment variables

See [`.env.example`](./.env.example).
