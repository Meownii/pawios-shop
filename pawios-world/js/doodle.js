(() => {
  const canvas = document.getElementById('doodle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const placeholder = document.getElementById('canvas-placeholder');
  const colorInput = document.getElementById('doodle-color');
  const sizeInput = document.getElementById('doodle-size');
  const sizeOutput = document.getElementById('doodle-size-value');
  const undoStack = [];
  let drawing = false, moved = false, tool = 'pencil', last = null, hasDrawing = false;
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const old = document.createElement('canvas'); old.width = canvas.width; old.height = canvas.height;
    if (canvas.width && canvas.height) old.getContext('2d').drawImage(canvas, 0, 0);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, rect.width, rect.height);
    if (old.width) ctx.drawImage(old, 0, 0, old.width / dpr, old.height / dpr);
  }
  function point(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function saveUndo() { if (undoStack.length >= 20) undoStack.shift(); undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); }
  function start(e) {
    e.preventDefault(); canvas.setPointerCapture(e.pointerId); saveUndo(); drawing = true; moved = false; last = point(e); ctx.beginPath(); ctx.moveTo(last.x, last.y);
  }
  function draw(e) {
    if (!drawing) return;
    const next = point(e); moved = true;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Number(sizeInput.value);
    ctx.strokeStyle = tool === 'eraser' ? '#fffdf8' : colorInput.value;
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(next.x, next.y); ctx.stroke(); last = next;
    placeholder.classList.add('is-hidden'); hasDrawing = true;
  }
  function end() {
    if (!drawing) return;
    if (!moved) { ctx.fillStyle = tool === 'eraser' ? '#fffdf8' : colorInput.value; ctx.beginPath(); ctx.arc(last.x, last.y, Number(sizeInput.value) / 2, 0, Math.PI * 2); ctx.fill(); placeholder.classList.add('is-hidden'); hasDrawing = true; }
    drawing = false; last = null;
  }
  canvas.addEventListener('pointerdown', start); canvas.addEventListener('pointermove', draw);
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('pointerleave', end);
  function setTool(next) { tool = next; document.getElementById('pencil-tool').classList.toggle('is-selected', tool === 'pencil'); document.getElementById('eraser-tool').classList.toggle('is-selected', tool === 'eraser'); }
  document.getElementById('pencil-tool').addEventListener('click', () => setTool('pencil'));
  document.getElementById('eraser-tool').addEventListener('click', () => setTool('eraser'));
  document.getElementById('undo-doodle').addEventListener('click', () => { const previous = undoStack.pop(); if (previous) { ctx.putImageData(previous, 0, 0); hasDrawing = undoStack.length > 0; placeholder.classList.toggle('is-hidden', hasDrawing); } });
  document.getElementById('clear-doodle').addEventListener('click', () => { saveUndo(); const r = canvas.getBoundingClientRect(); ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, r.width, r.height); hasDrawing = false; placeholder.classList.remove('is-hidden'); });
  sizeInput.addEventListener('input', () => { sizeOutput.value = sizeInput.value; sizeOutput.textContent = sizeInput.value; });
  document.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', () => { colorInput.value = button.dataset.color; setTool('pencil'); document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('is-selected', s === button)); }));
  colorInput.addEventListener('input', () => { document.querySelectorAll('.swatch').forEach(s => s.classList.remove('is-selected')); });
  document.getElementById('save-doodle').addEventListener('click', () => {
    const name = document.getElementById('doodle-name').value.trim().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 24);
    const a = document.createElement('a'); a.download = `${window.PAWIO_CONTENT.doodle.exportPrefix}${name ? `-${name}` : ''}.png`; a.href = canvas.toDataURL('image/png'); a.click();
  });
  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
  resizeCanvas();
})();
