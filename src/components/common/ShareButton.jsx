import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'

export default function ShareButton({ product, compact = false }) {
  const [copied, setCopied] = useState(false)

  const share = async (event) => {
    event?.stopPropagation?.()
    const id = product?.id ?? product?.name
    const url = new URL('/', window.location.origin)
    url.searchParams.set('product', String(id))
    const shareData = { title: product?.name || 'Iron Vault', text: `View ${product?.name || 'this item'} at Iron Vault`, url: url.toString() }

    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(shareData.url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(shareData.url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      } catch {
        window.prompt('Copy this product link', shareData.url)
      }
    }
  }

  return (
    <button type="button" className={compact ? 'share-btn share-btn--compact' : 'btn btn--outline btn--sm'} onClick={share} aria-label={`Share ${product?.name || 'product'}`} title="Share product link">
      {copied ? <Check size={15} /> : <Share2 size={15} />}
      {!compact && <span>{copied ? 'Link copied' : 'Share'}</span>}
    </button>
  )
}
