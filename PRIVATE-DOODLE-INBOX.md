# Private Doodle Room email setup

Visitors can send a doodle without creating an account or logging in. The PNG is emailed directly to Pawio’s inbox and never appears in a public gallery.

## 1. Create the Google mailer

Sign in to Apps Script using `meowniie00@gmail.com` and create a project at [script.google.com](https://script.google.com). Replace the contents of `Code.gs` with `supabase/google-apps-script/Code.gs` from this repository.

Open **Project Settings → Script Properties** and add:

- Property: `DOODLE_RECIPIENT_EMAIL`
- Value: the recipient email provided for Pawio

In the editor, choose `authorizeDoodleMailer` and click **Run**. Approve the Gmail send permission for this Google account. This sends no email; it only authorizes future doodle notifications.

## 2. Deploy the web app

Choose **Deploy → New deployment → Web app**:

- **Execute as:** Me
- **Who has access:** Anyone

Deploy, then copy the Web app URL ending in `/exec`. Keep this URL private; it acts as the server-side key for the mailer. Never put it in website JavaScript or publish it.

## 3. Connect Supabase

In **Supabase → Edge Functions → Secrets**, add:

- `DOODLE_GOOGLE_SCRIPT_URL`: the private Apps Script Web app URL

Keep the existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. Deploy the updated source from `supabase/functions/submit-doodle/index.ts` in the `submit-doodle` Edge Function.

## 4. Enable submissions

After setup, a test doodle can confirm delivery. Then change `submissionsEnabled: false` to `submissionsEnabled: true` in `js/supabase-config.js` and publish the site. The submitter's name is optional, and Pawio does not need to log in to receive doodles.
