(() => {
  const audio = document.getElementById('bgm');
  const toggle = document.getElementById('music-toggle');
  const volume = document.getElementById('music-volume');
  const source = window.PAWIO_CONTENT.music.src;
  const placeholder = !source || source === 'INSERT MUSIC FILE';
  const volumeKey = 'pawioMusicVolume';

  function readVolume() {
    try {
      const stored = Number(localStorage.getItem(volumeKey));
      if (Number.isFinite(stored) && stored >= 0 && stored <= 1) return stored;
    } catch (_) { /* storage may be disabled */ }
    return Number(volume.value || 0.45);
  }

  function showPlaying(playing) {
    toggle.classList.toggle('is-on', playing);
    toggle.classList.remove('is-loading');
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Turn music off' : 'Turn music on');
    toggle.title = playing ? 'Turn music off' : 'Turn music on';
  }

  if (placeholder) {
    toggle.disabled = true;
    toggle.setAttribute('aria-label', 'Music file not added');
    toggle.title = 'Music file not added';
  } else {
    audio.src = new URL(source, document.baseURI).href;
    audio.volume = readVolume();
    volume.value = String(audio.volume);
    audio.load();
    toggle.disabled = false;
    toggle.setAttribute('aria-label', 'Turn music on');

    toggle.addEventListener('click', async () => {
      if (!audio.paused) {
        audio.pause();
        return;
      }
      toggle.classList.add('is-loading');
      toggle.setAttribute('aria-label', 'Loading music');
      toggle.title = 'Loading music';
      try {
        if (audio.error) { audio.src = new URL(source, document.baseURI).href; audio.load(); }
        await audio.play();
      } catch (_) {
        toggle.classList.remove('is-loading');
        toggle.setAttribute('aria-label', 'Music could not load. Tap to retry');
        toggle.title = 'Tap to retry';
      }
    });

    audio.addEventListener('playing', () => showPlaying(true));
    audio.addEventListener('pause', () => showPlaying(false));
    audio.addEventListener('waiting', () => toggle.classList.add('is-loading'));
    audio.addEventListener('canplay', () => toggle.classList.remove('is-loading'));
    audio.addEventListener('error', () => {
      showPlaying(false);
      toggle.setAttribute('aria-label', 'Music could not load. Tap to retry');
      toggle.title = 'Tap to retry';
    });
  }

  volume.value = String(readVolume());
  audio.volume = readVolume();
  volume.addEventListener('input', () => {
    const nextVolume = Number(volume.value);
    audio.volume = nextVolume;
    try { localStorage.setItem(volumeKey, String(nextVolume)); } catch (_) { /* storage may be disabled */ }
  });
})();
