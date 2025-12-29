import { Suspense } from 'react'
import { createBrowserRouter, redirect, type RouteObject } from 'react-router-dom'
import { authService } from './lib/authService'
import type { AppRoute } from './routes.config'
import { appRoutes } from './routes.config'
import MainLayout from './layouts/MainLayout'
import RequireAuth from './components/RequireAuth'
import Loading from './Loading'
import ErrorPage from './pages/ErrorPage'
import type { LazyExoticComponent, ComponentType } from 'react'

async function requireAuthLoader() {
  try {
    await authService.ensureAccessToken()
    return null
  } catch {
    throw redirect('/login')
  }
}

function makeElement(
  Comp: LazyExoticComponent<ComponentType<any>>,
  auth?: boolean,
  roles?: string[]
) {
  const content = (
    <Suspense fallback={<Loading />}>
      <Comp />
    </Suspense>
  )
  return auth ? <RequireAuth allowedRoles={roles}>{content}</RequireAuth> : content
}

function toRouteObject(r: AppRoute): RouteObject {
  return {
    path: r.path === '/' ? undefined : r.path,
    index: r.path === '/',
    element: makeElement(r.element, r.auth, r.roles),
    handle: r.handle,
    loader: r.auth ? (r.loader ?? requireAuthLoader) : undefined,
    children: r.children?.length ? r.children.map(toRouteObject) : undefined,
  }
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: appRoutes.map(toRouteObject),
  },
])

export default router