import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/recruitment.css';
const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];
const routes = [['opportunities', 'Opportunities'], ['applications', 'Applications'], ['verification', 'Verification'], ['compare', 'Compare players'], ['cv', 'Football CV'], ['analytics', 'Analytics'], ['squad', 'Squad'], ['alerts', 'Opportunity alerts'], ['safety', 'Safety centre'], ['saved', 'Saved posts'], ['moderation', 'Moderation']];
export function Form({
  fields,
  onSubmit,
  busy,
  label = 'Save'
}) {
  return <form className='ff-panel' onSubmit={e => {
    e.preventDefault();
    onSubmit(Object.fromEntries(new FormData(e.currentTarget)));
  }}>{fields.map(f => <label className='ff-field' key={f.name}>{f.label}{f.options ? <select name={f.name} defaultValue={f.value ?? ''}>{f.options.map(o => <option key={o} value={o}>{o || 'Any'}</option>)}</select> : f.type === 'textarea' ? <textarea name={f.name} required={f.required} maxLength={f.max || 2000} defaultValue={f.value ?? ''} /> : <input name={f.name} type={f.type || 'text'} required={f.required} min={f.min} max={f.max} defaultValue={f.value ?? ''} />}</label>)}<button disabled={busy}>{label}</button></form>;
}
function Records({
  rows,
  children
}) {
  return rows.length ? <div>{rows.map(children)}</div> : <p>No records yet.</p>;
}
export default function RecruitmentPage() {
  const tab = useLocation().pathname.split('/')[1];
  const {
    user,
    apiFetch
  } = useAuth();
  const [data, setData] = useState([]),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [filter, setFilter] = useState(''),
    [review, setReview] = useState(false),
    [cv, setCv] = useState(null),
    [total, setTotal] = useState(0),
    [blocks, setBlocks] = useState([]),
    [mutes, setMutes] = useState([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'compare') {
        setData([]);
      } else if (tab === 'cv') {
        const [p, c, s, v] = await Promise.all([apiFetch(`/api/profiles/${user.username}`), apiFetch(`/api/profiles/${user.id}/career`), apiFetch(`/api/profiles/${user.id}/stats`), apiFetch(`/api/profiles/${user.id}/videos`)]);
        setCv({
          ...p.data,
          career: c.data || [],
          stats: s.data || [],
          videos: v.data?.data || v.data || []
        });
      } else {
        const url = tab === 'moderation' ? '/api/admin/reports' : tab === 'saved' ? '/api/bookmarks' : tab === 'safety' ? '/api/reports' : `/api/recruitment/${tab}${tab === 'opportunities' ? filter : tab === 'verification' && review ? '/review' : ''}`;
        const r = await apiFetch(url);
        setData(tab === 'saved' || tab === 'moderation' ? r.data?.data || [] : r.data || []);
        setTotal(r.total || 0);
        if (tab === 'safety') {
          const b = await apiFetch('/api/blocks?limit=100');
          setBlocks(b.data.data || []);
          const m = await apiFetch('/api/blocks/mutes?limit=100');
          setMutes(m.data.data || []);
        }
      }
    } catch (e) {
      setError(e.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, tab, filter, review, user.id, user.username]);
  useEffect(() => {
    load();
  }, [load]);
  const run = async (fn, msg) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(msg);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const send = (path, method, body) => apiFetch(path, {
    method,
    body: JSON.stringify(body)
  });
  const rows = Array.isArray(data) ? data : [];
  return <div className='ff-workspace'><header className='ff-topbar'><Link to='/feed' className='ff-brand'>footfrica</Link><nav><Link to='/feed'>Feed</Link><Link to='/players'>Find talent</Link><Link to='/messages'>Messages</Link><Link to='/profile'>My profile</Link></nav></header><div className='ff-workspace-grid'><aside className='ff-work-nav'>{routes.map(([path, name]) => <Link key={path} aria-current={tab === path ? 'page' : undefined} to={`/${path}`}>{name}</Link>)}<Link to='/scouts/watchlist'>Scout watchlist</Link><Link to='/settings'>Settings</Link></aside><main className='ff-work-main'><h1>{routes.find(r => r[0] === tab)?.[1]}</h1>{error && <p role='alert' className='ff-error'>{error}</p>}{notice && <p role='status' className='ff-success'>{notice}</p>}{loading && <p>Loading…</p>}
 {tab === 'opportunities' && <><Form busy={busy} label='Filter opportunities' fields={[{
            name: 'country',
            label: 'Country'
          }, {
            name: 'position',
            label: 'Position',
            options: ['', ...positions]
          }, {
            name: 'age',
            label: 'Age',
            type: 'number',
            min: 16,
            max: 50
          }]} onSubmit={f => setFilter('?' + new URLSearchParams(Object.entries(f).filter(([, v]) => v)))} />{user.user_type === 'club' && <><button onClick={() => setFilter('?mine=true')}>My opportunities</button><details><summary>Publish an opportunity</summary><p>A verified club account is required.</p><Form busy={busy} label='Publish opportunity' fields={[{
                name: 'title',
                label: 'Title',
                required: true
              }, {
                name: 'description',
                label: 'Description and requirements',
                type: 'textarea',
                required: true,
                max: 4000
              }, {
                name: 'country',
                label: 'Country',
                required: true
              }, {
                name: 'city',
                label: 'City'
              }, {
                name: 'position',
                label: 'Position',
                options: ['', ...positions]
              }, {
                name: 'min_age',
                label: 'Minimum age',
                type: 'number',
                min: 16,
                max: 50,
                value: 16
              }, {
                name: 'max_age',
                label: 'Maximum age',
                type: 'number',
                min: 16,
                max: 50,
                value: 50
              }, {
                name: 'deadline',
                label: 'Application deadline',
                type: 'datetime-local',
                required: true
              }]} onSubmit={f => run(() => send('/api/recruitment/opportunities', 'POST', {
                ...f,
                positions: f.position ? [f.position] : [],
                min_age: Number(f.min_age),
                max_age: Number(f.max_age),
                deadline: new Date(f.deadline).toISOString()
              }), 'Opportunity published.')} /></details></>}
 <p>{total} opportunities</p><div><button disabled={Number(new URLSearchParams(filter).get('page') || 1) <= 1} onClick={() => {
              const q = new URLSearchParams(filter);
              q.set('page', Number(q.get('page') || 1) - 1);
              setFilter('?' + q);
            }}>Previous</button><button disabled={Number(new URLSearchParams(filter).get('page') || 1) * 20 >= total} onClick={() => {
              const q = new URLSearchParams(filter);
              q.set('page', Number(q.get('page') || 1) + 1);
              setFilter('?' + q);
            }}>Next</button></div><Records rows={rows}>{o => <article className='ff-panel' key={o.id}><h2>{o.title}</h2><p>{o.club?.display_name}{o.club?.is_verified ? ' · Verified club' : ''} · {o.city}, {o.country}</p><p>Ages {o.min_age}–{o.max_age} · {o.positions.join(', ') || 'All positions'}</p><p className='ff-prewrap'>{o.description}</p><p>Deadline: {new Date(o.deadline).toLocaleString()}</p>{user.user_type === 'player' && <Form busy={busy} label='Apply' fields={[{
                name: 'cover_note',
                label: 'Application note',
                type: 'textarea'
              }]} onSubmit={f => run(() => send(`/api/recruitment/opportunities/${o.id}/apply`, 'POST', f), 'Application submitted.')} />} {o.club_id === user.id && <button disabled={busy} onClick={() => run(() => send(`/api/recruitment/opportunities/${o.id}`, 'PUT', {
                status: o.status === 'open' ? 'closed' : 'open'
              }), 'Opportunity updated.')}>{o.status === 'open' ? 'Close' : 'Reopen'}</button>}</article>}</Records></>}
 {tab === 'applications' && <Records rows={rows}>{a => <article className='ff-panel' key={a.id}><h2>{a.opportunity?.title}</h2><p>{a.player?.display_name} · <strong>{a.status}</strong></p><p>{a.cover_note}</p>{(user.user_type === 'club' ? ['shortlisted', 'invited', 'unsuccessful'] : ['withdrawn']).map(status => <button key={status} disabled={busy || ['withdrawn', 'unsuccessful'].includes(a.status)} onClick={() => run(() => send(`/api/recruitment/applications/${a.id}`, 'PUT', {
              status
            }), 'Application updated.')}>{status}</button>)}</article>}</Records>}
 {tab === 'verification' && <><p>Submit an official organisation or credential link for moderator review. Do not include identity documents in a public link.</p><Form busy={busy} label='Request verification' fields={[{
            name: 'organization',
            label: 'Organisation / professional name',
            required: true
          }, {
            name: 'evidence_url',
            label: 'Official evidence link (HTTPS)',
            type: 'url',
            required: true
          }, {
            name: 'notes',
            label: 'Supporting details',
            type: 'textarea'
          }]} onSubmit={f => run(() => send('/api/recruitment/verification', 'POST', f), 'Verification submitted.')} /><button onClick={() => setReview(r => !r)}>{review ? 'My requests' : 'Moderator review queue'}</button><Records rows={rows}>{r => <article className='ff-panel' key={r.id}><h2>{r.organization}</h2><p>{r.profile?.display_name} · {r.status}</p><a href={r.evidence_url} target='_blank' rel='noopener noreferrer'>Evidence link</a><p>{r.notes}</p><p>{r.review_note}</p>{review && <Form busy={busy} label='Save decision' fields={[{
                name: 'status',
                label: 'Decision',
                options: ['approved', 'rejected']
              }, {
                name: 'review_note',
                label: 'Review note',
                required: true
              }]} onSubmit={f => run(() => send(`/api/recruitment/verification/${r.id}/review`, 'PUT', f), 'Review saved.')} />}</article>}</Records></>}
 {tab === 'squad' && <>{user.user_type === 'club' && <Form busy={busy} label='Invite player' fields={[{
            name: 'username',
            label: 'Player username',
            required: true
          }]} onSubmit={f => run(() => send('/api/recruitment/squad', 'POST', f), 'Invitation saved. The player must accept.')} />}<Records rows={rows}>{m => <article key={m.id} className='ff-panel'><h2>{m.player?.display_name} · {m.club?.display_name}</h2><p>{m.status}</p>{(m.player_id === user.id && m.status === 'pending' ? ['accepted', 'declined'] : ['pending', 'accepted'].includes(m.status) ? ['ended'] : []).map(status => <button disabled={busy} key={status} onClick={() => run(() => send(`/api/recruitment/squad/${m.id}`, 'PUT', {
                status
              }), 'Membership updated.')}>{status === 'accepted' ? 'Accept invitation' : status === 'declined' ? 'Decline' : 'End / cancel membership'}</button>)}</article>}</Records></>}
 {tab === 'alerts' && <><p>Save your preferences to receive in-app notifications when clubs publish matching opportunities.</p><Form key={JSON.stringify(data?.preferences)} busy={busy} label='Save alert preferences' fields={[{
            name: 'enabled',
            label: 'Matching alerts',
            value: String(data?.preferences?.enabled ?? true),
            options: ['true', 'false']
          }, {
            name: 'country',
            label: 'Country (blank for any)',
            value: data?.preferences?.country
          }, {
            name: 'position',
            label: 'Position',
            value: data?.preferences?.position,
            options: ['', ...positions]
          }]} onSubmit={f => run(() => send('/api/recruitment/alerts', 'PUT', {
            ...f,
            enabled: f.enabled === 'true'
          }), 'Preferences saved.')} /><Records rows={data?.matches || []}>{o => <article className='ff-panel' key={o.id}><h2>{o.title}</h2><p>{o.city}, {o.country}</p><Link to='/opportunities'>View opportunities and apply</Link></article>}</Records></>}
 {tab === 'analytics' && !Array.isArray(data) && <><p>Profile views count one visit per signed-in viewer per day, excluding your own visits. Engagement totals cover all posts.</p><div className='ff-metrics'>{Object.entries(data).map(([key, value]) => <article className='ff-panel' key={key}><strong>{value}</strong><p>{key.replaceAll('_', ' ')}</p></article>)}</div></>}
 {tab === 'compare' && <><Form busy={busy} label='Compare players' fields={[{
            name: 'names',
            label: '2–4 player usernames, separated by commas',
            required: true
          }]} onSubmit={async f => {
            setError('');
            setBusy(true);
            try {
              const names = f.names.split(',').map(n => n.trim().replace(/^@/, ''));
              if (names.length < 2 || names.length > 4) throw new Error('Enter 2–4 usernames.');
              const profiles = await Promise.all(names.map(n => apiFetch(`/api/profiles/${encodeURIComponent(n)}`)));
              const res = await apiFetch('/api/recruitment/compare?ids=' + profiles.map(p => p.data.id).join(','));
              setData(res.data);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }} />{rows.length > 0 && <div className='ff-table-scroll'><table><thead><tr><th>Attribute</th>{rows.map(p => <th key={p.id}>{p.display_name}</th>)}</tr></thead><tbody>{['primary_position', 'dominant_foot', 'height_cm', 'nationality'].map(key => <tr key={key}><th>{key.replaceAll('_', ' ')}</th>{rows.map(p => <td key={p.id}>{p.player_profile?.[key] || 'Not provided'}</td>)}</tr>)}{['appearances', 'goals', 'assists'].map(key => <tr key={key}><th>{key} (all recorded seasons)</th>{rows.map(p => <td key={p.id}>{p.stats?.reduce((sum, s) => sum + (s[key] || 0), 0) || 0}</td>)}</tr>)}</tbody></table></div>}</>}
 {tab === 'cv' && cv && <><div className='ff-no-print'><button onClick={() => window.print()}>Download / print CV</button><button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/profile/${cv.username}`).then(() => setNotice('Profile link copied.')).catch(() => setError('Unable to copy link.'))}>Copy profile link</button></div><article className='ff-cv'><h2>{cv.display_name}</h2><p>{cv.location} · @{cv.username}</p><p>{cv.bio}</p><h3>Player details</h3><p>{cv.player_profile?.primary_position || 'Position not provided'} · {cv.player_profile?.nationality || 'Nationality not provided'} · {cv.player_profile?.dominant_foot || 'Foot not provided'}</p><h3>Career</h3>{cv.career.map(c => <p key={c.id}>{c.club_name} · {c.role} · {c.start_date}–{c.end_date || 'Present'}</p>)}<h3>Season statistics</h3>{cv.stats.map(s => <p key={s.id}>{s.season}: {s.appearances} appearances, {s.goals} goals, {s.assists} assists</p>)}<h3>Highlights</h3>{cv.videos.map(v => <p key={v.id}><a href={v.cloudflare_playback_url}>{v.title || 'Highlight'}</a> — {v.duration_seconds || 0}s</p>)}<p>Profile: {window.location.origin}/profile/{cv.username}</p></article></>}
 {tab === 'safety' && <><p>Report impersonation, suspicious trials or abusive behaviour. Avoid sending money or identity documents to unverified recruiters.</p><Form busy={busy} label='Submit report' fields={[{
            name: 'username',
            label: 'Account username',
            required: true
          }, {
            name: 'reason',
            label: 'What happened?',
            type: 'textarea',
            required: true,
            max: 500
          }]} onSubmit={f => run(async () => {
            const p = await apiFetch(`/api/profiles/${encodeURIComponent(f.username)}`);
            await send('/api/reports', 'POST', {
              entity_type: 'profile',
              entity_id: p.data.id,
              reported_user_id: p.data.id,
              reason: f.reason
            });
          }, 'Report submitted for moderation.')} /><Form busy={busy} label='Block account' fields={[{
            name: 'username',
            label: 'Account username',
            required: true
          }]} onSubmit={f => run(async () => {
            const p = await apiFetch(`/api/profiles/${encodeURIComponent(f.username)}`);
            await send(`/api/blocks/${p.data.id}`, 'POST', {});
          }, 'Account blocked.')} /><h2>Blocked accounts</h2>{blocks.map(b => <article className='ff-panel' key={b.blocked?.id}>{b.blocked?.display_name}<button disabled={busy} onClick={() => run(() => apiFetch(`/api/blocks/${b.blocked.id}`, {
              method: 'DELETE'
            }), 'Account unblocked.')}>Unblock</button></article>)}<h2>Muted accounts</h2>{mutes.map(m => <article className='ff-panel' key={m.muted?.id}>{m.muted?.display_name}<button disabled={busy} onClick={() => run(() => apiFetch(`/api/blocks/mutes/${m.muted.id}`, {
              method: 'DELETE'
            }), 'Account unmuted.')}>Unmute</button></article>)}<h2>Your reports</h2><Records rows={rows}>{r => <article className='ff-panel' key={r.id}><strong>{r.status}</strong><p>{r.reason}</p></article>}</Records></>}
 {tab === 'saved' && <Records rows={rows}>{b => <article className='ff-panel' key={b.post.id}><h2>{b.post.author?.display_name}</h2><p>{b.post.content}</p><Link to={`/post/${b.post.id}`}>View post</Link><button disabled={busy} onClick={() => run(() => apiFetch(`/api/bookmarks/${b.post.id}`, {
              method: 'DELETE'
            }), 'Bookmark removed.')}>Remove bookmark</button></article>}</Records>}
 {tab === 'moderation' && <><p>Moderator access is required. Review the report and its evidence before recording a decision.</p><Records rows={rows}>{r => <article className='ff-panel' key={r.id}><h2>{r.entity_type} report</h2><p>{r.reason}</p><p>Status: {r.status} · Reported account: {r.reported_user?.display_name}</p>{r.entity_type === 'post' && <Link to={`/post/${r.entity_id}`}>View reported post</Link>}{r.reported_user?.username && <Link to={`/profile/${r.reported_user.username}`}>View account</Link>}<Form busy={busy} label='Record decision' fields={[{
                name: 'action',
                label: 'Decision',
                options: ['approved', 'dismissed']
              }, {
                name: 'note',
                label: 'Moderator note',
                required: true
              }]} onSubmit={f => run(() => send(`/api/admin/reports/${r.id}`, 'PUT', f), 'Review saved.')} /></article>}</Records></>}
 </main></div></div>;
}
