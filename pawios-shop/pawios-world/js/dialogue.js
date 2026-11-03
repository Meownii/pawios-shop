(() => {
  const lines = window.PAWIO_CONTENT.dialogue;
  const overlay = document.getElementById('intro-overlay');
  const box = document.getElementById('dialogue-box');
  const text = document.getElementById('dialogue-text');
  const counter = document.getElementById('dialogue-counter');
  const nextMark = document.getElementById('dialogue-next');
  const skip = document.getElementById('skip-intro');
  let lineIndex = 0, timer = null, typing = false, charIndex = 0;
  const speed = 34;

  function revealLine() {
    clearInterval(timer);
    text.textContent = '';
    charIndex = 0;
    typing = true;
    nextMark.classList.remove('is-visible');
    counter.textContent = `${lineIndex + 1} / ${lines.length}`;
    timer = setInterval(() => {
      charIndex += 1;
      text.textContent = lines[lineIndex].slice(0, charIndex);
      if (charIndex >= lines[lineIndex].length) {
        clearInterval(timer); typing = false; nextMark.classList.add('is-visible');
      }
    }, speed);
  }
  function finishIntro() {
    clearInterval(timer);
    overlay.classList.add('is-closing');
    window.setTimeout(() => { overlay.hidden = true; overlay.classList.remove('is-closing'); }, 420);
    sessionStorage.setItem('pawioIntroSeen', '1');
  }
  function advance() {
    if (typing) { clearInterval(timer); text.textContent = lines[lineIndex]; typing = false; nextMark.classList.add('is-visible'); return; }
    if (lineIndex >= lines.length - 1) { finishIntro(); return; }
    lineIndex += 1; revealLine();
  }
  function play(fromStart = true) {
    overlay.hidden = false;
    overlay.classList.remove('is-closing');
    if (fromStart) lineIndex = 0;
    revealLine();
  }
  box.addEventListener('click', advance);
  box.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advance(); } });
  skip.addEventListener('click', finishIntro);
  document.getElementById('replay-intro').addEventListener('click', () => play(true));
  if (!sessionStorage.getItem('pawioIntroSeen')) play(); else overlay.hidden = true;
})();
