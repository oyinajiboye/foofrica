import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/directory.css'

export default function ScoutWatchlistPage() {
  const { user, apiFetch } = useAuth()
  const [lists, setLists] = useState([])
  const [selected, setSelected] = useState('')
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const loadLists = useCallback(async () => {
    const res = await apiFetch('/api/scouts/shortlists')
    setLists(res.data || [])
    setSelected(current => current || res.data?.[0]?.id || '')
  }, [apiFetch])
  useEffect(() => { if (user?.user_type === 'scout') loadLists().catch(err => setError(err.message)) }, [loadLists, user?.user_type])
  useEffect(() => {
    setPlayers([])
    if (!selected) return
    let cancelled = false
    setLoading(true)
    apiFetch(`/api/scouts/shortlists/${selected}/players`).then(res => { if (!cancelled) setPlayers(res.data || []) }).catch(err => { if (!cancelled) setError(err.message) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selected, apiFetch])
  const createList = async e => {
    e.preventDefault(); setBusy(true); setError('')
    try { const res = await apiFetch('/api/scouts/shortlists', { method: 'POST', body: JSON.stringify({ name: name.trim() }) }); await loadLists(); setSelected(res.data.id); setName('') }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const addPlayer = async e => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const profile = await apiFetch(`/api/profiles/${encodeURIComponent(username.replace(/^@/, '').trim())}`)
      await apiFetch(`/api/scouts/shortlists/${selected}/players`, { method: 'POST', body: JSON.stringify({ player_id: profile.data.id }) })
      const res = await apiFetch(`/api/scouts/shortlists/${selected}/players`)
      setPlayers(res.data || []); setUsername('')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const remove = async playerId => {
    setBusy(true)
    try { await apiFetch(`/api/scouts/shortlists/${selected}/players/${playerId}`, { method: 'DELETE' }); setPlayers(prev => prev.filter(p => p.player.id !== playerId)) }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const saveNote = async (playerId, notes) => {
    try { await apiFetch(`/api/scouts/shortlists/${selected}/players/${playerId}`, { method: 'PUT', body: JSON.stringify({ notes }) }); setError('') }
    catch (err) { setError('Note was not saved: ' + err.message) }
  }
  return <div className="directory"><header><Link to="/feed" className="brand">footfrica</Link><nav><Link to="/players">Find players</Link><Link to="/messages">Messages</Link><Link to="/profile">My profile</Link></nav></header><main>
    <h1>Scout watchlist</h1>{user?.user_type !== 'scout' ? <p>Watchlists are available to scout accounts. <Link to="/players">Explore players</Link></p> : <>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={createList}><label>Create a shortlist<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Under-21 midfielders" /></label><button disabled={busy || !name.trim()}>Create shortlist</button></form>
      <label style={{marginTop:24}}>Your shortlists<select value={selected} onChange={e => setSelected(e.target.value)} style={{display:'block',padding:12,font:'inherit',margin:'8px 0 20px',maxWidth:'100%'}}><option value="">Select a shortlist</option>{lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
      {selected && <><form onSubmit={addPlayer}><label>Add a player by username<input required value={username} onChange={e => setUsername(e.target.value)} /></label><button disabled={busy || !username.trim()}>Add player</button></form><p>{loading ? 'Loading…' : `${players.length} players in this shortlist`}</p>
      <div className="directory-grid">{players.map(item => <article key={item.player.id}><h2><Link to={`/profile/${item.player.username}`}>{item.player.display_name}</Link></h2><p>{item.player.player_profile?.primary_position || 'Position not specified'}</p><label>Evaluation notes<input key={selected + item.player.id} defaultValue={item.notes || ''} maxLength={500} onBlur={e => saveNote(item.player.id, e.target.value)} /></label><button disabled={busy} onClick={() => remove(item.player.id)}>Remove</button></article>)}</div></>}
    </>}</main></div>
}
