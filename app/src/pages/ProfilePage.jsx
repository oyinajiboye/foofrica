import AppHeader from '../components/AppHeader'
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form } from './RecruitmentPage';
import '../styles/recruitment.css';
export default function ProfilePage() {
  const {
    username,
    id
  } = useParams();
  const {
    user,
    apiFetch,
    saveSession
  } = useAuth();
  const identifier = id || (username && username !== 'me' ? username : user.username);
  const [profile, setProfile] = useState(null),
    [posts, setPosts] = useState([]),
    [career, setCareer] = useState([]),
    [stats, setStats] = useState([]),
    [endorsements, setEndorsements] = useState([]),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/profiles/${identifier}`);
      setProfile(r.data);
      const [p, c, s, e] = await Promise.all([apiFetch(`/api/profiles/${r.data.id}/posts`), apiFetch(`/api/profiles/${r.data.id}/career`), apiFetch(`/api/profiles/${r.data.id}/stats`), apiFetch(`/api/profiles/${r.data.id}/endorsements`)]);
      setPosts(p.data?.data || p.data || []);
      setCareer(c.data || []);
      setStats(s.data || []);
      setEndorsements(e.data || []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [apiFetch, identifier]);
  useEffect(() => {
    setProfile(null);
    load();
  }, [load]);
  useEffect(() => {
    if (profile?.id && profile.id !== user.id) apiFetch(`/api/recruitment/profile-views/${profile.id}`, {
      method: 'POST',
      body: '{}'
    }).catch(() => {});
  }, [profile?.id, user.id, apiFetch]);
  const own = profile?.id === user.id;
  const run = async fn => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      setNotice('Saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const put = (path, body, method = 'PUT') => apiFetch(path, {
    method,
    body: JSON.stringify(body)
  });
  const photo = (event, kind) => {
    const file = event.target.files?.[0];
    if (!file) return;
    run(async () => {
      const body = new FormData();
      body.append('file', file);
      const r = await apiFetch(`/api/uploads/${kind}`, {
        method: 'POST',
        body
      });
      saveSession(localStorage.getItem('ff_token'), {
        ...user,
        ...r.data
      });
    });
  };
  return <div className='ff-workspace'><AppHeader/><main className='ff-work-main design-profile' style={{
      maxWidth: 1100,
      margin: 'auto'
    }}><div className='design-profile-body'>{error && <p role='alert' className='ff-error'>{error}</p>}{notice && <p role='status'>{notice}</p>}{!profile && !error && <p>Loading profile…</p>}{profile && <>
 {profile.cover_url && <img src={profile.cover_url} alt='' style={{
          width: '100%',
          height: 200,
          objectFit: 'cover',
          borderRadius: 12
        }} />}<section className='ff-panel'>{profile.avatar_url && <img src={profile.avatar_url} alt='' style={{
            width: 88,
            height: 88,
            objectFit: 'cover',
            borderRadius: '50%'
          }} />}<h1>{profile.display_name}{profile.is_verified ? ' ✓' : ''}</h1><p>@{profile.username} · {profile.user_type} · {profile.location}</p><p>{profile.bio}</p><p>{profile.follower_count} followers · {profile.following_count} following · {profile.post_count} posts</p>{own ? <><Link to='/cv'>Football CV</Link> · <Link to='/analytics'>Profile analytics</Link> · <Link to='/verification'>Verification</Link> · <Link to='/squad'>Squad membership</Link></> : <><button disabled={busy} onClick={() => run(() => put(`/api/follows/${profile.id}`, {}, profile.is_following ? 'DELETE' : 'POST'))}>{profile.is_following ? 'Unfollow' : 'Follow'}</button><Link to={`/messages?to=${profile.username}`}>Send a message</Link> · <Link to='/safety'>Report or block</Link></>}</section>
 <nav className='design-tabs' aria-label='Profile sections'>{['Overview','Career history','Season statistics','Endorsements','Posts'].map(t=><a key={t} href={'#profile-'+t.replaceAll(' ','-')}>{t}</a>)}</nav>{own && <details id='profile-Overview' className='ff-panel'><summary>Edit profile</summary><Form busy={busy} fields={[{
            name: 'display_name',
            label: 'Display name',
            required: true,
            value: profile.display_name
          }, {
            name: 'bio',
            label: 'Bio',
            type: 'textarea',
            max: 300,
            value: profile.bio
          }]} onSubmit={f => run(async () => {
            const r = await put('/api/profiles/me', f);
            saveSession(localStorage.getItem('ff_token'), {
              ...user,
              ...r.data
            });
          })} /><label className='ff-field'>Profile photo<input type='file' accept='image/jpeg,image/png,image/webp,image/gif' onChange={e => photo(e, 'avatar')} /></label><label className='ff-field'>Cover photo<input type='file' accept='image/jpeg,image/png,image/webp,image/gif' onChange={e => photo(e, 'cover')} /></label>
 {profile.user_type === 'player' && <Form busy={busy} label='Save player details' fields={[{
            name: 'full_name',
            label: 'Full name',
            value: profile.player_profile?.full_name || profile.display_name
          }, {
            name: 'date_of_birth',
            label: 'Date of birth',
            type: 'date',
            value: profile.player_profile?.date_of_birth
          }, {
            name: 'nationality',
            label: 'Nationality',
            value: profile.player_profile?.nationality
          }, {
            name: 'primary_position',
            label: 'Position',
            options: ['', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'],
            value: profile.player_profile?.primary_position
          }, {
            name: 'dominant_foot',
            label: 'Dominant foot',
            options: ['', 'left', 'right', 'both'],
            value: profile.player_profile?.dominant_foot
          }, {
            name: 'height_cm',
            label: 'Height (cm)',
            type: 'number',
            min: 140,
            max: 220,
            value: profile.player_profile?.height_cm
          }]} onSubmit={f => run(() => put('/api/profiles/me/player', Object.fromEntries(Object.entries(f).filter(([, v]) => v).map(([k, v]) => [k, k === 'height_cm' ? Number(v) : v]))))} />}
 {profile.user_type === 'club' && <Form busy={busy} label='Save club details' fields={[{
            name: 'club_name',
            label: 'Club name',
            required: true,
            value: profile.club_profile?.club_name
          }, {
            name: 'country',
            label: 'Country',
            value: profile.club_profile?.country
          }, {
            name: 'city',
            label: 'City',
            value: profile.club_profile?.city
          }, {
            name: 'league',
            label: 'League',
            value: profile.club_profile?.league
          }]} onSubmit={f => run(() => put('/api/profiles/me/club', f))} />}
 {profile.user_type === 'scout' && <Form busy={busy} label='Save scout details' fields={[{
            name: 'organization',
            label: 'Organisation',
            value: profile.scout_profile?.organization
          }, {
            name: 'license_number',
            label: 'Licence number',
            value: profile.scout_profile?.license_number
          }]} onSubmit={f => run(() => put('/api/profiles/me/scout', f))} />}
 {profile.user_type === 'coach' && <Form busy={busy} label='Save coaching details' fields={[{
            name: 'license_level',
            label: 'Coaching qualification',
            value: profile.coach_profile?.license_level
          }]} onSubmit={f => run(() => put('/api/profiles/me/coach', f))} />}
 {profile.user_type === 'fan' && <Form busy={busy} label='Save fan details' fields={[{
            name: 'favorite_club_name',
            label: 'Favourite club',
            value: profile.fan_profile?.favorite_club_name
          }]} onSubmit={f => run(() => put('/api/profiles/me/fan', f))} />}
 </details>}
 {profile.user_type === 'player' && <><section className='ff-panel'><h2>Availability</h2><p>{profile.player_profile?.availability?.replaceAll('_',' ') || 'Not specified'}</p><p>{profile.player_profile?.preferred_location}</p>{own && <Form busy={busy} label='Save availability' fields={[{name:'availability',label:'Availability',options:['not_specified','open_to_trials','open_to_transfer','unavailable'],value:profile.player_profile?.availability},{name:'preferred_location',label:'Preferred location',value:profile.player_profile?.preferred_location},{name:'available_from',label:'Available from',type:'date',value:profile.player_profile?.available_from},{name:'willing_to_relocate',label:'Willing to relocate',options:['no','yes'],value:profile.player_profile?.willing_to_relocate?'yes':'no'}]} onSubmit={f=>run(()=>put('/api/profiles/me/player',{...f,available_from:f.available_from||null,willing_to_relocate:f.willing_to_relocate==='yes'}))}/>}</section><section className='ff-panel'><h2>Player details</h2><p>{profile.player_profile?.primary_position || 'Position not provided'} · {profile.player_profile?.dominant_foot || 'Dominant foot not provided'} · {profile.player_profile?.nationality}</p></section><section id='profile-Career-history' className='ff-panel'><h2>Career history</h2>{career.length ? career.map(c => <div key={c.id}><p>{c.club_name} · {c.role} · {c.start_date}–{c.end_date || 'Present'}</p>{own && <button disabled={busy} onClick={() => run(() => apiFetch(`/api/profiles/${profile.id}/career/${c.id}`, {
                method: 'DELETE'
              }))}>Remove entry</button>}</div>) : <p>No career entries yet.</p>}{own && <details><summary>Add career entry</summary><Form busy={busy} fields={[{
                name: 'club_name',
                label: 'Club',
                required: true
              }, {
                name: 'role',
                label: 'Role'
              }, {
                name: 'start_date',
                label: 'Start date',
                type: 'date',
                required: true
              }, {
                name: 'end_date',
                label: 'End date (blank for current)',
                type: 'date'
              }]} onSubmit={f => run(() => put(`/api/profiles/${user.id}/career`, {
                ...f,
                end_date: f.end_date || undefined,
                is_current: !f.end_date
              }, 'POST'))} /></details>}</section><section id='profile-Season-statistics' className='ff-panel'><h2>Season statistics</h2>{stats.length ? stats.map(s => <p key={s.id}>{s.season} · {s.club_name}: {s.appearances} appearances, {s.goals} goals, {s.assists} assists</p>) : <p>No statistics yet.</p>}{own && <details><summary>Add or update season statistics</summary><Form busy={busy} fields={[{
                name: 'season',
                label: 'Season (e.g. 2026-27)',
                required: true
              }, {
                name: 'club_name',
                label: 'Club',
                required: true
              }, ...['appearances', 'goals', 'assists'].map(name => ({
                name,
                label: name,
                type: 'number',
                min: 0,
                value: 0
              }))]} onSubmit={f => run(() => put(`/api/profiles/${user.id}/stats`, {
                ...f,
                appearances: Number(f.appearances),
                goals: Number(f.goals),
                assists: Number(f.assists)
              }))} /></details>}</section></>}
 <section id='profile-Endorsements' className='ff-panel'><h2>Endorsements</h2>{endorsements.map(e => <p key={e.id}>{e.skill} · {e.endorser?.display_name}</p>)}{!own && profile.user_type === 'player' && ['coach', 'scout'].includes(user.user_type) && <Form busy={busy} label='Endorse skill' fields={[{
            name: 'skill',
            label: 'Skill',
            options: ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'tackling', 'leadership', 'communication', 'vision', 'positioning']
          }]} onSubmit={f => run(() => put(`/api/profiles/${profile.id}/endorse`, f, 'POST'))} />}</section>
 <section id='profile-Posts'><h2>Posts</h2>{posts.length ? posts.map(p => <article className='ff-panel' key={p.id}><p>{p.content}</p>{p.image_urls?.map(url => <img src={url} key={url} alt='Post' style={{
              maxWidth: 250,
              maxHeight: 250
            }} />)}<Link to={`/post/${p.id}`}>View post and comments</Link></article>) : <p>No posts yet.</p>}</section>
 </>}</div>{profile && <aside className='design-side'><section className='ff-panel'><h2>{profile.user_type === 'player' ? 'Player snapshot' : 'Profile snapshot'}</h2><dl><dt>Role</dt><dd>{profile.user_type}</dd><dt>Location</dt><dd>{profile.location || 'Not provided'}</dd><dt>Followers</dt><dd>{profile.follower_count || 0}</dd>{profile.player_profile && <><dt>Position</dt><dd>{profile.player_profile.primary_position || 'Not provided'}</dd><dt>Dominant foot</dt><dd>{profile.player_profile.dominant_foot || 'Not provided'}</dd><dt>Nationality</dt><dd>{profile.player_profile.nationality || 'Not provided'}</dd></>}</dl></section><section className='ff-panel'><h2>Discover football talent</h2><p>Explore players, clubs and opportunities across the football community.</p><Link to='/players'>Find players</Link><p><Link to='/opportunities'>Explore opportunities</Link></p></section></aside>}</main></div>;
}
