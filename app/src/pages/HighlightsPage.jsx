import AppHeader from '../components/AppHeader'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StreamPlayer from '../components/StreamPlayer';
import '../styles/recruitment.css';
export default function HighlightsPage() {
  const {
    apiFetch
  } = useAuth();
  const [index, setIndex] = useState(0);
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
  const post=posts[index];
  return <div className='ff-workspace'><AppHeader/>{error && <p role='alert' className='ff-error'>{error}</p>}{loading && <p>Loading highlights…</p>}{post ? <main className='design-highlight'><aside className='design-highlight-caption'><h2>{post.author?.display_name || 'Football highlight'}</h2><p>@{post.author?.username} · {post.author?.user_type}</p><p>{post.content}</p><p style={{color:'#b59700'}}>{post.tags?.map(t=>'#'+t).join(' ')}</p><Link to={`/profile/${post.author?.username}`}>View profile</Link> · <Link to={`/post/${post.id}`}>Join the conversation</Link></aside><section className='design-highlight-video' aria-label='Selected highlight'><StreamPlayer key={post.id} video={post.video}/></section><aside className='design-highlight-actions'><Link to={`/post/${post.id}`} aria-label='Like or comment on highlight'>♡<br/>{post.likes_count || 0}</Link><Link to={`/post/${post.id}`} aria-label='Comments'>Comments<br/>{post.comments_count || 0}</Link><Link to='/saved'>Saved</Link><button disabled={index===0} onClick={()=>setIndex(i=>i-1)} aria-label='Previous highlight'>↑</button><button disabled={index===posts.length-1} onClick={()=>setIndex(i=>i+1)} aria-label='Next highlight'>↓</button><small>{index+1} / {posts.length}</small></aside></main> : !loading && <main className='ff-work-main'><h1>Highlights</h1><p>No highlights yet. Share the first one.</p><Link to='/upload-highlight'>Upload a highlight</Link></main>}</div>;
}
