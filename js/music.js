(() => {
  const toggle = document.getElementById('music-toggle');
  const audio = document.getElementById('site-music');
  if (!toggle || !audio) return;

  audio.volume = 0.28;

  function updateButton(playing) {
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    toggle.title = playing ? 'Pause background music' : 'Play background music';
    toggle.classList.toggle('is-on', playing);
  }

  toggle.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        await audio.play();
        updateButton(true);
      } catch {
        updateButton(false);
      }
    } else {
      audio.pause();
      updateButton(false);
    }
  });

  audio.addEventListener('play', () => updateButton(true));
  audio.addEventListener('pause', () => updateButton(false));
  audio.addEventListener('ended', () => updateButton(false));
})();
