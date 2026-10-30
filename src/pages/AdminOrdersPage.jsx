import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'
import { formatPrice } from '../utils/helpers'
import { getAllOrders, updateOrderStatus } from '../services/orderService'

const STATUSES = ['pending', 'processing', 'completed', 'cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setOrders(await getAllOrders()) }
    catch (cause) { setError(cause.message || 'Could not load orders.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const changeStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status)
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order))
    } catch (cause) { setError(cause.message || 'Could not update the order status.') }
  }

  return <div className="orders-page page-enter">
    <section className="masthead order-masthead"><p className="eyebrow">Iron Vault staff</p><h1 className="display">Order desk</h1><p className="lede">Review who placed each order, what they selected, and update its progress.</p></section>
    <section className="order-section">
      <div className="section-heading-row"><div><p className="eyebrow">Customer fulfilment</p><h2>All orders <span className="section-count">{orders.length}</span></h2></div><button className="btn btn--outline" type="button" onClick={load}><RefreshCw size={15} /> Refresh</button></div>
      {error && <div className="state-box state-box--error"><p>{error}</p></div>}
      {loading && <div className="state-box"><RefreshCw size={24} className="spin" /><p>Loading orders…</p></div>}
      {!loading && !orders.length && !error && <div className="empty-cart"><ClipboardList size={27} /><div><h3>No orders received</h3><p>Customer checkouts will be listed here.</p></div></div>}
      {!loading && orders.length > 0 && <div className="history-list">{orders.map((order) => <article className="history-card admin-order-card" key={order.id}>
        <div className="history-card-head"><div><span className="order-number">Order {String(order.id).slice(0, 8).toUpperCase()}</span><p>{new Date(order.created_at).toLocaleString()}</p></div><label className="admin-status">Status<select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label></div>
        <div className="order-customer"><strong>{order.profiles?.full_name || order.customer_name || 'Customer'}</strong><span>{order.profiles?.email || order.customer_email || 'No email'}</span></div>
        <div className="history-items">{(order.order_items || []).map((item) => <span key={item.id}>{item.product_name} <b>× {item.quantity}</b> · {formatPrice(item.unit_price)}</span>)}</div>
        <div className="history-total"><span>{(order.order_items || []).length} line items</span><strong>{formatPrice(order.total)}</strong></div>
      </article>)}</div>}
    </section>
  </div>
}
