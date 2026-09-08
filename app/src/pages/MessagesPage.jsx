import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form } from './RecruitmentPage';
import '../styles/recruitment.css';
export default function MessagesPage() {
  const {
      user,
      apiFetch
    } = useAuth(),
    [params] = useSearchParams();
  const [conversations, setConversations] = useState([]),
    [active, setActive] = useState(null),
    [messages, setMessages] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [text, setText] = useState(''),
    [page, setPage] = useState(1),
    [more, setMore] = useState(false);
  const loadInbox = useCallback(async () => {
    const r = await apiFetch('/api/messages/conversations?limit=100');
    setConversations(r.data.data || []);
  }, [apiFetch]);
  const loadThread = useCallback(async () => {
    if (!active) return;
    const r = await apiFetch(`/api/messages/conversations/${active}?page=${page}&limit=50`);
    setMessages(r.data.data || []);
    setMore(r.data.hasMore);
  }, [apiFetch, active, page]);
  useEffect(() => {
    let running = false,
      cancelled = false;
    const refresh = async () => {
      if (running || cancelled || document.hidden) return;
      running = true;
      try {
        await Promise.all([loadInbox(), loadThread()]);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        running = false;
      }
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [loadInbox, loadThread]);
  const run = async fn => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await fn();
      await Promise.all([loadInbox(), loadThread()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const conv = conversations.find(c => c.id === active),
    other = conv?.other_participant;
  const send = e => {
    e.preventDefault();
    run(async () => {
      await apiFetch(`/api/messages/conversations/${active}`, {
        method: 'POST',
        body: JSON.stringify({
          content: text
        })
      });
      setText('');
      setPage(1);
    });
  };
  return <div className='ff-workspace'><header className='ff-topbar'><Link className='ff-brand' to='/feed'>footfrica</Link><nav><Link to='/opportunities'>Opportunities</Link><Link to='/applications'>Applications</Link><Link to='/profile'>My profile</Link></nav></header><main className='ff-work-main'><h1>Messages</h1>{error && <p role='alert' className='ff-error'>{error}</p>}<details open={!!params.get('to')}><summary>New message</summary><Form busy={busy} label='Send message' fields={[{
          name: 'username',
          label: 'Recipient username',
          required: true,
          value: params.get('to')
        }, {
          name: 'message',
          label: 'Message',
          type: 'textarea',
          required: true
        }]} onSubmit={f => run(async () => {
          const p = await apiFetch(`/api/profiles/${encodeURIComponent(f.username.replace(/^@/, '').trim())}`);
          const r = await apiFetch('/api/messages/conversations', {
            method: 'POST',
            body: JSON.stringify({
              recipient_id: p.data.id,
              message: f.message
            })
          });
          setActive(r.data.conversation_id);
          setPage(1);
        })} /></details><div className='ff-inbox'><aside>{conversations.length ? conversations.map(c => <button className='ff-panel' style={{
            display: 'block',
            width: '100%',
            textAlign: 'left'
          }} key={c.id} onClick={() => {
            setActive(c.id);
            setMessages([]);
            setPage(1);
          }} aria-pressed={active === c.id}><strong>{c.other_participant?.display_name || 'Former participant'}</strong><p>{c.last_message}</p>{c.unread_count > 0 && <span>{c.unread_count} unread</span>}</button>) : <p>No conversations yet.</p>}</aside><section className='ff-panel'>{active ? <><h2>{other?.display_name || 'Conversation'}</h2>{other && <><Link to={`/profile/${other.username}`}>View profile</Link> · <Link to='/safety'>Report or block</Link><button disabled={busy} onClick={() => run(() => apiFetch(`/api/blocks/mutes/${other.id}`, {
                method: 'POST',
                body: '{}'
              }))}>Mute account</button></>}<button disabled={busy} onClick={() => {
              if (window.confirm('Leave this conversation? You will lose access to its messages.')) run(async () => {
                await apiFetch(`/api/messages/conversations/${active}`, {
                  method: 'DELETE'
                });
                setActive(null);
                setMessages([]);
              });
            }}>Leave conversation</button><div aria-live='polite' className='ff-thread'>{messages.map(m => <article key={m.id} className={m.sender_id === user.id ? 'ff-message own' : 'ff-message'}><strong>{m.sender?.display_name || 'You'}</strong><p className='ff-prewrap'>{m.content}</p>{m.attachments?.map(a => <button disabled={busy} key={a.id} onClick={() => run(async () => {
                  const r = await apiFetch(`/api/messages/attachments/${a.id}`);
                  window.location.assign(r.data.url);
                })}>Download {a.file_name}</button>)}<small>{new Date(m.created_at).toLocaleString()}{m.sender_id === user.id && m.read_at ? ' · Read' : ''}</small></article>)}</div><button disabled={!more} onClick={() => setPage(p => p + 1)}>Older messages</button><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Newer messages</button><form onSubmit={send}><label className='ff-field'>Message<textarea required maxLength={2000} value={text} onChange={e => setText(e.target.value)} /></label><button disabled={busy || !text.trim()}>Send</button></form><label className='ff-field'>Attach PDF or photo (5 MB)<input disabled={busy} type='file' accept='application/pdf,image/jpeg,image/png,image/webp' onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) run(async () => {
                  if (file.size > 5 * 1024 * 1024) throw new Error('File must be 5 MB or smaller.');
                  const body = new FormData();
                  body.append('file', file);
                  await apiFetch(`/api/messages/conversations/${active}/attachments`, {
                    method: 'POST',
                    body
                  });
                });
              }} /></label><button onClick={() => setText(`${window.location.origin}/profile/${user.username}`)}>Share my profile</button><Link to='/upload-highlight'>Upload a highlight</Link></> : <p>Select a conversation or start a new message.</p>}</section></div></main></div>;
}
