import { useMemo, useState, useEffect } from 'react'
import { Archive, BookOpen, Check, Copy, FileText, Heart, Info, Mail, Pencil, Play, RotateCcw, Shield, Trash2, UserRound } from 'lucide-react'
import userService from '../services/userService'
import gunService from '../services/gunService'
import { useFavorites } from '../hooks/useFavorites'
import { useGuns } from '../hooks/useGuns'
import { getAllDraftIds, loadDraft, deleteDraft, formatDraftTime } from '../utils/draftStorage'
import About from './About'
import Contact from './Contact'

const sections = [
  { id: 'overview', label: 'Overview', icon: UserRound },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'about', label: 'About', icon: Info },
  { id: 'contact', label: 'Contact', icon: Mail },
]

function readDrafts() {
  return getAllDraftIds().map((id) => ({ id, data: loadDraft(id) })).filter((entry) => entry.data)
}

export default function ProfilePage({ session, authProfile, onReplaySplash, onResumeDraft }) {
  const [section, setSection] = useState('overview')
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || authProfile?.full_name || 'Customer')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [drafts, setDrafts] = useState(readDrafts)
  const { favorites } = useFavorites()
  const { guns: archivedGuns, refetch: refetchArchive } = useGuns({ includeArchived: true, limit: 100 })
  const archived = useMemo(() => archivedGuns.filter((gun) => gun.archived_at), [archivedGuns])
  const visibleSections = authProfile?.is_admin ? sections : sections.filter((item) => item.id !== 'archive')

  useEffect(() => {
    const refresh = () => setDrafts(readDrafts())
    window.addEventListener('iron-vault:drafts-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('iron-vault:drafts-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const userId = session?.user?.id || profile.userId
  const email = session?.user?.email || authProfile?.email || ''
  const displayName = username || authProfile?.full_name || email || 'Customer'

  const handleCopyId = async () => {
    if (!userId) return
    await navigator.clipboard.writeText(userId)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Avatar must be under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const next = reader.result
      setAvatar(next)
      const result = userService.saveUserProfile({ ...profile, avatar: next })
      if (result.success) setProfile(result.data)
      setFeedback('Avatar updated.')
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = (event) => {
    event.preventDefault()
    const result = userService.saveUserProfile({ ...profile, username: username.trim() || 'Customer', bio: bio.trim(), avatar, userId })
    if (result.success) {
      setProfile(result.data)
      setFeedback('Profile saved on this device.')
      setSection('overview')
    } else setFeedback(result.message || 'Could not save the profile.')
  }

  const restoreProduct = async (id) => {
    try {
      await gunService.restoreGun(id)
      await refetchArchive()
      setFeedback('Product restored to the catalog.')
    } catch (error) { setFeedback(error.message || 'Could not restore product.') }
  }

  const permanentlyDelete = async (id) => {
    if (!window.confirm('Permanently delete this archived product? This cannot be undone.')) return
    try {
      await gunService.deleteGun(id)
      await refetchArchive()
      setFeedback('Archived product permanently deleted.')
    } catch (error) { setFeedback(error.message || 'Could not delete product.') }
  }

  const removeDraft = (id) => {
    deleteDraft(id)
    setDrafts(readDrafts())
  }

  return (
    <div className="profile-page page-enter">
      <section className="masthead profile-masthead">
        <div>
          <p className="eyebrow">Your Iron Vault account</p>
          <h1 className="display">Profile</h1>
          <p className="lede">Account details, saved drafts, archived products, and the story behind the house.</p>
        </div>
        <div className="profile-masthead-actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={() => setSection('edit')}><Pencil size={14} /> Edit profile</button>
          {onReplaySplash && <button type="button" className="btn btn--outline btn--sm" onClick={onReplaySplash}><Play size={14} /> Replay intro</button>}
        </div>
      </section>

      {feedback && <div className="toast toast--success" role="status"><Check size={16} /> {feedback}</div>}

      <nav className="profile-section-nav" aria-label="Profile sections">
        {visibleSections.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={section === id ? 'btn btn--primary btn--sm' : 'btn btn--outline btn--sm'} onClick={() => setSection(id)}>
            <Icon size={15} /> {label}{id === 'drafts' && drafts.length > 0 ? ` (${drafts.length})` : ''}{id === 'archive' && archived.length > 0 ? ` (${archived.length})` : ''}
          </button>
        ))}
      </nav>

      {section === 'overview' && <>
        <div className="profile-card">
          <div className="profile-card-top">
            <div className="avatar-wrap">
              {avatar ? <img src={avatar} alt={`${displayName} avatar`} className="avatar-img" /> : <div className="avatar-placeholder"><Shield size={36} stroke="var(--brass)" /></div>}
              <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
                <Pencil size={14} /><input id="avatar-file-input" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden-file-input" />
              </label>
            </div>
            <div className="profile-identity">
              <h2 className="display">{displayName}</h2>
              <p>{email}</p>
              <div className="profile-id-row"><span className="mono-badge">{userId}</span><button type="button" className="icon-btn" onClick={handleCopyId} title="Copy account ID">{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>
            </div>
          </div>
          {bio && <p className="profile-bio">{bio}</p>}
          <div className="profile-stats">
            <div className="stat-item"><Heart size={20} className="stat-icon" stroke="var(--brass)" /><div className="stat-val">{favorites.length}</div><div className="stat-label">Favorites</div></div>
            <div className="stat-item"><FileText size={20} className="stat-icon" stroke="var(--steel)" /><div className="stat-val">{drafts.length}</div><div className="stat-label">Drafts</div></div>
            <div className="stat-item"><Archive size={20} className="stat-icon" stroke="var(--steel)" /><div className="stat-val">{archived.length}</div><div className="stat-label">Archived products</div></div>
          </div>
        </div>
        <div className="profile-shortcuts">
          <button type="button" className="card-box profile-shortcut" onClick={() => setSection('drafts')}><FileText /><span><strong>Saved drafts</strong><small>Continue an unfinished catalog form.</small></span></button>
        {authProfile?.is_admin && <button type="button" className="card-box profile-shortcut" onClick={() => setSection('archive')}><Archive /><span><strong>Product archive</strong><small>Restore or permanently remove archived entries.</small></span></button>}
        </div>
      </>}

      {section === 'edit' && <form onSubmit={saveProfile} className="profile-form">
        <div><p className="eyebrow">Account preferences</p><h2 className="section-title">Edit profile</h2></div>
        <div className="form-group"><label htmlFor="prof-name" className="form-label">Display name</label><input id="prof-name" type="text" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={80} className="form-input" /></div>
        <div className="form-group"><label htmlFor="prof-bio" className="form-label">Bio</label><textarea id="prof-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={400} rows={4} className="form-textarea" /></div>
        <div className="profile-edit-actions"><button type="button" className="btn btn--outline" onClick={() => setSection('overview')}>Cancel</button><button type="submit" className="btn btn--primary">Save profile</button></div>
        <p className="form-hint">Display name, bio, and avatar are stored locally in this browser. Email and password are managed by Supabase Auth.</p>
      </form>}

      {section === 'drafts' && <section className="profile-list-section"><div className="list-head"><div><p className="eyebrow">Continue where you left off</p><h2>Catalog drafts</h2></div><span className="count">{drafts.length} saved</span></div>
        {drafts.length ? <ul className="profile-record-list">{drafts.map(({ id, data }) => <li className="profile-record" key={id}><div><h3>{data.formData?.name || (id === 'create' ? 'New catalog item' : `Edit item ${id}`)}</h3><p>{id === 'create' ? 'New item draft' : 'Catalog edit draft'} · {formatDraftTime(data.savedAt)}</p></div><div className="profile-record-actions"><button type="button" className="btn btn--primary btn--sm" onClick={() => onResumeDraft?.(id)}><BookOpen size={14} /> Resume</button><button type="button" className="btn btn--outline btn--sm" onClick={() => removeDraft(id)}><Trash2 size={14} /> Delete</button></div></li>)}</ul> : <div className="state-box"><FileText size={28} /><h3>No drafts saved</h3><p>Use Save Draft while creating or editing a catalog item.</p></div>}
      </section>}

      {section === 'archive' && authProfile?.is_admin && <section className="profile-list-section"><div className="list-head"><div><p className="eyebrow">Soft-deleted catalog items</p><h2>Archive</h2></div><span className="count">{archived.length} archived</span></div>
        {archived.length ? <ul className="profile-record-list">{archived.map((gun) => <li className="profile-record" key={gun.id}><div><h3>{gun.name}</h3><p>{gun.type} · Archived {new Date(gun.archived_at).toLocaleDateString()}</p></div><div className="profile-record-actions"><button type="button" className="btn btn--primary btn--sm" onClick={() => restoreProduct(gun.id)}><RotateCcw size={14} /> Restore</button><button type="button" className="btn btn--outline btn--sm" onClick={() => permanentlyDelete(gun.id)}><Trash2 size={14} /> Delete permanently</button></div></li>)}</ul> : <div className="state-box"><Archive size={28} /><h3>Archive is empty</h3><p>Products you archive from the catalog will appear here.</p></div>}
      </section>}

      {section === 'about' && <About />}
      {section === 'contact' && <Contact />}
    </div>
  )
}
