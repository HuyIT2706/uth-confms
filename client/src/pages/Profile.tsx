import { useLoaderData } from 'react-router-dom'

export default function Profile() {
  const data = useLoaderData() as any
  return (
    <div>
      <h2>Profile</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
