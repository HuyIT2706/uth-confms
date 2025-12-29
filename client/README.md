# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


## Testing identity-service locally

- The client dev server proxies `/api` to `http://localhost:3001` (see `vite.config.ts`). This avoids CORS while developing.
- Start the backend identity service (recommended via Docker Compose):
  - `docker compose up --build`
- Start the frontend:
  - `cd client`
  - `npm install`
  - `npm run dev`
- Open the app in the browser (Vite usually on `http://localhost:5173`) and use the **Test Auth UI** on the main page to Register / Login / Refresh / Logout with the identity-service.

Notes:
- The identity-service endpoints are: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh-token`, `POST /api/auth/logout`.
- If you prefer not to use the proxy, enable CORS on `identity-service/src/main.ts` with `app.enableCors(...)`.

Router & adding pages
----------------------

Project uses React Router v6 with a centralized router configuration.

- Routes are declared in `client/src/routes.config.ts` (lazy-loaded components and `handle.title`).
- Router instance is created in `client/src/router.tsx` and provided in `client/src/main.tsx` via `RouterProvider`.
- To add a new page:
  1. Create your component under `client/src/pages/` (export default).
  2. Add a lazy import and route entry in `client/src/routes.config.ts`, e.g.:

```ts
// routes.config.ts
{ path: '/new', element: <NewPage />, handle: { title: 'New Page — UTH' } }
```

  3. If the route must be protected (authenticated), wrap it by convention in `router.tsx` (or extend `RequireAuth`).

- The app shell (nav + Outlet) is `client/src/layouts/MainLayout.tsx`. Use `handle.title` to set the document title automatically.

Conventions for FE team
-----------------------
- Use `handle.title` for accessibility / SEO-friendly titles (short string). The MainLayout updates document.title automatically.
- Keep routes lazy-loaded so pages only load when needed (uses `Suspense` + `Loading` fallback).
- Protected pages should rely on `client/src/components/RequireAuth.tsx` (checks `localStorage.accessToken` by default).

Auth & roles
---------------

The router supports simple auth/role protection via fields in `routes.config.ts`:

- `auth: true` — automatically wraps the route with `RequireAuth` so unauthenticated users are redirected to `/login`.
- `roles: string[]` — optional list of allowed roles. If provided, `RequireAuth` parses the access token and checks `payload.role`; users with non-matching roles are redirected to `/forbidden`.

Example:

```ts
{ path: '/dashboard', element: <Dashboard />, auth: true, roles: ['admin','chair'], handle: { title: 'Dashboard' } }
```

Notes:
- `RequireAuth` performs a lightweight JWT payload parse on the client (no signature verification). Keep security in the backend for sensitive checks.
- If you need more complex behavior (loaders, data fetching, or server-validated permissions), add a `loader` or implement permission checks on the server and return 403 as appropriate.


