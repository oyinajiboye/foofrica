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
  return <main className='ff-work-main' style={{
    maxWidth: 850,
    margin: 'auto'
  }}><Link className='ff-brand' to='/feed'>footfrica</Link><h1>Notifications</h1><p>{data.unread_count || 0} unread · <Link to='/alerts'>Opportunity preferences</Link></p>{error && <p role='alert' className='ff-error'>{error}</p>}<button disabled={busy} onClick={() => act('/api/notifications/read-all', 'PUT')}>Mark all read</button>{data.data.length ? data.data.map(n => <article className='ff-panel' key={n.id}><Link to={target(n)} onClick={() => act(`/api/notifications/${n.id}/read`, 'PUT')}><strong>{n.actor?.display_name || 'Footfrica'}</strong> {labels[n.type] || 'sent an update'}</Link><p>{new Date(n.created_at).toLocaleString()}{!n.read_at ? ' · Unread' : ''}</p><button disabled={busy} onClick={() => act(`/api/notifications/${n.id}`, 'DELETE')}>Delete</button></article>) : <p>No notifications yet.</p>}<button disabled={page === 1 || busy} onClick={() => setPage(p => p - 1)}>Previous</button><button disabled={!data.hasMore || busy} onClick={() => setPage(p => p + 1)}>Next</button></main>;
}
