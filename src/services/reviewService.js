import { apiClient, IS_SUPABASE } from '../config/api'
import { getSession } from './authService'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings.
// Supports both Supabase (public.reviews) and university API (/api/v1/recipes/:id/reviews).
// ---------------------------------------------------------------------------

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId) {
    if (IS_SUPABASE) {
      const data = await apiClient.get(`/rest/v1/reviews?product_id=eq.${gunId}&select=*,review_votes(user_id,vote)&order=created_at.desc`)
      const ownerId = getSession()?.user?.id
      const list = Array.isArray(data)
        ? data.map((r) => ({
            id: r.id,
            product_id: r.product_id,
            user_id: r.user_id,
            is_mine: Boolean(ownerId && ownerId === r.user_id),
            user_identifier: r.user_id ? `Member ${String(r.user_id).substring(0, 8)}` : 'Member',
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at,
            likes: (r.review_votes || []).filter((vote) => vote.vote === 1).length,
            dislikes: (r.review_votes || []).filter((vote) => vote.vote === -1).length,
            my_vote: (r.review_votes || []).find((vote) => vote.user_id === ownerId)?.vote || 0,
          }))
        : []

      return { success: true, data: list }
    }

    return apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    if (IS_SUPABASE) {
      const userId = getSession()?.user?.id
      if (!userId) throw new Error('Sign in to write a review.')
      const payload = {
        product_id: Number(gunId),
        user_id: userId,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: created }
    }

    return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
  }

  /**
   * Edit an existing review.
   */
  async updateReview(reviewId, reviewData) {
    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
        },
        { headers: { Prefer: 'return=representation' } },
      )
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    return apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData)
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      return { success: true }
    }

    return apiClient.delete(`/api/v1/reviews/${reviewId}`)
  }

  async voteReview(reviewId, vote) {
    if (!IS_SUPABASE) throw new Error('Review votes require Supabase.')
    const userId = getSession()?.user?.id
    if (!userId) throw new Error('Sign in to react to reviews.')
    const path = `/rest/v1/review_votes?review_id=eq.${reviewId}&user_id=eq.${userId}`
    const current = await apiClient.get(`${path}&select=vote`)
    if (current?.[0]?.vote === vote) {
      await apiClient.delete(path)
      return
    }
    if (current?.length) {
      await apiClient.patch(path, { vote })
      return
    }
    await apiClient.post('/rest/v1/review_votes', { review_id: reviewId, user_id: userId, vote }, { headers: { Prefer: 'return=minimal' } })
  }
}

export default new ReviewService()
