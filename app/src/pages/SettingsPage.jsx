import AppHeader from '../components/AppHeader'
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form } from './RecruitmentPage';
export default function SettingsPage() {
  const {
    user,
    apiFetch,
    clearSession, saveSession, accessToken
  } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    apiFetch('/api/settings').then(r => setSettings(r.data)).catch(e => setError(e.message));
  }, [apiFetch]);
  const save = async (path, body, method = 'PUT') => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiFetch(path, {
        method,
        body: JSON.stringify(body)
      });
      setNotice('Saved.');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return <div className='ff-workspace'><AppHeader/><div className='design-settings'><aside className='ff-panel'><h2>Settings</h2>{['Account','Privacy and notifications','Change password','Change email','Location and website','Interests','Account controls'].map(label=><a key={label} href={'#settings-'+label.replaceAll(' ','-')}>{label}</a>)}<Link to='/profile'>Profile</Link><Link to='/verification'>Verification</Link><Link to='/safety'>Blocked & muted</Link></aside><main className='ff-work-main' style={{
      maxWidth: 850,
      margin: 'auto'
    }}><h1 id='settings-Account'>Settings</h1><p>Manage your Footfrica account, privacy, notifications, and football visibility.</p>{error && <p role='alert' className='ff-error'>{error}</p>}{notice && <p role='status'>{notice}</p>}
 <section className='ff-panel'><h2>Download your data</h2><p>Download your own posts, comments, sent messages, applications and role-switch history as JSON.</p>{['posts','comments','messages','applications','role_history'].map(dataset=><button key={dataset} disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const records=[];let page=1,more=true;while(more){const r=await apiFetch(`/api/account-data/export/${dataset}?page=${page++}`);records.push(...r.data.records);more=r.data.hasMore}const url=URL.createObjectURL(new Blob([JSON.stringify({dataset,exported_at:new Date().toISOString(),records},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`footfrica-${dataset}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){setError(e.message)}finally{setBusy(false)}}}>Download {dataset.replaceAll('_',' ')}</button>)}</section>
 <section className='ff-panel'><h2>Switch account role</h2><p>Active role: <strong>{user.user_type}</strong>. Only one role is active at a time. Previous details are retained, but switching clears verification and requires a new verification request. Resolve active applications and squad memberships first.</p><Form busy={busy} label='Switch role' fields={[{name:'next_role',label:'New role',options:['fan','player','coach','scout','club'],value:user.user_type}]} onSubmit={async f=>{setBusy(true);setError('');try{const r=await apiFetch('/api/settings/account/role',{method:'POST',body:JSON.stringify({expected_role:user.user_type,next_role:f.next_role})});saveSession(accessToken,r.data);navigate('/profile')}catch(e){setError(e.message)}finally{setBusy(false)}}}/></section>
 {settings && <><section id='settings-Privacy-and-notifications' className='ff-panel'><h2>Privacy and notifications</h2><Form busy={busy} fields={[{
            name: 'profile_visibility',
            label: 'Profile visibility',
            options: ['public', 'private'],
            value: settings.profile_visibility
          }, {
            name: 'who_can_dm',
            label: 'Who can message you?',
            options: ['everyone', 'followers', 'nobody'],
            value: settings.who_can_dm
          }]} onSubmit={f => save('/api/settings', f)} />{['show_location', 'show_age', 'notify_likes', 'notify_comments', 'notify_follows', 'notify_messages', 'notify_mentions', 'notify_endorsements', 'notify_shortlists'].map(key => <label key={key} className='ff-field'><span><input type='checkbox' checked={!!settings[key]} disabled={busy} onChange={async e => {
                const value = e.target.checked;
                if (await save('/api/settings', {
                  [key]: value
                })) setSettings(s => ({
                  ...s,
                  [key]: value
                }));
              }} />{key.replaceAll('_', ' ')}</span></label>)}</section></>}
 <details id='settings-Change-password' className='ff-panel'><summary>Change password</summary><Form busy={busy} fields={[{
          name: 'current_password',
          label: 'Current password',
          type: 'password',
          required: true
        }, {
          name: 'new_password',
          label: 'New password (at least 8 characters)',
          type: 'password',
          required: true
        }]} onSubmit={f => save('/api/settings/account/password', f)} /></details>
 <details id='settings-Change-email' className='ff-panel'><summary>Change email</summary><Form busy={busy} fields={[{
          name: 'new_email',
          label: 'New email',
          type: 'email',
          required: true
        }, {
          name: 'password',
          label: 'Current password',
          type: 'password',
          required: true
        }]} onSubmit={f => save('/api/settings/account/email', f)} /></details>
 <section id='settings-Location-and-website' className='ff-panel'><h2>Location and website</h2><Form busy={busy} fields={[{
          name: 'location',
          label: 'Location',
          value: user.location
        }, {
          name: 'website_url',
          label: 'Website',
          type: 'url',
          value: user.website_url
        }]} onSubmit={f => save('/api/settings/account/profile', f)} /></section>
 <section id='settings-Interests' className='ff-panel'><h2>Interests</h2><Form busy={busy} fields={[{
          name: 'interests',
          label: 'Topics, separated by commas',
          value: (user.interests || []).join(', ')
        }]} onSubmit={f => save('/api/profiles/me', {
          interests: f.interests.split(',').map(s => s.trim()).filter(Boolean)
        })} /><Link to='/alerts'>Manage opportunity alerts</Link></section>
 <section id='settings-Account-controls' className='ff-panel'><h2>Account controls</h2><button disabled={busy} onClick={async () => {
          await apiFetch('/api/auth/logout', {
            method: 'POST',
            body: '{}'
          }).catch(() => {});
          clearSession, saveSession, accessToken();
          navigate('/login');
        }}>Sign out</button><details><summary>Deactivate account</summary><p>Your account will be disabled. You will need administrator assistance to reactivate it.</p><button disabled={busy} onClick={async () => {
            if (window.confirm('Disable your account? Reactivation requires administrator assistance.') && (await save('/api/settings/deactivate', {}, 'POST'))) {
              clearSession, saveSession, accessToken();
              navigate('/login');
            }
          }}>Deactivate account</button></details><details><summary>Permanently delete account</summary><p>This permanently deletes your account and associated records.</p><Form busy={busy} label='Delete account permanently' fields={[{
            name: 'password',
            label: 'Current password',
            type: 'password',
            required: true
          }]} onSubmit={async f => {
            if (window.confirm('Permanently delete your account and records?') && (await save('/api/settings/account', f, 'DELETE'))) {
              clearSession, saveSession, accessToken();
              navigate('/');
            }
          }} /></details></section>
 </main></div></div>;
}
