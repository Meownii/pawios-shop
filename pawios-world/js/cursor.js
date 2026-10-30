(() => {
  const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!desktopPointer.matches) return;

  const cursor = document.createElement('img');
  cursor.className = 'rin-cursor is-hidden';
  cursor.alt = '';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);

  const base = new URL('../assets/cursors/rin-kagamine/', document.currentScript.src);
  const frames = {
    normal: Array.from({ length: 7 }, (_, i) => new URL(`normal-${i}.png`, base).href),
    link: Array.from({ length: 7 }, (_, i) => new URL(`link-select-${i}.png`, base).href)
  };
  const timing = { normal: 167, link: [133, 133, 133, 133, 133, 233, 133] };
  const images = Object.values(frames).flat().map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mode = 'normal';
  let frame = 0;
  let nextFrameAt = 0;
  let x = -100;
  let y = -100;

  function setMode(nextMode) {
    if (mode === nextMode) return;
    mode = nextMode;
    frame = 0;
    nextFrameAt = 0;
    if (reducedMotion) cursor.src = frames[mode][0];
  }

  function updateMode(target) {
    if (target instanceof Element && target.closest('a, button, summary, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]')) {
      setMode('link');
    } else {
      setMode('normal');
    }
  }

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    x = event.clientX;
    y = event.clientY;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    cursor.classList.remove('is-hidden');
    updateMode(event.target);
  }, { passive: true });

  document.addEventListener('pointerover', (event) => updateMode(event.target), { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));

  function animate(now) {
    if (now >= nextFrameAt) {
      cursor.src = frames[mode][frame];
      frame = (frame + 1) % frames[mode].length;
      const durations = timing[mode];
      nextFrameAt = now + (Array.isArray(durations) ? durations[frame] : durations);
    }
    requestAnimationFrame(animate);
  }

  if (reducedMotion) {
    cursor.src = frames.normal[0];
  } else {
    requestAnimationFrame(animate);
  }
})();
