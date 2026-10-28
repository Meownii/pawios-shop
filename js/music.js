(() => {
  const audio = document.getElementById('bgm');
  const toggle = document.getElementById('music-toggle');
  const source = window.PAWIO_CONTENT.music.src;
  audio.src = source;
  toggle.setAttribute('aria-label', 'Music unavailable');
  fetch(source, { method: 'HEAD', cache: 'no-store' }).then(response => {
    const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!response.ok || !mime.startsWith('audio/')) throw new Error('track missing');
    toggle.disabled = false;
    toggle.setAttribute('aria-label', 'Turn music on');
  }).catch(() => {
    toggle.disabled = true;
    toggle.setAttribute('aria-label', 'Music file not added');
  });
  toggle.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        await audio.play(); toggle.classList.add('is-on'); toggle.setAttribute('aria-pressed', 'true'); toggle.setAttribute('aria-label', 'Turn music off');
      } catch (_) { toggle.setAttribute('aria-label', 'Tap to start music'); }
    } else {
      audio.pause(); toggle.classList.remove('is-on'); toggle.setAttribute('aria-pressed', 'false'); toggle.setAttribute('aria-label', 'Turn music on');
    }
  });
  audio.addEventListener('ended', () => { toggle.classList.remove('is-on'); toggle.setAttribute('aria-pressed', 'false'); toggle.setAttribute('aria-label', 'Turn music on'); });
})();
