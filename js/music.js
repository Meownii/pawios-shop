(() => {
  const audio = document.getElementById('bgm');
  const toggle = document.getElementById('music-toggle');
  const source = window.PAWIO_CONTENT.music.src;
  const placeholder = !source || source === 'INSERT MUSIC FILE';

  if (placeholder) {
    toggle.disabled = true;
    toggle.setAttribute('aria-label', 'Music file not added');
    return;
  }

  audio.src = source;
  toggle.disabled = false;
  toggle.setAttribute('aria-label', 'Turn music on');

  const showPlaying = playing => {
    toggle.classList.toggle('is-on', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Turn music off' : 'Turn music on');
  };

  audio.addEventListener('playing', () => showPlaying(true));
  audio.addEventListener('pause', () => showPlaying(false));
  audio.addEventListener('ended', () => showPlaying(false));
  audio.addEventListener('error', () => {
    showPlaying(false);
    toggle.disabled = true;
    toggle.setAttribute('aria-label', 'Music unavailable');
  });

  toggle.addEventListener('click', async () => {
    if (audio.paused) {
      try { await audio.play(); }
      catch (_) { toggle.setAttribute('aria-label', 'Tap to try music again'); }
    } else {
      audio.pause();
    }
  });
})();
