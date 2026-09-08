import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StreamPlayer from '../components/StreamPlayer';
import Poll from '../components/Poll';
import '../styles/recruitment.css';
export default function SinglePostPage() {
  const {
      id
    } = useParams(),
    navigate = useNavigate(),
    {
      user,
      apiFetch
    } = useAuth();
  const [post, setPost] = useState(null),
    [comments, setComments] = useState([]),
    [text, setText] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    const [p, c, b] = await Promise.all([apiFetch(`/api/posts/${id}`), apiFetch(`/api/posts/${id}/comments?page=${page}&limit=30`), apiFetch(`/api/bookmarks/check/${id}`)]);
    setPost(p.data);
    setComments(c.data?.data || c.data || []);
    setMore(c.data?.hasMore);
    setSaved(b.data.is_bookmarked);
  }, [apiFetch, id, page]);
  useEffect(() => {
    load().catch(e => setError(e.message));
  }, [load]);
  const run = async fn => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className='ff-workspace'><header className='ff-topbar'><Link className='ff-brand' to='/feed'>footfrica</Link><nav><Link to='/highlights'>Highlights</Link><Link to='/saved'>Saved posts</Link><Link to='/safety'>Report content</Link></nav></header><main className='ff-work-main' style={{
      maxWidth: 850,
      margin: 'auto'
    }}>{error && <p role='alert' className='ff-error'>{error}</p>}{notice && <p role='status'>{notice}</p>}{post ? <><article className='ff-panel'><h1><Link to={`/profile/${post.author?.username}`}>{post.author?.display_name}</Link></h1><p>{new Date(post.created_at).toLocaleString()}</p><p className='ff-prewrap'>{post.content}</p>{post.image_urls?.map(url => <img key={url} src={url} alt='Post photo' style={{
            width: '100%',
            borderRadius: 12
          }} />)}{post.video && <StreamPlayer video={post.video} />} {post.post_type === 'poll' && <Poll postId={id} />}<p>{post.likes_count || 0} likes · {post.comments_count || 0} comments · {post.reposts_count || 0} reposts</p><button disabled={busy} onClick={() => run(() => apiFetch(`/api/posts/${id}/like`, {
            method: post.is_liked ? 'DELETE' : 'POST',
            body: post.is_liked ? undefined : '{}'
          }))}>{post.is_liked ? 'Unlike' : 'Like'}</button><button disabled={busy} onClick={() => run(() => apiFetch(`/api/posts/${id}/repost`, {
            method: post.is_reposted ? 'DELETE' : 'POST',
            body: post.is_reposted ? undefined : '{}'
          }))}>{post.is_reposted ? 'Undo repost' : 'Repost'}</button><button disabled={busy} onClick={() => run(() => apiFetch(`/api/bookmarks/${id}`, {
            method: saved ? 'DELETE' : 'POST',
            body: saved ? undefined : '{}'
          }))}>{saved ? 'Unsave' : 'Save'}</button><button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => setNotice('Post link copied.')).catch(() => setError('Unable to copy link.'))}>Copy link</button>{post.author_id === user.id && <button disabled={busy} onClick={() => {
            if (window.confirm('Delete this post?')) run(async () => {
              await apiFetch(`/api/posts/${id}`, {
                method: 'DELETE'
              });
              navigate('/feed');
            });
          }}>Delete post</button>}</article><section className='ff-panel'><h2>Comments</h2><form onSubmit={e => {
            e.preventDefault();
            run(async () => {
              await apiFetch(`/api/posts/${id}/comments`, {
                method: 'POST',
                body: JSON.stringify({
                  content: text
                })
              });
              setText('');
              setPage(1);
            });
          }}><label className='ff-field'>Your comment<textarea value={text} onChange={e => setText(e.target.value)} required maxLength={500} /></label><button disabled={busy || !text.trim()}>Post comment</button></form>{comments.map(c => <article key={c.id}><p><strong>{c.author?.display_name}</strong> · {new Date(c.created_at).toLocaleString()}</p><p className='ff-prewrap'>{c.content}</p></article>)}{!comments.length && <p>No comments yet.</p>}<button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><button disabled={!more} onClick={() => setPage(p => p + 1)}>Next</button></section></> : !error && <p>Loading post…</p>}</main></div>;
}
