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
  let client = null, isAdmin = false;
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('is-error', error); };
  const ready = Boolean(config.url && config.anonKey && window.supabase?.createClient);
  const submissionsReady = ready && config.submissionsEnabled === true;
  if (!ready) {
    setStatus('Shared gallery setup is pending. You can still save your PNG.');
    $('gallery-grid').innerHTML = '<p class="empty-gallery">The shared gallery will appear here after setup.</p>';
    $('admin-open').hidden = true;
  } else {
    client = window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    submit.disabled = !submissionsReady;
    setStatus(submissionsReady ? 'Your drawing will be reviewed before it appears in the gallery.' : 'Gallery connected. Submissions remain paused until the upload function is deployed.');
    $('admin-open').hidden = false;
    $('admin-open').addEventListener('click', () => { $('admin-panel').hidden = !$('admin-panel').hidden; });
    $('admin-send-link').addEventListener('click', sendAdminLink);
    $('admin-signout').addEventListener('click', async () => { await client.auth.signOut(); isAdmin = false; renderAdmin(false); });
    if (submissionsReady) submit.addEventListener('click', submitDoodle);
    client.auth.onAuthStateChange((_event, session) => { window.setTimeout(() => checkAdmin(session), 0); });
    client.auth.getSession().then(({ data }) => checkAdmin(data.session));
    loadGallery();
    window.addEventListener('pawio:viewchange', event => { if (event.detail.view === 'doodle') { loadGallery(); if (isAdmin) loadQueue(); } });
  }

  async function loadGallery() {
    const grid = $('gallery-grid');
    try {
      const { data, error } = await client.from('doodles').select('id, nickname, image_path, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(48);
      if (error) throw error;
      grid.replaceChildren();
      if (!data.length) { grid.innerHTML = '<p class="empty-gallery">No doodles in the gallery yet.</p>'; return; }
      for (const doodle of data) {
        const { data: image, error: imageError } = await client.storage.from(config.bucket || 'doodle-submissions').createSignedUrl(doodle.image_path, 3600);
        if (imageError) continue;
        const card = document.createElement('figure'); card.className = 'gallery-card';
        const img = document.createElement('img'); img.src = image.signedUrl; img.alt = doodle.nickname ? `Doodle by ${doodle.nickname}` : 'Visitor doodle'; img.loading = 'lazy';
        const caption = document.createElement('figcaption'); caption.textContent = doodle.nickname || 'Anonymous'; card.append(img, caption); grid.append(card);
      }
      if (!grid.children.length) grid.innerHTML = '<p class="empty-gallery">Gallery images are temporarily unavailable.</p>';
    } catch (_) { grid.innerHTML = '<p class="empty-gallery">The gallery could not be reached. Please try again later.</p>'; }
  }

  async function submitDoodle() {
    if (!ready || submit.disabled) return;
    if (!hasDrawing) { setStatus('Draw something before submitting.'); return; }
    if ($('doodle-website').value) { setStatus('Submission could not be completed.', true); return; }
    submit.disabled = true; setStatus('Sending your drawing for review…');
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
      setStatus('Submitted! Your doodle will appear after approval.');
      $('doodle-name').value = ''; $('doodle-website').value = '';
    } catch (error) { setStatus(error.message === 'Failed to fetch' ? 'The shared gallery is unavailable right now. Your drawing is still here; you can save its PNG.' : error.message === 'Drawing is too large. You can save the PNG instead.' ? error.message : 'The drawing could not be submitted. Please try again or save the PNG.', true); }
    finally { submit.disabled = false; }
  }

  async function sendAdminLink() {
    const email = $('admin-email').value.trim(), feedback = $('admin-auth-status');
    feedback.textContent = '';
    if (!email) { feedback.textContent = 'Enter the owner email to receive a sign-in link.'; return; }
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}${location.pathname}?admin=1` } });
    feedback.textContent = error ? 'Could not send the sign-in link. Check the auth setup.' : 'Check the owner inbox for a secure sign-in link.';
  }

  async function checkAdmin(session) {
    if (!session) { isAdmin = false; renderAdmin(false); return; }
    const { data, error } = await client.rpc('is_doodle_admin');
    isAdmin = !error && data === true; renderAdmin(isAdmin);
    if (isAdmin) loadQueue();
  }
  function renderAdmin(active) {
    $('admin-panel').hidden = !active;
    $('admin-auth').hidden = active;
    $('admin-signout').hidden = !active;
    $('admin-queue').hidden = !active;
  }
  async function loadQueue() {
    if (!isAdmin) return;
    const queue = $('admin-queue'); queue.replaceChildren();
    const { data, error } = await client.from('doodles').select('id, nickname, image_path, created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(100);
    if (error) { queue.textContent = 'Could not load the moderation queue.'; return; }
    if (!data.length) { queue.textContent = 'The moderation queue is clear.'; return; }
    for (const doodle of data) {
      const { data: image } = await client.storage.from(config.bucket || 'doodle-submissions').createSignedUrl(doodle.image_path, 3600);
      const card = document.createElement('article'); card.className = 'admin-card';
      if (image?.signedUrl) { const img = document.createElement('img'); img.src = image.signedUrl; img.alt = 'Pending visitor doodle'; card.append(img); }
      const details = document.createElement('div'), name = document.createElement('b'), actions = document.createElement('div');
      name.textContent = doodle.nickname || 'Anonymous'; actions.className = 'admin-actions'; details.append(name, actions); card.append(details);
      actions.append(actionButton('Approve', () => moderate(doodle, 'approved')), actionButton('Reject', () => moderate(doodle, 'rejected')), actionButton('Delete', () => removeDoodle(doodle)));
      queue.append(card);
    }
  }
  function actionButton(label, action) { const button = document.createElement('button'); button.className = 'tool-button'; button.type = 'button'; button.textContent = label; button.addEventListener('click', action); return button; }
  async function moderate(doodle, decision) {
    const { error } = await client.from('doodles').update({ status: decision }).eq('id', doodle.id);
    if (error) { $('admin-auth-status').textContent = 'Could not update this doodle.'; return; }
    loadQueue(); if (decision === 'approved') loadGallery();
  }
  async function removeDoodle(doodle) {
    const { error: storageError } = await client.storage.from(config.bucket || 'doodle-submissions').remove([doodle.image_path]);
    if (storageError) { $('admin-auth-status').textContent = 'Could not remove the image.'; return; }
    const { error } = await client.from('doodles').delete().eq('id', doodle.id);
    if (error) { $('admin-auth-status').textContent = 'The image is removed, but its record could not be deleted.'; return; }
    loadQueue(); loadGallery();
  }

  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
  resizeCanvas();
})();
