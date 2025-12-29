import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export default function ErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    if (error.status === 401 || error.status === 302 || error.status === 403) {
      return null  
    }

    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Oops!</h1>
        <h2>Something went wrong</h2>
        <p style={{ fontSize: '4rem', margin: '1rem 0' }}>
          {error.status}
        </p>
        <p>{error.statusText || 'Page not found'}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Unexpected Error</h1>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
        {error instanceof Error ? error.message : String(error)}
      </pre>
    </div>
  )
}