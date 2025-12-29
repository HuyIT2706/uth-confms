import { Link } from 'react-router-dom'

export default function Forbidden() {
  return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <h2>403 — Forbidden</h2>
      <p>Bạn không có quyền truy cập trang này.</p>
      <p><Link to="/">Quay về trang chủ</Link></p>
    </div>
  )
}
