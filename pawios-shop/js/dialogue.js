(() => {
  const lines = window.PAWIO_CONTENT.dialogue;
  const expressions = window.PAWIO_CONTENT.dialogueExpressions || [];
  const overlay = document.getElementById('intro-overlay');
  const box = document.getElementById('dialogue-box');
  const text = document.getElementById('dialogue-text');
  const nextMark = document.getElementById('dialogue-next');
  const skip = document.getElementById('skip-intro');
  let lineIndex = 0, timer = null, typing = false, charIndex = 0, finished = false;
  const speed = 32;

  function setExpression(name) {
    const selected = name || 'open';
    document.querySelectorAll('.intro-sprite').forEach(sprite => {
      sprite.classList.toggle('is-current', sprite.dataset.expression === selected);
    });
  }

  function revealLine() {
    clearInterval(timer); text.textContent = ''; charIndex = 0; typing = true;
    setExpression(expressions[lineIndex]);
    nextMark.classList.remove('is-visible');
    timer = setInterval(() => {
      charIndex += 1; text.textContent = lines[lineIndex].slice(0, charIndex);
      if (charIndex >= lines[lineIndex].length) { clearInterval(timer); typing = false; nextMark.classList.add('is-visible'); }
    }, speed);
  }
  function finishIntro() {
    if (finished) return;
    finished = true;
    clearInterval(timer); typing = false; overlay.classList.add('is-closing');
    window.setTimeout(() => { overlay.hidden = true; overlay.classList.remove('is-closing'); }, 320);
    try { sessionStorage.setItem('pawioIntroSeen', '1'); } catch (_) { /* session storage may be disabled */ }
  }
  function advance() {
    if (finished || overlay.hidden) return;
    if (typing) { clearInterval(timer); text.textContent = lines[lineIndex]; typing = false; nextMark.classList.add('is-visible'); return; }
    if (lineIndex >= lines.length - 1) { finishIntro(); return; }
    lineIndex += 1; revealLine();
  }
  function play() { finished = false; overlay.hidden = false; overlay.classList.remove('is-closing'); lineIndex = 0; revealLine(); }
  overlay.addEventListener('click', event => {
    if (event.target.closest('#skip-intro')) return;
    advance();
  });
  box.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advance(); } });
  skip.addEventListener('click', event => { event.stopPropagation(); finishIntro(); });
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); finishIntro(); }
  });
  document.getElementById('replay-intro').addEventListener('click', play);
  let seen = false; try { seen = sessionStorage.getItem('pawioIntroSeen') === '1'; } catch (_) {}
  if (!seen) play(); else overlay.hidden = true;
})();
