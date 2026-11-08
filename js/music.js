(() => {
  const toggle = document.getElementById('music-toggle');
  const popover = document.getElementById('music-player-popover');
  if (!toggle || !popover) return;

  function setOpen(open) {
    popover.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close music player' : 'Open music player');
    toggle.title = open ? 'Close music player' : 'Play music on this site';
    toggle.classList.toggle('is-on', open);
  }

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
