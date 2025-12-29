import { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import type { AppRoute } from './routes.config.tsx'
import MainLayout from './layouts/MainLayout'
import RequireAuth from './components/RequireAuth'
import Loading from './Loading'
import { appRoutes } from './routes.config.tsx'
import ErrorPage from './pages/ErrorPage'

// Ensure the imported routes are treated with the explicit AppRoute type
const typedRoutes = appRoutes as AppRoute[]

// Import Forbidden page to include route
import Forbidden from './pages/Forbidden'

// Map our simple appRoutes into the shape expected by createBrowserRouter
const children = typedRoutes.map((r: AppRoute) => {
  const Comp = r.element
  let element = (
    <Suspense fallback={<Loading />}>
      <Comp />
    </Suspense>
  )

  // Wrap route automatically if auth flag set
  if (r.auth) {
    element = <RequireAuth allowedRoles={r.roles}>{element}</RequireAuth>
  }

  if (r.path === '/') {
    return { index: true, element, handle: r.handle }
  }

  return { path: r.path.replace(/^[/]/, ''), element, handle: r.handle }
})

// Include forbidden route explicitly
children.push({ path: 'forbidden', element: <Forbidden />, handle: { title: 'Forbidden' } })

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children,
    // generic errorElement could be added here (omitted for brevity)
  },
])

export default router
