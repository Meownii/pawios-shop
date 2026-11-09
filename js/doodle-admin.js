(() => {
  const config = window.PAWIO_SUPABASE || {};
  const loginPanel = document.getElementById('login-panel');
  const submissionsPanel = document.getElementById('submissions-panel');
  const loginForm = document.getElementById('inbox-login-form');
  const emailInput = document.getElementById('inbox-email');
  const loginStatus = document.getElementById('login-status');
  const inboxStatus = document.getElementById('inbox-status');
  const submissions = document.getElementById('private-submissions');
  const accountLabel = document.getElementById('account-label');
  const clientReady = Boolean(config.url && config.anonKey && window.supabase?.createClient);

  function status(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle('is-error', isError);
  }

  if (!clientReady) {
    status(loginStatus, 'The private inbox is not configured yet.', true);
    loginForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey);

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    if (!email) return;
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    status(loginStatus, 'Sending a secure sign-in link…');
    try {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.href
        }
      });
      if (error) throw error;
      status(loginStatus, 'If this email is registered for inbox access, a sign-in link has been sent.');
    } catch (_) {
      status(loginStatus, 'The sign-in link could not be sent. Check the email and try again.', true);
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById('refresh-inbox').addEventListener('click', loadSubmissions);
  document.getElementById('sign-out').addEventListener('click', async () => {
    await client.auth.signOut();
    submissions.replaceChildren();
    status(loginStatus, 'You have signed out.');
  });

  client.auth.onAuthStateChange((_event, session) => {
    if (session) showInbox(session);
    else {
      loginPanel.hidden = false;
      submissionsPanel.hidden = true;
    }
  });

  client.auth.getSession().then(({ data }) => {
    if (data.session) showInbox(data.session);
  });

  function showInbox(session) {
    loginPanel.hidden = true;
    submissionsPanel.hidden = false;
    accountLabel.textContent = session.user.email || 'Signed in';
    loadSubmissions();
  }

  async function loadSubmissions() {
    status(inboxStatus, 'Loading private submissions…');
    submissions.replaceChildren();
    const { data, error } = await client
      .from('doodles')
      .select('id, nickname, image_path, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      status(inboxStatus, 'This account does not have access to the private inbox, or the inbox setup is incomplete.', true);
      return;
    }
    if (!data?.length) {
      status(inboxStatus, 'No doodles have been sent yet.');
      return;
    }

    const cards = await Promise.all(data.map(async doodle => {
      const { data: signed, error: signedError } = await client.storage
        .from(config.bucket || 'doodle-submissions')
        .createSignedUrl(doodle.image_path, 60 * 60);
      if (signedError || !signed?.signedUrl) return null;

      const card = document.createElement('figure');
      card.className = 'private-submission';
      const image = document.createElement('img');
      image.src = signed.signedUrl;
      image.alt = doodle.nickname && doodle.nickname !== 'Anonymous'
        ? `Doodle sent by ${doodle.nickname}`
        : 'Anonymous doodle';
      image.loading = 'lazy';

      const caption = document.createElement('figcaption');
      const name = document.createElement('strong');
      name.textContent = doodle.nickname || 'Anonymous';
      const time = document.createElement('time');
      const date = new Date(doodle.created_at);
      time.dateTime = date.toISOString();
      time.textContent = date.toLocaleString();
      caption.append(name, time);
      card.append(image, caption);
      return card;
    }));

    cards.filter(Boolean).forEach(card => submissions.append(card));
    status(inboxStatus, `${submissions.children.length} private doodle${submissions.children.length === 1 ? '' : 's'}.`);
  }
})();
