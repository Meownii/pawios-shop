(() => {
  const toggle = document.getElementById('sfx-toggle');
  const preferenceKey = 'pawioButtonSounds';
  let soundOn = true;
  let context;
  try { soundOn = localStorage.getItem(preferenceKey) !== 'off'; } catch (_) { /* storage may be disabled */ }

  function updateToggle() {
    toggle.setAttribute('aria-pressed', String(soundOn));
    toggle.setAttribute('aria-label', soundOn ? 'Button sounds on' : 'Button sounds off');
    toggle.title = soundOn ? 'Button sounds on' : 'Button sounds off';
    toggle.classList.toggle('is-muted', !soundOn);
  }

  function playClickSound() {
    if (!soundOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      context ||= new AudioContext();
      const startTone = () => {
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(780, now);
        oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.065);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.09);
      };
      if (context.state === 'suspended') context.resume().then(startTone).catch(() => {});
      else startTone();
    } catch (_) { /* Web Audio may be unavailable */ }
  }

  toggle.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem(preferenceKey, soundOn ? 'on' : 'off'); } catch (_) { /* storage may be disabled */ }
    updateToggle();
  });

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest('#music-toggle, #sfx-toggle, input, select, textarea')) return;
    if (target.closest('button, a[href], [role="button"], #intro-overlay')) playClickSound();
  }, true);

  updateToggle();
})();
