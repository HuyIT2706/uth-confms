import { useEffect } from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import PrefetchLink from '../components/PrefetchLink'

export default function MainLayout() {
  // use route handles to set document title when route changes
  const matches = useMatches()
  useEffect(() => {
    // Find the closest match with a title handle
    const matchWithTitle = [...matches].reverse().find((m) => (m.handle as { title?: string })?.title)
    const title = matchWithTitle ? ((matchWithTitle.handle as { title?: string }).title as string) : 'UTH'
    document.title = title
  }, [matches])

  return (
    <div>
      <header style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <nav>
          <PrefetchLink to="/">Home</PrefetchLink> | <PrefetchLink to="/register">Register</PrefetchLink> | <PrefetchLink to="/login">Login</PrefetchLink>
        </nav>
      </header>
      <main style={{ padding: 12 }}>
        <Outlet />
      </main>
    </div>
  )
}
