(() => {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!finePointer.matches) return;

  const assetRoot = new URL('../assets/cursors/rin-kagamine/', document.currentScript.src);

  Promise.all([
    fetch(new URL('manifest.json', assetRoot)).then((response) => {
      if (!response.ok) throw new Error('Cursor theme is unavailable');
      return response.json();
    }),
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = new URL('atlas.png', assetRoot).href;
    })
  ]).then(([theme, atlas]) => {
    const cursor = document.createElement('img');
    cursor.className = 'rin-cursor is-hidden';
    cursor.alt = '';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.draggable = false;
    document.body.append(cursor);
    document.documentElement.classList.add('has-rin-cursor');

    const aliases = {
      default: 'normal', auto: 'normal', none: 'normal',
      pointer: 'link-select', text: 'text', 'vertical-text': 'text',
      help: 'help', wait: 'busy', progress: 'working-on-background',
      move: 'move', 'all-scroll': 'move', grab: 'move', grabbing: 'move',
      'not-allowed': 'unavailable', 'no-drop': 'unavailable',
      crosshair: 'precision', copy: 'alt-select', alias: 'location-select',
      'col-resize': 'horizontal-resize', 'ew-resize': 'horizontal-resize',
      'row-resize': 'vertical-resize', 'ns-resize': 'vertical-resize',
      'nesw-resize': 'diagonal-resize', 'sw-resize': 'diagonal-resize',
      'nwse-resize': 'diagonal-resize2', 'se-resize': 'diagonal-resize2'
    };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cache = new Map();

    for (const [stateName, state] of Object.entries(theme.states)) {
      const frames = state.atlasFrames.map(({ x, y }) => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        canvas.getContext('2d').drawImage(atlas, x, y, 32, 32, 0, 0, 32, 32);
        return canvas.toDataURL('image/png');
      });
      cache.set(stateName, state.sequence.map((frame) => frames[frame]));
    }

    let mode = 'normal';
    let step = 0;
    let nextFrameAt = 0;
    let x = -100;
    let y = -100;

    function positionCursor() {
      const hotspot = theme.states[mode]?.hotspot || [0, 0];
      cursor.style.transform = `translate3d(${x - hotspot[0]}px, ${y - hotspot[1]}px, 0)`;
    }

    function setMode(nextMode) {
      if (!theme.states[nextMode]) nextMode = 'normal';
      if (mode === nextMode) return;
      mode = nextMode;
      step = 0;
      nextFrameAt = 0;
      positionCursor();
    }

    function modeFor(target) {
      if (!(target instanceof Element)) return 'normal';
      if (target.closest(':disabled, [aria-disabled="true"]')) return 'unavailable';
      if (target.closest('[contenteditable="true"], input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, select')) {
        const input = target.closest('input');
        return input?.type === 'range' ? aliases[getComputedStyle(target).cursor] || 'normal' : 'text';
      }
      if (target.closest('a, button, summary, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]')) return 'link-select';
      return aliases[getComputedStyle(target).cursor] || 'normal';
    }

    function move(event) {
      if (event.pointerType === 'touch') return;
      x = event.clientX;
      y = event.clientY;
      cursor.classList.remove('is-hidden');
      setMode(modeFor(event.target));
      positionCursor();
    }

    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', (event) => setMode(modeFor(event.target)), { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));

    function draw(now) {
      const frames = cache.get(mode) || cache.get('normal');
      cursor.src = frames[step] || frames[0];
      if (reducedMotion) {
        step = 0;
      } else if (now >= nextFrameAt) {
        const durations = theme.states[mode].stepMs;
        const delay = durations[Math.min(step, durations.length - 1)] || 133;
        step = (step + 1) % frames.length;
        nextFrameAt = now + delay;
      }
      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }).catch(() => {});
})();
