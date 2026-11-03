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

The selected track is **“Glow” by Scott Buckley**, a relaxed, happy acoustic guitar and piano piece. It is included locally as `assets/audio/glow.mp3` and licensed under **CC BY 4.0**, including commercial projects when attributed. Playback starts only after the visitor presses the music button; there is no autoplay. The volume slider is saved on the visitor's device. Required attribution is “Glow” by Scott Buckley — released under CC-BY 4.0. www.scottbuckley.com.au. Source: [Scott Buckley's official track page](https://www.scottbuckley.com.au/library/glow/). License: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

The small speaker toggle enables or mutes gentle synthesized UI button sounds. They start only after a visitor presses a control and the preference is saved on that device.

## Content source and known gaps

The profile, commission details, prices and payment notes, links, shop status, and terms were transcribed from Pawio's public Carrd on 27 October 2026. The site links to VGen and Toyhouse for current commission options and prices instead of inventing amounts. No products or purchase links were listed on the Carrd; the Shop states that the physical merchandise catalog is still in preparation. Review the copy against the live Carrd before making a future policy or price change.

## Doodle Room: local editor and shared instant-publish gallery

The editor works locally: pencil, eraser, color and width controls, undo, clear, optional nickname, and PNG download. Persistent shared submissions require Supabase because GitHub Pages only serves static files. When connected, a drawing is published to the gallery immediately; there is no approval queue, admin sign-in, or delete control. The Supabase project URL is prefilled in the browser config; its public key and the submissions switch still need to be set before uploads are enabled.

### Configure Supabase

1. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates the gallery and Storage bucket, and also upgrades the previous moderation-based schema if it was already installed. Existing doodles become public in the gallery.
2. From the project root, deploy the Edge Function (the root is the folder containing `index.html` and `supabase/`):

   ```sh
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy submit-doodle --no-verify-jwt
   ```

   Anonymous visitors need `--no-verify-jwt`. The function validates the site's allowed origin, PNG signature and dimensions, 512 KiB upload limit, honeypot, and five-submission-per-15-minute rate limit. It uses Supabase's server-injected `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function. No custom function secrets or Auth setup are required.
3. In `js/supabase-config.js`, set `url` to the Supabase Project URL, `anonKey` to the public anon/publishable key, and `submissionsEnabled` to `true`. The public key belongs in the website; never put a service-role/secret key in the browser.
4. Publish the site and test a submission. Refresh another browser to confirm the drawing appears in the shared gallery.

For a custom website domain, add its origin to `ALLOWED_ORIGINS` in `supabase/functions/submit-doodle/index.ts` and redeploy. Supabase provides `SUPABASE_URL` and the server key to the hosted function automatically. Images are public because they are shared gallery posts; browser visitors cannot upload directly to Storage or edit gallery records.

## Fonts and accessibility

The site loads Zen Maru Gothic for reading, Mochiy Pop One for headings, and DotGothic16 for compact retro interface labels from Google Fonts. All three are available under the SIL Open Font License. The site includes keyboard-operable navigation/dialogue, touch pointer drawing, reduced-motion handling, and responsive layouts.

### Custom cursor

The desktop pointer uses the full supplied Kagamine Rin cursor set by ko from RW Designer. The original 32×32 animated cursor frames are preserved as PNG frames so they can animate in modern browsers. The theme includes the normal pointer, link, text, resize, and other cursor states. Touch devices keep their system cursor behavior.
