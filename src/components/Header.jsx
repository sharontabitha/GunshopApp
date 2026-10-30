import { Plus, ShoppingBag, Moon, Sun, LogIn, LogOut } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'

const CUSTOMER_NAV = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Favorites', label: 'Favorites', hasBadge: true },
  { id: 'Orders', label: 'Orders' },
  { id: 'Profile', label: 'Profile' },
  { id: 'About', label: 'About' },
  { id: 'Contact', label: 'Contact' },
]

const ADMIN_NAV = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Admin', label: 'Order desk' },
  { id: 'Profile', label: 'Profile' },
  { id: 'About', label: 'About' },
]

const GUEST_NAV = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'About', label: 'About' },
  { id: 'Contact', label: 'Contact' },
]

function Header({ tab, onTab, onNavigateCreate, theme = 'light', onToggleTheme, cartCount = 0, isAuthenticated = false, isAdmin = false, onLogin, onLogout }) {
  const { favorites } = useFavorites()
  const favCount = favorites ? favorites.length : 0
  const navItems = isAdmin ? ADMIN_NAV : isAuthenticated ? CUSTOMER_NAV : GUEST_NAV

  return (
    <header className="header">
      <div className="header-brand-wrap" onClick={() => onTab('Catalog')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="header-logo-badge">
          <img src="/iron-vault.svg" alt="Iron Vault crest" />
        </div>
        <span className="brand display">Iron Vault</span>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'nav-link active' : 'nav-link'}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.hasBadge && favCount > 0 && (
              <span className="nav-badge">{favCount}</span>
            )}
            {item.hasCartBadge && cartCount > 0 && (
              <span className="nav-badge">{cartCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        {!isAdmin && <button type="button" className="header-cart" onClick={() => onTab('Cart')} aria-label={`Open cart, ${cartCount} items`}>
          <ShoppingBag size={17} /><span>Cart</span>{cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
        </button>}
        {isAuthenticated ? (
          <button type="button" className="header-auth" onClick={onLogout} title="Sign out"><LogOut size={16} /><span>Sign out</span></button>
        ) : (
          <button type="button" className="header-auth" onClick={onLogin} title="Sign in"><LogIn size={16} /><span>Sign in</span></button>
        )}
        {onNavigateCreate && (
          <button
            type="button"
            className="btn btn--primary btn--sm header-cta"
            onClick={onNavigateCreate}
            title="Register a catalogue item"
          >
            <Plus size={15} /> Add Item
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
