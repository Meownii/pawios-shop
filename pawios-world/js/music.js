(() => {
  const audio = document.getElementById('bgm');
  const toggle = document.getElementById('music-toggle');
  const volume = document.getElementById('music-volume');
  const status = document.getElementById('music-status');
  const disc = document.getElementById('music-disc');
  const source = window.PAWIO_CONTENT.music.src;
  // A missing-file placeholder must never masquerade as a working music player.
  fetch(source, { method: 'HEAD' }).then(response => {
    if (!response.ok) throw new Error('missing track');
    toggle.disabled = false; volume.disabled = false;
    status.textContent = 'READY — TAP TO PLAY';
  }).catch(() => {
    status.textContent = 'NO TRACK LOADED';
    document.getElementById('track-name').textContent = 'INSERT MUSIC FILE';
  });
  audio.volume = Number(volume.value);
  volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
  toggle.addEventListener('click', async () => {
    if (audio.paused) {
      try { await audio.play(); toggle.textContent = 'Ⅱ'; status.textContent = 'NOW PLAYING'; disc.classList.add('is-playing'); }
      catch { status.textContent = 'TAP TO START'; }
    } else { audio.pause(); toggle.textContent = '▶'; status.textContent = 'PAUSED'; disc.classList.remove('is-playing'); }
  });
  audio.addEventListener('ended', () => { toggle.textContent = '▶'; disc.classList.remove('is-playing'); });
})();
