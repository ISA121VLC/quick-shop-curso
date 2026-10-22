import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1>404</h1>
      <p className="mt-2 text-body">La página no existe.</p>
      <Link to="/" className="mt-4 inline-block">
        Volver al inicio
      </Link>
    </div>
  )
}
