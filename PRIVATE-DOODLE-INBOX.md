# Pawio’s private Doodle Room email setup

Visitors can submit a drawing without creating an account or signing in. The site emails the PNG directly to Pawio and does not display a public gallery. Keep submissions disabled until email delivery is configured and tested.

## 1. Keep Supabase storage private

The current Supabase setup keeps the `doodle-submissions` bucket private and does not let visitors read submitted images. The email function stores each image privately, emails it as an attachment, and reports success only after the email provider accepts it.

## 2. Set up the email sender

Create an account with Resend, add a sending domain you control, and verify it using the DNS records Resend provides. A verified sender address is required for production sending. Then create an API key.

## 3. Add secrets to Supabase

In Supabase, open **Project Settings → Edge Functions → Secrets** (or the Edge Function secrets settings) and add these values:

- `RESEND_API_KEY`: the Resend API key
- `DOODLE_RECIPIENT_EMAIL`: Pawio’s inbox address
- `DOODLE_FROM_EMAIL`: a sender address on the verified domain, for example `Pawio Doodles <doodles@your-verified-domain.com>`

Do not add these values to `js/supabase-config.js`, any other public website file, or a public GitHub commit. Keep the recipient value in Supabase secrets too.

## 4. Deploy the Edge Function

In **Edge Functions → submit-doodle**, replace the function source with `supabase/functions/submit-doodle/index.ts` and deploy it. The built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets must remain available.

## 5. Enable submissions

After the sender and secrets are set and a test submission reaches Pawio’s inbox, change `submissionsEnabled: false` to `submissionsEnabled: true` in `js/supabase-config.js` and publish that file. Until then, visitors can still draw and save a PNG, but the submit button stays paused.

Pawio does not need to log in to receive drawings. The optional `doodle-admin.html` page is no longer linked from the public Doodle Room.
