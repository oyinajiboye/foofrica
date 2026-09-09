export default function StreamPlayer({
  video
}) {
  let src;
  try {
    const url = new URL(video?.cloudflare_playback_url);
    if (url.protocol === 'https:' && url.hostname.endsWith('.cloudflarestream.com')) src = `${url.origin}/${video.cloudflare_uid}/iframe`;
  } catch {/* No playback yet. */}
  if (!src) return <p>Video is still processing or unavailable.</p>;
  return <iframe src={src} title={video.title || 'Football highlight'} allow='accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture' allowFullScreen loading='lazy' style={{
    width: '100%',
    aspectRatio: '16/9',
    border: 0,
    borderRadius: 12
  }} />;
}
