import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form } from './RecruitmentPage';
export default function SettingsPage() {
  const {
    user,
    apiFetch,
    clearSession
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
  return <div className='ff-workspace'><header className='ff-topbar'><Link className='ff-brand' to='/feed'>footfrica</Link><nav><Link to='/profile'>Edit profile</Link><Link to='/opportunities'>Opportunities</Link><Link to='/safety'>Safety centre</Link></nav></header><main className='ff-work-main' style={{
      maxWidth: 850,
      margin: 'auto'
    }}><h1>Settings</h1>{error && <p role='alert' className='ff-error'>{error}</p>}{notice && <p role='status'>{notice}</p>}
 {settings && <><section className='ff-panel'><h2>Privacy and notifications</h2><Form busy={busy} fields={[{
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
 <details className='ff-panel'><summary>Change password</summary><Form busy={busy} fields={[{
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
 <details className='ff-panel'><summary>Change email</summary><Form busy={busy} fields={[{
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
 <section className='ff-panel'><h2>Location and website</h2><Form busy={busy} fields={[{
          name: 'location',
          label: 'Location',
          value: user.location
        }, {
          name: 'website_url',
          label: 'Website',
          type: 'url',
          value: user.website_url
        }]} onSubmit={f => save('/api/settings/account/profile', f)} /></section>
 <section className='ff-panel'><h2>Interests</h2><Form busy={busy} fields={[{
          name: 'interests',
          label: 'Topics, separated by commas',
          value: (user.interests || []).join(', ')
        }]} onSubmit={f => save('/api/profiles/me', {
          interests: f.interests.split(',').map(s => s.trim()).filter(Boolean)
        })} /><Link to='/alerts'>Manage opportunity alerts</Link></section>
 <section className='ff-panel'><h2>Account controls</h2><button disabled={busy} onClick={async () => {
          await apiFetch('/api/auth/logout', {
            method: 'POST',
            body: '{}'
          }).catch(() => {});
          clearSession();
          navigate('/login');
        }}>Sign out</button><details><summary>Deactivate account</summary><p>Your account will be disabled. You will need administrator assistance to reactivate it.</p><button disabled={busy} onClick={async () => {
            if (window.confirm('Disable your account? Reactivation requires administrator assistance.') && (await save('/api/settings/deactivate', {}, 'POST'))) {
              clearSession();
              navigate('/login');
            }
          }}>Deactivate account</button></details><details><summary>Permanently delete account</summary><p>This permanently deletes your account and associated records.</p><Form busy={busy} label='Delete account permanently' fields={[{
            name: 'password',
            label: 'Current password',
            type: 'password',
            required: true
          }]} onSubmit={async f => {
            if (window.confirm('Permanently delete your account and records?') && (await save('/api/settings/account', f, 'DELETE'))) {
              clearSession();
              navigate('/');
            }
          }} /></details></section>
 </main></div>;
}
