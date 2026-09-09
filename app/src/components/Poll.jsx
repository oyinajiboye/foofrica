import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
export default function Poll({
  postId
}) {
  const {
    apiFetch
  } = useAuth();
  const [poll, setPoll] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = useCallback(() => apiFetch(`/api/polls/${postId}`).then(r => setPoll(r.data)).catch(e => setError(e.message)), [apiFetch, postId]);
  useEffect(() => {
    load();
  }, [load]);
  return <div>{error && <p role='alert'>{error}</p>}{poll && <><p>Closes {new Date(poll.closes_at).toLocaleString()}</p>{poll.options.map((option, i) => <button key={i} disabled={busy || new Date(poll.closes_at) <= new Date()} style={{
        display: 'block',
        margin: '8px 0',
        padding: 10,
        width: '100%',
        textAlign: 'left',
        border: '1px solid #166534',
        background: poll.selected === i ? '#dcfce7' : 'white'
      }} onClick={async () => {
        setBusy(true);
        try {
          await apiFetch(`/api/polls/${postId}/vote`, {
            method: 'POST',
            body: JSON.stringify({
              option_index: i
            })
          });
          await load();
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}>{option} · {poll.counts[i]} votes {poll.selected === i ? '✓' : ''}</button>)}</>}</div>;
}
