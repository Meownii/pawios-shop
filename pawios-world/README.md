# Pawio's World

A buildless HTML, CSS, and JavaScript personal site designed for GitHub Pages. The interface takes cues from early-2000s visual novel menus and personal anime websites. Reference screenshots supplied for art direction are not included as site assets; they contain third-party artwork. The site uses custom CSS ornaments and clearly marked spaces for Pawio's own art.

## Run locally

Open `index.html` in a browser, or serve this folder with any static server. For example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a GitHub repository and upload the contents of this folder (keep `index.html` at the repository root).
2. In the repository, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Wait for the Pages URL shown in Settings → Pages.

No build step or framework is required. Links, stylesheets, scripts, and assets use relative paths for project pages.

## Replace the artwork and logo

- **Logo:** replace the contents of `.logo-reservation` in `index.html` with an `<img>` pointing to your transparent logo. Use `max-width: 100%; max-height: 100%; object-fit: contain` so wide and tall logo variants fit.
- **Home character:** replace the `.character-placeholder` element with an image from `assets/images/characters/`. Keep the stage wrapper and its caption.
- **Profile picture:** replace `.profile-portrait` with a client-approved portrait.
- **Shop preview:** replace `.shop-placeholder` with a product or banner image under `assets/images/products/`.
- **Opening scene:** replace `.intro-art` with optional character artwork. The composition also works with the placeholder.
- The `assets/images/backgrounds/`, `assets/images/decorations/`, and `assets/icons/` directories are ready for original or appropriately licensed files.

Use only artwork the client owns or has permission to publish. No reference image supplied with this project has been copied into the website.

## Update content and links

- `js/content.js` holds the four opening dialogue lines, external links, music filename, and doodle export name.
- Profile and commission wording, the shop note, and Terms of Service are in `index.html` so they can be edited directly. The Terms section reflects the rules transcribed from Pawio's Carrd on 27 October 2026.
- The Carrd status is shown as open. Commission prices and options are linked to VGen and Toyhouse because the Carrd says its prices were moved there; no prices were invented.
- The shop currently has no confirmed catalog or purchase link. Its message records the Carrd note that custom physical merchandise is in progress, with preorders planned for December 2026 or early 2027.

## Add an authorized music file

Place an audio file at `assets/audio/insert-music-here.mp3`, or change `src` and `title` in `js/content.js` and update the matching `<audio>` source in `index.html`. The player checks that a file exists, waits for a visitor's click to start playback, and supports pause and volume. Browsers may block autoplay, so playback is never started automatically.

## Doodle Room behavior and limits

The pencil, eraser, color picker, width control, undo, clear, optional nickname, and PNG export work locally in the browser. The page does **not** upload or store drawings. The “approved gallery” is intentionally empty. To accept submissions and publish moderated drawings, configure a backend with upload validation, rate limits, moderation, and storage; then implement that service before enabling a submission control. For now, visitors can save a PNG and share it through Pawio's public Discord link.

## Fonts and licensing

The site loads **Cherry Bomb One**, **M PLUS Rounded 1c**, and **DotGothic16** from Google Fonts. Google Fonts lists these under the SIL Open Font License. The fonts are used for display lettering, body text, and compact retro labels respectively. If you need fully offline font delivery, download the font files and OFL notices from Google Fonts and place them in `assets/fonts/`, then define local `@font-face` rules in `css/style.css`.

## Custom desktop cursor

The desktop pointer and link cursor use the PNG previews from the [Kagamine Rin cursor set by ko on RW Designer](https://www.rw-designer.com/cursor-set/rin-kagamine). The source set is animated `.ani`, which modern browsers do not use as animated page cursors, so the site references the set's hosted static previews instead of copying or republishing the original files. The small source credit appears in the desktop footer. Touch devices keep their normal system behavior.

## Accessibility and responsive layout

Navigation uses buttons, controls have labels, the dialogue can be advanced by keyboard, canvas drawing supports touch/pointer input, and reduced-motion preferences are respected. Layout breakpoints cover compact phones through wide desktops; no site assets or backend secrets are required.
