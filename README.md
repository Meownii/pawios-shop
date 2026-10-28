# Pawio's World

A static HTML/CSS/JavaScript personal website inspired by early-2000s Japanese visual novel menus and personal anime websites. It is designed to publish from the repository root on GitHub Pages and has no build step.

## Preview locally

Open `index.html`, or run a static server from this directory:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Push the project files to a GitHub repository.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select the `main` branch and `/ (root)`.
4. Save and open the Pages URL shown by GitHub.

All local paths are relative, so the site also works when published from a repository subpath. No framework or build command is required.

## Edit the site

- `js/content.js` contains the four intro lines, the matching sprite order, outbound links, music path, and PNG filename prefix.
- Section copy and image placement are in `index.html`.
- `css/style.css` contains the visual system; `css/responsive.css` holds compact-width layouts.
- `js/main.js`, `js/dialogue.js`, and `js/music.js` manage the section navigation, intro, and one-button music control.

### Artwork and logo

The current Home uses `assets/images/characters/doki-chibi-group.png` and `assets/images/logo/pawios-shop.png`. The intro uses three expressions in `assets/images/characters/`: `sprite-open.png`, `sprite-closed.png`, and `sprite-point.png`. Replace files in place to keep the existing layout. The matching line for each spoken line is editable through `dialogueExpressions` in `js/content.js` (`open`, `closed`, `point`). The profile portrait and shop preview remain reserved for future approved art.

The three uploaded portrait sprites had solid black matte pixels and no alpha channel. Pure black was made transparent and the empty margins were trimmed so the supplied art could sit naturally over the visual novel backgrounds; the colored artwork was not redrawn or recolored. The official logo was converted losslessly from WebP to PNG and its empty transparent border was trimmed. The chibi group image is included as supplied.

### Music

The selected track is **“Sleep” by Scott Buckley**, an ambient piano piece. The composer’s official page offers the MP3 under **CC BY 4.0**, including commercial projects when attributed. The track itself is not bundled yet. Download the MP3 from [Scott Buckley's official track page](https://www.scottbuckley.com.au/library/sleep/) and save it as `assets/audio/sleep.mp3`. Its required attribution is “Sleep” by Scott Buckley — released under CC-BY 4.0. www.scottbuckley.com.au. The compact music button becomes available only when that file exists. To use a different track, change `music.src` in `js/content.js` and update the credit in `index.html`. Playback starts only after the visitor presses the button; there is no autoplay. License: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

## Content source and known gaps

The profile, commission details, prices and payment notes, links, shop status, and terms were transcribed from Pawio's public Carrd on 27 October 2026. The site links to VGen and Toyhouse for current commission options and prices instead of inventing amounts. No products or purchase links were listed on the Carrd; the Shop states that the physical merchandise catalog is still in preparation. Review the copy against the live Carrd before making a future policy or price change.

## Doodle Room: local editor and shared gallery

The drawing canvas, pencil, eraser, color and width controls, undo, clear, optional nickname, and PNG download work without any backend. Visitors can always save their PNG. A shared gallery and upload button are **not active until the Supabase setup below is completed**. The browser config intentionally has empty URL/key values, so the site does not claim to store drawings yet.

### Configure Supabase (required for persistent submissions)

The integration uses a private Storage bucket, a Postgres table with `pending`/`approved`/`rejected` states, Row Level Security, and an Edge Function. New submissions remain private pending review. Only authenticated user IDs listed in `doodle_admins` can see the queue, approve, reject, or delete. The browser contains only the Supabase project URL and public anon/publishable key; never put a `service_role` key in this static site.

1. Create a Supabase project. Install the Supabase CLI and authenticate it.
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. Deploy the function from this project directory:

   ```sh
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy submit-doodle --no-verify-jwt
   ```

   `--no-verify-jwt` is needed because visitors submit anonymously. The function validates the exact allowed origin, PNG signature, image/body size, honeypot, and rate limit itself. It uses the server-side `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function runtime.
4. Set the function secrets. Use the exact GitHub Pages origin (no path) in `ALLOWED_ORIGINS`; for a custom domain, list that origin too. Generate a long random secret for the rate-limit pepper:

   ```sh
   supabase secrets set ALLOWED_ORIGINS="https://YOUR-USER.github.io" RATE_LIMIT_PEPPER="LONG_RANDOM_SECRET"
   ```

   Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. If those are missing in your project, add them through the Supabase function secrets settings. Never place either secret in `js/supabase-config.js`.
5. In `js/supabase-config.js`, set `url` to the project URL and `anonKey` to the project's public anon/publishable key. These values are visible to visitors by design; database/storage policies must remain enabled. Only after deploying the function and confirming its secrets/origin, set `submissionsEnabled: true`; this is the explicit switch that enables visitor uploads.
6. In Supabase **Authentication → URL Configuration**, add the published site URL to the allowed redirect URLs, including the Pages subpath if applicable. Enable email sign-in and configure email delivery.
7. Create the owner's Auth user using the chosen email sign-in method. Add that user's Auth UUID to `doodle_admins` in the SQL Editor. The example query at the bottom of `schema.sql` can insert by email; replace the example with the owner's email and run it once. Do not expose an admin API key.
8. Publish the updated site. Test one anonymous submission, confirm it appears only in the owner queue, approve it, then check that the approved gallery displays it from a second browser.

The Edge Function limits each hashed IP window to five attempts per 15 minutes and accepts PNG files up to 512 KiB. Submitted nickname text is limited to 24 characters. Images are stored in a private bucket and shown through short-lived signed URLs. Supabase Auth magic links secure the owner moderation session; database and Storage RLS enforce permissions even if someone calls the APIs directly.

Relevant Supabase references: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Edge Function secrets](https://supabase.com/docs/guides/functions/secrets), [Auth](https://supabase.com/docs/guides/auth).

## Fonts and accessibility

The site loads Zen Maru Gothic for reading, Mochiy Pop One for headings, and DotGothic16 for compact retro interface labels from Google Fonts. All three are available under the SIL Open Font License. The site includes keyboard-operable navigation/dialogue, touch pointer drawing, reduced-motion handling, and responsive layouts.
