(() => {
  const canvas = document.getElementById('doodle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const placeholder = $('canvas-placeholder');
  const colorInput = $('doodle-color'), sizeInput = $('doodle-size'), sizeOutput = $('doodle-size-value');
  const undoStack = [];
  let drawing = false, moved = false, tool = 'pencil', last = null, hasDrawing = false;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect(), dpr = Math.max(1, window.devicePixelRatio || 1);
    const old = document.createElement('canvas'); old.width = canvas.width; old.height = canvas.height;
    if (canvas.width && canvas.height) old.getContext('2d').drawImage(canvas, 0, 0);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, rect.width, rect.height);
    if (old.width) ctx.drawImage(old, 0, 0, old.width / dpr, old.height / dpr);
  }
  const point = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function saveUndo() { if (undoStack.length >= 20) undoStack.shift(); undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); }
  function start(e) { e.preventDefault(); canvas.setPointerCapture(e.pointerId); saveUndo(); drawing = true; moved = false; last = point(e); }
  function draw(e) {
    if (!drawing) return;
    const next = point(e); moved = true; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Number(sizeInput.value);
    ctx.strokeStyle = tool === 'eraser' ? '#fffdf8' : colorInput.value; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(next.x, next.y); ctx.stroke(); last = next;
    placeholder.classList.add('is-hidden'); hasDrawing = true;
  }
  function end() {
    if (!drawing) return;
    if (!moved) { ctx.fillStyle = tool === 'eraser' ? '#fffdf8' : colorInput.value; ctx.beginPath(); ctx.arc(last.x, last.y, Number(sizeInput.value) / 2, 0, Math.PI * 2); ctx.fill(); placeholder.classList.add('is-hidden'); hasDrawing = true; }
    drawing = false; last = null;
  }
  canvas.addEventListener('pointerdown', start); canvas.addEventListener('pointermove', draw); canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('pointerleave', end);
  function setTool(next) { tool = next; $('pencil-tool').classList.toggle('is-selected', next === 'pencil'); $('eraser-tool').classList.toggle('is-selected', next === 'eraser'); }
  $('pencil-tool').addEventListener('click', () => setTool('pencil')); $('eraser-tool').addEventListener('click', () => setTool('eraser'));
  $('undo-doodle').addEventListener('click', () => { const previous = undoStack.pop(); if (previous) { ctx.putImageData(previous, 0, 0); hasDrawing = undoStack.length > 0; placeholder.classList.toggle('is-hidden', hasDrawing); } });
  $('clear-doodle').addEventListener('click', () => { saveUndo(); const r = canvas.getBoundingClientRect(); ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, r.width, r.height); hasDrawing = false; placeholder.classList.remove('is-hidden'); });
  sizeInput.addEventListener('input', () => { sizeOutput.value = sizeInput.value; sizeOutput.textContent = sizeInput.value; });
  document.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', () => { colorInput.value = button.dataset.color; setTool('pencil'); document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('is-selected', s === button)); }));
  colorInput.addEventListener('input', () => document.querySelectorAll('.swatch').forEach(s => s.classList.remove('is-selected')));
  $('save-doodle').addEventListener('click', () => downloadCanvas());
  function downloadCanvas() {
    const name = $('doodle-name').value.trim().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 24);
    const a = document.createElement('a'); a.download = `${window.PAWIO_CONTENT.doodle.exportPrefix}${name ? `-${name}` : ''}.png`; a.href = canvas.toDataURL('image/png'); a.click();
  }

  const endpoint = window.PAWIO_DOODLE_ENDPOINT || '';
  const status = $('submit-status'), submit = $('submit-doodle');
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('is-error', error); };
  if (!endpoint) {
    submit.disabled = true;
    setStatus('Private doodle delivery is temporarily unavailable. You can still save your PNG.');
  } else {
    submit.disabled = false;
    setStatus('Draw something before sending. Your doodle will be sent privately to Pawio.');
    submit.addEventListener('click', submitDoodle);
  }

  async function submitDoodle() {
    if (!endpoint || submit.disabled) return;
    if (!hasDrawing) { setStatus('Draw something before submitting.'); return; }
    if ($('doodle-website').value) { setStatus('Submission could not be completed.', true); return; }
    submit.disabled = true; setStatus('Sending your doodle…');
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob || blob.size > 512 * 1024) { setStatus('This drawing is over the 512 KiB limit. Save its PNG or simplify the image and try again.', true); return; }
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob);
      });
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ nickname: $('doodle-name').value.trim().slice(0, 24), image: base64, website: $('doodle-website').value })
      });
      setStatus('Your doodle was submitted privately to Pawio. Thank you for sharing!');
      $('doodle-name').value = ''; $('doodle-website').value = '';
    } catch (error) {
      const message = error?.message || '';
      const visibleMessage = message === 'Failed to fetch'
        ? 'The doodle email service could not be reached. Please try again later or save the PNG.'
        : 'The drawing could not be submitted. Please try again or save the PNG.';
      setStatus(visibleMessage, true);
    }
    finally { submit.disabled = false; }
  }

  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
  resizeCanvas();
})();
