import { formatPrice } from '../utils/validation.js'

export default function OrderItems({ order }) {
  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface-alt text-heading">
          <tr>
            <th className="px-3 py-2">Producto</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2">Cantidad</th>
            <th className="px-3 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.product_id} className="border-t border-line">
              <td className="px-3 py-2">{item.product_name}</td>
              <td className="px-3 py-2">{formatPrice(item.unit_price)}</td>
              <td className="px-3 py-2">{item.quantity}</td>
              <td className="px-3 py-2 text-right">{formatPrice(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line">
            <td colSpan={3} className="px-3 py-2 text-right text-heading">Total</td>
            <td className="px-3 py-2 text-right text-heading">{formatPrice(order.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
