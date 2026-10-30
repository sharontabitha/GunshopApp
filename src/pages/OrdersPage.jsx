import { useEffect, useState } from 'react'
import { ArrowRight, PackageCheck, RefreshCw, ShoppingBag } from 'lucide-react'
import { formatPrice } from '../utils/helpers'
import { getCustomerOrders } from '../services/orderService'

const displayDate = (value) => new Date(value).toLocaleString()

export default function OrdersPage({ user, onBrowse }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try { setOrders(await getCustomerOrders(user.id)) }
    catch (cause) { setError(cause.message || 'Could not load your orders.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user.id])

  return (
    <div className="orders-page page-enter">
      <section className="masthead order-masthead"><p className="eyebrow">Your account</p><h1 className="display">Order history</h1><p className="lede">See every order placed with your Iron Vault account and follow its status.</p></section>
      <section className="order-section">
        <div className="section-heading-row"><div><p className="eyebrow">Personal ledger</p><h2>Your orders</h2></div><button className="btn btn--outline" type="button" onClick={load}><RefreshCw size={15} /> Refresh</button></div>
        {loading && <div className="state-box"><RefreshCw size={24} className="spin" /><p>Loading your orders…</p></div>}
        {!loading && error && <div className="state-box state-box--error"><p>{error}</p><button className="btn btn--outline" onClick={load} type="button">Try again</button></div>}
        {!loading && !error && orders.length === 0 && <div className="empty-cart"><ShoppingBag size={27} /><div><h3>No orders yet</h3><p>Your order confirmations and updates will appear here.</p></div><button className="btn btn--outline" onClick={onBrowse} type="button">Browse collection <ArrowRight size={15} /></button></div>}
        {!loading && !error && orders.length > 0 && <div className="history-list">{orders.map((order) => <article className="history-card" key={order.id}>
          <div className="history-card-head"><div><span className="order-number">Order {String(order.id).slice(0, 8).toUpperCase()}</span><p>{displayDate(order.created_at)}</p></div><span className="status-pill"><PackageCheck size={14} />{order.status}</span></div>
          <div className="history-items">{(order.order_items || []).map((item) => <span key={item.id}>{item.product_name} <b>× {item.quantity}</b></span>)}</div>
          <div className="history-total"><span>Order total</span><strong>{formatPrice(order.total)}</strong></div>
        </article>)}</div>}
      </section>
    </div>
  )
}
