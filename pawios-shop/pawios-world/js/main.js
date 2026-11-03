(() => {
  const views = ['home', 'about', 'commissions', 'shop', 'tos', 'doodle'];
  const labels = { home: 'HOME / 00', about: 'ABOUT ME / 01', commissions: 'COMMISSIONS / 02', shop: 'SHOP / 03', tos: 'TOS / 04', doodle: 'DOODLE ROOM / 05' };
  function setView(name) {
    if (!views.includes(name)) name = 'home';
    views.forEach(view => { const section = document.getElementById(`view-${view}`); const active = view === name; section.hidden = !active; section.classList.toggle('is-active', active); });
    document.getElementById('page-indicator').textContent = labels[name];
    document.title = name === 'home' ? "Pawio's World — little corner of the internet" : `${name === 'tos' ? 'Terms of Service' : name.charAt(0).toUpperCase() + name.slice(1)} — Pawio's World`;
    history.replaceState(null, '', name === 'home' ? location.pathname : `#${name}`);
    document.querySelector('.screen-frame').scrollTop = 0;
  }
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  document.getElementById('back-home').addEventListener('click', () => setView('home'));
  const initial = location.hash.slice(1); setView(views.includes(initial) ? initial : 'home');

  const links = window.PAWIO_CONTENT.links;
  document.querySelectorAll('[data-link]').forEach(a => { const item = links[a.dataset.link]; if (item) { a.href = item.url; if (a.classList.contains('social-link')) a.setAttribute('aria-label', `${item.label}: ${item.note}`); } });
  const social = document.getElementById('social-links');
  Object.entries(links).forEach(([key, item], i) => { const a = document.createElement('a'); a.className = `social-link social-link--${key}`; a.href = item.url; a.target = '_blank'; a.rel = 'noopener'; a.innerHTML = `<span class="social-icon">${['◉','↗','◇'][i]}</span><span><b>${item.label}</b><small>${item.note}</small></span><span class="social-out">↗</span>`; social.append(a); });

  function tick() { document.getElementById('clock').textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date()) + ' UTC'; }
  tick(); setInterval(tick, 60_000);
})();
