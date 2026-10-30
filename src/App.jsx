import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import CreateGunPage from './pages/CreateGunPage.jsx'
import EditGunPage from './pages/EditGunPage.jsx'
import GunDetail from './components/gun/GunDetail.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import CartPage from './pages/CartPage.jsx'
import AdminOrdersPage from './pages/AdminOrdersPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import gunService from './services/gunService.js'
import { getSession, loadProfile, refreshSession, signIn, signOut, signUp } from './services/authService.js'
import { placeOrder } from './services/orderService.js'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState(() => window.location.pathname === '/admin' ? 'Admin' : 'Catalog')
  const [session, setSession] = useState(() => getSession())
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(getSession()?.access_token))
  const [authNotice, setAuthNotice] = useState('')
  const [authReturnTab, setAuthReturnTab] = useState('Catalog')
  const [theme, setTheme] = useState(() => localStorage.getItem('iron-vault-theme') || 'light')
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iron-vault-cart') || '[]') } catch { return [] }
  })
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    localStorage.setItem('iron-vault-theme', theme)
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171714' : '#f5f1e9')
  }, [theme])

  useEffect(() => { localStorage.setItem('iron-vault-cart', JSON.stringify(cart)) }, [cart])
  const establishSession = useCallback(async (activeSession) => {
    setSession(activeSession)
    if (!activeSession?.user?.id) {
      setProfile(null)
      setAuthLoading(false)
      if (window.location.pathname === '/admin') {
        window.history.replaceState({}, '', '/')
        setTab('Login')
        setAuthNotice('Sign in with an administrator account to open the order desk.')
      }
      return null
    }
    setAuthLoading(true)
    try {
      const customerProfile = await loadProfile(activeSession.user.id)
      const resolved = customerProfile || {
        id: activeSession.user.id,
        full_name: activeSession.user.user_metadata?.full_name || '',
        email: activeSession.user.email,
        is_admin: false,
      }
      setProfile(resolved)
      if (window.location.pathname === '/admin') {
        if (resolved.is_admin) setTab('Admin')
        else {
          window.history.replaceState({}, '', '/')
          setTab('Login')
          setAuthNotice('The admin order desk is only available to store administrators.')
        }
      }
      return resolved
    } catch (error) {
      setProfile({ id: activeSession.user.id, full_name: activeSession.user.user_metadata?.full_name || '', email: activeSession.user.email, is_admin: false })
      setAuthNotice(`Account is signed in, but profile setup is incomplete: ${error.message}`)
      if (window.location.pathname === '/admin') {
        window.history.replaceState({}, '', '/')
        setTab('Login')
      }
      return null
    } finally { setAuthLoading(false) }
  }, [])

  useEffect(() => {
    let mounted = true
    const restore = async () => {
      const active = await refreshSession()
      if (mounted) await establishSession(active)
    }
    restore()
    return () => { mounted = false }
  }, [establishSession])

  const handleAuthSubmit = async ({ mode, fullName, email, password }) => {
    if (mode === 'signup') {
      const result = await signUp(email, password, fullName)
      if (result.access_token) {
        await establishSession(result)
        setTab(authReturnTab)
        return
      }
      return { message: 'Account created. Check your email to confirm it, then sign in.' }
    }
    const active = await signIn(email, password)
    const nextProfile = await establishSession(active)
    if (nextProfile?.is_admin) {
      window.history.pushState({}, '', '/admin')
      setTab('Admin')
    } else {
      if (window.location.pathname === '/admin') window.history.replaceState({}, '', '/')
      setTab(authReturnTab)
    }
    return null
  }

  const handleLogout = async () => {
    await signOut()
    setSession(null)
    setProfile(null)
    setTab('Catalog')
    if (window.location.pathname === '/admin') window.history.replaceState({}, '', '/')
  }

  const handleAddToCart = (product) => {
    const productId = String(product.id ?? product.name)
    setCart((items) => {
      const found = items.find((item) => String(item.id) === productId)
      if (found) return items.map((item) => String(item.id) === productId ? { ...item, quantity: item.quantity + 1 } : item)
      return [...items, { ...product, id: productId, quantity: 1 }]
    })
  }

  const handlePlaceOrder = (customerName) => {
    if (!cart.length || !session?.user?.id) throw new Error('Sign in before placing an order.')
    return placeOrder(cart).then((order) => {
      setCart([])
      return order
    })
  }

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (['Admin', 'Create', 'Edit'].includes(target) && !profile?.is_admin) return
    if (['Orders', 'Cart', 'Profile'].includes(target) && !session?.user?.id) {
      setAuthNotice('Sign in to access your account and orders.')
      setAuthReturnTab(target)
      setTab('Login')
      return
    }
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      if (target === 'Admin') window.history.pushState({}, '', '/admin')
      else if (window.location.pathname === '/admin') window.history.pushState({}, '', '/')
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  return (
    <div className="shell" data-theme={theme}>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={profile?.is_admin ? () => handleNavigate('Create') : undefined}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
        cartCount={cart.reduce((count, item) => count + item.quantity, 0)}
        isAuthenticated={Boolean(session?.user?.id)}
        isAdmin={Boolean(profile?.is_admin)}
        onLogin={() => { setAuthNotice(''); setAuthReturnTab('Catalog'); setTab('Login') }}
        onLogout={handleLogout}
      />

      <main className="main">
        {authLoading && <div className="state-box"><span className="spin">◌</span><p>Restoring your secure session…</p></div>}
        {/* Sub-page views */}
        {!authLoading && mode === 'create' && (
          <CreateGunPage
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab(window.location.pathname === '/admin' ? 'Admin' : 'Catalog')
            }}
          />
        )}

        {!authLoading && mode === 'edit' && (
          <EditGunPage
            gun={editingGun}
            gunId={editingGun?.id}
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab(window.location.pathname === '/admin' ? 'Admin' : 'Catalog')
            }}
          />
        )}

        {!authLoading && mode === 'detail' && selectedGun && (
          <GunDetail
            gun={selectedGun}
            onBack={handleBackToList}
            onEdit={profile?.is_admin && !selectedGun.demoOnly ? (g) => handleNavigate('Edit', g) : undefined}
            onDelete={profile?.is_admin && !selectedGun.demoOnly ? (g) => setDeleteTarget(g) : undefined}
            onAddToCart={!profile?.is_admin && !selectedGun.demoOnly ? handleAddToCart : undefined}
          />
        )}

        {/* Top-level Tabs */}
        {!authLoading && mode === 'list' && (
          <>
            {tab === 'Catalog' && (
              <Catalog
                onNavigate={profile?.is_admin ? (destination, payload) => handleNavigate(destination, payload) : undefined}
                onAddToCart={!profile?.is_admin ? handleAddToCart : undefined}
              />
            )}
            {tab === 'Cart' && (
              <CartPage
                cart={cart}
                user={profile || session?.user || { email: '' }}
                onQuantity={(id, quantity) => setCart((items) => quantity < 1 ? items.filter((item) => String(item.id) !== String(id)) : items.map((item) => String(item.id) === String(id) ? { ...item, quantity } : item))}
                onRemove={(id) => setCart((items) => items.filter((item) => String(item.id) !== String(id)))}
                onCheckout={handlePlaceOrder}
                onBrowse={() => setTab('Catalog')}
              />
            )}
            {tab === 'Orders' && session?.user?.id && (
              <OrdersPage
                user={session.user}
                onBrowse={() => setTab('Catalog')}
              />
            )}
            {tab === 'Admin' && profile?.is_admin && <AdminOrdersPage />}
            {tab === 'Login' && <AuthPage onSubmit={handleAuthSubmit} notice={authNotice} />}
            {tab === 'Favorites' && (
              <FavoritesPage
                onSelectGun={(g) => handleNavigate('Detail', g)}
                onNavigateCatalog={() => setTab('Catalog')}
                onAddToCart={!profile?.is_admin ? handleAddToCart : undefined}
              />
            )}
            {tab === 'Profile' && session?.user?.id && (
              <ProfilePage onReplaySplash={() => setShowSplash(true)} />
            )}
            {tab === 'About' && <About />}
            {tab === 'Contact' && <Contact />}
          </>
        )}
      </main>

      {/* Global Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Hardware Record"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            await gunService.deleteGun(deleteTarget.id)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to delete record.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
