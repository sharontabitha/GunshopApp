import { useState } from 'react'
import { ArrowRight, Minus, PackageCheck, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { formatPrice } from '../utils/helpers'

export default function CartPage({ cart, user, onQuantity, onRemove, onCheckout, onBrowse }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0)

  const checkout = async () => {
    setBusy(true); setError(''); setSuccess('')
    try {
      const order = await onCheckout()
      setSuccess(`Order ${String(order?.id || '').slice(0, 8).toUpperCase()} placed. You can track it under Orders.`)
    } catch (cause) { setError(cause.message || 'Could not place this order.') }
    finally { setBusy(false) }
  }

  return <div className="orders-page page-enter">
    <section className="masthead order-masthead"><p className="eyebrow">Customer checkout</p><h1 className="display">Your cart</h1><p className="lede">Review your selection before placing an order to Iron Vault.</p></section>
    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success order-success"><PackageCheck size={17} />{success}</p>}
    {!cart.length ? <div className="empty-cart"><ShoppingBag size={27} /><div><h3>Your cart is empty</h3><p>Browse the collection and add an item to begin.</p></div><button className="btn btn--outline" onClick={onBrowse} type="button">Browse collection <ArrowRight size={15} /></button></div> : <div className="cart-layout">
      <div className="cart-list">{cart.map((item) => <article className="cart-item" key={item.id}>
        <img src={item.image_url || item.image || '/guns/pistol.svg'} alt="" />
        <div className="cart-item-copy"><h3>{item.name}</h3><p>{item.type || item.category} · {item.caliber || 'Catalogue item'}</p><strong>{formatPrice(item.price)}</strong></div>
        <div className="quantity-control"><button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{item.quantity}</span><button type="button" onClick={() => onQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div>
        <button className="remove-item" type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button>
      </article>)}</div>
      <aside className="checkout-card"><p className="eyebrow">Order summary</p><div className="summary-row"><span>Items</span><span>{cart.reduce((count, item) => count + item.quantity, 0)}</span></div><div className="summary-row"><span>Customer</span><span>{user.email}</span></div><div className="summary-row summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div><button className="btn btn--primary checkout-button" disabled={busy} type="button" onClick={checkout}><ShoppingBag size={16} />{busy ? 'Placing order…' : 'Place order'}</button><p className="checkout-caption">Order is recorded in your account. Payment handling can be added separately.</p></aside>
    </div>}
  </div>
}
