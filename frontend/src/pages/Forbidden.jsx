import { Link } from 'react-router-dom'

export default function Forbidden() {
  return (
    <div className="py-16 text-center">
      <h1>403</h1>
      <p className="mt-2 text-body">No tienes permiso para ver esta página.</p>
      <Link to="/" className="mt-4 inline-block">
        Volver al inicio
      </Link>
    </div>
  )
}
