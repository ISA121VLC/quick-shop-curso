import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-slate-600">La página no existe.</p>
      <Link to="/" className="mt-4 inline-block text-indigo-700 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
