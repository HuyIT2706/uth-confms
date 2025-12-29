import { lazy } from 'react'
import type { LazyExoticComponent, ComponentType } from 'react'

// Import helpers allow us to prefetch the JS chunk when needed
type ImportFn = () => Promise<{ default: ComponentType<unknown> }>

const importTestAuth: ImportFn = () => import('./TestAuth')
const importRegister: ImportFn = () => import('./pages/Register')
const importLogin: ImportFn = () => import('./pages/Login')
const importProfile: ImportFn = () => import('./pages/Profile')
const importNotFound: ImportFn = () => import('./pages/NotFound')

// Lazy-loaded page components (used at runtime)
const TestAuth = lazy(importTestAuth)
const Register = lazy(importRegister)
const Login = lazy(importLogin)
const Profile = lazy(importProfile)
const NotFound = lazy(importNotFound)

export type AppRoute = {
  // Optional unique key for programmatic linking/prefetching
  key?: string
  path: string
  // The lazy element used when route is rendered
  element: LazyExoticComponent<ComponentType<unknown>>
  // The underlying import function (useful for prefetch)
  importFn?: ImportFn
  auth?: boolean
  roles?: string[]
  handle?: { title?: string; breadcrumb?: string; preload?: boolean }
  children?: AppRoute[]
}

/**
 * Centralized route definitions for the app.
 * Features:
 * - `importFn` can be called to prefetch a route's JS chunk
 * - `key` is optional and useful for programmatic navigation helpers
 * - `handle.title` is used by `MainLayout` for document.title
 */
export const appRoutes: AppRoute[] = [
  { key: 'home', path: '/', element: TestAuth, importFn: importTestAuth, handle: { title: 'Home — UTH', preload: true } },
  { key: 'register', path: '/register', element: Register, importFn: importRegister, handle: { title: 'Đăng ký — UTH' } },
  { key: 'login', path: '/login', element: Login, importFn: importLogin, handle: { title: 'Đăng nhập — UTH' } },
  // profile requires auth; example allowed roles provided
  { key: 'profile', path: '/profile', element: Profile, importFn: importProfile, auth: true, roles: ['author', 'reviewer', 'chair', 'admin'], handle: { title: 'Profile — UTH' } },
  { key: 'notfound', path: '*', element: NotFound, importFn: importNotFound, handle: { title: '404 — Not found' } },
]

// Simple helper object teams can import to avoid hardcoding paths
export const ROUTES = {
  HOME: '/',
  REGISTER: '/register',
  LOGIN: '/login',
  PROFILE: '/profile',
  FORBIDDEN: '/forbidden',
}

/**
 * Prefetch a route by key or path. Returns a promise that resolves when
 * the module is loaded (or rejects if not found).
 */
export function prefetchRouteByKey(key: string) {
  const route = appRoutes.find((r) => r.key === key)
  if (!route || !route.importFn) return Promise.reject(new Error('route or importFn not found'))
  return route.importFn()
}

export function prefetchRouteByPath(path: string) {
  const route = appRoutes.find((r) => r.path === path)
  if (!route || !route.importFn) return Promise.reject(new Error('route or importFn not found'))
  return route.importFn()
}
