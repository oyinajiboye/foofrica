import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/directory.css'

export default function DirectoryPage({ role }) {
  const { apiFetch } = useAuth()
  const [query, setQuery] = useState('')
  const [filters,setFilters]=useState({})
  const [people, setPeople] = useState([])
  const [page, setPage] = useState(1)
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/directory?role=${role}&q=${encodeURIComponent(query)}&page=${page}&${new URLSearchParams(filters)}`)
        if (!cancelled) { setPeople(res.data.data); setMore(res.data.hasMore); setError('') }
      } catch (err) { if (!cancelled) { setError(err.message); setPeople([]) } }
      finally { if (!cancelled) setLoading(false) }
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [apiFetch, role, query, page,filters])
  const title = `${role[0].toUpperCase()}${role.slice(1)}${role === 'coach' ? 'es' : 's'}`
  return <div className="directory">
    <header><Link to="/feed" className="brand">footfrica</Link><nav><Link to="/feed">Home</Link><Link to="/discover">Discover</Link><Link to="/messages">Messages</Link><Link to="/profile">My profile</Link></nav></header>
    <main><h1>{title}</h1><nav className="directory-tabs">{['player','club','scout','coach'].map(type => <Link key={type} aria-current={role === type ? 'page' : undefined} to={`/${type}${type === 'coach' ? 'es' : 's'}`}>{type[0].toUpperCase() + type.slice(1)}{type === 'coach' ? 'es' : 's'}</Link>)}</nav>
      <label>Search {title.toLowerCase()}<input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} placeholder="Name or username" /></label>
      {role==='player'&&<div style={{display:'flex',gap:12,flexWrap:'wrap'}}>{[['position','Position'],['nationality','Nationality'],['foot','Dominant foot (left/right/both)'],['min_age','Minimum age'],['max_age','Maximum age']].map(([key,label])=><label key={key}>{label}<input value={filters[key]||''} onChange={e=>{setFilters(f=>{const next={...f};if(e.target.value)next[key]=e.target.value;else delete next[key];return next});setPage(1)}}/></label>)}</div>}
      {error && <p role="alert">{error}</p>}
      {loading ? <p role="status">Loading…</p> : <><div className="directory-grid">{people.map(person => <article key={person.id}>
        {person.avatar_url ? <img src={person.avatar_url} alt="" /> : <span className="directory-avatar">{person.display_name?.slice(0,1)}</span>}
        <h2><Link to={`/profile/${person.username}`}>{person.display_name}</Link></h2><p>@{person.username}{person.is_verified ? ' · Verified' : ''}</p><p>{person.bio || person.location || 'Football community member'}</p>
        <Link to={`/profile/${person.username}`}>View profile</Link>
      </article>)}</div>{people.length === 0 && !error && <p>No {title.toLowerCase()} found.</p>}</>}
      <div className="directory-pagination"><button disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page}</span><button disabled={!more || loading} onClick={() => setPage(p => p + 1)}>Next</button></div>
    </main></div>
}
