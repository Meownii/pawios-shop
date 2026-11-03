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

  const config = window.PAWIO_SUPABASE || {};
  const status = $('submit-status'), submit = $('submit-doodle');
  let client = null;
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('is-error', error); };
  const ready = Boolean(config.url && config.anonKey && window.supabase?.createClient);
  const submissionsReady = ready && config.submissionsEnabled === true;
  if (!ready) {
    setStatus('The shared gallery is not connected yet. You can still save your PNG.');
    $('gallery-grid').innerHTML = '<p class="empty-gallery">The shared gallery will appear here after setup.</p>';
  } else {
    client = window.supabase.createClient(config.url, config.anonKey);
    submit.disabled = !submissionsReady;
    setStatus(submissionsReady ? 'Drawings appear in the shared gallery as soon as they are sent.' : 'The gallery is connected, but drawing submissions are not enabled yet.');
    if (submissionsReady) submit.addEventListener('click', submitDoodle);
    loadGallery();
    window.addEventListener('pawio:viewchange', event => { if (event.detail.view === 'doodle') loadGallery(); });
    window.setInterval(loadGallery, 60_000);
  }

  async function loadGallery() {
    const grid = $('gallery-grid');
    try {
      const { data, error } = await client.from('doodles').select('id, nickname, image_path, created_at').order('created_at', { ascending: false }).limit(48);
      if (error) throw error;
      grid.replaceChildren();
      if (!data.length) { grid.innerHTML = '<p class="empty-gallery">No doodles in the gallery yet.</p>'; return; }
      for (const doodle of data) {
        const { data: image } = client.storage.from(config.bucket || 'doodle-submissions').getPublicUrl(doodle.image_path);
        const card = document.createElement('figure'); card.className = 'gallery-card';
        const img = document.createElement('img'); img.src = image.publicUrl; img.alt = doodle.nickname ? `Doodle by ${doodle.nickname}` : 'Visitor doodle'; img.loading = 'lazy';
        const caption = document.createElement('figcaption'); caption.textContent = doodle.nickname || 'Anonymous'; card.append(img, caption); grid.append(card);
      }
      if (!grid.children.length) grid.innerHTML = '<p class="empty-gallery">Gallery images are temporarily unavailable.</p>';
    } catch (_) { grid.innerHTML = '<p class="empty-gallery">The gallery could not be reached. Please try again later.</p>'; }
  }

  async function submitDoodle() {
    if (!ready || submit.disabled) return;
    if (!hasDrawing) { setStatus('Draw something before submitting.'); return; }
    if ($('doodle-website').value) { setStatus('Submission could not be completed.', true); return; }
    submit.disabled = true; setStatus('Sending your doodle…');
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob || blob.size > 512 * 1024) { setStatus('This drawing is over the 512 KiB limit. Save its PNG or simplify the image and try again.', true); return; }
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob);
      });
      const response = await fetch(`${config.url.replace(/\/$/, '')}/functions/v1/submit-doodle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
        body: JSON.stringify({ nickname: $('doodle-name').value.trim().slice(0, 24), image: base64, website: $('doodle-website').value })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 413 ? 'Drawing is too large. You can save the PNG instead.' : result.error || 'Submission failed');
      setStatus('Your doodle is on the wall! Thanks for sharing.');
      $('doodle-name').value = ''; $('doodle-website').value = '';
      await loadGallery();
    } catch (error) {
      const message = error?.message || '';
      const visibleMessage = message === 'Failed to fetch'
        ? 'The doodle service could not be reached. Check that the Edge Function is deployed and its URL is correct.'
        : message === 'Submission service is not configured'
          ? 'The database setup is incomplete. Run the latest supabase/schema.sql in Supabase SQL Editor.'
          : message === 'Drawing could not be saved'
            ? 'The server could not save this drawing. Check the Supabase storage bucket and database setup.'
            : message === 'Origin not allowed'
              ? 'This website address is not allowed by the doodle service.'
              : message === 'Please wait before sending another doodle'
                ? 'Please wait a few minutes before sending another doodle.'
                : message === 'Drawing is too large. You can save the PNG instead.'
                  ? message
                  : 'The drawing could not be submitted. Please try again or save the PNG.';
      setStatus(visibleMessage, true);
    }
    finally { submit.disabled = false; }
  }

  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
  resizeCanvas();
})();
