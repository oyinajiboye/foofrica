import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StreamPlayer from '../components/StreamPlayer';
import '../styles/recruitment.css';
export default function UploadHighlightPage() {
  const {
      apiFetch
    } = useAuth(),
    navigate = useNavigate();
  const [video, setVideo] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [title, setTitle] = useState('');
  const run = async fn => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const upload = e => {
    e.preventDefault();
    const file = e.currentTarget.elements.file.files[0];
    run(async () => {
      if (!file || !file.type.startsWith('video/') || file.size > 200 * 1024 * 1024) throw new Error('Choose a video under 200 MB and no longer than 10 minutes.');
      const r = await apiFetch('/api/videos/upload-url', {
        method: 'POST',
        body: '{}'
      });
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(r.data.upload_url, {
        method: 'POST',
        body: form
      });
      if (!response.ok) throw new Error('Upload failed. Please try again.');
      const saved = await apiFetch('/api/videos/metadata', {
        method: 'POST',
        body: JSON.stringify({
          cloudflare_uid: r.data.uid,
          title,
          match_type: 'highlight'
        })
      });
      setVideo(saved.data);
    });
  };
  return <main className='ff-work-main' style={{
    maxWidth: 760,
    margin: 'auto'
  }}><Link to='/feed'>← Feed</Link><h1>Upload a highlight</h1>{error && <p role='alert' className='ff-error'>{error}</p>}{busy && <p role='status'>Uploading or saving… Keep this page open.</p>}{!video ? <form className='ff-panel' onSubmit={upload}><label className='ff-field'>Title<input value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} /></label><label className='ff-field'>Video (up to 200 MB, 10 minutes)<input name='file' type='file' accept='video/*' required /></label><button disabled={busy}>Upload video</button></form> : <section className='ff-panel'><h2>{video.title}</h2><p>Status: {video.status}</p>{video.status === 'ready' ? <><StreamPlayer video={video} /><button disabled={busy} onClick={() => run(async () => {
          const r = await apiFetch('/api/posts', {
            method: 'POST',
            body: JSON.stringify({
              post_type: 'video',
              video_id: video.id,
              content: title
            })
          });
          navigate(`/post/${r.data.id}`);
        })}>Publish highlight</button></> : <button disabled={busy} onClick={() => run(async () => {
        const r = await apiFetch(`/api/videos/${video.id}/status`, {
          method: 'POST',
          body: '{}'
        });
        setVideo(r.data);
      })}>Refresh processing status</button>}<button disabled={busy} onClick={() => run(async () => {
        await apiFetch(`/api/videos/${video.id}`, {
          method: 'DELETE'
        });
        setVideo(null);
      })}>Delete upload</button></section>}</main>;
}
