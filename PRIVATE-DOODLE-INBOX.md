# Private Doodle Room inbox setup

The Doodle Room now sends drawings to a private owner inbox. The public site must not expose the gallery or image URLs. Keep submissions disabled until the Supabase steps below are complete.

## 1. Secure the database and image bucket

In the Pawio Supabase project, open **SQL Editor**, create a query, paste the full contents of `supabase/schema.sql`, and run it. This removes old public read policies and makes the `doodle-submissions` bucket private. Existing submissions will then be visible only to the allowlisted account.

## 2. Add Pawio's account

In Supabase **Authentication → Users**, invite or create the email account Pawio will use for the inbox. Use the same address in the allowlist query below.

Run this in **SQL Editor**, replacing the example text with Pawio's email:

```sql
insert into public.doodle_admin_emails (email)
values (lower(btrim('PAWIO_EMAIL_HERE')))
on conflict (email) do nothing;
```

Only an authenticated session whose email matches this allowlist can read doodle records or create temporary signed image links. Visitors can submit without signing in.

## 3. Deploy the private submit function

In **Edge Functions**, open `submit-doodle`, replace its source with `supabase/functions/submit-doodle/index.ts`, and deploy it. It must have the project-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. Never put the service-role key in website files.

## 4. Allow the inbox sign-in redirect

In **Authentication → URL Configuration → Redirect URLs**, add:

`https://meownii.github.io/pawios-shop/doodle-admin.html`

Email sign-in links are sent only to existing Supabase Auth users. The inbox page asks for Pawio's email and shows drawings only after sign-in and allowlist verification.

## 5. Enable submissions last

After steps 1–4 are complete, change `submissionsEnabled: false` to `submissionsEnabled: true` in `js/supabase-config.js` and publish that file. The public Doodle Room deliberately has no gallery; it tells visitors drawings go privately to Pawio and that their name is optional.
