import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StreamPlayer from '../components/StreamPlayer';
import '../styles/recruitment.css';
export default function HighlightsPage() {
  const {
    apiFetch
  } = useAuth();
  const [posts, setPosts] = useState([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let done = false;
    apiFetch('/api/feed/highlights?limit=50').then(r => {
      if (!done) setPosts(r.data || []);
    }).catch(e => {
      if (!done) setError(e.message);
    }).finally(() => {
      if (!done) setLoading(false);
    });
    return () => {
      done = true;
    };
  }, [apiFetch]);
  return <div className='ff-workspace'><header className='ff-topbar'><Link className='ff-brand' to='/feed'>footfrica</Link><nav><Link to='/upload-highlight'>Upload highlight</Link><Link to='/players'>Find talent</Link><Link to='/scouts/watchlist'>Watchlist</Link><Link to='/saved'>Saved posts</Link></nav></header><main className='ff-work-main' style={{
      maxWidth: 850,
      margin: 'auto'
    }}><h1>Highlights</h1><p>Leading public video posts from the past seven days.</p>{error && <p role='alert' className='ff-error'>{error}</p>}{loading && <p>Loading…</p>}{posts.map(p => <article key={p.id} className='ff-panel'><h2><Link to={`/profile/${p.author?.username}`}>{p.author?.display_name}</Link></h2><p>{p.content}</p><StreamPlayer video={p.video} /><p>{p.likes_count || 0} likes · {p.comments_count || 0} comments</p><Link to={`/post/${p.id}`}>Comment, like or save</Link></article>)}{!loading && !error && !posts.length && <p>No highlights yet. Share the first one.</p>}</main></div>;
}
