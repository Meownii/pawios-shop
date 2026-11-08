(() => {
  const toggle = document.getElementById('music-toggle');
  const popover = document.getElementById('spotify-player-popover');
  if (!toggle || !popover) return;

  function setOpen(open) {
    popover.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close Spotify player' : 'Open Spotify player');
    toggle.title = open ? 'Close Spotify player' : 'Play Pawio’s Spotify song';
    toggle.classList.toggle('is-on', open);
  }

  toggle.disabled = false;
  toggle.addEventListener('click', () => setOpen(popover.hidden));
  document.addEventListener('click', (event) => {
    if (!popover.hidden && !popover.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !popover.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
