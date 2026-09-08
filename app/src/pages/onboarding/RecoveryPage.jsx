import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form } from '../RecruitmentPage';
export default function RecoveryPage() {
  const location = useLocation(),
    navigate = useNavigate(),
    {
      apiFetch,
      saveSession,
      clearSession
    } = useAuth();
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const started = useRef(false);
  const forgot = location.pathname === '/forgot-password';
  useEffect(() => {
    if (forgot || started.current) return;
    started.current = true;
    const query = new URLSearchParams(location.search),
      code = query.get('code'),
      verifier = sessionStorage.getItem('ff_pkce');
    window.history.replaceState(null, '', location.pathname);
    if (query.get('error_description')) {
      setError(query.get('error_description'));
      return;
    }
    if (!code || !verifier) {
      setError('Open a new sign-in or reset link in the browser where you requested it.');
      return;
    }
    setBusy(true);
    apiFetch('/api/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({
        code,
        verifier
      })
    }).then(r => {
      sessionStorage.removeItem('ff_pkce');
      saveSession(r.data.access_token, r.data.profile, r.data.refresh_token);
      if (location.pathname === '/reset-password') setReady(true);else navigate(r.data.needs_onboarding ? '/onboard/user-type' : '/feed', {
        replace: true
      });
    }).catch(e => setError(e.message)).finally(() => setBusy(false));
  }, [forgot, location.pathname, location.search, apiFetch, saveSession, navigate]);
  const submit = async f => {
    setBusy(true);
    setError('');
    try {
      if (forgot) {
        const r = await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify(f)
        });
        if (r.data.verifier) sessionStorage.setItem('ff_pkce', r.data.verifier);
        setNotice(r.data.message);
      } else {
        if (f.password !== f.confirm) throw new Error('Passwords do not match.');
        await apiFetch('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            password: f.password,
            refresh_token: localStorage.getItem('ff_refresh_token')
          })
        });
        clearSession();
        setReady(false);
        setNotice('Password updated. Sign in with your new password.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return <main className='ff-work-main' style={{
    maxWidth: 550,
    margin: '40px auto'
  }}><Link className='ff-brand' to='/'>footfrica</Link><h1>{forgot ? 'Reset your password' : ready ? 'Choose a new password' : 'Account access'}</h1>{error && <p role='alert' className='ff-error'>{error}</p>}{notice && <p role='status'>{notice}</p>}{busy && <p>Working…</p>}{(forgot || ready) && <Form busy={busy} label={forgot ? 'Send reset link' : 'Update password'} fields={forgot ? [{
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true
    }] : [{
      name: 'password',
      label: 'New password (8+ characters)',
      type: 'password',
      required: true
    }, {
      name: 'confirm',
      label: 'Confirm password',
      type: 'password',
      required: true
    }]} onSubmit={submit} />}<Link to='/login'>Sign in</Link> · <Link to='/forgot-password'>Request a new reset link</Link></main>;
}
