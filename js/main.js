(() => {
  const views = ['home', 'about', 'commissions', 'shop', 'tos', 'doodle'];
  const toolbar = document.getElementById('section-toolbar');
  const frame = document.querySelector('.screen-frame');
  let current = 'home';

  function setView(name, updateHistory = true) {
    if (!views.includes(name)) name = 'home';
    current = name;
    views.forEach(view => {
      const section = document.getElementById(`view-${view}`);
      const active = view === name;
      section.hidden = !active;
      section.classList.toggle('is-active', active);
    });
    toolbar.hidden = name === 'home';
    document.querySelectorAll('.nav-tab').forEach(tab => {
      const active = tab.dataset.view === name;
      tab.classList.toggle('is-active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    document.title = name === 'home' ? "Pawio's World" : `${name === 'tos' ? 'Terms of Service' : name === 'doodle' ? 'Doodle Room' : name.charAt(0).toUpperCase() + name.slice(1)} — Pawio's World`;
    if (updateHistory) {
      const next = name === 'home' ? location.pathname + location.search : `#${name}`;
      history.pushState({ view: name }, '', next);
    }
    window.scrollTo({ top: frame.getBoundingClientRect().top + window.scrollY, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.dispatchEvent(new CustomEvent('pawio:viewchange', { detail: { view: name } }));
  }

  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  window.addEventListener('popstate', () => setView(location.hash.slice(1) || 'home', false));
  window.addEventListener('hashchange', () => {
    const next = location.hash.slice(1) || 'home';
    if (next !== current) setView(next, false);
  });
  setView(views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home', false);

  const links = window.PAWIO_CONTENT.links;
  document.querySelectorAll('[data-link]').forEach(a => {
    const item = links[a.dataset.link];
    if (item) { a.href = item.url; if (a.classList.contains('social-link')) a.setAttribute('aria-label', `${item.label}: ${item.note}`); }
  });
  const social = document.getElementById('social-links');
  Object.entries(links).forEach(([key, item], i) => {
    const a = document.createElement('a');
    a.className = `social-link social-link--${key}`; a.href = item.url; a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', `${item.label}: ${item.note}`);
    const icon = document.createElement('span'); icon.className = 'social-icon'; icon.setAttribute('aria-hidden', 'true');
    const iconImage = document.createElement('img');
    iconImage.src = "assets/images/social/" + ['social-1.webp','social-2.webp','social-3.webp','social-4.webp'][i];
    iconImage.alt = '';
    iconImage.loading = 'lazy';
    icon.append(iconImage);
    const copy = document.createElement('span'); const label = document.createElement('b'); label.textContent = item.label; const note = document.createElement('small'); note.textContent = item.note; copy.append(label, note);
    const out = document.createElement('span'); out.className = 'social-out'; out.textContent = '↗'; a.append(icon, copy, out); social.append(a);
  });
})();
