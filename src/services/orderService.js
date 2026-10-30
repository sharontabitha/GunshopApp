import { apiClient } from '../config/api'

export const placeOrder = async (items) => {
  if (items.some((item) => !/^\d+$/.test(String(item.id)))) {
    throw new Error('Some catalogue entries are demo-only. Run supabase/seed-catalog.sql before placing an order.')
  }
  const result = await apiClient.post('/rest/v1/rpc/place_order', {
    p_items: items.map(({ id, quantity }) => ({ product_id: id, quantity })),
  })
  return Array.isArray(result) ? result[0] : result
}

export async function getCustomerOrders(userId) {
  return apiClient.get(`/rest/v1/orders?select=*,order_items(*)&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`)
}

export async function getAllOrders() {
  return apiClient.get('/rest/v1/orders?select=*,profiles(full_name,email),order_items(*)&order=created_at.desc')
}

export async function updateOrderStatus(orderId, status) {
  return apiClient.patch(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, { status }, {
    headers: { Prefer: 'return=minimal' },
  })
}
