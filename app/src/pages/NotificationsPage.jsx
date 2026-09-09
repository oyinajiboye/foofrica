import AppHeader from '../components/AppHeader'
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/recruitment.css';
const labels = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'followed you',
  message: 'sent you a message',
  mention: 'mentioned you',
  endorsement: 'endorsed your skills',
  verification: 'updated your verification',
  shortlist: 'added you to a shortlist',
  opportunity: 'published a matching opportunity',
  application: 'updated an application',
  squad: 'updated squad membership'
};
const target = n => n.type === 'opportunity' ? '/opportunities' : n.type === 'application' ? '/applications' : n.type === 'squad' ? '/squad' : n.type === 'message' ? '/messages' : n.type === 'verification' ? '/verification' : n.entity_type === 'post' ? `/post/${n.entity_id}` : n.actor?.username ? `/profile/${n.actor.username}` : '/profile';
export default function NotificationsPage() {
  const {
    apiFetch
  } = useAuth();
  const [filter,setFilter]=useState('All');
  const [data, setData] = useState({
      data: []
    }),
    [error, setError] = useState(''),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await apiFetch(`/api/notifications?page=${page}&limit=30`);
    setData(r.data);
  }, [apiFetch, page]);
  useEffect(() => {
    let running = false,
      done = false;
    const refresh = async () => {
      if (running || done || document.hidden) return;
      running = true;
      try {
        await load();
      } catch (e) {
        if (!done) setError(e.message);
      } finally {
        running = false;
      }
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      done = true;
      clearInterval(timer);
    };
  }, [load]);
  const act = async (path, method) => {
    setBusy(true);
    setError('');
    try {
      await apiFetch(path, {
        method,
        body: method === 'PUT' ? '{}' : undefined
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const groups={All:null,Mentions:['mention'],Posts:['like','comment','repost'],Opportunities:['opportunity','application','squad'],Messages:['message'],System:['verification']};
  const visible=data.data.filter(n=>!groups[filter] || groups[filter].includes(n.type));
  return <div className='ff-workspace'><AppHeader/><main className='ff-work-main'><h1>Notifications</h1><p>Stay updated on your football activity, opportunities, and conversations.</p>{error && <p role='alert' className='ff-error'>{error}</p>}<button disabled={busy} onClick={()=>act('/api/notifications/read-all','PUT')}>Mark all as read</button><div className='design-two-column'><section className='ff-panel design-notification-list'><nav className='design-tabs' aria-label='Notification filters'>{Object.keys(groups).map(t=><button key={t} aria-selected={filter===t} onClick={()=>setFilter(t)}>{t}</button>)}</nav>{visible.length?visible.map(n=><article className={'design-notification '+(!n.read_at?'unread':'')} key={n.id}><span className='design-avatar'>{(n.actor?.display_name||'F').slice(0,1)}</span><div><Link to={target(n)} onClick={()=>act(`/api/notifications/${n.id}/read`,'PUT')}><strong>{n.actor?.display_name||'Footfrica'}</strong> {labels[n.type]||'sent an update'}</Link><p>{new Date(n.created_at).toLocaleString()}</p><Link to={target(n)}>View update</Link></div><button style={{marginLeft:'auto',background:'white',color:'#777',borderColor:'#eee'}} disabled={busy} onClick={()=>act(`/api/notifications/${n.id}`,'DELETE')}>Delete</button></article>):<p style={{padding:24}}>No notifications in this category on this page.</p>}<div style={{padding:16}}><button disabled={page===1||busy} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={!data.hasMore||busy} onClick={()=>setPage(p=>p+1)}>Next</button></div></section><aside className='design-side'><section className='ff-panel'><h2>Activity summary</h2><dl><dt>Unread notifications</dt><dd>{data.unread_count||0}</dd><dt>On this page</dt><dd>{data.data.length}</dd></dl></section><section className='ff-panel'><h2>Notification settings</h2><p>Choose which football updates you want to receive.</p><Link to='/settings'>Manage settings</Link></section><section className='ff-panel'><h2>Opportunities</h2><Link to='/alerts'>Manage opportunity preferences</Link></section></aside></div></main></div>;
}
