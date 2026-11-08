import { useState, useMemo, useEffect } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import gunService from '../services/gunService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page — the main product listing.
 *
 * Data source priority:
 *   1. Live API via useGuns()
 *   2. Local static array (GUNS_LOCAL) when the API is unreachable
 *
 * Features: search, category filter, sort, CRUD actions, detail modal.
 */
export default function Catalog({ onNavigate, onAddToCart }) {
  // ---- API data ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 50 })
  const [useLocal, setUseLocal] = useState(false)

  // Decide data source
  const rawGuns = useMemo(() => {
    if (useLocal || (error && apiGuns.length === 0)) {
      // Enrich local data with synthetic ids so FavoriteButton and detail work
      return GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}`, demoOnly: true }))
    }
    // Keep the classroom storefront at its full 15-item size regardless of
    // backend configuration. Remote rows win where a fixture has the same name.
    const remoteNames = new Set(apiGuns.map((item) => item.name?.toLowerCase()))
    const demoAdditions = GUNS_LOCAL
      .filter((item) => !remoteNames.has(item.name.toLowerCase()))
      .map((item, index) => ({ ...item, id: `demo-${index}`, demoOnly: true }))
    return [...apiGuns, ...demoAdditions]
  }, [apiGuns, error, useLocal])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const categories = useMemo(() => extractCategories(rawGuns), [rawGuns])

  const filteredGuns = useMemo(() => {
    let result = rawGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, search, activeCategory, sortKey, sortOrder])

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  useEffect(() => {
    const productId = new URLSearchParams(window.location.search).get('product')
    if (!productId || loading) return
    const match = rawGuns.find((item) => String(item.id) === productId || item.name === productId)
    if (match) setSelectedGun(match)
  }, [loading, rawGuns])

  const openDetail = (gun) => {
    setSelectedGun(gun)
    const url = new URL(window.location.href)
    url.searchParams.set('product', String(gun.id ?? gun.name))
    window.history.replaceState({}, '', url)
  }

  const closeDetail = () => {
    setSelectedGun(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('product')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  // ---- delete ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      await gunService.archiveGun(deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={closeDetail}
        onEdit={!selectedGun.demoOnly && onNavigate ? (g) => onNavigate('Edit', g) : undefined}
        onDelete={!selectedGun.demoOnly && onNavigate ? (g) => { setSelectedGun(null); setDeleteTarget(g) } : undefined}
        onAddToCart={!selectedGun.demoOnly ? onAddToCart : undefined}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Find your next favorite.</h1>
        <p className="lede">
          Explore the Iron Vault collection: twelve carefully selected pieces and three useful accessories, all in one place.
        </p>
      </section>

      <section>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} piece{filteredGuns.length !== 1 ? 's' : ''}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order) }}
        />

        {/* States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {/* Product grid */}
        {filteredGuns.length > 0 && (
          <ul className="stock">
            {filteredGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={openDetail}
                onEdit={!gun.demoOnly && onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={!gun.demoOnly && onNavigate ? setDeleteTarget : undefined}
                onAddToCart={onAddToCart}
              />
            ))}
          </ul>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={`Archive "${deleteTarget?.name}"? You can restore it later from your profile.`}
        confirmLabel="Archive"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
      />
      {deleteError && (
        <div className="toast toast--error">{deleteError}</div>
      )}
    </>
  )
}
