import { useState } from 'react'
import { ArrowLeft, Star, Send, Loader, ThumbsUp, ThumbsDown, Pencil, Trash2, X } from 'lucide-react'
import { ShoppingBag } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import reviewService from '../../services/reviewService'
import { getSession } from '../../services/authService'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger delete flow
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete, onAddToCart }) {
  const images = gun.image_urls?.length ? gun.image_urls : [gun.image_url || gun.image || '/guns/pistol.svg']
  const [selectedImage, setSelectedImage] = useState(images[0])
  const imgSrc = images.includes(selectedImage) ? selectedImage : images[0]
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [editingReview, setEditingReview] = useState(null)
  const [reacting, setReacting] = useState(null)
  const isSignedIn = Boolean(getSession()?.user?.id)

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = editingReview
      ? await reviewService.updateReview(editingReview, { rating, comment: comment.trim() }).then((response) => response.data).catch((error) => { setReviewError(error.message || 'Could not update review.'); return null })
      : await createReview(gun.id, { user_id: getSession()?.user?.id || getUserIdentifier(), rating, comment: comment.trim() })

    if (result) {
      setReviewSuccess(editingReview ? 'Review updated.' : 'Review submitted!')
      setComment('')
      setRating(5)
      setEditingReview(null)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const startEditingReview = (review) => {
    setEditingReview(review.id)
    setRating(review.rating)
    setComment(review.comment || '')
    setReviewSuccess('Editing your review.')
    window.scrollTo({ top: document.querySelector('.review-form')?.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' })
  }

  const deleteOwnReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return
    try {
      await reviewService.deleteReview(reviewId)
      refetchReviews()
    } catch (error) { setReviewError(error.message || 'Could not delete review.') }
  }

  const voteReview = async (reviewId, vote) => {
    if (!isSignedIn) { setReviewError('Sign in to like or dislike reviews.'); return }
    try {
      setReacting(reviewId)
      await reviewService.voteReview(reviewId, vote)
      await refetchReviews()
    } catch (error) { setReviewError(error.message || 'Could not save your reaction.') }
    finally { setReacting(null) }
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
          <div className="detail-gallery"><img className="detail-img" src={imgSrc} alt={gun.name} decoding="async" fetchPriority="high" />
            {images.length > 1 && <div className="detail-gallery-thumbs">{images.map((url) => <button key={url} type="button" className={url === imgSrc ? 'gallery-thumb active' : 'gallery-thumb'} onClick={() => setSelectedImage(url)} aria-label="View product image"><img src={url} alt="" loading="lazy" decoding="async" /></button>)}</div>}
          </div>
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            <ShareButton product={gun} />
            {onAddToCart && <button type="button" className="btn btn--primary" onClick={() => onAddToCart(gun)}><ShoppingBag size={16} /> Add to cart</button>}
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          {!isSignedIn && <p className="form-hint">Sign in to write, edit, or react to reviews.</p>}
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id || !isSignedIn}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> {editingReview ? 'Save Changes' : 'Submit Review'}</>
            )}
          </button>
          {editingReview && <button type="button" className="btn btn--outline btn--sm" onClick={() => { setEditingReview(null); setComment(''); setRating(5) }}><X size={14} /> Cancel edit</button>}

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                  <span className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? 'var(--brass)' : 'none'}
                        stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                      />
                    ))}
                  </span>
                </div>
                {rev.comment && <p className="review-comment">{rev.comment}</p>}
                <div className="review-actions">
                  {rev.is_mine ? <>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => startEditingReview(rev)}><Pencil size={14} /> Edit</button>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => deleteOwnReview(rev.id)}><Trash2 size={14} /> Delete</button>
                  </> : <>
                    <button type="button" className={rev.my_vote === 1 ? 'review-vote active' : 'review-vote'} onClick={() => voteReview(rev.id, 1)} disabled={reacting === rev.id || !isSignedIn} aria-label="Like review"><ThumbsUp size={15} /> {rev.likes || 0}</button>
                    <button type="button" className={rev.my_vote === -1 ? 'review-vote active' : 'review-vote'} onClick={() => voteReview(rev.id, -1)} disabled={reacting === rev.id || !isSignedIn} aria-label="Dislike review"><ThumbsDown size={15} /> {rev.dislikes || 0}</button>
                  </>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
