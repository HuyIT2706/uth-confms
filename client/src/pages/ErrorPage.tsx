import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

export default function ErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Something went wrong</h2>
        <p>{error.status} — {error.statusText}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Unexpected error</h2>
      {
        (() => {
          const errMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: unknown }).message : undefined
          return <pre>{String(errMsg ?? error)}</pre>
        })()
      }
    </div>
  )
}
