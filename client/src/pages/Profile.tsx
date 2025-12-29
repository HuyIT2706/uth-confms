export default function Profile() {
  const token = localStorage.getItem('accessToken')
  return (
    <div>
      <h2>Profile</h2>
      <p>This is a protected page. Access token (truncated):</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{token ? `${token.slice(0, 60)}...` : 'no token'}</pre>
    </div>
  )
}
