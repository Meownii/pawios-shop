(() => {
  const audio = document.getElementById('site-music');
  const headerToggle = document.getElementById('music-toggle');
  const player = document.getElementById('aeroPlayer');
  const playButton = document.getElementById('aeroPlay');
  const seek = document.getElementById('aeroSeek');
  const volume = document.getElementById('aeroVolume');
  const currentTime = document.getElementById('aeroCurrentTime');
  const duration = document.getElementById('aeroDuration');
  if (!audio || !headerToggle || !player || !playButton) return;

  const formatTime = value => {
    if (!Number.isFinite(value)) return '--:--';
    const seconds = Math.floor(value);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  function syncPlayer() {
    const playing = !audio.paused && !audio.ended;
    player.classList.toggle('is-playing', playing);
    playButton.textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    if (volume && document.activeElement !== volume) volume.value = String(audio.volume);
    if (seek && Number.isFinite(audio.duration) && audio.duration > 0 && document.activeElement !== seek) {
      seek.value = String((audio.currentTime / audio.duration) * 100);
    }
    if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
    if (duration) duration.textContent = formatTime(audio.duration);
  }

  playButton.addEventListener('click', () => headerToggle.click());
  volume?.addEventListener('input', () => { audio.volume = Number(volume.value); });
  seek?.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = audio.duration * Number(seek.value) / 100;
    }
  });
  ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'durationchange', 'volumechange', 'seeked'].forEach(eventName => {
    audio.addEventListener(eventName, syncPlayer);
  });
  syncPlayer();
})();
