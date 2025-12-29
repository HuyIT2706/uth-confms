import { lazy } from 'react'
import { redirect } from 'react-router-dom'
import { authFetch } from './lib/authFetch'
import type { LazyExoticComponent, ComponentType } from 'react'

type ImportFn = () => Promise<{ default: ComponentType<unknown> }>

const importHome: ImportFn = () => import('./TestAuth')          // sau này thay bằng Dashboard thật
const importRegister: ImportFn = () => import('./pages/Register')
const importLogin: ImportFn = () => import('./pages/Login')
const importProfile: ImportFn = () => import('./pages/Profile')
const importForbidden: ImportFn = () => import('./pages/Forbidden')
const importNotFound: ImportFn = () => import('./pages/NotFound')

const Home = lazy(importHome)
const Register = lazy(importRegister)
const Login = lazy(importLogin)
const Profile = lazy(importProfile)
const Forbidden = lazy(importForbidden)
const NotFound = lazy(importNotFound)

export type AppRoute = {
  key?: string
  path: string
  element: LazyExoticComponent<ComponentType<unknown>>
  importFn?: ImportFn
  auth?: boolean
  roles?: string[]
  handle?: { title?: string; breadcrumb?: string; preload?: boolean }
  loader?: () => Promise<any>
  children?: AppRoute[]
}

export const appRoutes: AppRoute[] = [
  {
    key: 'home',
    path: '/',
    element: Home,
    importFn: importHome,
    handle: { title: 'Home — UTH', preload: true },
  },
  {
    key: 'register',
    path: '/register',
    element: Register,
    importFn: importRegister,
    handle: { title: 'Đăng ký — UTH' },
  },
  {
    key: 'login',
    path: '/login',
    element: Login,
    importFn: importLogin,
    handle: { title: 'Đăng nhập — UTH' },
  },
  {
    key: 'profile',
    path: '/profile',
    element: Profile,
    importFn: importProfile,
    auth: true,
    roles: ['author', 'reviewer', 'chair', 'admin'],
    handle: { title: 'Profile — UTH' },
    loader: async () => {
      const res = await authFetch('/api/users/me')
      if (!res.ok) {
        if (res.status === 401) throw redirect('/login')
        if (res.status === 403) throw redirect('/forbidden')
        throw new Response(await res.text(), { status: res.status })
      }
      const user = await res.json()

      // Optional: frontend double-check role
      const allowedRoles = ['author', 'reviewer', 'chair', 'admin']
      if (!allowedRoles.includes(user.role)) {
        throw redirect('/forbidden')
      }

      return user
    },
  },
  {
    key: 'forbidden',
    path: '/forbidden',
    element: Forbidden,
    importFn: importForbidden,
    handle: { title: '403 — Forbidden — UTH' },
  },
  {
    key: 'notfound',
    path: '*',
    element: NotFound,
    importFn: importNotFound,
    handle: { title: '404 — Not Found — UTH' },
  },
]

export const ROUTES = {
  HOME: '/',
  REGISTER: '/register',
  LOGIN: '/login',
  PROFILE: '/profile',
  FORBIDDEN: '/forbidden',
} as const

// Prefetch helpers
export function prefetchRouteByKey(key: string) {
  const route = appRoutes.find((r) => r.key === key)
  if (!route) throw new Error(`Route with key "${key}" not found`)
  if (!route.importFn) throw new Error(`Route "${key}" has no importFn`)
  return route.importFn()
}

export function prefetchRouteByPath(path: string) {
  const route = appRoutes.find((r) => r.path === path)
  if (!route) throw new Error(`Route with path "${path}" not found`)
  if (!route.importFn) throw new Error(`Route "${path}" has no importFn`)
  return route.importFn()
}